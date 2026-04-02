export interface DeformationSummary {
  max_displacement_mm: number;
  avg_displacement_mm: number;
  displaced_vertex_count: number;
  total_vertex_count: number;
}

export interface StressFieldSummary {
  max_stress_mpa: number;
  min_stress_mpa: number;
  avg_stress_mpa: number;
  danger_zone_pct: number;
  stress_concentrator_count: number;
  thin_wall_count: number;
}

export interface GeometrySummary {
  vertex_count: number;
  face_count: number;
  bounding_box_mm: [number, number, number];
  volume_mm3: number;
  surface_area_mm2: number;
  is_watertight: boolean;
}

export interface SimulationState {
  scenario_id: string;
  material_id: string;
  geometry: GeometrySummary;
  deformation: DeformationSummary;
  stress: StressFieldSummary;
}
