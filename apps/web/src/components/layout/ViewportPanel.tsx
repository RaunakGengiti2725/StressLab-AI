import { Box, PanelLeftOpen, PanelRightOpen } from "lucide-react";

interface ViewportPanelProps {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
}

export function ViewportPanel({
  leftCollapsed,
  rightCollapsed,
  onToggleLeft,
  onToggleRight,
}: ViewportPanelProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-surface-0">
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "40px 40px",
        }}
      />

      {/* Subtle center cross */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-zinc-800/30" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-zinc-800/30" />

      {/* Axes indicator (bottom-left) */}
      <div className="absolute bottom-4 left-4 flex items-end gap-0.5">
        <div className="flex flex-col items-center">
          <div className="h-8 w-0.5 bg-emerald-500" />
          <span className="mt-0.5 text-2xs font-medium text-emerald-500">Y</span>
        </div>
        <div className="mb-3 flex items-center">
          <div className="h-0.5 w-8 bg-red-500" />
          <span className="ml-0.5 text-2xs font-medium text-red-500">X</span>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div className="rounded-2xl border border-border bg-surface-1/80 p-8 backdrop-blur-sm">
          <Box size={48} className="mx-auto mb-4 text-zinc-600" strokeWidth={1} />
          <p className="text-sm font-medium text-zinc-400">3D Viewport</p>
          <p className="mt-1 max-w-xs text-xs text-zinc-600">
            React Three Fiber viewport will render here in Phase 2.
            Upload an STL or load a sample model to begin.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button className="rounded-md border border-border bg-surface-3 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-surface-4 hover:text-zinc-100">
              Load Sample
            </button>
            <button className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover">
              Upload STL
            </button>
          </div>
        </div>
      </div>

      {/* Panel toggle buttons */}
      {leftCollapsed && (
        <button
          onClick={onToggleLeft}
          className="absolute left-2 top-2 rounded-md border border-border bg-surface-1/80 p-1.5 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-surface-3 hover:text-zinc-300"
        >
          <PanelLeftOpen size={14} />
        </button>
      )}
      {rightCollapsed && (
        <button
          onClick={onToggleRight}
          className="absolute right-2 top-2 rounded-md border border-border bg-surface-1/80 p-1.5 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-surface-3 hover:text-zinc-300"
        >
          <PanelRightOpen size={14} />
        </button>
      )}

      {/* View mode indicator */}
      <div className="absolute right-3 bottom-3 flex gap-1">
        {["Shaded", "Wireframe", "Stress"].map((mode, i) => (
          <button
            key={mode}
            className={`rounded px-2 py-0.5 text-2xs transition-colors ${
              i === 0
                ? "bg-surface-3 text-zinc-300"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
