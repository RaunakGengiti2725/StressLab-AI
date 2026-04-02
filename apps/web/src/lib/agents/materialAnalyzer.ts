import type { AgentOutput, Severity } from "@shared/agents";
import { AgentType } from "@shared/agents";
import type { MaterialProfile } from "@shared/materials";
import { MATERIALS } from "@/data/materials";
import type { AgentInput } from "./types";

function safetyFactor(mat: MaterialProfile, maxStress: number): number {
  if (maxStress < 1e-6) return 99;
  return mat.yield_strength_mpa / maxStress;
}

function elongationMargin(mat: MaterialProfile, maxDisp: number): number {
  const pctDisp = Math.min(maxDisp * 10, 100);
  return mat.elongation_at_break_pct - pctDisp;
}

function riskFromSafetyFactor(sf: number): number {
  if (sf >= 5) return 5;
  if (sf >= 3) return 15;
  if (sf >= 2) return 30;
  if (sf >= 1.5) return 50;
  if (sf >= 1.0) return 70;
  return 90;
}

function severityFromRisk(risk: number): Severity {
  if (risk >= 70) return "critical";
  if (risk >= 50) return "high";
  if (risk >= 30) return "moderate";
  if (risk >= 15) return "low";
  return "info";
}

function brittlenessMultiplier(mat: MaterialProfile): number {
  if (mat.brittleness === "high") return 1.3;
  if (mat.brittleness === "medium") return 1.0;
  return 0.7;
}

function adhesionPenalty(
  mat: MaterialProfile,
  testMode: string | null,
): number {
  if (testMode === "tension" || testMode === "bend") {
    if (mat.layer_adhesion === "low") return 15;
    if (mat.layer_adhesion === "medium") return 5;
  }
  return 0;
}

function failureModeForMaterial(mat: MaterialProfile, testMode: string | null): string {
  if (mat.brittleness === "high") return "Brittle fracture";
  if (testMode === "twist" && mat.fatigue_resistance === "low") return "Fatigue failure";
  if (
    (testMode === "tension" || testMode === "bend") &&
    mat.layer_adhesion === "low"
  )
    return "Layer delamination";
  if (mat.elongation_at_break_pct > 100) return "Excessive deformation";
  return "Yield failure";
}

export function analyzeMaterial(
  mat: MaterialProfile,
  input: AgentInput,
): AgentOutput {
  const sf = safetyFactor(mat, input.stress.maxStress);
  const elongMargin = elongationMargin(mat, input.deformation.maxDisplacement);

  let risk = riskFromSafetyFactor(sf);
  risk *= brittlenessMultiplier(mat);
  risk += adhesionPenalty(mat, input.testMode);

  if (elongMargin < 0) risk += 15;
  if (input.stress.dangerZonePct > 20) risk += 10;
  if (input.stress.stressConcentratorCount > 0) risk += 5;

  risk = Math.min(100, Math.max(0, Math.round(risk)));

  const severity = severityFromRisk(risk);
  const failureMode = failureModeForMaterial(mat, input.testMode);

  const recommendations: string[] = [];
  if (sf < 1.5)
    recommendations.push(
      `Safety factor is only ${sf.toFixed(1)}x — consider a stronger material`,
    );
  if (mat.brittleness === "high" && input.stress.dangerZonePct > 10)
    recommendations.push(
      "High brittleness + stress concentrations — add fillets to sharp corners",
    );
  if (mat.layer_adhesion === "low" && input.testMode === "tension")
    recommendations.push(
      "Poor layer adhesion under tension — print with more walls or use PETG/Nylon",
    );
  if (elongMargin < 0)
    recommendations.push(
      `Elongation at break (${mat.elongation_at_break_pct}%) may be exceeded — reduce load or switch material`,
    );
  if (mat.fatigue_resistance === "low" && risk > 30)
    recommendations.push(
      "Low fatigue resistance — not suitable for repeated loading",
    );
  if (recommendations.length === 0) {
    recommendations.push(
      `${mat.name} appears adequate for this load case with a safety factor of ${sf.toFixed(1)}x`,
    );
  }

  const explanation = buildMaterialExplanation(mat, input, sf, risk);

  return {
    agent_id: `material-${mat.id}`,
    agent_type: AgentType.MATERIAL,
    agent_name: `${mat.name} Agent`,
    category: "Material Analysis",
    severity,
    risk_score: risk,
    confidence: input.isSimulationActive ? 0.8 : 0.3,
    failure_mode: risk > 30 ? failureMode : null,
    explanation,
    recommendations,
    design_suggestions: [],
    supporting_metrics: {
      safety_factor: parseFloat(sf.toFixed(2)),
      yield_strength_mpa: mat.yield_strength_mpa,
      max_stress_mpa: parseFloat(input.stress.maxStress.toFixed(1)),
      elongation_at_break_pct: mat.elongation_at_break_pct,
      elongation_margin: parseFloat(elongMargin.toFixed(1)),
    },
  };
}

function buildMaterialExplanation(
  mat: MaterialProfile,
  input: AgentInput,
  sf: number,
  risk: number,
): string {
  if (!input.isSimulationActive) {
    return `${mat.name}: Yield strength ${mat.yield_strength_mpa} MPa, E=${mat.youngs_modulus_gpa} GPa, elongation ${mat.elongation_at_break_pct}%. Apply forces to see analysis.`;
  }

  const parts: string[] = [];

  if (risk >= 70) {
    parts.push(
      `${mat.name} is at high risk under this load.`,
    );
  } else if (risk >= 40) {
    parts.push(`${mat.name} shows moderate risk.`);
  } else {
    parts.push(`${mat.name} handles this load well.`);
  }

  parts.push(
    `Safety factor: ${sf.toFixed(1)}x (stress ${input.stress.maxStress.toFixed(1)} MPa vs yield ${mat.yield_strength_mpa} MPa).`,
  );

  if (mat.brittleness === "high") {
    parts.push("Brittleness is high — sudden fracture is possible without warning.");
  }
  if (mat.elongation_at_break_pct < 10) {
    parts.push(
      `Low elongation (${mat.elongation_at_break_pct}%) limits deformation capacity before failure.`,
    );
  }

  return parts.join(" ");
}

export function analyzeAllMaterials(input: AgentInput): AgentOutput[] {
  return MATERIALS.map((mat) => analyzeMaterial(mat, input));
}
