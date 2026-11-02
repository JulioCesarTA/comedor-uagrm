"""LLM "local" real para intent-detection y matching de consultas predefinidas.

NO es un transformer, es TF-IDF + cosine similarity sobre un corpus de ejemplos.
Sirve para:
- Clasificar intents (menu/reserva/beca) en atencion-estudiante
- Mapear preguntas en lenguaje natural a queries predefinidas en reportes (SPEC §10)
"""
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class IntentClassifier:
    """Rule-based + similitud. Entrena con ejemplos al bootstrap."""

    def __init__(self):
        self._samples = {
            "consultar_menu": [
                "que hay de comer hoy", "menu del dia", "cual es el menu", "almuerzo de hoy",
                "que platos hay", "ver menu", "menu semanal", "cena de hoy", "desayuno disponible",
            ],
            "reservar": [
                "quiero reservar", "reservar para almuerzo", "reserva mi comida", "apartar racion",
                "guardar un plato", "pedir reserva", "quiero el plato de pollo",
            ],
            "consultar_beca": [
                "cuanto me queda de beca", "estado de mi beca", "cuantas raciones de beca tengo",
                "beca comedor", "mi beca", "soy becario",
            ],
            "cancelar": [
                "cancelar reserva", "ya no voy", "quiero cancelar", "no voy a ir",
                "anular reserva", "libera mi lugar",
            ],
            "ayuda": [
                "hola", "ayuda", "que puedo hacer", "informacion", "menu de opciones", "comandos",
            ],
        }
        self._vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        X, y = [], []
        for intent, exs in self._samples.items():
            for e in exs:
                X.append(e); y.append(intent)
        self._X_vec = self._vectorizer.fit_transform(X)
        self._y = np.array(y)

    def classify(self, text: str) -> dict:
        if not text or not text.strip():
            return {"intent": "ayuda", "confianza": 0.0, "metodo": "fallback"}
        qv = self._vectorizer.transform([text.lower()])
        sims = cosine_similarity(qv, self._X_vec)[0]
        # top-3 por intent y promedio
        intent_scores = {}
        for intent in self._samples.keys():
            mask = self._y == intent
            top3 = np.sort(sims[mask])[::-1][:3]
            intent_scores[intent] = float(top3.mean())
        best = max(intent_scores.items(), key=lambda x: x[1])
        return {
            "intent": best[0],
            "confianza": round(best[1], 3),
            "scores_por_intent": {k: round(v, 3) for k, v in intent_scores.items()},
            "metodo": "TF-IDF + cosine similarity",
        }


class QueryMatcher:
    """SPEC §10: NL pregunta -> query predefinida. Cada query tiene ejemplos de entrenamiento."""

    def __init__(self):
        self._queries = {
            "raciones_por_dia": [
                "cuantas raciones se sirvieron", "numero de raciones por dia",
                "cuanta gente comio", "total de almuerzos servidos",
                "estadisticas de uso del comedor", "cuantos estudiantes vinieron",
            ],
            "desperdicio_por_plato": [
                "cuanto desperdicio hubo", "platos con mas sobras",
                "cual plato se desperdicia mas", "comida tirada",
                "merma por plato", "porcentaje de desperdicio",
            ],
            "becarios_inactivos": [
                "becarios que no vienen", "beca sin usar", "becarios inactivos",
                "estudiantes que no usan beca", "cuales becas estan desaprovechadas",
                "quien tiene beca y no la usa",
            ],
            "stock_bajo": [
                "insumos con stock bajo", "que falta en almacen", "productos por vencer",
                "stock critico", "insumos escasos",
            ],
        }
        self._v = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        X, y = [], []
        for q, exs in self._queries.items():
            for e in exs:
                X.append(e); y.append(q)
        self._Xv = self._v.fit_transform(X)
        self._y = np.array(y)

    def match(self, pregunta: str) -> dict:
        qv = self._v.transform([pregunta.lower()])
        sims = cosine_similarity(qv, self._Xv)[0]
        scores = {}
        for q in self._queries.keys():
            mask = self._y == q
            scores[q] = float(np.sort(sims[mask])[::-1][:2].mean())
        best = max(scores.items(), key=lambda x: x[1])
        return {
            "plantilla_elegida": best[0],
            "confianza": round(best[1], 3),
            "scores": {k: round(v, 3) for k, v in scores.items()},
        }
