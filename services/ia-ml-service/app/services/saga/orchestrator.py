"""Saga Orchestrator — SPEC §5. Estado en DynamoDB.
Saga 1: reservar + apartar porción + cobrar + confirmar.
Saga 2: cancelar (devolver pago -> liberar porción -> cancelar reserva)."""
import os
import uuid
import httpx
from datetime import datetime

from app.data import dynamo_client

MENU_URL = os.getenv("MENU_URL", "http://menu-inventario-service:8080")
COMENSALES_URL = os.getenv("COMENSALES_URL", "http://comensales-reservas-service:8080")
PAGOS_URL = os.getenv("PAGOS_URL", "http://pagos-tickets-service:8080")


class SagaOrchestrator:

    def __init__(self):
        try: dynamo_client.ensure_tables()
        except Exception: pass

    def reservar_y_pagar(self, p: dict) -> dict:
        # Idempotencia
        cached = dynamo_client.check_and_lock_idempotency(p["idempotency_key"])
        if cached and cached.get("sagaId"): return cached

        saga_id = str(uuid.uuid4())
        estado = {"sagaId": saga_id, "step": 0, "status": "RUNNING", "payload": p,
                  "compensations": [], "started_at": datetime.utcnow().isoformat()}
        dynamo_client.put_saga(saga_id, estado)

        try:
            with httpx.Client(timeout=10) as cli:
                # Paso 1: crear reserva pendiente
                r1 = cli.post(f"{COMENSALES_URL}/reservas", json={
                    "estudianteId": p["estudiante_id"], "menuId": p["menu_id"],
                    "platoId": p["plato_id"], "fecha": p["fecha"], "turno": p["turno"],
                    "sagaId": saga_id,
                })
                r1.raise_for_status()
                reserva_id = r1.json()["id"]
                estado.update(step=1, reservaId=reserva_id)
                estado["compensations"].append({"srv": "comensales", "accion": "cancelar", "reservaId": reserva_id})
                dynamo_client.put_saga(saga_id, estado)

                # Paso 2: apartar porción
                r2 = cli.post(f"{MENU_URL}/porciones/apartar",
                              json={"menuId": p["menu_id"], "platoId": p["plato_id"]})
                r2.raise_for_status()
                estado["step"] = 2
                estado["compensations"].append({"srv": "menu", "accion": "liberar",
                                                 "menuId": p["menu_id"], "platoId": p["plato_id"]})
                dynamo_client.put_saga(saga_id, estado)

                # Paso 3: cobrar
                r3 = cli.post(f"{PAGOS_URL}/pagos/cobrar", json={
                    "reservaId": reserva_id, "estudianteId": p["estudiante_id"],
                    "monto": p["monto"], "metodo": p["metodo_pago"], "sagaId": saga_id,
                })
                r3.raise_for_status()
                pago = r3.json()
                estado.update(step=3, pagoId=pago["pagoId"], ticketId=pago["ticketId"])
                estado["compensations"].append({"srv": "pagos", "accion": "devolver", "pagoId": pago["pagoId"]})
                dynamo_client.put_saga(saga_id, estado)

                # Paso 4: confirmar reserva + emitir QR
                r4 = cli.post(f"{COMENSALES_URL}/reservas/{reserva_id}/confirmar")
                r4.raise_for_status()
                conf = r4.json()
                estado.update(step=4, status="COMPLETED", qr=conf.get("qr"),
                              finished_at=datetime.utcnow().isoformat())
                dynamo_client.put_saga(saga_id, estado)

                out = {"sagaId": saga_id, "status": "COMPLETED",
                       "reservaId": reserva_id, "pagoId": pago["pagoId"],
                       "ticketId": pago["ticketId"], "qr": conf.get("qr"),
                       "stripe": pago.get("stripe")}
                dynamo_client.check_and_lock_idempotency(p["idempotency_key"], out)
                return out

        except Exception as e:
            # Compensar en orden inverso
            self._compensar(estado)
            estado.update(status="COMPENSATED", error=str(e),
                          finished_at=datetime.utcnow().isoformat())
            dynamo_client.put_saga(saga_id, estado)
            raise

    def cancelar(self, p: dict) -> dict:
        """Saga 2: devolver pago -> liberar porción -> cancelar reserva."""
        saga_id = str(uuid.uuid4())
        estado = {"sagaId": saga_id, "step": 0, "status": "RUNNING",
                  "payload": p, "started_at": datetime.utcnow().isoformat()}
        dynamo_client.put_saga(saga_id, estado)
        with httpx.Client(timeout=10) as cli:
            cli.post(f"{PAGOS_URL}/pagos/{p['pago_id']}/devolver").raise_for_status()
            estado["step"] = 1; dynamo_client.put_saga(saga_id, estado)
            # Liberar porción: necesitamos menuId/platoId del evento; en MVP se pasa en payload si se tiene
            if p.get("menu_id") and p.get("plato_id"):
                cli.post(f"{MENU_URL}/porciones/liberar",
                         json={"menuId": p["menu_id"], "platoId": p["plato_id"]})
            estado["step"] = 2; dynamo_client.put_saga(saga_id, estado)
            cli.post(f"{COMENSALES_URL}/reservas/{p['reserva_id']}/cancelar").raise_for_status()
            estado.update(step=3, status="COMPLETED",
                          finished_at=datetime.utcnow().isoformat())
            dynamo_client.put_saga(saga_id, estado)
        return {"sagaId": saga_id, "status": "COMPLETED"}

    def get_estado(self, saga_id: str) -> dict | None:
        return dynamo_client.get_saga(saga_id)

    def _compensar(self, estado: dict):
        with httpx.Client(timeout=10) as cli:
            for comp in reversed(estado.get("compensations", [])):
                try:
                    if comp["srv"] == "pagos":
                        cli.post(f"{PAGOS_URL}/pagos/{comp['pagoId']}/devolver")
                    elif comp["srv"] == "menu":
                        cli.post(f"{MENU_URL}/porciones/liberar",
                                 json={"menuId": comp["menuId"], "platoId": comp["platoId"]})
                    elif comp["srv"] == "comensales":
                        cli.post(f"{COMENSALES_URL}/reservas/{comp['reservaId']}/cancelar")
                except Exception:
                    pass  # Compensación best-effort; errores quedan en logs
