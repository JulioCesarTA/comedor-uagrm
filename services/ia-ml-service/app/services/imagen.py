from app.models.cnn_desperdicio import CnnDesperdicio
from app.models.cnn_calidad_insumo import CnnCalidadInsumo


def estimar_desperdicio(image_bytes: bytes) -> dict:
    return CnnDesperdicio().predict(image_bytes)


def clasificar_calidad_insumo(image_bytes: bytes) -> dict:
    return CnnCalidadInsumo().predict(image_bytes)
