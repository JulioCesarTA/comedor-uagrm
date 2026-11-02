from app.models.no_show_model import NoShowModel

_model = NoShowModel()


def probabilidad_no_presentacion(features: dict) -> float:
    return _model.predict_proba(features)
