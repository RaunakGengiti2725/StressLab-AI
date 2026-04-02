import type { AgentOutput, DesignSuggestion, Severity } from "@shared/agents";
import { AgentType } from "@shared/agents";
import type { AgentInput } from "./types";

function severityFromRisk(risk: number): Severity {
  if (risk >= 70) return "critical";
  if (risk >= 50) return "high";
  if (risk >= 30) return "moderate";
  if (risk >= 15) return "low";
  return "info";
}

export function analyzeDesign(input: AgentInput): AgentOutput {
  const mat = input.material;
  const suggestions: DesignSuggestion[] = [];
  const recommendations: string[] = [];
  let risk = 0;

  if (!input.isSimulationActive) {
    return {
      agent_id: "advisor-design",
      agent_type: AgentType.ADVISOR,
      agent_name: "Design Advisor",
      category: "Design Recommendations",
      severity: "info",
      risk_score: 0,
      confidence: 0.2,
      failure_mode: null,
      explanation:
        "Apply forces to the model to receive design improvement recommendations. The advisor analyzes stress patterns, geometry features, and material suitability.",
      recommendations: ["Load a model and apply forces to begin analysis"],
      design_suggestions: [],
      supporting_metrics: {},
    };
  }

  if (input.stress.stressConcentratorCount > 0) {
    risk += 20;
    suggestions.push({
      area: "Sharp corners / edges",
      action: "Add fillets (R ≥ 1-2mm) to internal corners",
      impact: "Reduces peak stress by 30-50% at concentration points",
    });
    recommendations.push(
      `Found ${input.stress.stressConcentratorCount} stress concentration points — add fillets to reduce peak stress`,
    );
  }

  if (input.stress.thinWallCount > 0) {
    risk += 15;
    suggestions.push({
      area: "Thin wall sections",
      action: "Increase wall thickness to ≥ 2mm minimum",
      impact: "Prevents localized failure at thin regions",
    });
    recommendations.push(
      `${input.stress.thinWallCount} thin-wall regions detected — increase thickness for structural integrity`,
    );
  }

  if (input.stress.dangerZonePct > 25) {
    risk += 25;
    suggestions.push({
      area: "High-stress zone (>25% of part)",
      action: "Add reinforcement ribs perpendicular to primary load direction",
      impact: "Distributes load over larger area, reduces peak stress",
    });
    recommendations.push(
      `${input.stress.dangerZonePct.toFixed(1)}% of the part is in the danger zone — add structural ribs`,
    );
  } else if (input.stress.dangerZonePct > 10) {
    risk += 10;
    recommendations.push(
      `${input.stress.dangerZonePct.toFixed(1)}% danger zone — monitor but generally acceptable`,
    );
  }

  const sf =
    input.stress.maxStress > 0
      ? mat.yield_strength_mpa / input.stress.maxStress
      : 99;

  if (sf < 1.5) {
    risk += 20;
    suggestions.push({
      area: "Overall cross-section",
      action: "Increase thickness in the load path by 30-50%",
      impact: `Raises safety factor from ${sf.toFixed(1)}x toward 2.0x or higher`,
    });
    recommendations.push(
      `Safety factor is only ${sf.toFixed(1)}x — increase cross-section or switch to a stronger material`,
    );
  }

  if (mat.brittleness === "high" && input.stress.dangerZonePct > 5) {
    risk += 10;
    recommendations.push(
      "Using a brittle material with visible stress — consider PETG or Nylon for impact resistance",
    );
  }

  if (
    input.testMode === "bend" &&
    input.deformation.maxDisplacement > 0.5
  ) {
    suggestions.push({
      area: "Bending section",
      action: "Add gussets or change cross-section from rectangular to I/T-beam profile",
      impact: "Increases moment of inertia, reducing deflection under bending",
    });
  }

  if (
    input.testMode === "twist" &&
    input.deformation.maxDisplacement > 0.3
  ) {
    suggestions.push({
      area: "Torsion region",
      action: "Use a closed cross-section (e.g., tube) instead of open channel",
      impact: "Dramatically improves torsional rigidity",
    });
  }

  risk = Math.min(100, Math.max(0, Math.round(risk)));

  if (recommendations.length === 0) {
    recommendations.push("Geometry looks structurally sound for this load case");
  }

  const explanation = buildAdvisorExplanation(input, risk, sf, suggestions.length);

  return {
    agent_id: "advisor-design",
    agent_type: AgentType.ADVISOR,
    agent_name: "Design Advisor",
    category: "Design Recommendations",
    severity: severityFromRisk(risk),
    risk_score: risk,
    confidence: input.isSimulationActive ? 0.75 : 0.2,
    failure_mode: null,
    explanation,
    recommendations,
    design_suggestions: suggestions,
    supporting_metrics: {
      safety_factor: parseFloat(sf.toFixed(2)),
      danger_zone_pct: parseFloat(input.stress.dangerZonePct.toFixed(1)),
      stress_concentrators: input.stress.stressConcentratorCount,
      thin_walls: input.stress.thinWallCount,
      suggestion_count: suggestions.length,
    },
  };
}

function buildAdvisorExplanation(
  input: AgentInput,
  risk: number,
  sf: number,
  suggestionCount: number,
): string {
  if (suggestionCount === 0) {
    return `No critical design issues found. Safety factor is ${sf.toFixed(1)}x with ${input.stress.dangerZonePct.toFixed(1)}% danger zone. The current geometry handles this load case well.`;
  }

  const issues: string[] = [];
  if (input.stress.stressConcentratorCount > 0) issues.push("stress concentrations");
  if (input.stress.thinWallCount > 0) issues.push("thin walls");
  if (input.stress.dangerZonePct > 20) issues.push("large danger zone");
  if (sf < 1.5) issues.push("low safety factor");

  return `${suggestionCount} design improvement${suggestionCount > 1 ? "s" : ""} identified: ${issues.join(", ")}. Addressing these could significantly reduce failure risk (currently ${risk}/100).`;
}
