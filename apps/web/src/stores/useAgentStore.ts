import { create } from "zustand";
import type { AnalysisResult } from "@shared/agents";

interface AgentState {
  analysis: AnalysisResult | null;
  isRunning: boolean;
  lastRunTimestamp: number | null;

  setAnalysis: (result: AnalysisResult) => void;
  setRunning: (running: boolean) => void;
  clearAnalysis: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  analysis: null,
  isRunning: false,
  lastRunTimestamp: null,

  setAnalysis: (result) =>
    set({
      analysis: result,
      isRunning: false,
      lastRunTimestamp: result.timestamp,
    }),

  setRunning: (running) => set({ isRunning: running }),

  clearAnalysis: () =>
    set({ analysis: null, isRunning: false, lastRunTimestamp: null }),
}));
