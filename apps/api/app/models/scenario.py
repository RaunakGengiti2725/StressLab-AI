from __future__ import annotations

from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class TestType(str, Enum):
    BEND = "bend"
    TWIST = "twist"
    TENSION = "tension"
    COMPRESSION = "compression"


class Constraint(BaseModel):
    region_id: str = Field(description="ID of the pinned face group")
    vertex_indices: List[int] = Field(default_factory=list, description="Anchored vertex indices")
    position: List[float] = Field(description="Centroid [x, y, z]")


class ForceLoad(BaseModel):
    region_id: str = Field(description="ID of the loaded face group")
    vertex_indices: List[int] = Field(default_factory=list, description="Loaded vertex indices")
    force_type: TestType
    magnitude: float = Field(ge=0, description="Force magnitude in N")
    direction: List[float] = Field(description="Normalized direction vector [x, y, z]")


class TestScenario(BaseModel):
    id: str = Field(description="Unique scenario identifier")
    name: str = Field(description="Human-readable name")
    project_id: str = Field(default="default")
    material_id: str = Field(description="Selected material profile ID")
    test_type: TestType
    constraints: List[Constraint] = Field(default_factory=list)
    loads: List[ForceLoad] = Field(default_factory=list)
    created_at: str = Field(description="ISO 8601 timestamp")
    notes: str = Field(default="")
