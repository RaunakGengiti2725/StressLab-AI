import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Box,
  Layers,
  FlaskConical,
  X,
  Check,
} from "lucide-react";

import { useMaterialStore } from "@/stores/useMaterialStore";
import { useModelStore } from "@/stores/useModelStore";
import { useScenarioStore } from "@/stores/useScenarioStore";
import { useAgentStore } from "@/stores/useAgentStore";
import { ScenarioList } from "@/components/scenarios/ScenarioList";

type Tab = "project" | "materials" | "scenarios";

export function LeftPanel({ onCollapse }: { onCollapse: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("project");
  const [treeOpen, setTreeOpen] = useState(true);

  const loadFromStorage = useScenarioStore((s) => s.loadFromStorage);
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const materials = useMaterialStore((s) => s.materials);
  const selectedId = useMaterialStore((s) => s.selectedId);
  const rawSetSelectedId = useMaterialStore((s) => s.setSelectedId);
  const clearComparison = useScenarioStore((s) => s.setComparisonResult);
  const clearReport = useScenarioStore((s) => s.setReport);
  const clearAnalysis = useAgentStore((s) => s.clearAnalysis);

  const setSelectedId = (id: string) => {
    if (id === selectedId) return;
    rawSetSelectedId(id);
    clearComparison(null);
    clearReport(null);
    clearAnalysis();
  };

  const modelLoaded = useModelStore((s) => s.loaded);
  const modelName = useModelStore((s) => s.name);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "project", label: "Project", icon: <Folder size={14} /> },
    { id: "materials", label: "Materials", icon: <FlaskConical size={14} /> },
    { id: "scenarios", label: "Scenarios", icon: <Layers size={14} /> },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                activeTab === tab.id
                  ? "bg-surface-3 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onCollapse}
          className="rounded p-0.5 text-zinc-500 hover:bg-surface-3 hover:text-zinc-300"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "project" && (
          <div>
            <button
              onClick={() => setTreeOpen((v) => !v)}
              className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-xs text-zinc-300 hover:bg-surface-3"
            >
              {treeOpen ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
              <Folder size={12} className="text-accent" />
              My Project
            </button>
            {treeOpen && (
              <div className="ml-4 mt-1 space-y-0.5">
                {modelLoaded ? (
                  <div className="flex items-center gap-1.5 rounded bg-accent/10 px-1 py-1 text-xs text-accent">
                    <Box size={12} />
                    {modelName}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded px-1 py-1 text-xs italic text-zinc-500">
                    <Box size={12} />
                    No model loaded
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="space-y-1">
            <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-zinc-500">
              Material Library
            </p>
            {materials.map((mat) => (
              <button
                key={mat.id}
                onClick={() => setSelectedId(mat.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs transition-colors ${
                  selectedId === mat.id
                    ? "bg-surface-3 text-zinc-100"
                    : "text-zinc-400 hover:bg-surface-3 hover:text-zinc-200"
                }`}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: mat.color_hex }}
                />
                <span className="flex-1 text-left">{mat.name}</span>
                {selectedId === mat.id && (
                  <Check size={12} className="text-accent" />
                )}
              </button>
            ))}
            <div className="mt-3 rounded-lg border border-border bg-surface-2 p-2.5">
              <p className="text-2xs font-medium text-zinc-400">Selected</p>
              {(() => {
                const sel = materials.find((m) => m.id === selectedId);
                if (!sel) return null;
                return (
                  <div className="mt-1 space-y-0.5 text-2xs text-zinc-500">
                    <p>E = {sel.youngs_modulus_gpa} GPa</p>
                    <p>σy = {sel.yield_strength_mpa} MPa</p>
                    <p>Elongation = {sel.elongation_at_break_pct}%</p>
                    <p>Density = {sel.density_g_cm3} g/cm³</p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "scenarios" && <ScenarioList />}
      </div>
    </div>
  );
}
