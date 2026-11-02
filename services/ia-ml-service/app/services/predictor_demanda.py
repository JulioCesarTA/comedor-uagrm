"""Wrapper del modelo supervisado de regresión (predicción de raciones)."""
from app.models.demanda_model import DemandaModel

_model = DemandaModel()


def predecir_demanda(features: dict) -> int:
    return _model.predict(features)
