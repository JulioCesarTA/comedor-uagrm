"""Esquemas de entrada de la API de agentes."""
from pydantic import BaseModel


class Mision(BaseModel):
    objetivo: str
    contexto: dict | None = None


class PropuestaLocal(BaseModel):
    tipo: str
    clave: str
    titulo: str
    resumen: str
    payload: dict
    decision: str | None = None      # "aprobar" | "rechazar" si se decidió sin conexión


class Horario(BaseModel):
    activo: bool = True
    modo: str                      # cada | diario | semanal
    cadaMin: int = 60
    hora: str = "08:00"
    dias: list[int] = [0, 1, 2, 3, 4, 5, 6]
