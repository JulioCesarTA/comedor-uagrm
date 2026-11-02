"""SPEC §10: reportes generativos — el LLM elige consulta predefinida, nunca SQL libre."""
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.reportes.generador import GeneradorReportes

router = APIRouter()


class ReportePeticion(BaseModel):
    pregunta: str
    rol_usuario: str
    formato: str = "json"  # json | excel | pdf


@router.post("/pedir")
def pedir_reporte(body: ReportePeticion):
    return GeneradorReportes().responder(body.pregunta, body.rol_usuario, body.formato)
