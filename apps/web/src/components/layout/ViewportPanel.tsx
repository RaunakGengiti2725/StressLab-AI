import { Box, PanelLeftOpen, PanelRightOpen, Upload } from "lucide-react";

import { useWorkspaceStore, type ViewMode } from "@/stores/useWorkspaceStore";
import { useModelStore } from "@/stores/useModelStore";
import { SceneCanvas } from "@/components/viewport/SceneCanvas";

const viewModeLabels: Record<ViewMode, string> = {
  shaded: "Shaded",
  wireframe: "Wireframe",
  xray: "X-Ray",
  stress: "Stress",
};

export function ViewportPanel() {
  const loaded = useModelStore((s) => s.loaded);
  const loadSample = useModelStore((s) => s.loadSample);
  const leftOpen = useWorkspaceStore((s) => s.leftPanelOpen);
  const rightOpen = useWorkspaceStore((s) => s.rightPanelOpen);
  const toggleLeft = useWorkspaceStore((s) => s.toggleLeftPanel);
  const toggleRight = useWorkspaceStore((s) => s.toggleRightPanel);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* R3F Canvas -- always mounted for smooth transitions */}
      <SceneCanvas />

      {/* Empty state overlay */}
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto rounded-2xl border border-border bg-surface-1/90 p-8 backdrop-blur-sm">
            <Box size={48} className="mx-auto mb-4 text-zinc-600" strokeWidth={1} />
            <p className="text-center text-sm font-medium text-zinc-400">
              3D Viewport
            </p>
            <p className="mx-auto mt-1 max-w-xs text-center text-xs text-zinc-600">
              Load a sample model to explore the workspace, or upload your own
              STL file.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={loadSample}
                className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Load Sample Bracket
              </button>
              <button
                className="flex items-center gap-1.5 rounded-md border border-border bg-surface-3 px-3 py-2 text-xs text-zinc-400 opacity-50"
                disabled
                title="File upload coming in Phase 3"
              >
                <Upload size={13} />
                Upload STL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel toggle buttons */}
      {!leftOpen && (
        <button
          onClick={toggleLeft}
          className="absolute left-2 top-2 z-10 rounded-md border border-border bg-surface-1/80 p-1.5 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-surface-3 hover:text-zinc-300"
        >
          <PanelLeftOpen size={14} />
        </button>
      )}
      {!rightOpen && (
        <button
          onClick={toggleRight}
          className="absolute right-2 top-2 z-10 rounded-md border border-border bg-surface-1/80 p-1.5 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-surface-3 hover:text-zinc-300"
        >
          <PanelRightOpen size={14} />
        </button>
      )}

      {/* View mode switcher */}
      <div className="absolute right-3 bottom-3 z-10 flex gap-1">
        {(["shaded", "wireframe", "xray", "stress"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`rounded px-2 py-0.5 text-2xs transition-colors ${
              viewMode === mode
                ? "bg-surface-3 text-zinc-200"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {viewModeLabels[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}
