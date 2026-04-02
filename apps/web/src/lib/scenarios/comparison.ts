import type { AgentInput } from "@/lib/agents/types";
import type { MaterialProfile } from "@shared/materials";
import { MATERIALS } from "@/data/materials";
import { analyzeMaterial } from "@/lib/agents/materialAnalyzer";
import type {
  MaterialComparisonEntry,
  MaterialComparisonResult,
  ScenarioComparisonResult,
  ScenarioComparisonRow,
  SavedScenario,
} from "./types";

/**
 * Approximate how stress/deformation change when switching materials.
 * For a linear-elastic model: displacement ~ 1/E, stress ~ E * displacement_gradient.
 * Since displacement_gradient ~ displacement / characteristic_length,
 * stress stays roughly constant while deformation scales inversely with E.
 * However, we also factor in geometry-induced stress concentration which stays constant.
 */
function scaleInputForMaterial(
  baseInput: AgentInput,
  baseMat: MaterialProfile,
  targetMat: MaterialProfile,
): AgentInput {
  const eRatio = baseMat.youngs_modulus_gpa / targetMat.youngs_modulus_gpa;
  const clampedRatio = Math.max(0.01, Math.min(100, eRatio));

  const scaledMaxDisp = baseInput.deformation.maxDisplacement * clampedRatio;
  const scaledAvgDisp = baseInput.deformation.avgDisplacement * clampedRatio;

  const stressScale = 1 / clampedRatio;
  const scaledMaxStress = baseInput.stress.maxStress * stressScale;
  const scaledAvgStress = baseInput.stress.avgStress * stressScale;

  const scaledDangerPct =
    clampedRatio > 1
      ? Math.min(100, baseInput.stress.dangerZonePct * (1 + (clampedRatio - 1) * 0.3))
      : baseInput.stress.dangerZonePct * clampedRatio;

  return {
    ...baseInput,
    material: targetMat,
    deformation: {
      ...baseInput.deformation,
      maxDisplacement: scaledMaxDisp,
      avgDisplacement: scaledAvgDisp,
    },
    stress: {
      ...baseInput.stress,
      maxStress: scaledMaxStress,
      avgStress: scaledAvgStress,
      dangerZonePct: scaledDangerPct,
    },
  };
}

export function compareAllMaterials(
  baseInput: AgentInput,
): MaterialComparisonResult {
  const baseMat = baseInput.material;
  const entries: MaterialComparisonEntry[] = [];

  for (const mat of MATERIALS) {
    const scaledInput =
      mat.id === baseMat.id
        ? baseInput
        : scaleInputForMaterial(baseInput, baseMat, mat);

    const agentResult = analyzeMaterial(mat, scaledInput);

    const sf =
      typeof agentResult.supporting_metrics["safety_factor"] === "number"
        ? agentResult.supporting_metrics["safety_factor"]
        : 0;

    entries.push({
      materialId: mat.id,
      materialName: mat.name,
      colorHex: mat.color_hex,
      riskScore: agentResult.risk_score,
      severity: agentResult.severity,
      safetyFactor: sf,
      maxStressScaled:
        typeof agentResult.supporting_metrics["max_stress_mpa"] === "number"
          ? agentResult.supporting_metrics["max_stress_mpa"]
          : scaledInput.stress.maxStress,
      maxDisplacementScaled: scaledInput.deformation.maxDisplacement,
      dangerPctScaled: scaledInput.stress.dangerZonePct,
      failureMode: agentResult.failure_mode,
      topRecommendation: agentResult.recommendations[0] ?? "No issues detected",
    });
  }

  entries.sort((a, b) => a.riskScore - b.riskScore);

  const forceMag = Math.sqrt(
    baseInput.forceDirection[0] ** 2 +
      baseInput.forceDirection[1] ** 2 +
      baseInput.forceDirection[2] ** 2,
  ) * baseInput.forceMagnitude;

  return {
    timestamp: Date.now(),
    baselineMaterialId: baseMat.id,
    testMode: baseInput.testMode,
    forceMagnitude: forceMag,
    entries,
    bestMaterialId: entries[0]?.materialId ?? baseMat.id,
    worstMaterialId: entries[entries.length - 1]?.materialId ?? baseMat.id,
  };
}

export function compareScenarios(
  a: SavedScenario,
  b: SavedScenario,
): ScenarioComparisonResult {
  const rows: ScenarioComparisonRow[] = [];

  const matA = MATERIALS.find((m) => m.id === a.materialId);
  const matB = MATERIALS.find((m) => m.id === b.materialId);

  rows.push({
    field: "Material",
    scenarioA: matA?.name ?? a.materialId,
    scenarioB: matB?.name ?? b.materialId,
    delta: a.materialId === b.materialId ? "Same" : "Different",
  });

  rows.push({
    field: "Test Mode",
    scenarioA: a.testMode ?? "None",
    scenarioB: b.testMode ?? "None",
    delta: a.testMode === b.testMode ? "Same" : "Different",
  });

  const fmA = Math.sqrt(
    a.forceDelta[0] ** 2 + a.forceDelta[1] ** 2 + a.forceDelta[2] ** 2,
  );
  const fmB = Math.sqrt(
    b.forceDelta[0] ** 2 + b.forceDelta[1] ** 2 + b.forceDelta[2] ** 2,
  );
  rows.push({
    field: "Force Magnitude",
    scenarioA: fmA.toFixed(2),
    scenarioB: fmB.toFixed(2),
    delta: (fmB - fmA).toFixed(2),
  });

  rows.push({
    field: "Max Stress (MPa)",
    scenarioA: a.maxStress.toFixed(1),
    scenarioB: b.maxStress.toFixed(1),
    delta: `${(b.maxStress - a.maxStress).toFixed(1)} (${pctDelta(a.maxStress, b.maxStress)})`,
  });

  rows.push({
    field: "Max Displacement (mm)",
    scenarioA: a.maxDisplacement.toFixed(2),
    scenarioB: b.maxDisplacement.toFixed(2),
    delta: `${(b.maxDisplacement - a.maxDisplacement).toFixed(2)} (${pctDelta(a.maxDisplacement, b.maxDisplacement)})`,
  });

  rows.push({
    field: "Danger Zone %",
    scenarioA: `${a.dangerPct.toFixed(1)}%`,
    scenarioB: `${b.dangerPct.toFixed(1)}%`,
    delta: `${(b.dangerPct - a.dangerPct).toFixed(1)}%`,
  });

  const riskA = a.analysis?.overall_risk ?? 0;
  const riskB = b.analysis?.overall_risk ?? 0;
  rows.push({
    field: "Overall Risk",
    scenarioA: `${riskA}/100`,
    scenarioB: `${riskB}/100`,
    delta: `${riskB - riskA}`,
  });

  const failA = a.analysis?.failure_agents[0]?.failure_mode ?? "—";
  const failB = b.analysis?.failure_agents[0]?.failure_mode ?? "—";
  rows.push({
    field: "Likely Failure Mode",
    scenarioA: failA,
    scenarioB: failB,
    delta: failA === failB ? "Same" : "Different",
  });

  const advA = a.analysis?.advisor?.recommendations[0] ?? "—";
  const advB = b.analysis?.advisor?.recommendations[0] ?? "—";
  rows.push({
    field: "Top Recommendation",
    scenarioA: advA,
    scenarioB: advB,
    delta: advA === advB ? "Same" : "Different",
  });

  return { scenarioA: a, scenarioB: b, rows };
}

function pctDelta(a: number, b: number): string {
  if (Math.abs(a) < 1e-6) return b > 0 ? "+∞%" : "0%";
  const pct = ((b - a) / a) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
}
