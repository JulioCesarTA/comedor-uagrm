"""Agentes de IA del SPEC §3.4. Cada misión usa skills MCP contra los otros microservicios."""
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.agentes.monitor_comedor_agent import MonitorComedorAgent
from app.services.agentes.planificador_menu_agent import PlanificadorMenuAgent
from app.services.agentes.inventario_compras_agent import InventarioComprasAgent
from app.services.agentes.atencion_estudiante_agent import AtencionEstudianteAgent

router = APIRouter()


class Mision(BaseModel):
    objetivo: str
    contexto: dict | None = None


@router.post("/monitor-comedor")
def monitor(m: Mision):
    return MonitorComedorAgent().run(m.objetivo, m.contexto or {})

@router.post("/planificador-menu")
def planif(m: Mision):
    return PlanificadorMenuAgent().run(m.objetivo, m.contexto or {})

@router.post("/inventario-compras")
def inv(m: Mision):
    return InventarioComprasAgent().run(m.objetivo, m.contexto or {})

@router.post("/atencion-estudiante")
def atn(m: Mision):
    return AtencionEstudianteAgent().run(m.objetivo, m.contexto or {})
