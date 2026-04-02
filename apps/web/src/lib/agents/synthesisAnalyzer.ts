import type { AgentOutput, Severity } from "@shared/agents";
import { AgentType } from "@shared/agents";
import { MATERIALS } from "@/data/materials";
import { analyzeMaterial } from "./materialAnalyzer";
import type { AgentInput } from "./types";

function severityFromRisk(risk: number): Severity {
  if (risk >= 70) return "critical";
  if (risk >= 50) return "high";
  if (risk >= 30) return "moderate";
  if (risk >= 15) return "low";
  return "info";
}

interface RankedMaterial {
  id: string;
  name: string;
  riskScore: number;
  safetyFactor: number;
}

export function synthesizeMaterialRanking(input: AgentInput): AgentOutput {
  if (!input.isSimulationActive) {
    return {
      agent_id: "synthesis-ranking",
      agent_type: AgentType.SYNTHESIS,
      agent_name: "Material Ranker",
      category: "Synthesis",
      severity: "info",
      risk_score: 0,
      confidence: 0.2,
      failure_mode: null,
      explanation:
        "Apply forces to compare all materials for this load case. The ranker evaluates each material against the current stress state.",
      recommendations: ["Apply forces to begin material comparison"],
      design_suggestions: [],
      supporting_metrics: {},
    };
  }

  const ranked: RankedMaterial[] = MATERIALS.map((mat) => {
    const result = analyzeMaterial(mat, { ...input, material: mat });
    const sf =
      input.stress.maxStress > 0
        ? mat.yield_strength_mpa / input.stress.maxStress
        : 99;
    return {
      id: mat.id,
      name: mat.name,
      riskScore: result.risk_score,
      safetyFactor: sf,
    };
  }).sort((a, b) => a.riskScore - b.riskScore);

  const best = ranked[0]!;
  const worst = ranked[ranked.length - 1]!;
  const current = ranked.find((r) => r.id === input.material.id);
  const currentRank =
    ranked.findIndex((r) => r.id === input.material.id) + 1;

  const overallRisk = current?.riskScore ?? 50;

  const recommendations: string[] = [];
  if (currentRank > 1) {
    recommendations.push(
      `Best option: ${best.name} (risk ${best.riskScore}/100, SF ${best.safetyFactor.toFixed(1)}x)`,
    );
  }
  if (currentRank <= 2) {
    recommendations.push(
      `${input.material.name} is ${currentRank === 1 ? "the best" : "a strong"} choice for this load case`,
    );
  }
  if (currentRank > 3) {
    recommendations.push(
      `${input.material.name} ranks ${currentRank}/6 — consider switching to ${best.name}`,
    );
  }

  const rankingStr = ranked
    .map((r, i) => `${i + 1}. ${r.name} (risk ${r.riskScore})`)
    .join("; ");

  const explanation = `Material ranking for current ${input.testMode ?? "load"} case: ${rankingStr}. ${best.name} is safest (risk ${best.riskScore}/100), ${worst.name} is riskiest (risk ${worst.riskScore}/100). Current material ${input.material.name} ranks #${currentRank}.`;

  const metrics: Record<string, string | number> = {
    best_material: best.name,
    best_risk: best.riskScore,
    worst_material: worst.name,
    worst_risk: worst.riskScore,
    current_rank: currentRank,
  };
  for (const r of ranked) {
    metrics[`${r.id}_risk`] = r.riskScore;
  }

  return {
    agent_id: "synthesis-ranking",
    agent_type: AgentType.SYNTHESIS,
    agent_name: "Material Ranker",
    category: "Synthesis",
    severity: severityFromRisk(overallRisk),
    risk_score: overallRisk,
    confidence: 0.8,
    failure_mode: null,
    explanation,
    recommendations,
    design_suggestions: [],
    supporting_metrics: metrics,
  };
}
