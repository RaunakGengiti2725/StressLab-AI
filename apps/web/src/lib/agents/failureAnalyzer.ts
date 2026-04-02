import type { AgentOutput, Severity } from "@shared/agents";
import { AgentType } from "@shared/agents";
import type { AgentInput } from "./types";

function severityFromRisk(risk: number): Severity {
  if (risk >= 70) return "critical";
  if (risk >= 50) return "high";
  if (risk >= 30) return "moderate";
  if (risk >= 15) return "low";
  return "info";
}

export function analyzeBrittleFracture(input: AgentInput): AgentOutput {
  const mat = input.material;
  const sf =
    input.stress.maxStress > 0
      ? mat.yield_strength_mpa / input.stress.maxStress
      : 99;

  let risk = 10;

  if (mat.brittleness === "high") risk += 30;
  else if (mat.brittleness === "medium") risk += 10;

  if (mat.elongation_at_break_pct < 10) risk += 20;
  else if (mat.elongation_at_break_pct < 20) risk += 5;

  if (sf < 1.0) risk += 30;
  else if (sf < 1.5) risk += 20;
  else if (sf < 2.0) risk += 10;

  if (input.stress.stressConcentratorCount > 0) risk += 10;
  if (input.stress.dangerZonePct > 15) risk += 10;

  risk = Math.min(100, Math.max(0, Math.round(risk)));

  const recommendations: string[] = [];
  if (risk > 40) {
    if (mat.brittleness === "high")
      recommendations.push("Switch to a less brittle material like PETG or Nylon");
    if (input.stress.stressConcentratorCount > 0)
      recommendations.push("Add fillets to stress concentration points");
    if (sf < 1.5)
      recommendations.push("Increase wall thickness to raise the safety factor");
  }
  if (recommendations.length === 0)
    recommendations.push("Brittle fracture risk is within acceptable limits");

  let explanation: string;
  if (!input.isSimulationActive) {
    explanation = `${mat.name} has ${mat.brittleness} brittleness and ${mat.elongation_at_break_pct}% elongation at break. Apply forces to evaluate fracture risk.`;
  } else if (risk >= 60) {
    explanation = `High brittle fracture risk: ${mat.name} has ${mat.brittleness} brittleness with only ${mat.elongation_at_break_pct}% elongation. At ${input.stress.maxStress.toFixed(1)} MPa peak stress (safety factor ${sf.toFixed(1)}x), sudden failure is likely at stress concentrations.`;
  } else if (risk >= 30) {
    explanation = `Moderate fracture concern: ${mat.name} may fracture at stress concentrators. Safety factor is ${sf.toFixed(1)}x with ${input.stress.dangerZonePct.toFixed(1)}% of the part in the danger zone.`;
  } else {
    explanation = `Brittle fracture is unlikely for ${mat.name} under this load. Safety factor ${sf.toFixed(1)}x with adequate elongation margin.`;
  }

  return {
    agent_id: "failure-brittle",
    agent_type: AgentType.FAILURE,
    agent_name: "Brittle Fracture",
    category: "Failure Mode",
    severity: severityFromRisk(risk),
    risk_score: risk,
    confidence: input.isSimulationActive ? 0.85 : 0.3,
    failure_mode: risk > 40 ? "Brittle fracture" : null,
    explanation,
    recommendations,
    design_suggestions:
      risk > 40
        ? [
            {
              area: "Stress concentrations",
              action: "Add fillets (R ≥ 1mm) to all sharp internal corners",
              impact: "Reduces peak stress by 30-50%",
            },
          ]
        : [],
    supporting_metrics: {
      brittleness: mat.brittleness,
      elongation_pct: mat.elongation_at_break_pct,
      safety_factor: parseFloat(sf.toFixed(2)),
      stress_concentrators: input.stress.stressConcentratorCount,
    },
  };
}

export function analyzeFlexFatigue(input: AgentInput): AgentOutput {
  const mat = input.material;

  let risk = 10;

  if (mat.fatigue_resistance === "low") risk += 25;
  else if (mat.fatigue_resistance === "medium") risk += 10;

  if (input.testMode === "bend" || input.testMode === "twist") risk += 15;

  if (input.stress.dangerZonePct > 10) risk += 15;
  if (input.stress.maxStress > mat.yield_strength_mpa * 0.5) risk += 15;

  if (mat.youngs_modulus_gpa < 0.5) risk -= 10;

  risk = Math.min(100, Math.max(0, Math.round(risk)));

  const recommendations: string[] = [];
  if (risk > 40) {
    recommendations.push("Consider Nylon or TPU for better fatigue life");
    if (input.testMode === "bend")
      recommendations.push("Add ribs perpendicular to the bend axis");
    if (input.testMode === "twist")
      recommendations.push("Increase cross-section to reduce shear stress");
  }
  if (recommendations.length === 0)
    recommendations.push("Fatigue risk is within acceptable limits for typical use");

  let explanation: string;
  if (!input.isSimulationActive) {
    explanation = `${mat.name} has ${mat.fatigue_resistance} fatigue resistance. Apply cyclic loads to evaluate fatigue risk.`;
  } else if (risk >= 50) {
    explanation = `Significant fatigue concern: ${mat.name} has ${mat.fatigue_resistance} fatigue resistance under ${input.testMode ?? "unknown"} loading. Repeated loading at ${input.stress.maxStress.toFixed(1)} MPa will progressively weaken the part.`;
  } else {
    explanation = `Fatigue risk is ${risk > 25 ? "moderate" : "low"} for ${mat.name}. ${mat.fatigue_resistance === "high" ? "Good fatigue resistance." : "Monitor for signs of material degradation under repeated use."}`;
  }

  return {
    agent_id: "failure-fatigue",
    agent_type: AgentType.FAILURE,
    agent_name: "Flex / Fatigue",
    category: "Failure Mode",
    severity: severityFromRisk(risk),
    risk_score: risk,
    confidence: input.isSimulationActive ? 0.75 : 0.3,
    failure_mode: risk > 40 ? "Fatigue failure" : null,
    explanation,
    recommendations,
    design_suggestions:
      risk > 40
        ? [
            {
              area: "Load-bearing sections",
              action: "Add reinforcement ribs along the primary stress axis",
              impact: "Increases section modulus and distributes cyclic stress",
            },
          ]
        : [],
    supporting_metrics: {
      fatigue_resistance: mat.fatigue_resistance,
      test_mode: input.testMode ?? "none",
      stress_ratio: parseFloat(
        (input.stress.maxStress / mat.yield_strength_mpa).toFixed(2),
      ),
    },
  };
}

export function analyzeDelamination(input: AgentInput): AgentOutput {
  const mat = input.material;

  let risk = 5;

  if (mat.layer_adhesion === "low") risk += 30;
  else if (mat.layer_adhesion === "medium") risk += 12;

  if (input.testMode === "tension") risk += 25;
  else if (input.testMode === "bend") risk += 15;
  else if (input.testMode === "twist") risk += 10;

  if (input.stress.maxStress > mat.yield_strength_mpa * 0.6) risk += 15;
  if (input.stress.dangerZonePct > 15) risk += 5;

  if (mat.category === "resin") risk -= 20;

  risk = Math.min(100, Math.max(0, Math.round(risk)));

  const recommendations: string[] = [];
  if (risk > 35) {
    recommendations.push("Increase wall count (4+ perimeters) for better inter-layer bonding");
    if (input.testMode === "tension")
      recommendations.push(
        "Orient print so layers are parallel to the tension axis, not perpendicular",
      );
    if (mat.layer_adhesion === "low")
      recommendations.push("Switch to PETG or Nylon for superior layer adhesion");
  }
  if (recommendations.length === 0)
    recommendations.push("Layer delamination risk is acceptably low");

  let explanation: string;
  if (!input.isSimulationActive) {
    explanation = `${mat.name} has ${mat.layer_adhesion} layer adhesion. Tension and bending loads test inter-layer bonds most severely.`;
  } else if (risk >= 50) {
    explanation = `High delamination risk: ${mat.name}'s ${mat.layer_adhesion} layer adhesion is vulnerable under ${input.testMode ?? "this"} loading at ${input.stress.maxStress.toFixed(1)} MPa. Layers may separate at weak bond points.`;
  } else {
    explanation = `Delamination risk is ${risk > 20 ? "moderate" : "low"} for ${mat.name}. ${mat.layer_adhesion === "high" ? "Strong layer bonds reduce this concern." : "Print orientation matters for this material."}`;
  }

  return {
    agent_id: "failure-delamination",
    agent_type: AgentType.FAILURE,
    agent_name: "Delamination",
    category: "Failure Mode",
    severity: severityFromRisk(risk),
    risk_score: risk,
    confidence: input.isSimulationActive ? 0.7 : 0.25,
    failure_mode: risk > 35 ? "Layer delamination" : null,
    explanation,
    recommendations,
    design_suggestions:
      risk > 35
        ? [
            {
              area: "Print orientation",
              action:
                "Orient layers parallel to primary load direction (heuristic — verify with slicer)",
              impact: "Can improve inter-layer strength by 2-3x in tension",
            },
          ]
        : [],
    supporting_metrics: {
      layer_adhesion: mat.layer_adhesion,
      test_mode: input.testMode ?? "none",
      category: mat.category,
    },
  };
}

export function analyzeAllFailureModes(input: AgentInput): AgentOutput[] {
  return [
    analyzeBrittleFracture(input),
    analyzeFlexFatigue(input),
    analyzeDelamination(input),
  ];
}
