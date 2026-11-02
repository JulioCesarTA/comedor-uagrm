"""Agente: Planificador de menú. Usa predicción de demanda + stock + aceptación."""
from app.services.agentes.mcp_tools import McpToolClient
from app.services.predictor_demanda import predecir_demanda


class PlanificadorMenuAgent:
    def run(self, objetivo: str, contexto: dict) -> dict:
        tools = McpToolClient()
        stock = tools.ver_stock_insumo()
        propuesta = []
        for turno in ("DESAYUNO", "ALMUERZO", "CENA"):
            for plato_id in contexto.get("platos_candidatos", [f"plato-{turno}-A", f"plato-{turno}-B"]):
                raciones = predecir_demanda({"plato_id": plato_id, "es_feriado": False})
                propuesta.append({"turno": turno, "platoId": plato_id, "racionesSugeridas": raciones})
        return {"agente": "planificador-menu", "objetivo": objetivo,
                "propuesta": propuesta, "stockActual": stock,
                "requiere_confirmacion_humana": True}
