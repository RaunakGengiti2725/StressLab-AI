export interface MaterialProfile {
  id: string;
  name: string;
  category: "thermoplastic" | "resin";
  youngs_modulus_gpa: number;
  yield_strength_mpa: number;
  ultimate_strength_mpa: number;
  elongation_at_break_pct: number;
  density_g_cm3: number;
  heat_deflection_c: number;
  layer_adhesion: "low" | "medium" | "high";
  fatigue_resistance: "low" | "medium" | "high";
  brittleness: "low" | "medium" | "high";
  color_hex: string;
}

export const MATERIAL_IDS = [
  "pla",
  "petg",
  "abs",
  "nylon",
  "tpu",
  "resin",
] as const;

export type MaterialId = (typeof MATERIAL_IDS)[number];
