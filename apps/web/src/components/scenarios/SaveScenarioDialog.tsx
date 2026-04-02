import { useState } from "react";
import { X, Save } from "lucide-react";

import { useScenarioStore } from "@/stores/useScenarioStore";
import { useSimulationStore } from "@/stores/useSimulationStore";
import { useMaterialStore } from "@/stores/useMaterialStore";
import { useModelStore } from "@/stores/useModelStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useAgentStore } from "@/stores/useAgentStore";

export function SaveScenarioDialog() {
  const open = useScenarioStore((s) => s.saveDialogOpen);
  const close = useScenarioStore((s) => s.closeSaveDialog);
  const createScenario = useScenarioStore((s) => s.createScenario);

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const modelSource = useModelStore((s) => s.source);
  const modelName = useModelStore((s) => s.name);
  const materialId = useMaterialStore((s) => s.selectedId);
  const activeTool = useWorkspaceStore((s) => s.activeTool);

  const anchorRegionId = useSimulationStore((s) => s.anchorRegionId);
  const forceRegionId = useSimulationStore((s) => s.forceRegionId);
  const forceDelta = useSimulationStore((s) => s.forceDelta);
  const maxStress = useSimulationStore((s) => s.maxStress);
  const maxDisplacement = useSimulationStore((s) => s.maxDisplacement);
  const dangerPct = useSimulationStore((s) => s.dangerPct);

  const analysis = useAgentStore((s) => s.analysis);

  if (!open) return null;

  const testMode = ["bend", "twist", "compress", "tension"].includes(activeTool)
    ? activeTool
    : null;

  const handleSave = () => {
    const scenarioName =
      name.trim() || `${modelName} — ${materialId.toUpperCase()} ${testMode ?? "test"}`;

    createScenario({
      name: scenarioName,
      notes: notes.trim(),
      modelSource: modelSource ?? "unknown",
      modelName: modelName || "Untitled",
      materialId,
      testMode,
      anchorRegionId,
      forceRegionId,
      forceDelta: [...forceDelta],
      maxStress,
      maxDisplacement,
      dangerPct,
      analysis: analysis ? structuredClone(analysis) : null,
    });

    setName("");
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[420px] rounded-xl border border-border bg-surface-1 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Save size={16} className="text-accent" />
            <span className="text-sm font-medium text-zinc-100">
              Save Scenario
            </span>
          </div>
          <button
            onClick={close}
            className="rounded p-1 text-zinc-400 hover:bg-surface-3 hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${modelName} — ${materialId.toUpperCase()} ${testMode ?? "test"}`}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-accent"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What are you testing? Any specific concerns?"
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-accent"
            />
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-zinc-500">
              Snapshot Preview
            </p>
            <div className="grid grid-cols-2 gap-2 text-2xs text-zinc-400">
              <div>
                Model: <span className="text-zinc-300">{modelName || "—"}</span>
              </div>
              <div>
                Material:{" "}
                <span className="text-zinc-300">
                  {materialId.toUpperCase()}
                </span>
              </div>
              <div>
                Test: <span className="text-zinc-300">{testMode ?? "—"}</span>
              </div>
              <div>
                Max Stress:{" "}
                <span className="text-zinc-300">
                  {maxStress.toFixed(1)} MPa
                </span>
              </div>
              <div>
                Displacement:{" "}
                <span className="text-zinc-300">
                  {maxDisplacement.toFixed(2)} mm
                </span>
              </div>
              <div>
                Danger:{" "}
                <span className="text-zinc-300">
                  {dangerPct.toFixed(1)}%
                </span>
              </div>
              <div>
                Risk:{" "}
                <span className="text-zinc-300">
                  {analysis ? `${analysis.overall_risk}/100` : "—"}
                </span>
              </div>
              <div>
                Analysis:{" "}
                <span className="text-zinc-300">
                  {analysis ? "Included" : "Not run"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={close}
              className="rounded-md px-4 py-2 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent/80"
            >
              <Save size={14} />
              Save Scenario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
