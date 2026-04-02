import {
  BarChart3,
  ArrowUpDown,
  Trophy,
  AlertTriangle,
  Shield,
  X,
} from "lucide-react";

import { useScenarioStore } from "@/stores/useScenarioStore";
import type {
  MaterialComparisonResult,
  MaterialComparisonEntry,
  ScenarioComparisonResult,
} from "@/lib/scenarios/types";

function riskColor(risk: number): string {
  if (risk >= 60) return "text-red-400";
  if (risk >= 35) return "text-yellow-400";
  return "text-emerald-400";
}

function riskBg(risk: number): string {
  if (risk >= 60) return "bg-red-500/10 border-red-500/20";
  if (risk >= 35) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-emerald-500/10 border-emerald-500/20";
}

function MaterialRow({
  entry,
  rank,
  isBaseline,
}: {
  entry: MaterialComparisonEntry;
  rank: number;
  isBaseline: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 ${riskBg(entry.riskScore)} ${
        isBaseline ? "ring-1 ring-accent/30" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-3 text-2xs font-bold text-zinc-300">
            {rank}
          </span>
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.colorHex }}
          />
          <span className="text-xs font-medium text-zinc-200">
            {entry.materialName}
          </span>
          {isBaseline && (
            <span className="rounded bg-accent/20 px-1 py-0.5 text-2xs text-accent">
              current
            </span>
          )}
          {rank === 1 && (
            <Trophy size={12} className="text-yellow-400" />
          )}
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${riskColor(entry.riskScore)}`}
        >
          {entry.riskScore}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-2xs">
        <div>
          <p className="text-zinc-500">Safety Factor</p>
          <p className="font-medium text-zinc-300">
            {entry.safetyFactor.toFixed(1)}x
          </p>
        </div>
        <div>
          <p className="text-zinc-500">Max Stress</p>
          <p className="font-medium text-zinc-300">
            {entry.maxStressScaled.toFixed(1)} MPa
          </p>
        </div>
        <div>
          <p className="text-zinc-500">Displacement</p>
          <p className="font-medium text-zinc-300">
            {entry.maxDisplacementScaled.toFixed(2)} mm
          </p>
        </div>
      </div>

      {entry.failureMode && (
        <p className="mt-1.5 flex items-center gap-1 text-2xs text-orange-400">
          <AlertTriangle size={10} />
          {entry.failureMode}
        </p>
      )}

      <p className="mt-1 text-2xs text-zinc-500">{entry.topRecommendation}</p>
    </div>
  );
}

function MaterialComparisonView({
  result,
}: {
  result: MaterialComparisonResult;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BarChart3 size={14} className="text-accent" />
          <span className="text-xs font-medium text-zinc-200">
            Material Comparison
          </span>
        </div>
        <span className="text-2xs text-zinc-500">
          {result.testMode ?? "—"} |{" "}
          {result.entries.length} materials
        </span>
      </div>

      <div className="rounded-lg border border-border bg-surface-2 p-2">
        <div className="flex items-center justify-between text-2xs">
          <span className="text-zinc-500">
            Best:{" "}
            <span className="font-medium text-emerald-400">
              {result.entries[0]?.materialName}
            </span>
          </span>
          <span className="text-zinc-500">
            Most risk:{" "}
            <span className="font-medium text-red-400">
              {result.entries[result.entries.length - 1]?.materialName}
            </span>
          </span>
        </div>
      </div>

      {result.entries.map((entry, i) => (
        <MaterialRow
          key={entry.materialId}
          entry={entry}
          rank={i + 1}
          isBaseline={entry.materialId === result.baselineMaterialId}
        />
      ))}
    </div>
  );
}

function ScenarioComparisonView({
  result,
  onClose,
}: {
  result: ScenarioComparisonResult;
  onClose: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-accent" />
          <span className="text-xs font-medium text-zinc-200">
            Scenario Comparison
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-zinc-500 hover:text-zinc-300"
        >
          <X size={12} />
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface-2">
        <div className="grid grid-cols-4 border-b border-border px-2 py-1.5 text-2xs font-medium text-zinc-500">
          <div>Field</div>
          <div className="truncate" title={result.scenarioA.name}>
            {result.scenarioA.name}
          </div>
          <div className="truncate" title={result.scenarioB.name}>
            {result.scenarioB.name}
          </div>
          <div>Delta</div>
        </div>
        {result.rows.map((row) => (
          <div
            key={row.field}
            className="grid grid-cols-4 border-b border-border/50 px-2 py-1.5 text-2xs last:border-0"
          >
            <div className="font-medium text-zinc-400">{row.field}</div>
            <div className="text-zinc-300">{row.scenarioA}</div>
            <div className="text-zinc-300">{row.scenarioB}</div>
            <div className="text-zinc-500">{row.delta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonPanel() {
  const materialComparison = useScenarioStore((s) => s.comparisonResult);
  const scenarioComparison = useScenarioStore((s) => s.scenarioComparison);
  const setComparisonResult = useScenarioStore((s) => s.setComparisonResult);
  const setScenarioComparison = useScenarioStore(
    (s) => s.setScenarioComparison,
  );

  if (!materialComparison && !scenarioComparison) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Shield size={24} className="mb-2 text-zinc-600" />
        <p className="text-xs text-zinc-500">No comparison active</p>
        <p className="mt-1 text-2xs text-zinc-600">
          Click "Compare" in the toolbar to compare materials
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scenarioComparison && (
        <ScenarioComparisonView
          result={scenarioComparison}
          onClose={() => setScenarioComparison(null)}
        />
      )}

      {materialComparison && (
        <>
          <MaterialComparisonView result={materialComparison} />
          <button
            onClick={() => setComparisonResult(null)}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-border py-1.5 text-2xs text-zinc-500 hover:bg-surface-3 hover:text-zinc-300"
          >
            <X size={10} />
            Clear Comparison
          </button>
        </>
      )}
    </div>
  );
}
