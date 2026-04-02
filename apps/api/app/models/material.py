from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class MaterialProfile(BaseModel):
    id: str = Field(description="Unique material identifier")
    name: str = Field(description="Display name")
    category: str = Field(description="thermoplastic | resin")
    youngs_modulus_gpa: float = Field(description="Stiffness (GPa)")
    yield_strength_mpa: float = Field(description="Yield strength (MPa)")
    ultimate_strength_mpa: float = Field(description="Ultimate tensile strength (MPa)")
    elongation_at_break_pct: float = Field(description="Elongation at break (%)")
    density_g_cm3: float = Field(description="Density (g/cm³)")
    heat_deflection_c: float = Field(description="Heat deflection temperature (°C)")
    layer_adhesion: str = Field(description="low | medium | high")
    fatigue_resistance: str = Field(description="low | medium | high")
    brittleness: str = Field(description="low | medium | high")
    color_hex: str = Field(description="UI display color")


MATERIAL_LIBRARY: List[MaterialProfile] = [
    MaterialProfile(
        id="pla",
        name="PLA",
        category="thermoplastic",
        youngs_modulus_gpa=3.5,
        yield_strength_mpa=60.0,
        ultimate_strength_mpa=65.0,
        elongation_at_break_pct=6.0,
        density_g_cm3=1.24,
        heat_deflection_c=60.0,
        layer_adhesion="medium",
        fatigue_resistance="low",
        brittleness="high",
        color_hex="#22d3ee",
    ),
    MaterialProfile(
        id="petg",
        name="PETG",
        category="thermoplastic",
        youngs_modulus_gpa=2.0,
        yield_strength_mpa=50.0,
        ultimate_strength_mpa=53.0,
        elongation_at_break_pct=23.0,
        density_g_cm3=1.27,
        heat_deflection_c=80.0,
        layer_adhesion="high",
        fatigue_resistance="medium",
        brittleness="medium",
        color_hex="#a78bfa",
    ),
    MaterialProfile(
        id="abs",
        name="ABS",
        category="thermoplastic",
        youngs_modulus_gpa=2.3,
        yield_strength_mpa=40.0,
        ultimate_strength_mpa=44.0,
        elongation_at_break_pct=20.0,
        density_g_cm3=1.04,
        heat_deflection_c=100.0,
        layer_adhesion="medium",
        fatigue_resistance="medium",
        brittleness="medium",
        color_hex="#fb923c",
    ),
    MaterialProfile(
        id="nylon",
        name="Nylon",
        category="thermoplastic",
        youngs_modulus_gpa=1.7,
        yield_strength_mpa=70.0,
        ultimate_strength_mpa=85.0,
        elongation_at_break_pct=30.0,
        density_g_cm3=1.14,
        heat_deflection_c=80.0,
        layer_adhesion="high",
        fatigue_resistance="high",
        brittleness="low",
        color_hex="#4ade80",
    ),
    MaterialProfile(
        id="tpu",
        name="TPU",
        category="thermoplastic",
        youngs_modulus_gpa=0.03,
        yield_strength_mpa=30.0,
        ultimate_strength_mpa=40.0,
        elongation_at_break_pct=500.0,
        density_g_cm3=1.21,
        heat_deflection_c=60.0,
        layer_adhesion="high",
        fatigue_resistance="high",
        brittleness="low",
        color_hex="#f472b6",
    ),
    MaterialProfile(
        id="resin",
        name="Resin (Standard)",
        category="resin",
        youngs_modulus_gpa=2.8,
        yield_strength_mpa=55.0,
        ultimate_strength_mpa=65.0,
        elongation_at_break_pct=5.0,
        density_g_cm3=1.18,
        heat_deflection_c=70.0,
        layer_adhesion="high",
        fatigue_resistance="low",
        brittleness="high",
        color_hex="#facc15",
    ),
]
