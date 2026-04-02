from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class DeformationSummary(BaseModel):
    max_displacement_mm: float = Field(description="Maximum vertex displacement")
    avg_displacement_mm: float = Field(description="Average vertex displacement")
    displaced_vertex_count: int = Field(description="Number of vertices with nonzero displacement")
    total_vertex_count: int


class StressFieldSummary(BaseModel):
    max_stress_mpa: float = Field(description="Peak von-Mises-equivalent stress")
    min_stress_mpa: float = Field(ge=0)
    avg_stress_mpa: float
    danger_zone_pct: float = Field(
        ge=0, le=100, description="Percentage of mesh area above yield threshold"
    )
    stress_concentrator_count: int = Field(description="Sharp corners / thin walls detected")
    thin_wall_count: int = Field(description="Regions thinner than recommended minimum")


class GeometrySummary(BaseModel):
    vertex_count: int
    face_count: int
    bounding_box_mm: List[float] = Field(description="[width, height, depth]")
    volume_mm3: float
    surface_area_mm2: float
    is_watertight: bool


class SimulationState(BaseModel):
    scenario_id: str
    material_id: str
    geometry: GeometrySummary
    deformation: DeformationSummary
    stress: StressFieldSummary
