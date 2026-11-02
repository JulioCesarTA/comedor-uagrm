"""Endpoints de los 6 modelos ML/DL del SPEC §8."""
from datetime import date
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

from app.services.predictor_demanda import predecir_demanda
from app.services.predictor_asistencia import probabilidad_no_presentacion
from app.services.segmentador import segmentar_comensales, agrupar_platos
from app.services.imagen import estimar_desperdicio, clasificar_calidad_insumo

router = APIRouter()


class DemandaIn(BaseModel):
    fecha: date
    plato_id: str
    es_feriado: bool = False
    temperatura_c: float | None = None


@router.post("/demanda")
def demanda(body: DemandaIn):
    """Supervisado — regresión: raciones esperadas por turno/plato."""
    return {
        "fecha": body.fecha, "platoId": body.plato_id,
        "racionesEstimadas": predecir_demanda(body.model_dump()),
    }


class NoShowIn(BaseModel):
    estudiante_id: str
    plato_id: str
    turno: str


@router.post("/no-presentacion")
def no_show(body: NoShowIn):
    """Supervisado — clasificación: prob de no-show de una reserva."""
    return {"probNoShow": probabilidad_no_presentacion(body.model_dump())}


@router.get("/segmentar-comensales")
def seg_comensales():
    """No supervisado: clusters de comensales."""
    return {"clusters": segmentar_comensales()}


@router.get("/agrupar-platos")
def ag_platos():
    """No supervisado: clusters de platos."""
    return {"clusters": agrupar_platos()}


@router.post("/desperdicio")
async def desperdicio(file: UploadFile = File(...)):
    """CNN (DL): foto de bandeja -> % de desperdicio por componente."""
    buf = await file.read()
    return estimar_desperdicio(buf)


@router.post("/calidad-insumo")
async def calidad(file: UploadFile = File(...)):
    """CNN (DL): foto de insumo recibido -> clase de calidad."""
    buf = await file.read()
    return clasificar_calidad_insumo(buf)
