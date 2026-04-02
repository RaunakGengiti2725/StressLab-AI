import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, Terminal, Activity, X, Send, Sparkles, FileText } from "lucide-react";

import { useModelStore } from "@/stores/useModelStore";
import {
  useMaterialStore,
  getSelectedMaterial,
} from "@/stores/useMaterialStore";
import { useSimulationStore } from "@/stores/useSimulationStore";
import { useAgentStore } from "@/stores/useAgentStore";
import { useChatStore } from "@/stores/useChatStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useScenarioStore } from "@/stores/useScenarioStore";
import { buildAgentInput } from "@/lib/agents/stateAdapter";
import { generateChatResponse, SUGGESTED_PROMPTS } from "@/lib/agents/chat";
import { ReportPanel } from "@/components/scenarios/ReportView";
import type { ChatMessage } from "@/lib/agents/types";

type Tab = "chat" | "logs" | "metrics" | "report";

export function BottomDrawer({ onCollapse }: { onCollapse: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const modelLoaded = useModelStore((s) => s.loaded);
  const modelName = useModelStore((s) => s.name);
  const vertexCount = useModelStore((s) => s.vertexCount);
  const faceCount = useModelStore((s) => s.faceCount);
  const material = useMaterialStore(getSelectedMaterial);

  const maxStress = useSimulationStore((s) => s.maxStress);
  const maxDisplacement = useSimulationStore((s) => s.maxDisplacement);
  const dangerPct = useSimulationStore((s) => s.dangerPct);
  const isDeformed = useSimulationStore((s) => s.isDeformed);
  const anchorRegionId = useSimulationStore((s) => s.anchorRegionId);
  const forceRegionId = useSimulationStore((s) => s.forceRegionId);
  const regions = useSimulationStore((s) => s.regions);
  const forceDelta = useSimulationStore((s) => s.forceDelta);
  const geometryFactors = useSimulationStore((s) => s.geometryFactors);

  const activeTool = useWorkspaceStore((s) => s.activeTool);
  const analysis = useAgentStore((s) => s.analysis);
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const hasReport = useScenarioStore((s) => s.report !== null);
  const reportOpen = useScenarioStore((s) => s.reportOpen);
  const setReportOpen = useScenarioStore((s) => s.setReportOpen);

  useEffect(() => {
    if (reportOpen) {
      setActiveTab("report");
      setReportOpen(false);
    }
  }, [reportOpen, setReportOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildCurrentInput = useCallback(() => {
    return buildAgentInput({
      material,
      activeTool,
      regions,
      anchorRegionId,
      forceRegionId,
      forceDelta,
      maxStress,
      maxDisplacement,
      dangerPct,
      isDeformed,
      geometryFactors,
      vertexCount,
      faceCount,
    });
  }, [
    material,
    activeTool,
    regions,
    anchorRegionId,
    forceRegionId,
    forceDelta,
    maxStress,
    maxDisplacement,
    dangerPct,
    isDeformed,
    geometryFactors,
    vertexCount,
    faceCount,
  ]);

  const handleSend = useCallback(
    (text?: string) => {
      const question = (text ?? chatInput).trim();
      if (!question) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: question,
        timestamp: Date.now(),
      };
      addMessage(userMsg);

      const input = buildCurrentInput();
      const response = generateChatResponse(question, { input, analysis });
      addMessage(response);

      setChatInput("");
    },
    [chatInput, addMessage, buildCurrentInput, analysis],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { id: "chat", label: "AI Chat", icon: <MessageSquare size={13} /> },
    { id: "logs", label: "Event Log", icon: <Terminal size={13} /> },
    { id: "metrics", label: "Metrics", icon: <Activity size={13} /> },
    { id: "report", label: "Report", icon: <FileText size={13} />, badge: hasReport },
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
              {tab.badge && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              )}
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
            <div className="flex-1 space-y-2 overflow-y-auto">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              <div ref={chatEndRef} />

              {messages.length <= 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-2xs text-zinc-400 transition-colors hover:border-accent/30 hover:text-zinc-200"
                    >
                      <Sparkles size={10} className="text-accent" />
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about stress, materials, or design..."
                className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-accent"
              />
              <button
                onClick={() => handleSend()}
                disabled={!chatInput.trim()}
                className="flex items-center gap-1 rounded-md bg-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent/80 disabled:opacity-40"
              >
                <Send size={12} />
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
            {modelLoaded && (
              <p>
                <span className="text-emerald-600">[load]</span>{" "}
                <span className="text-zinc-400">{modelName}</span> —{" "}
                {vertexCount.toLocaleString()} vertices,{" "}
                {faceCount.toLocaleString()} faces
              </p>
            )}
            <p>
              <span className="text-zinc-600">[info]</span> Material:{" "}
              <span className="text-zinc-400">{material.name}</span>
            </p>
            {regions.length > 0 && (
              <p>
                <span className="text-emerald-600">[mesh]</span> Extracted{" "}
                {regions.length} selectable regions
              </p>
            )}
            {anchorRegionId !== null && (
              <p>
                <span className="text-blue-400">[pin]</span> Anchor set on
                region #{anchorRegionId}
              </p>
            )}
            {forceRegionId !== null && (
              <p>
                <span className="text-amber-400">[force]</span> Force region set
                to #{forceRegionId}
              </p>
            )}
            {isDeformed && (
              <p>
                <span className="text-red-400">[sim]</span> Simulation active —
                max stress {maxStress.toFixed(1)} MPa, danger{" "}
                {dangerPct.toFixed(1)}%
              </p>
            )}
            {analysis ? (
              <p>
                <span className="text-accent">[agents]</span> Analysis complete
                — overall risk {analysis.overall_risk}/100, {analysis.material_agents.length} material +{" "}
                {analysis.failure_agents.length} failure agents ran
              </p>
            ) : (
              <p>
                <span className="text-zinc-600">[info]</span> Agent system ready
                — click Analyze to run
              </p>
            )}
          </div>
        )}

        {activeTab === "metrics" && (
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Vertices",
                value: modelLoaded ? vertexCount.toLocaleString() : "—",
              },
              {
                label: "Faces",
                value: modelLoaded ? faceCount.toLocaleString() : "—",
              },
              {
                label: "Max Stress",
                value: isDeformed ? `${maxStress.toFixed(1)} MPa` : "—",
                highlight: isDeformed && dangerPct > 10,
              },
              {
                label: "Danger %",
                value: isDeformed ? `${dangerPct.toFixed(1)}%` : "—",
                highlight: isDeformed && dangerPct > 20,
              },
              {
                label: "Max Disp.",
                value: isDeformed
                  ? `${maxDisplacement.toFixed(2)} mm`
                  : "—",
              },
              {
                label: "Material",
                value: material.name,
              },
              {
                label: "E (GPa)",
                value: material.youngs_modulus_gpa.toString(),
              },
              {
                label: "Risk",
                value: analysis
                  ? `${analysis.overall_risk}/100`
                  : "—",
                highlight: analysis ? analysis.overall_risk >= 60 : false,
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className={`rounded-lg border p-2.5 text-center ${
                  "highlight" in metric && metric.highlight
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-border bg-surface-2"
                }`}
              >
                <p
                  className={`text-lg font-semibold ${
                    "highlight" in metric && metric.highlight
                      ? "text-red-400"
                      : "text-zinc-300"
                  }`}
                >
                  {metric.value}
                </p>
                <p className="text-2xs text-zinc-500">{metric.label}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "report" && <ReportPanel />}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={`flex items-start gap-2 rounded-lg p-3 ${
        isUser
          ? "bg-accent/10 ml-8"
          : isSystem
            ? "bg-surface-2"
            : "bg-surface-2"
      }`}
    >
      <div
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold text-white ${
          isUser ? "bg-zinc-600" : "bg-accent"
        }`}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
          {message.content}
        </p>
        <p className="mt-1 text-2xs text-zinc-600">
          {isSystem ? "System" : isUser ? "You" : "StressLab AI"}
        </p>
      </div>
    </div>
  );
}
