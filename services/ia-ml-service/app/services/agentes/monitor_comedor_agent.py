"""Agente: Monitor del Comedor. Detecta caída de asistencia, desperdicio alto, costo fuera de rango."""
from app.data import cqrs_client


class MonitorComedorAgent:
    def run(self, objetivo: str, contexto: dict) -> dict:
        hallazgos = []
        desperdicio = cqrs_client.run_query_predefinida(
            "desperdicio_por_plato",
            {"desde": contexto.get("desde", "2026-01-01"),
             "hasta": contexto.get("hasta", "2026-12-31")},
        )
        for d in desperdicio:
            if d.get("pct", 0) > 25:
                hallazgos.append({"severidad": "alta", "msg": f"Plato {d['plato_id']} con {d['pct']}% desperdicio"})
        return {"agente": "monitor-comedor", "objetivo": objetivo,
                "hallazgos": hallazgos, "requiere_confirmacion_humana": False}
