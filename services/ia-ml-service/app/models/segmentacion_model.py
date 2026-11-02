"""K-means REAL con sklearn, sobre features sintéticos."""
import numpy as np
from sklearn.cluster import KMeans


class SegmentacionComensales:
    def __init__(self):
        rng = np.random.default_rng(11)
        # 1000 comensales simulados: [frecuencia, hora_pref, usa_beca]
        f = np.concatenate([rng.normal(20, 3, 400), rng.normal(5, 2, 300), rng.normal(12, 2, 200), rng.normal(2, 1, 100)])
        h = np.concatenate([rng.normal(12, 1, 400), rng.normal(12, 1, 300), rng.normal(19, 1, 200), rng.normal(12, 1, 100)])
        b = np.concatenate([np.zeros(400), np.ones(300), np.zeros(200), np.ones(100)])
        X = np.column_stack([f, h, b])
        km = KMeans(n_clusters=4, random_state=11, n_init=5).fit(X)
        self._centers = km.cluster_centers_
        self._labels, counts = np.unique(km.labels_, return_counts=True)
        self._counts = counts

    def clusters(self) -> list[dict]:
        out = []
        for i, c in enumerate(self._centers):
            freq, hora, beca = c
            etiq = []
            etiq.append("frecuente" if freq > 15 else ("regular" if freq > 8 else "esporadico"))
            etiq.append("almuerzo" if hora < 14 else "cena")
            if beca > 0.5: etiq.append("becario")
            out.append({"id": int(i), "etiqueta": "-".join(etiq), "tam": int(self._counts[i])})
        return out


class AgrupadorPlatos:
    def __init__(self):
        rng = np.random.default_rng(17)
        # 50 platos: [aceptacion_0a1, costo_bob, pct_desperdicio]
        X = np.column_stack([
            rng.beta(5, 2, 50),
            rng.gamma(2, 3, 50) + 3,
            rng.beta(2, 5, 50) * 100
        ])
        km = KMeans(n_clusters=3, random_state=17, n_init=5).fit(X)
        self._centers = km.cluster_centers_
        _, counts = np.unique(km.labels_, return_counts=True)
        self._counts = counts

    def clusters(self) -> list[dict]:
        out = []
        for i, c in enumerate(self._centers):
            acep, costo, desp = c
            label_parts = []
            label_parts.append("alta-aceptacion" if acep > 0.65 else "baja-aceptacion")
            label_parts.append(f"costo-{'alto' if costo > 8 else 'bajo'}")
            label_parts.append(f"desp-{'alto' if desp > 25 else 'bajo'}")
            out.append({"id": int(i), "etiqueta": "-".join(label_parts), "tam": int(self._counts[i])})
        return out
