import {
  Bot,
  X,
  ShieldAlert,
  Lightbulb,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Zap,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useState } from "react";

import { useAgentStore } from "@/stores/useAgentStore";
import { useScenarioStore } from "@/stores/useScenarioStore";
import type { AgentOutput, Severity } from "@shared/agents";
import { ComparisonPanel } from "@/components/scenarios/ComparisonPanel";
import { ReportPanel } from "@/components/scenarios/ReportView";

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

function severityBadge(severity: Severity) {
  const styles: Record<Severity, string> = {
    critical: "bg-red-500/20 text-red-400",
    high: "bg-orange-500/20 text-orange-400",
    moderate: "bg-yellow-500/20 text-yellow-400",
    low: "bg-emerald-500/20 text-emerald-400",
    info: "bg-zinc-500/20 text-zinc-400",
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-2xs font-medium ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}

function AgentCard({ agent }: { agent: AgentOutput }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg border p-3 ${riskBg(agent.risk_score)}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-200">
            {agent.agent_name}
          </span>
          {severityBadge(agent.severity)}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold tabular-nums ${riskColor(agent.risk_score)}`}
          >
            {agent.risk_score}
          </span>
          {expanded ? (
            <ChevronDown size={12} className="text-zinc-500" />
          ) : (
            <ChevronRight size={12} className="text-zinc-500" />
          )}
        </div>
      </button>

      {agent.failure_mode && (
        <p className="mt-1 flex items-center gap-1 text-2xs text-orange-400">
          <AlertTriangle size={10} />
          {agent.failure_mode}
        </p>
      )}

      {expanded && (
        <div className="mt-2 space-y-2 border-t border-white/5 pt-2">
          <p className="text-2xs leading-relaxed text-zinc-400">
            {agent.explanation}
          </p>

          {agent.confidence > 0 && (
            <div className="flex items-center gap-1 text-2xs text-zinc-500">
              <span>Confidence:</span>
              <div className="h-1 w-16 rounded-full bg-zinc-700">
                <div
                  className="h-1 rounded-full bg-accent"
                  style={{ width: `${agent.confidence * 100}%` }}
                />
              </div>
              <span>{(agent.confidence * 100).toFixed(0)}%</span>
            </div>
          )}

          {agent.recommendations.length > 0 && (
            <div className="space-y-1">
              <p className="text-2xs font-medium text-zinc-500">
                Recommendations
              </p>
              {agent.recommendations.map((rec, i) => (
                <p key={i} className="text-2xs text-zinc-400">
                  • {rec}
                </p>
              ))}
            </div>
          )}

          {agent.design_suggestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-2xs font-medium text-zinc-500">
                Design changes
              </p>
              {agent.design_suggestions.map((s, i) => (
                <div
                  key={i}
                  className="rounded bg-surface-2 px-2 py-1.5 text-2xs"
                >
                  <p className="font-medium text-zinc-300">{s.action}</p>
                  <p className="text-zinc-500">
                    {s.area} — {s.impact}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OverallRiskBanner({ risk }: { risk: number }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${riskBg(risk)}`}
    >
      <div className="flex items-center gap-2">
        <Zap size={14} className={riskColor(risk)} />
        <span className="text-xs font-medium text-zinc-200">Overall Risk</span>
      </div>
      <span className={`text-lg font-bold tabular-nums ${riskColor(risk)}`}>
        {risk}
        <span className="text-2xs font-normal text-zinc-500">/100</span>
      </span>
    </div>
  );
}

function AwaitingCard({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-zinc-200">{label}</span>
      </div>
      <p className="mt-1 text-2xs text-zinc-500">
        Awaiting simulation state...
      </p>
    </div>
  );
}

type RightTab = "agents" | "comparison" | "report";

export function RightPanel({ onCollapse }: { onCollapse: () => void }) {
  const [activeTab, setActiveTab] = useState<RightTab>("agents");
  const analysis = useAgentStore((s) => s.analysis);
  const isRunning = useAgentStore((s) => s.isRunning);

  const hasComparison = useScenarioStore((s) => s.comparisonResult !== null);
  const hasReport = useScenarioStore((s) => s.report !== null);

  const hasAnalysis = analysis !== null;

  const tabs: { id: RightTab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { id: "agents", label: "Agents", icon: <Bot size={12} /> },
    {
      id: "comparison",
      label: "Compare",
      icon: <BarChart3 size={12} />,
      badge: hasComparison,
    },
    {
      id: "report",
      label: "Report",
      icon: <FileText size={12} />,
      badge: hasReport,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1">
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
              {tab.badge && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </button>
          ))}
          {isRunning && (
            <span className="animate-pulse text-2xs text-accent">
              analyzing...
            </span>
          )}
        </div>
        <button
          onClick={onCollapse}
          className="rounded p-0.5 text-zinc-500 hover:bg-surface-3 hover:text-zinc-300"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {activeTab === "agents" && (
          <>
            {hasAnalysis && (
              <OverallRiskBanner risk={analysis.overall_risk} />
            )}

            <p className="mb-1 text-2xs font-medium uppercase tracking-wider text-zinc-500">
              Material Agents
            </p>

            {hasAnalysis
              ? analysis.material_agents.map((agent) => (
                  <AgentCard key={agent.agent_id} agent={agent} />
                ))
              : ["PLA", "PETG", "ABS", "Nylon", "TPU", "Resin"].map((name) => (
                  <AwaitingCard
                    key={name}
                    icon={
                      <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                    }
                    label={`${name} Agent`}
                  />
                ))}

            <div className="mt-4 space-y-2">
              <p className="text-2xs font-medium uppercase tracking-wider text-zinc-500">
                Failure Modes
              </p>

              {hasAnalysis ? (
                analysis.failure_agents.map((agent) => (
                  <AgentCard key={agent.agent_id} agent={agent} />
                ))
              ) : (
                <AwaitingCard
                  icon={<ShieldAlert size={14} className="text-yellow-400" />}
                  label="Failure Mode Agents"
                />
              )}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-2xs font-medium uppercase tracking-wider text-zinc-500">
                Advisors
              </p>

              {hasAnalysis && analysis.advisor ? (
                <AgentCard agent={analysis.advisor} />
              ) : (
                <AwaitingCard
                  icon={<Lightbulb size={14} className="text-accent" />}
                  label="Design Advisor"
                />
              )}

              {hasAnalysis && analysis.synthesis ? (
                <AgentCard agent={analysis.synthesis} />
              ) : (
                <AwaitingCard
                  icon={<BarChart3 size={14} className="text-emerald-400" />}
                  label="Material Ranker"
                />
              )}
            </div>
          </>
        )}

        {activeTab === "comparison" && <ComparisonPanel />}
        {activeTab === "report" && <ReportPanel />}
      </div>
    </div>
  );
}
