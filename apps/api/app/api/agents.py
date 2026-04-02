from fastapi import APIRouter

from app.models import AgentOutput, AgentType, DesignSuggestion

router = APIRouter(prefix="/agents", tags=["agents"])


def _mock_material_agent(material_id: str, material_name: str, risk: float) -> AgentOutput:
    return AgentOutput(
        agent_id=f"{material_id}-agent",
        agent_type=AgentType.MATERIAL,
        agent_name=f"{material_name} Agent",
        risk_score=risk,
        confidence=0.85,
        failure_mode="brittle fracture" if risk > 60 else None,
        explanation=(
            f"Based on the current load scenario, {material_name} shows "
            f"{'elevated' if risk > 60 else 'moderate' if risk > 30 else 'low'} "
            f"risk. This assessment considers the material's stiffness, elongation at break, "
            f"and layer adhesion properties against the applied stress field."
        ),
        recommendations=[
            f"{'Consider switching to a tougher material' if risk > 60 else 'Material is suitable for this load case'}",
        ],
        design_suggestions=[
            DesignSuggestion(
                area="high-stress corner",
                action="Add 2mm fillet radius",
                impact="Reduce peak stress by ~30%",
            ),
        ]
        if risk > 40
        else [],
    )


@router.get("/evaluate")
async def evaluate_agents():
    """Run all agents against current state. Phase 1 stub: returns mock outputs."""
    return {
        "agents": [
            _mock_material_agent("pla", "PLA", 72.0).model_dump(),
            _mock_material_agent("petg", "PETG", 38.0).model_dump(),
            _mock_material_agent("abs", "ABS", 45.0).model_dump(),
            _mock_material_agent("nylon", "Nylon", 22.0).model_dump(),
            _mock_material_agent("tpu", "TPU", 12.0).model_dump(),
            _mock_material_agent("resin", "Resin", 68.0).model_dump(),
        ]
    }


@router.get("/materials")
async def list_materials():
    """Return available material profiles."""
    from app.models.material import MATERIAL_LIBRARY

    return {"materials": [m.model_dump() for m in MATERIAL_LIBRARY]}
