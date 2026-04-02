export enum AgentType {
  MATERIAL = "material",
  FAILURE = "failure",
  SYNTHESIS = "synthesis",
}

export interface DesignSuggestion {
  area: string;
  action: string;
  impact: string;
}

export interface AgentOutput {
  agent_id: string;
  agent_type: AgentType;
  agent_name: string;
  risk_score: number;
  confidence: number;
  failure_mode: string | null;
  explanation: string;
  recommendations: string[];
  design_suggestions: DesignSuggestion[];
}
