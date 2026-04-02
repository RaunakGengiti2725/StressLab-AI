import { create } from "zustand";
import type { ChatMessage } from "@/lib/agents/types";

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
}

const WELCOME: ChatMessage = {
  id: "system-welcome",
  role: "system",
  content:
    "Welcome to StressLab AI. Load a model and apply forces to begin analysis. I can help you understand stress patterns, compare materials, and suggest design improvements.",
  timestamp: Date.now(),
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [WELCOME],

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  clearMessages: () => set({ messages: [WELCOME] }),
}));
