export enum TestType {
  BEND = "bend",
  TWIST = "twist",
  TENSION = "tension",
  COMPRESSION = "compression",
}

export interface Constraint {
  region_id: string;
  vertex_indices: number[];
  position: [number, number, number];
}

export interface ForceLoad {
  region_id: string;
  vertex_indices: number[];
  force_type: TestType;
  magnitude: number;
  direction: [number, number, number];
}

export interface TestScenario {
  id: string;
  name: string;
  project_id: string;
  material_id: string;
  test_type: TestType;
  constraints: Constraint[];
  loads: ForceLoad[];
  created_at: string;
  notes: string;
}
