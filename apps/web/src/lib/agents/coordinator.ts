import type { AnalysisResult } from "@shared/agents";
import type { AgentInput } from "./types";
import { analyzeAllMaterials } from "./materialAnalyzer";
import { analyzeAllFailureModes } from "./failureAnalyzer";
import { analyzeDesign } from "./designAdvisor";
import { synthesizeMaterialRanking } from "./synthesisAnalyzer";

export function runAllAgents(input: AgentInput): AnalysisResult {
  const materialAgents = analyzeAllMaterials(input);
  const failureAgents = analyzeAllFailureModes(input);
  const advisor = analyzeDesign(input);
  const synthesis = synthesizeMaterialRanking(input);

  const allRisks = [
    ...materialAgents.map((a) => a.risk_score),
    ...failureAgents.map((a) => a.risk_score),
    advisor.risk_score,
  ];

  const overallRisk =
    allRisks.length > 0
      ? Math.round(allRisks.reduce((s, v) => s + v, 0) / allRisks.length)
      : 0;

  const currentMaterialResult = materialAgents.find(
    (a) => a.agent_id === `material-${input.material.id}`,
  );

  const bestMaterialId =
    (synthesis.supporting_metrics["best_material"] as string) ?? null;
  const bestMat = bestMaterialId
    ? materialAgents
        .map((a) => a.agent_id.replace("material-", ""))
        .sort(
          (a, b) =>
            (materialAgents.find((m) => m.agent_id === `material-${a}`)
              ?.risk_score ?? 100) -
            (materialAgents.find((m) => m.agent_id === `material-${b}`)
              ?.risk_score ?? 100),
        )[0] ?? null
    : null;

  return {
    timestamp: Date.now(),
    material_agents: materialAgents,
    failure_agents: failureAgents,
    advisor,
    synthesis,
    overall_risk: currentMaterialResult?.risk_score ?? overallRisk,
    best_material_id: bestMat,
  };
}
