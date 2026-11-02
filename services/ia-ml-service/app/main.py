"""ia-ml-service — FastAPI app con arquitectura en capas (API -> services -> models/data)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import predicciones, agentes, reportes, sagas

app = FastAPI(title="ia-ml-service", version="1.0.0",
              description="Comedor UAGRM — IA/ML + Agentes + Saga orchestrator")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

@app.get("/health")
def health() -> dict:
    return {"status": "UP", "service": "ia-ml-service"}

app.include_router(predicciones.router, prefix="/ml", tags=["ml"])
app.include_router(agentes.router, prefix="/agentes", tags=["agentes"])
app.include_router(reportes.router, prefix="/reportes", tags=["reportes"])
app.include_router(sagas.router, prefix="/sagas", tags=["sagas"])
