"""Agente: Atención al estudiante con LLM local (TF-IDF intent classifier)."""
from app.services.agentes.mcp_tools import McpToolClient
from app.services.llm_local import IntentClassifier

_classifier = IntentClassifier()


class AtencionEstudianteAgent:
    def run(self, objetivo: str, contexto: dict) -> dict:
        tools = McpToolClient()
        cls = _classifier.classify(objetivo)
        resp = {"intent_detectado": cls["intent"], "confianza": cls["confianza"], "metodo": cls["metodo"]}

        if cls["intent"] == "consultar_menu":
            turno = "ALMUERZO"
            t_lower = objetivo.lower()
            if "desayuno" in t_lower: turno = "DESAYUNO"
            elif "cena" in t_lower: turno = "CENA"
            resp["menu"] = tools.consultar_menu(turno)[:5]
            resp["mensaje"] = f"Menú del {turno.lower()} obtenido ({len(resp['menu'])} opciones)"
        elif cls["intent"] == "consultar_beca":
            est = contexto.get("estudiante_id")
            if est:
                resp["beca"] = tools.consultar_beca(est)
                resp["mensaje"] = "Estado de tu beca obtenido"
            else:
                resp["mensaje"] = "Dime tu ID de estudiante para consultar tu beca"
        elif cls["intent"] == "reservar":
            resp["mensaje"] = "Para reservar necesito: fecha, turno y plato. Formato: 'reservar plato-X'"
        elif cls["intent"] == "cancelar":
            resp["mensaje"] = "Para cancelar necesito el ID de la reserva"
        else:
            resp["mensaje"] = "Puedo ayudarte con: menu, reservar, consultar beca, cancelar"

        return {
            "agente": "atencion-estudiante",
            "objetivo": objetivo,
            "respuesta": resp,
            "requiere_confirmacion_humana": cls["intent"] in ("reservar", "cancelar"),
        }
