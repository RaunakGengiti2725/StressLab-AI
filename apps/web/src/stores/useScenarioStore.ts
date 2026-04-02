import { create } from "zustand";
import type {
  SavedScenario,
  MaterialComparisonResult,
  ScenarioComparisonResult,
  StressReport,
} from "@/lib/scenarios/types";
import {
  loadScenarios,
  saveScenario as persistScenario,
  deleteScenario as removePersisted,
  renameScenario as renamePersisted,
  generateId,
} from "@/lib/scenarios/persistence";

interface ScenarioState {
  scenarios: SavedScenario[];
  activeScenarioId: string | null;

  saveDialogOpen: boolean;
  comparisonResult: MaterialComparisonResult | null;
  scenarioComparison: ScenarioComparisonResult | null;
  report: StressReport | null;
  reportOpen: boolean;

  compareScenarioAId: string | null;
  compareScenarioBId: string | null;

  loadFromStorage: () => void;
  openSaveDialog: () => void;
  closeSaveDialog: () => void;

  createScenario: (scenario: Omit<SavedScenario, "id" | "createdAt" | "updatedAt">) => string;
  updateScenario: (id: string, updates: Partial<SavedScenario>) => void;
  removeScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  setActiveScenario: (id: string | null) => void;

  setComparisonResult: (result: MaterialComparisonResult | null) => void;
  setScenarioComparison: (result: ScenarioComparisonResult | null) => void;
  setCompareIds: (a: string | null, b: string | null) => void;

  setReport: (report: StressReport | null) => void;
  setReportOpen: (open: boolean) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: [],
  activeScenarioId: null,

  saveDialogOpen: false,
  comparisonResult: null,
  scenarioComparison: null,
  report: null,
  reportOpen: false,

  compareScenarioAId: null,
  compareScenarioBId: null,

  loadFromStorage: () => {
    set({ scenarios: loadScenarios() });
  },

  openSaveDialog: () => set({ saveDialogOpen: true }),
  closeSaveDialog: () => set({ saveDialogOpen: false }),

  createScenario: (data) => {
    const now = Date.now();
    const id = generateId();
    const scenario: SavedScenario = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    persistScenario(scenario);
    set((s) => ({
      scenarios: [scenario, ...s.scenarios],
      saveDialogOpen: false,
      activeScenarioId: id,
    }));
    return id;
  },

  updateScenario: (id, updates) => {
    set((s) => {
      const scenarios = s.scenarios.map((sc) =>
        sc.id === id ? { ...sc, ...updates, updatedAt: Date.now() } : sc,
      );
      const updated = scenarios.find((sc) => sc.id === id);
      if (updated) persistScenario(updated);
      return { scenarios };
    });
  },

  removeScenario: (id) => {
    removePersisted(id);
    set((s) => ({
      scenarios: s.scenarios.filter((sc) => sc.id !== id),
      activeScenarioId: s.activeScenarioId === id ? null : s.activeScenarioId,
    }));
  },

  renameScenario: (id, name) => {
    renamePersisted(id, name);
    set((s) => ({
      scenarios: s.scenarios.map((sc) =>
        sc.id === id ? { ...sc, name, updatedAt: Date.now() } : sc,
      ),
    }));
  },

  setActiveScenario: (id) => set({ activeScenarioId: id }),

  setComparisonResult: (result) => set({ comparisonResult: result }),
  setScenarioComparison: (result) => set({ scenarioComparison: result }),
  setCompareIds: (a, b) =>
    set({ compareScenarioAId: a, compareScenarioBId: b }),

  setReport: (report) => set({ report }),
  setReportOpen: (open) => set({ reportOpen: open }),
}));
