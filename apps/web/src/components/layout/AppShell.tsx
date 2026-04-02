import { useState } from "react";
import { TopToolbar } from "./TopToolbar";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { BottomDrawer } from "./BottomDrawer";
import { ViewportPanel } from "./ViewportPanel";

export function AppShell() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-0">
      <TopToolbar />

      <div className="flex flex-1 overflow-hidden">
        {!leftCollapsed && (
          <aside className="flex w-[280px] flex-shrink-0 flex-col border-r border-border bg-surface-1">
            <LeftPanel onCollapse={() => setLeftCollapsed(true)} />
          </aside>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <ViewportPanel
              leftCollapsed={leftCollapsed}
              rightCollapsed={rightCollapsed}
              onToggleLeft={() => setLeftCollapsed((v) => !v)}
              onToggleRight={() => setRightCollapsed((v) => !v)}
            />
          </main>

          {!bottomCollapsed && (
            <div className="h-[200px] flex-shrink-0 border-t border-border bg-surface-1">
              <BottomDrawer onCollapse={() => setBottomCollapsed(true)} />
            </div>
          )}
        </div>

        {!rightCollapsed && (
          <aside className="flex w-[320px] flex-shrink-0 flex-col border-l border-border bg-surface-1">
            <RightPanel onCollapse={() => setRightCollapsed(true)} />
          </aside>
        )}
      </div>

      {(leftCollapsed || rightCollapsed || bottomCollapsed) && (
        <div className="flex items-center gap-1 border-t border-border bg-surface-1 px-2 py-1">
          {leftCollapsed && (
            <button
              onClick={() => setLeftCollapsed(false)}
              className="rounded px-2 py-0.5 text-2xs text-zinc-400 hover:bg-surface-3 hover:text-zinc-200"
            >
              Show Sidebar
            </button>
          )}
          {bottomCollapsed && (
            <button
              onClick={() => setBottomCollapsed(false)}
              className="rounded px-2 py-0.5 text-2xs text-zinc-400 hover:bg-surface-3 hover:text-zinc-200"
            >
              Show Console
            </button>
          )}
          {rightCollapsed && (
            <button
              onClick={() => setRightCollapsed(false)}
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
