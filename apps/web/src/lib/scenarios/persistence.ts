import type { SavedScenario } from "./types";

const STORAGE_KEY = "stresslab-scenarios";

function readAll(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedScenario[];
  } catch {
    return [];
  }
}

function writeAll(scenarios: SavedScenario[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function loadScenarios(): SavedScenario[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveScenario(scenario: SavedScenario): void {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === scenario.id);
  if (idx >= 0) {
    all[idx] = scenario;
  } else {
    all.push(scenario);
  }
  writeAll(all);
}

export function deleteScenario(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function getScenario(id: string): SavedScenario | null {
  return readAll().find((s) => s.id === id) ?? null;
}

export function renameScenario(id: string, name: string): void {
  const all = readAll();
  const scenario = all.find((s) => s.id === id);
  if (scenario) {
    scenario.name = name;
    scenario.updatedAt = Date.now();
    writeAll(all);
  }
}

export function generateId(): string {
  return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
