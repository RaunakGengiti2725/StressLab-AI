import { useState } from "react";
import {
  Layers,
  Trash2,
  RotateCcw,
  GitCompareArrows,
  Pencil,
  Check,
  X,
} from "lucide-react";

import { useScenarioStore } from "@/stores/useScenarioStore";
import { useSimulationStore } from "@/stores/useSimulationStore";
import { useMaterialStore } from "@/stores/useMaterialStore";
import { useModelStore } from "@/stores/useModelStore";
import { useWorkspaceStore, type ToolId } from "@/stores/useWorkspaceStore";
import { useAgentStore } from "@/stores/useAgentStore";
import { MATERIALS } from "@/data/materials";
import { compareScenarios } from "@/lib/scenarios/comparison";
import type { SavedScenario } from "@/lib/scenarios/types";

export function ScenarioList() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const activeId = useScenarioStore((s) => s.activeScenarioId);
  const removeScenario = useScenarioStore((s) => s.removeScenario);
  const renameScenario = useScenarioStore((s) => s.renameScenario);
  const setActiveScenario = useScenarioStore((s) => s.setActiveScenario);
  const setScenarioComparison = useScenarioStore(
    (s) => s.setScenarioComparison,
  );
  const setCompareIds = useScenarioStore((s) => s.setCompareIds);
  const compareAId = useScenarioStore((s) => s.compareScenarioAId);
  const compareBId = useScenarioStore((s) => s.compareScenarioBId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [compareMode, setCompareMode] = useState(false);

  const setActiveTool = useWorkspaceStore((s) => s.setActiveTool);
  const loadSample = useModelStore((s) => s.loadSample);
  const modelSource = useModelStore((s) => s.source);

  const simStore = useSimulationStore;
  const setAnalysis = useAgentStore((s) => s.setAnalysis);

  const handleRestore = (sc: SavedScenario) => {
    if (sc.modelSource === "sample-bracket" && modelSource !== "sample-bracket") {
      loadSample();
    }

    useMaterialStore.getState().setSelectedId(sc.materialId);

    if (sc.testMode) {
      setActiveTool(sc.testMode as ToolId);
    } else {
      setActiveTool("select");
    }

    const restoreSimState = () => {
      const store = simStore.getState();
      if (store.regions.length === 0) return;

      if (
        sc.anchorRegionId !== null &&
        sc.anchorRegionId < store.regions.length
      ) {
        store.setAnchorRegion(sc.anchorRegionId);
      }
      if (
        sc.forceRegionId !== null &&
        sc.forceRegionId < store.regions.length
      ) {
        store.setForceRegion(sc.forceRegionId);
      }
      store.updateForceDelta(sc.forceDelta);
    };

    if (simStore.getState().regions.length > 0) {
      restoreSimState();
    } else {
      setTimeout(restoreSimState, 200);
    }

    if (sc.analysis) {
      setAnalysis(sc.analysis);
    }

    setActiveScenario(sc.id);
  };

  const startRename = (sc: SavedScenario) => {
    setEditingId(sc.id);
    setEditName(sc.name);
  };

  const confirmRename = () => {
    if (editingId && editName.trim()) {
      renameScenario(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const toggleCompareSelect = (id: string) => {
    if (compareAId === id) {
      setCompareIds(null, compareBId);
    } else if (compareBId === id) {
      setCompareIds(compareAId, null);
    } else if (!compareAId) {
      setCompareIds(id, compareBId);
    } else if (!compareBId) {
      setCompareIds(compareAId, id);
    }
  };

  const runScenarioComparison = () => {
    if (!compareAId || !compareBId) return;
    const a = scenarios.find((s) => s.id === compareAId);
    const b = scenarios.find((s) => s.id === compareBId);
    if (a && b) {
      const result = compareScenarios(a, b);
      setScenarioComparison(result);
    }
    setCompareMode(false);
  };

  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Layers size={24} className="mb-2 text-zinc-600" />
        <p className="text-xs text-zinc-500">No saved scenarios</p>
        <p className="mt-1 text-2xs text-zinc-600">
          Apply forces and save to create scenarios
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-2xs font-medium uppercase tracking-wider text-zinc-500">
          Saved ({scenarios.length})
        </p>
        <button
          onClick={() => {
            setCompareMode(!compareMode);
            if (compareMode) {
              setCompareIds(null, null);
              setScenarioComparison(null);
            }
          }}
          className={`flex items-center gap-1 rounded px-2 py-0.5 text-2xs transition-colors ${
            compareMode
              ? "bg-accent/20 text-accent"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <GitCompareArrows size={10} />
          {compareMode ? "Cancel" : "Compare"}
        </button>
      </div>

      {compareMode && (
        <div className="rounded-md border border-accent/20 bg-accent/5 p-2 text-2xs text-zinc-400">
          Select two scenarios to compare.
          {compareAId && compareBId && (
            <button
              onClick={runScenarioComparison}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded bg-accent/20 px-2 py-1 text-accent hover:bg-accent/30"
            >
              <GitCompareArrows size={10} />
              Compare Selected
            </button>
          )}
        </div>
      )}

      {scenarios.map((sc) => {
        const mat = MATERIALS.find((m) => m.id === sc.materialId);
        const isActive = activeId === sc.id;
        const isCompareSelected =
          compareAId === sc.id || compareBId === sc.id;
        const age = formatAge(sc.updatedAt);

        return (
          <div
            key={sc.id}
            className={`rounded-lg border p-2.5 transition-colors ${
              isActive
                ? "border-accent/30 bg-accent/5"
                : isCompareSelected
                  ? "border-accent/20 bg-accent/5"
                  : "border-border bg-surface-2 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-start justify-between">
              {editingId === sc.id ? (
                <div className="flex flex-1 items-center gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmRename()}
                    className="flex-1 rounded border border-border bg-surface-1 px-2 py-0.5 text-xs text-zinc-200 outline-none focus:border-accent"
                    autoFocus
                  />
                  <button
                    onClick={confirmRename}
                    className="p-0.5 text-emerald-400"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-0.5 text-zinc-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() =>
                    compareMode
                      ? toggleCompareSelect(sc.id)
                      : handleRestore(sc)
                  }
                  className="flex-1 text-left"
                >
                  <p className="text-xs font-medium text-zinc-200">
                    {compareMode && isCompareSelected && (
                      <span className="mr-1 text-accent">●</span>
                    )}
                    {sc.name}
                  </p>
                </button>
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-2xs text-zinc-500">
              {mat && (
                <span className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: mat.color_hex }}
                  />
                  {mat.name}
                </span>
              )}
              {sc.testMode && (
                <span className="rounded bg-surface-3 px-1 py-0.5">
                  {sc.testMode}
                </span>
              )}
              {sc.analysis && (
                <span
                  className={`font-medium ${
                    sc.analysis.overall_risk >= 60
                      ? "text-red-400"
                      : sc.analysis.overall_risk >= 35
                        ? "text-yellow-400"
                        : "text-emerald-400"
                  }`}
                >
                  Risk {sc.analysis.overall_risk}
                </span>
              )}
              <span className="ml-auto">{age}</span>
            </div>

            {!compareMode && (
              <div className="mt-2 flex gap-1">
                <button
                  onClick={() => handleRestore(sc)}
                  title="Restore"
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs text-zinc-500 hover:bg-surface-3 hover:text-zinc-300"
                >
                  <RotateCcw size={10} />
                  Restore
                </button>
                <button
                  onClick={() => startRename(sc)}
                  title="Rename"
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs text-zinc-500 hover:bg-surface-3 hover:text-zinc-300"
                >
                  <Pencil size={10} />
                </button>
                <button
                  onClick={() => removeScenario(sc.id)}
                  title="Delete"
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs text-red-500/60 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatAge(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
