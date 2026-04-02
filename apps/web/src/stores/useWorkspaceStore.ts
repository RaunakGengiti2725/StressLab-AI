import { create } from "zustand";

export type ToolId =
  | "select"
  | "pin"
  | "bend"
  | "twist"
  | "compress"
  | "tension";

export type ViewMode = "shaded" | "wireframe" | "xray" | "stress";

interface WorkspaceState {
  activeTool: ToolId;
  viewMode: ViewMode;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;

  setActiveTool: (tool: ToolId) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setLeftPanel: (open: boolean) => void;
  setRightPanel: (open: boolean) => void;
  setBottomPanel: (open: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeTool: "select",
  viewMode: "shaded",
  leftPanelOpen: true,
  rightPanelOpen: true,
  bottomPanelOpen: true,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () =>
    set((s) => ({
      viewMode:
        s.viewMode === "shaded"
          ? "wireframe"
          : s.viewMode === "wireframe"
            ? "xray"
            : s.viewMode === "xray"
              ? "stress"
              : "shaded",
    })),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleBottomPanel: () =>
    set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
  setLeftPanel: (open) => set({ leftPanelOpen: open }),
  setRightPanel: (open) => set({ rightPanelOpen: open }),
  setBottomPanel: (open) => set({ bottomPanelOpen: open }),
}));
