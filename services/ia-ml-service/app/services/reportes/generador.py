"""Reportes generativos con LLM local (TF-IDF query matcher). SPEC §10:
el "LLM" elige entre consultas predefinidas y rellena parámetros, nunca escribe SQL libre."""
import re
from datetime import date, timedelta

from app.data import cqrs_client
from app.services.llm_local import QueryMatcher

_matcher = QueryMatcher()

ROLES_PERMITIDOS = {
    "administrador": {"raciones_por_dia", "desperdicio_por_plato", "becarios_inactivos", "stock_bajo"},
    "nutricionista": {"raciones_por_dia", "desperdicio_por_plato"},
    "cocina_almacen": {"raciones_por_dia", "stock_bajo"},
}


class GeneradorReportes:
    def responder(self, pregunta: str, rol: str, formato: str) -> dict:
        match = _matcher.match(pregunta)
        plantilla = match["plantilla_elegida"]

        if plantilla not in ROLES_PERMITIDOS.get(rol, set()):
            return {
                "error": "no autorizado para esta consulta",
                "plantilla_elegida": plantilla,
                "rol": rol,
                "metodo": "LLM local TF-IDF + RBAC",
            }

        params = self._extraer_params(pregunta)
        datos = cqrs_client.run_query_predefinida(plantilla, params)

        return {
            "pregunta_original": pregunta,
            "plantilla_elegida": plantilla,
            "confianza_llm": match["confianza"],
            "scores_otros_queries": match["scores"],
            "parametros_detectados": params,
            "filas": datos,
            "formato_salida": formato,
            "metodo": "LLM local (TF-IDF + cosine) + queries parametrizadas + RBAC",
            "exportable_a": ["json", "excel", "pdf"],
        }

    def _extraer_params(self, p: str) -> dict:
        hoy = date.today()
        m = re.search(r"(\d{4}-\d{2}-\d{2})", p)
        if m:
            desde = date.fromisoformat(m.group(1))
            return {"desde": desde.isoformat(), "hasta": hoy.isoformat()}
        # heurística días
        if "ultimo mes" in p.lower() or "mes" in p.lower():
            return {"desde": (hoy - timedelta(days=30)).isoformat(), "hasta": hoy.isoformat()}
        if "semana" in p.lower():
            return {"desde": (hoy - timedelta(days=7)).isoformat(), "hasta": hoy.isoformat()}
        return {"desde": (hoy - timedelta(days=30)).isoformat(), "hasta": hoy.isoformat()}
