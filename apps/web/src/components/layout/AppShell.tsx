import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { TopToolbar } from "./TopToolbar";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { BottomDrawer } from "./BottomDrawer";
import { ViewportPanel } from "./ViewportPanel";
import { SaveScenarioDialog } from "@/components/scenarios/SaveScenarioDialog";

export function AppShell() {
  const leftOpen = useWorkspaceStore((s) => s.leftPanelOpen);
  const rightOpen = useWorkspaceStore((s) => s.rightPanelOpen);
  const bottomOpen = useWorkspaceStore((s) => s.bottomPanelOpen);
  const setLeft = useWorkspaceStore((s) => s.setLeftPanel);
  const setRight = useWorkspaceStore((s) => s.setRightPanel);
  const setBottom = useWorkspaceStore((s) => s.setBottomPanel);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-0">
      <SaveScenarioDialog />
      <TopToolbar />

      <div className="flex flex-1 overflow-hidden">
        {leftOpen && (
          <aside className="flex w-[280px] flex-shrink-0 flex-col border-r border-border bg-surface-1">
            <LeftPanel onCollapse={() => setLeft(false)} />
          </aside>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <ViewportPanel />
          </main>

          {bottomOpen && (
            <div className="h-[200px] flex-shrink-0 border-t border-border bg-surface-1">
              <BottomDrawer onCollapse={() => setBottom(false)} />
            </div>
          )}
        </div>

        {rightOpen && (
          <aside className="flex w-[320px] flex-shrink-0 flex-col border-l border-border bg-surface-1">
            <RightPanel onCollapse={() => setRight(false)} />
          </aside>
        )}
      </div>

      {(!leftOpen || !rightOpen || !bottomOpen) && (
        <div className="flex items-center gap-1 border-t border-border bg-surface-1 px-2 py-1">
          {!leftOpen && (
            <button
              onClick={() => setLeft(true)}
              className="rounded px-2 py-0.5 text-2xs text-zinc-400 hover:bg-surface-3 hover:text-zinc-200"
            >
              Show Sidebar
            </button>
          )}
          {!bottomOpen && (
            <button
              onClick={() => setBottom(true)}
              className="rounded px-2 py-0.5 text-2xs text-zinc-400 hover:bg-surface-3 hover:text-zinc-200"
            >
              Show Console
            </button>
          )}
          {!rightOpen && (
            <button
              onClick={() => setRight(true)}
              className="rounded px-2 py-0.5 text-2xs text-zinc-400 hover:bg-surface-3 hover:text-zinc-200"
            >
              Show Agents
            </button>
          )}
        </div>
      )}
    </div>
  );
}
