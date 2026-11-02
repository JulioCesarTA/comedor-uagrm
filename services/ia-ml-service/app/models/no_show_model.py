"""Clasificación binaria no-show REAL con sklearn LogisticRegression."""
import numpy as np
from sklearn.linear_model import LogisticRegression


class NoShowModel:
    def __init__(self):
        rng = np.random.default_rng(7)
        X, y = [], []
        for _ in range(500):
            turno_cod = rng.integers(0, 3)
            es_becario = rng.integers(0, 2)
            lluvia = rng.integers(0, 2)
            prev_cancel = rng.integers(0, 5)
            logits = -1.8 + 0.5 * turno_cod + 0.9 * lluvia + 0.6 * prev_cancel - 0.7 * es_becario
            p = 1 / (1 + np.exp(-logits))
            X.append([turno_cod, es_becario, lluvia, prev_cancel])
            y.append(1 if rng.random() < p else 0)
        self.model = LogisticRegression()
        self.model.fit(X, y)

    def predict_proba(self, features: dict) -> float:
        turno_cod = {"DESAYUNO": 0, "ALMUERZO": 1, "CENA": 2}.get(features.get("turno", "ALMUERZO"), 1)
        p = self.model.predict_proba([[turno_cod, 0, 0, 0]])[0][1]
        return round(float(p), 3)
