"""Modelo supervisado de regresión REAL con sklearn.
Entrena un RandomForest sobre datos sintéticos y lo usa para predecir."""
import numpy as np
from sklearn.ensemble import RandomForestRegressor


def _hash_to_feat(s: str, mod: int) -> int:
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    return h % mod


class DemandaModel:
    def __init__(self):
        rng = np.random.default_rng(42)
        X, y = [], []
        for _ in range(500):
            plato_feat = rng.integers(0, 100)
            dia_sem = rng.integers(0, 7)
            feriado = rng.integers(0, 2)
            temp = rng.normal(22, 5)
            demanda = 80 + plato_feat * 1.2 + (6 - dia_sem) * 8 + feriado * 30 - (temp - 22) * 1.5 + rng.normal(0, 10)
            X.append([plato_feat, dia_sem, feriado, temp])
            y.append(max(0, demanda))
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.model.fit(X, y)

    def predict(self, features: dict) -> int:
        plato_feat = _hash_to_feat(str(features.get("plato_id", "")), 100)
        dia_sem = 2
        feriado = 1 if features.get("es_feriado") else 0
        temp = features.get("temperatura_c") or 22.0
        pred = self.model.predict([[plato_feat, dia_sem, feriado, temp]])[0]
        return int(max(10, pred))
