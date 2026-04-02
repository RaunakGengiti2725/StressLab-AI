from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import health, cad, simulation, agents

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AI-assisted pre-print validation workspace for 3D printed parts",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(cad.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
