import type { AnalysisResult } from "@shared/agents";
import { MATERIALS } from "@/data/materials";
import type { MaterialComparisonResult, StressReport, ReportSection } from "./types";

interface ReportInput {
  modelName: string;
  materialId: string;
  testMode: string | null;
  forceDelta: [number, number, number];
  maxStress: number;
  maxDisplacement: number;
  dangerPct: number;
  analysis: AnalysisResult | null;
  comparison: MaterialComparisonResult | null;
}

export function generateReport(input: ReportInput): StressReport {
  const mat = MATERIALS.find((m) => m.id === input.materialId);
  const materialName = mat?.name ?? input.materialId;
  const forceMag = Math.sqrt(
    input.forceDelta[0] ** 2 +
      input.forceDelta[1] ** 2 +
      input.forceDelta[2] ** 2,
  );

  const overallRisk = input.analysis?.overall_risk ?? 0;

  const dangerZones: string[] = [];
  if (input.dangerPct > 0) {
    dangerZones.push(
      `${input.dangerPct.toFixed(1)}% of vertices are in the danger zone (≥70% of peak stress)`,
    );
  }
  if (input.analysis) {
    const concentrators =
      input.analysis.failure_agents.filter((a) => a.risk_score >= 50).length;
    if (concentrators > 0) {
      dangerZones.push(
        `${concentrators} failure mode agent(s) report high or critical risk`,
      );
    }
  }
  if (dangerZones.length === 0) {
    dangerZones.push("No significant danger zones detected under current loading");
  }

  const likelyFailureMode =
    input.analysis?.failure_agents
      .filter((a) => a.failure_mode)
      .sort((a, b) => b.risk_score - a.risk_score)[0]?.failure_mode ?? null;

  const designRecs: string[] = [];
  if (input.analysis?.advisor) {
    designRecs.push(...input.analysis.advisor.recommendations);
    for (const s of input.analysis.advisor.design_suggestions) {
      designRecs.push(`${s.action} (${s.area}) — ${s.impact}`);
    }
  }
  if (designRecs.length === 0) {
    designRecs.push("Run analysis to get design recommendations");
  }

  const sections: ReportSection[] = [];

  sections.push({
    title: "Test Configuration",
    content: `Model: ${input.modelName} | Material: ${materialName} | Test: ${input.testMode ?? "None"} | Force: ${forceMag.toFixed(2)} units`,
    data: {
      model: input.modelName,
      material: materialName,
      test_mode: input.testMode ?? "none",
      force_magnitude: parseFloat(forceMag.toFixed(2)),
    },
  });

  sections.push({
    title: "Simulation Results",
    content: `Peak stress: ${input.maxStress.toFixed(1)} MPa | Peak displacement: ${input.maxDisplacement.toFixed(2)} mm | Danger zone: ${input.dangerPct.toFixed(1)}%`,
    data: {
      max_stress_mpa: parseFloat(input.maxStress.toFixed(1)),
      max_displacement_mm: parseFloat(input.maxDisplacement.toFixed(2)),
      danger_zone_pct: parseFloat(input.dangerPct.toFixed(1)),
    },
  });

  if (input.analysis) {
    const currentMatAgent = input.analysis.material_agents.find(
      (a) => a.agent_id === `material-${input.materialId}`,
    );
    if (currentMatAgent) {
      sections.push({
        title: "Material Analysis",
        content: currentMatAgent.explanation,
        data: currentMatAgent.supporting_metrics,
      });
    }

    if (input.analysis.synthesis) {
      sections.push({
        title: "Material Ranking",
        content: input.analysis.synthesis.explanation,
        data: input.analysis.synthesis.supporting_metrics,
      });
    }
  }

  if (input.comparison) {
    const lines = input.comparison.entries.map(
      (e, i) =>
        `${i + 1}. ${e.materialName} — Risk: ${e.riskScore}/100, Safety Factor: ${e.safetyFactor.toFixed(1)}x${e.failureMode ? `, Failure: ${e.failureMode}` : ""}`,
    );
    sections.push({
      title: "Material Comparison",
      content: lines.join("\n"),
      data: {
        best_material: input.comparison.entries[0]?.materialName ?? "—",
        worst_material:
          input.comparison.entries[input.comparison.entries.length - 1]
            ?.materialName ?? "—",
        materials_compared: input.comparison.entries.length,
      },
    });
  }

  return {
    id: `rpt-${Date.now()}`,
    title: `Stress Report — ${input.modelName} (${materialName})`,
    generatedAt: Date.now(),
    modelName: input.modelName,
    materialName,
    materialId: input.materialId,
    testType: input.testMode,
    forceSummary: `${forceMag.toFixed(2)} units (${input.testMode ?? "no test"})`,
    dangerZones,
    overallRisk,
    riskAssessment: riskLabel(overallRisk),
    likelyFailureMode,
    designRecommendations: designRecs,
    comparisonSummary: input.comparison?.entries ?? null,
    sections,
    confidenceNote:
      "This is a heuristic pre-print validation. Results are approximate and not a substitute for certified FEA. Material properties are nominal; real-world performance depends on print settings, orientation, infill, and environmental conditions.",
  };
}

function riskLabel(risk: number): string {
  if (risk >= 70) return "High risk — significant failure probability under this loading";
  if (risk >= 50) return "Elevated risk — review design and material choice";
  if (risk >= 30) return "Moderate risk — acceptable with design caution";
  if (risk >= 15) return "Low risk — design appears adequate";
  return "Minimal risk — no significant concerns detected";
}

export function reportToJson(report: StressReport): string {
  return JSON.stringify(report, null, 2);
}

export function reportToMarkdown(report: StressReport): string {
  const lines: string[] = [];
  lines.push(`# ${report.title}`);
  lines.push("");
  lines.push(
    `*Generated: ${new Date(report.generatedAt).toLocaleString()}*`,
  );
  lines.push("");

  lines.push("## Summary");
  lines.push(`- **Model:** ${report.modelName}`);
  lines.push(`- **Material:** ${report.materialName}`);
  lines.push(`- **Test Type:** ${report.testType ?? "None"}`);
  lines.push(`- **Force:** ${report.forceSummary}`);
  lines.push(`- **Overall Risk:** ${report.overallRisk}/100 — ${report.riskAssessment}`);
  if (report.likelyFailureMode) {
    lines.push(`- **Likely Failure Mode:** ${report.likelyFailureMode}`);
  }
  lines.push("");

  lines.push("## Danger Zones");
  for (const z of report.dangerZones) {
    lines.push(`- ${z}`);
  }
  lines.push("");

  lines.push("## Design Recommendations");
  for (const r of report.designRecommendations) {
    lines.push(`- ${r}`);
  }
  lines.push("");

  for (const section of report.sections) {
    lines.push(`## ${section.title}`);
    lines.push(section.content);
    lines.push("");
  }

  lines.push("---");
  lines.push(`*${report.confidenceNote}*`);

  return lines.join("\n");
}
