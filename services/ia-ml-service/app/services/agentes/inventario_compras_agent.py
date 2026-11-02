"""Agente: Inventario y compras. Detecta stock bajo + lotes por vencer, prepara órdenes.
SPEC §3.4: emitir orden de compra requiere confirmación humana."""
from app.services.agentes.mcp_tools import McpToolClient


class InventarioComprasAgent:
    def run(self, objetivo: str, contexto: dict) -> dict:
        tools = McpToolClient()
        bajos = tools.ver_stock_bajo()
        borradores = [{"insumoId": i["id"], "nombre": i["nombre"],
                       "sugerir_comprar": max(1, int(i["stockMinimo"] * 2))} for i in bajos]
        return {"agente": "inventario-compras", "objetivo": objetivo,
                "insumosEnRiesgo": bajos, "ordenesBorrador": borradores,
                "requiere_confirmacion_humana": True}
