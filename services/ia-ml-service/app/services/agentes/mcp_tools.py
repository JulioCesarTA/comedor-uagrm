"""Catálogo de herramientas MCP que exponen los microservicios.
Los agentes NO hacen SQL — solo invocan estas tools vía HTTP (equivalente MCP para dev local)."""
import os
import httpx


class McpToolClient:
    def __init__(self):
        self.menu = os.getenv("MENU_URL", "http://menu-inventario-service:8080")
        self.com = os.getenv("COMENSALES_URL", "http://comensales-reservas-service:8080")
        self.pag = os.getenv("PAGOS_URL", "http://pagos-tickets-service:8080")

    # --- menu-inventario tools ---
    def consultar_menu(self, turno: str) -> list:
        with httpx.Client(timeout=5) as c:
            r = c.get(f"{self.menu}/menus/semana/{turno}")
            return r.json() if r.status_code == 200 else []

    def ver_stock_insumo(self) -> list:
        with httpx.Client(timeout=5) as c:
            r = c.get(f"{self.menu}/insumos")
            return r.json() if r.status_code == 200 else []

    def ver_stock_bajo(self) -> list:
        with httpx.Client(timeout=5) as c:
            r = c.get(f"{self.menu}/insumos/stock-bajo")
            return r.json() if r.status_code == 200 else []

    # --- comensales tools ---
    def consultar_beca(self, estudiante_id: str) -> dict:
        with httpx.Client(timeout=5) as c:
            r = c.get(f"{self.com}/estudiantes/{estudiante_id}/beca")
            return r.json() if r.status_code == 200 else {}

    # --- pagos tools ---
    def consultar_estado_pago(self, pago_id: str) -> dict:
        with httpx.Client(timeout=5) as c:
            r = c.get(f"{self.pag}/pagos/{pago_id}")
            return r.json() if r.status_code == 200 else {}
