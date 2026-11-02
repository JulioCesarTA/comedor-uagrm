"""SPEC §5: Saga orchestrator + idempotencia (estado en DynamoDB)."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.saga.orchestrator import SagaOrchestrator

router = APIRouter()


class ReservarYPagarReq(BaseModel):
    estudiante_id: str
    menu_id: str
    plato_id: str
    fecha: str
    turno: str
    metodo_pago: str  # qr_bancario | efectivo | beca
    monto: float
    idempotency_key: str


@router.post("/reservar-y-pagar")
def saga1(body: ReservarYPagarReq):
    try:
        return SagaOrchestrator().reservar_y_pagar(body.model_dump())
    except Exception as e:
        raise HTTPException(400, str(e))


class CancelarReq(BaseModel):
    reserva_id: str
    pago_id: str
    idempotency_key: str


@router.post("/cancelar")
def saga2(body: CancelarReq):
    try:
        return SagaOrchestrator().cancelar(body.model_dump())
    except Exception as e:
        raise HTTPException(400, str(e))


@router.get("/{saga_id}")
def estado_saga(saga_id: str):
    return SagaOrchestrator().get_estado(saga_id)
