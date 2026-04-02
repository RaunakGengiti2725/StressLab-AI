import { useState } from "react";
import { MessageSquare, Terminal, Activity, X } from "lucide-react";

type Tab = "chat" | "logs" | "metrics";

export function BottomDrawer({ onCollapse }: { onCollapse: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "chat", label: "AI Chat", icon: <MessageSquare size={13} /> },
    { id: "logs", label: "Event Log", icon: <Terminal size={13} /> },
    { id: "metrics", label: "Metrics", icon: <Activity size={13} /> },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
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
        {activeTab === "chat" && (
          <div className="flex h-full flex-col">
            <div className="flex-1">
              <div className="flex items-start gap-2 rounded-lg bg-surface-2 p-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-accent text-[10px] font-bold text-white">
                  AI
                </div>
                <div>
                  <p className="text-xs text-zinc-300">
                    Welcome to StressLab AI. Load a model and apply forces to
                    begin analysis. I can help you understand stress patterns,
                    compare materials, and suggest design improvements.
                  </p>
                  <p className="mt-1 text-2xs text-zinc-600">System</p>
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Ask about stress, materials, or design..."
                className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-accent"
                disabled
              />
              <button
                className="rounded-md bg-accent px-3 py-2 text-xs font-medium text-white opacity-50"
                disabled
              >
                Send
              </button>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-1 font-mono text-2xs text-zinc-500">
            <p>
              <span className="text-zinc-600">[init]</span> StressLab AI v0.1.0
              loaded
            </p>
            <p>
              <span className="text-zinc-600">[info]</span> Waiting for model
              upload or sample selection...
            </p>
            <p>
              <span className="text-zinc-600">[info]</span> 6 material profiles
              loaded
            </p>
            <p>
              <span className="text-zinc-600">[info]</span> Agent system ready
              (stub mode)
            </p>
          </div>
        )}

        {activeTab === "metrics" && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Vertices", value: "—" },
              { label: "Faces", value: "—" },
              { label: "Max Stress", value: "—" },
              { label: "Danger %", value: "—" },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-border bg-surface-2 p-2.5 text-center"
              >
                <p className="text-lg font-semibold text-zinc-300">
                  {metric.value}
                </p>
                <p className="text-2xs text-zinc-500">{metric.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
