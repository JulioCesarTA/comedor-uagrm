from app.models.segmentacion_model import SegmentacionComensales, AgrupadorPlatos


def segmentar_comensales() -> list[dict]:
    return SegmentacionComensales().clusters()


def agrupar_platos() -> list[dict]:
    return AgrupadorPlatos().clusters()
