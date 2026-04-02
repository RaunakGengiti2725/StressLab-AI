import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, Box, Layers, FlaskConical, X } from "lucide-react";

type Tab = "project" | "materials" | "scenarios";

const materials = [
  { id: "pla", name: "PLA", color: "#22d3ee" },
  { id: "petg", name: "PETG", color: "#a78bfa" },
  { id: "abs", name: "ABS", color: "#fb923c" },
  { id: "nylon", name: "Nylon", color: "#4ade80" },
  { id: "tpu", name: "TPU", color: "#f472b6" },
  { id: "resin", name: "Resin", color: "#facc15" },
];

export function LeftPanel({ onCollapse }: { onCollapse: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("project");
  const [treeOpen, setTreeOpen] = useState(true);

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
              {treeOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <Folder size={12} className="text-accent" />
              My Project
            </button>
            {treeOpen && (
              <div className="ml-4 mt-1 space-y-0.5">
                <div className="flex items-center gap-1.5 rounded px-1 py-1 text-xs text-zinc-400">
                  <Box size={12} className="text-zinc-500" />
                  bracket.stl
                </div>
                <div className="flex items-center gap-1.5 rounded px-1 py-1 text-xs text-zinc-500 italic">
                  <Box size={12} />
                  Drop STL files here...
                </div>
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
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs text-zinc-300 transition-colors hover:bg-surface-3"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: mat.color }}
                />
                {mat.name}
              </button>
            ))}
          </div>
        )}

        {activeTab === "scenarios" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layers size={24} className="mb-2 text-zinc-600" />
            <p className="text-xs text-zinc-500">No saved scenarios</p>
            <p className="mt-1 text-2xs text-zinc-600">
              Apply forces and save to create scenarios
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
