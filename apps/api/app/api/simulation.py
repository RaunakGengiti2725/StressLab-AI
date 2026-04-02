from fastapi import APIRouter

from app.models import SimulationState, StressFieldSummary, DeformationSummary
from app.models.simulation import GeometrySummary

router = APIRouter(prefix="/simulation", tags=["simulation"])


def _mock_simulation_state(material_id: str = "pla") -> SimulationState:
    """Return a plausible mock simulation state for stub responses."""
    return SimulationState(
        scenario_id="stub-scenario-1",
        material_id=material_id,
        geometry=GeometrySummary(
            vertex_count=2844,
            face_count=948,
            bounding_box_mm=[80.0, 40.0, 25.0],
            volume_mm3=32000.0,
            surface_area_mm2=12800.0,
            is_watertight=True,
        ),
        deformation=DeformationSummary(
            max_displacement_mm=1.2,
            avg_displacement_mm=0.35,
            displaced_vertex_count=1800,
            total_vertex_count=2844,
        ),
        stress=StressFieldSummary(
            max_stress_mpa=48.0,
            min_stress_mpa=0.0,
            avg_stress_mpa=12.5,
            danger_zone_pct=8.3,
            stress_concentrator_count=3,
            thin_wall_count=1,
        ),
    )


@router.get("/state")
async def get_simulation_state(material_id: str = "pla"):
    """Return the current simulation state. Phase 1 stub: returns mock data."""
    return _mock_simulation_state(material_id)


@router.post("/run")
async def run_simulation():
    """Trigger a simulation run. Phase 1 stub: returns mock result."""
    return {
        "status": "completed",
        "message": "Simulation engine not implemented until Phase 3.",
        "state": _mock_simulation_state().model_dump(),
    }
