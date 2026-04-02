import {
  MousePointer2,
  Pin,
  ArrowDownFromLine,
  RotateCcw,
  Maximize2,
  ArrowUpFromLine,
  RefreshCw,
  GitCompare,
  Save,
} from "lucide-react";

type Tool =
  | "select"
  | "pin"
  | "bend"
  | "twist"
  | "compress"
  | "tension"
  | "reset"
  | "compare"
  | "save";

const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", icon: <MousePointer2 size={16} /> },
  { id: "pin", label: "Pin", icon: <Pin size={16} /> },
  { id: "bend", label: "Bend", icon: <ArrowDownFromLine size={16} /> },
  { id: "twist", label: "Twist", icon: <RotateCcw size={16} /> },
  { id: "compress", label: "Compress", icon: <Maximize2 size={16} /> },
  { id: "tension", label: "Tension", icon: <ArrowUpFromLine size={16} /> },
  { id: "reset", label: "Reset", icon: <RefreshCw size={16} /> },
  { id: "compare", label: "Compare", icon: <GitCompare size={16} /> },
  { id: "save", label: "Save", icon: <Save size={16} /> },
];

export function TopToolbar() {
  return (
    <header className="flex h-12 items-center border-b border-border bg-surface-1 px-3">
      <div className="mr-6 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
          SL
        </div>
        <span className="text-sm font-semibold text-zinc-100">StressLab</span>
        <span className="text-2xs font-medium text-zinc-500">AI</span>
      </div>

      <div className="mx-2 h-5 w-px bg-border" />

      <nav className="flex items-center gap-0.5">
        {tools.map((tool) => (
          <button
            key={tool.id}
            title={tool.label}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-100"
          >
            {tool.icon}
            <span className="hidden xl:inline">{tool.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-2xs text-zinc-500">
        <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono">
          Phase 1 — Scaffold
        </span>
      </div>
    </header>
  );
}
