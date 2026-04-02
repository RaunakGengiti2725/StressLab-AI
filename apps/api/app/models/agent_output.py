from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class AgentType(str, Enum):
    MATERIAL = "material"
    FAILURE = "failure"
    SYNTHESIS = "synthesis"


class DesignSuggestion(BaseModel):
    area: str = Field(description="Region or aspect of the design")
    action: str = Field(description="Recommended change")
    impact: str = Field(description="Expected improvement")


class AgentOutput(BaseModel):
    agent_id: str = Field(description="Unique agent identifier, e.g. 'pla-agent'")
    agent_type: AgentType
    agent_name: str = Field(description="Human-readable name")
    risk_score: float = Field(ge=0, le=100, description="Overall risk 0 (safe) to 100 (danger)")
    confidence: float = Field(ge=0, le=1, description="Agent confidence in its assessment")
    failure_mode: Optional[str] = Field(default=None, description="Primary failure mode if any")
    explanation: str = Field(description="One-paragraph grounded explanation")
    recommendations: List[str] = Field(default_factory=list)
    design_suggestions: List[DesignSuggestion] = Field(default_factory=list)
