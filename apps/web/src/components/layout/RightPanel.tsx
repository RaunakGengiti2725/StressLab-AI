import { Bot, X, ShieldAlert, Lightbulb, BarChart3 } from "lucide-react";

const agentStubs = [
  { id: "pla", name: "PLA Agent", risk: 72, color: "#22d3ee", status: "High Risk" },
  { id: "petg", name: "PETG Agent", risk: 38, color: "#a78bfa", status: "Moderate" },
  { id: "abs", name: "ABS Agent", risk: 45, color: "#fb923c", status: "Moderate" },
  { id: "nylon", name: "Nylon Agent", risk: 22, color: "#4ade80", status: "Low Risk" },
  { id: "tpu", name: "TPU Agent", risk: 12, color: "#f472b6", status: "Low Risk" },
  { id: "resin", name: "Resin Agent", risk: 68, color: "#facc15", status: "High Risk" },
];

function riskColor(risk: number): string {
  if (risk >= 60) return "text-red-400";
  if (risk >= 35) return "text-yellow-400";
  return "text-emerald-400";
}

function riskBg(risk: number): string {
  if (risk >= 60) return "bg-red-500/10 border-red-500/20";
  if (risk >= 35) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-emerald-500/10 border-emerald-500/20";
}

export function RightPanel({ onCollapse }: { onCollapse: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Bot size={14} className="text-accent" />
          <span className="text-xs font-medium text-zinc-200">AI Agents</span>
        </div>
        <button
          onClick={onCollapse}
          className="rounded p-0.5 text-zinc-500 hover:bg-surface-3 hover:text-zinc-300"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <p className="mb-1 text-2xs font-medium uppercase tracking-wider text-zinc-500">
          Material Agents
        </p>

        {agentStubs.map((agent) => (
          <div
            key={agent.id}
            className={`rounded-lg border p-3 ${riskBg(agent.risk)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="text-xs font-medium text-zinc-200">
                  {agent.name}
                </span>
              </div>
              <span className={`text-xs font-semibold ${riskColor(agent.risk)}`}>
                {agent.risk}
              </span>
            </div>
            <p className={`mt-1 text-2xs ${riskColor(agent.risk)}`}>
              {agent.status}
            </p>
          </div>
        ))}

        <div className="mt-4 space-y-2">
          <p className="text-2xs font-medium uppercase tracking-wider text-zinc-500">
            Advisors
          </p>

          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-yellow-400" />
              <span className="text-xs font-medium text-zinc-200">
                Failure Mode Agent
              </span>
            </div>
            <p className="mt-1 text-2xs text-zinc-500">
              Awaiting simulation state...
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center gap-2">
              <Lightbulb size={14} className="text-accent" />
              <span className="text-xs font-medium text-zinc-200">
                Design Advisor
              </span>
            </div>
            <p className="mt-1 text-2xs text-zinc-500">
              Awaiting simulation state...
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-emerald-400" />
              <span className="text-xs font-medium text-zinc-200">
                Material Ranker
              </span>
            </div>
            <p className="mt-1 text-2xs text-zinc-500">
              Awaiting simulation state...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
