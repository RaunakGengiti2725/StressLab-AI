import type { AnalysisResult } from "@shared/agents";
import type { Vec3 } from "@/lib/simulation/types";

// ── Saved Scenario ──────────────────────────────────────────────

export interface SavedScenario {
  id: string;
  name: string;
  notes: string;
  createdAt: number;
  updatedAt: number;

  modelSource: string;
  modelName: string;

  materialId: string;

  testMode: string | null;
  anchorRegionId: number | null;
  forceRegionId: number | null;
  forceDelta: Vec3;

  maxStress: number;
  maxDisplacement: number;
  dangerPct: number;

  analysis: AnalysisResult | null;
}

// ── Material Comparison ─────────────────────────────────────────

export interface MaterialComparisonEntry {
  materialId: string;
  materialName: string;
  colorHex: string;
  riskScore: number;
  severity: string;
  safetyFactor: number;
  maxStressScaled: number;
  maxDisplacementScaled: number;
  dangerPctScaled: number;
  failureMode: string | null;
  topRecommendation: string;
}

export interface MaterialComparisonResult {
  timestamp: number;
  baselineMaterialId: string;
  testMode: string | null;
  forceMagnitude: number;
  entries: MaterialComparisonEntry[];
  bestMaterialId: string;
  worstMaterialId: string;
}

// ── Scenario Comparison ─────────────────────────────────────────

export interface ScenarioComparisonRow {
  field: string;
  scenarioA: string;
  scenarioB: string;
  delta: string;
}

export interface ScenarioComparisonResult {
  scenarioA: SavedScenario;
  scenarioB: SavedScenario;
  rows: ScenarioComparisonRow[];
}

// ── Report ──────────────────────────────────────────────────────

export interface ReportSection {
  title: string;
  content: string;
  data?: Record<string, string | number>;
}

export interface StressReport {
  id: string;
  title: string;
  generatedAt: number;

  modelName: string;
  materialName: string;
  materialId: string;
  testType: string | null;

  forceSummary: string;
  dangerZones: string[];
  overallRisk: number;
  riskAssessment: string;
  likelyFailureMode: string | null;
  designRecommendations: string[];

  comparisonSummary: MaterialComparisonEntry[] | null;

  sections: ReportSection[];

  confidenceNote: string;
}
