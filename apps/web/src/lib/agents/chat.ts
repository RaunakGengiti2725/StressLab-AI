import type { AnalysisResult } from "@shared/agents";
import type { AgentInput, ChatMessage } from "./types";

let messageCounter = 0;
function nextId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

interface ChatContext {
  input: AgentInput;
  analysis: AnalysisResult | null;
}

type QuestionMatcher = {
  patterns: RegExp[];
  handler: (ctx: ChatContext) => string;
};

const matchers: QuestionMatcher[] = [
  {
    patterns: [/why.*(pla|petg|abs|nylon|tpu|resin).*(risk|danger|bad|unsafe)/i],
    handler: (ctx) => {
      const match = ctx.input.material;
      const matAgent = ctx.analysis?.material_agents.find(
        (a) => a.agent_id === `material-${match.id}`,
      );
      if (matAgent) return matAgent.explanation;
      return `${match.name}: yield strength ${match.yield_strength_mpa} MPa, elongation ${match.elongation_at_break_pct}%. Run analysis for detailed risk assessment.`;
    },
  },
  {
    patterns: [/why.*(pla|petg|abs|nylon|tpu|resin).*(safe|good|better)/i],
    handler: (ctx) => {
      const nameMatch = ctx.input.material.name;
      const matAgent = ctx.analysis?.material_agents.find(
        (a) => a.agent_id === `material-${ctx.input.material.id}`,
      );
      if (matAgent && matAgent.risk_score < 40) {
        return `${nameMatch} is performing well here. ${matAgent.explanation}`;
      }
      if (matAgent) {
        return `${nameMatch} actually shows some risk (${matAgent.risk_score}/100). ${matAgent.explanation}`;
      }
      return `${nameMatch} has yield strength ${ctx.input.material.yield_strength_mpa} MPa. Run analysis for comparison.`;
    },
  },
  {
    patterns: [/where.*fail/i, /fail.*first/i, /weak.*point/i, /weak.*spot/i],
    handler: (ctx) => {
      if (!ctx.input.isSimulationActive)
        return "Apply forces to the model first. I need simulation data to identify failure points.";

      const failures = ctx.analysis?.failure_agents.filter(
        (a) => a.risk_score > 30,
      );
      if (!failures || failures.length === 0)
        return `No critical failure points detected at current load levels. Danger zone covers ${ctx.input.stress.dangerZonePct.toFixed(1)}% of the part. The highest-stress regions (shown in red/yellow on the heatmap) are where failure would initiate if loads increase.`;

      const worst = failures.sort((a, b) => b.risk_score - a.risk_score)[0]!;
      return `Most likely failure: ${worst.failure_mode ?? worst.agent_name} (risk ${worst.risk_score}/100). ${worst.explanation} Look at the red zones on the heatmap — those are the highest stress concentrations at ${ctx.input.stress.maxStress.toFixed(1)} MPa.`;
    },
  },
  {
    patterns: [/which.*material.*(best|better|recommend)/i, /best.*material/i, /what.*material.*should/i],
    handler: (ctx) => {
      if (!ctx.analysis?.synthesis)
        return "Run the analysis to compare all materials for this load case.";
      return ctx.analysis.synthesis.explanation;
    },
  },
  {
    patterns: [/redesign/i, /improve/i, /fix.*design/i, /what.*change/i, /how.*reduce.*risk/i, /how.*reduce.*stress/i],
    handler: (ctx) => {
      if (!ctx.analysis?.advisor)
        return "Run the analysis first. I need simulation results to suggest design improvements.";
      const adv = ctx.analysis.advisor;
      if (adv.design_suggestions.length === 0)
        return adv.explanation;
      const suggList = adv.design_suggestions
        .map((s) => `• ${s.area}: ${s.action} (${s.impact})`)
        .join("\n");
      return `${adv.explanation}\n\nSuggestions:\n${suggList}`;
    },
  },
  {
    patterns: [/why.*(corner|edge).*(red|hot|stress|glow)/i, /red.*corner/i],
    handler: (ctx) => {
      if (!ctx.input.isSimulationActive)
        return "Apply forces to see stress patterns. Sharp corners concentrate stress and will glow red under load.";
      const concentrators = ctx.input.stress.stressConcentratorCount;
      if (concentrators > 0)
        return `Sharp corners act as stress concentrators — the geometry creates a stress multiplication effect (typically 2-3x). Found ${concentrators} concentration points. At ${ctx.input.stress.maxStress.toFixed(1)} MPa peak stress, these corners see the highest local stress. Adding fillets (R ≥ 1mm) would reduce this significantly.`;
      return `The red areas indicate peak stress regions (${ctx.input.stress.maxStress.toFixed(1)} MPa). Even without sharp corners, stress naturally concentrates where the geometry transitions from constrained to loaded regions.`;
    },
  },
  {
    patterns: [/bend.*crack/i, /crack.*bend/i, /more.*likely.*(bend|crack)/i, /bend.*or.*crack/i],
    handler: (ctx) => {
      if (!ctx.analysis) return "Run the analysis for failure mode comparison.";
      const brittle = ctx.analysis.failure_agents.find(
        (a) => a.agent_id === "failure-brittle",
      );
      const fatigue = ctx.analysis.failure_agents.find(
        (a) => a.agent_id === "failure-fatigue",
      );
      if (!brittle || !fatigue)
        return "Failure analysis is not available. Run the analysis.";

      const mat = ctx.input.material;
      if (brittle.risk_score > fatigue.risk_score) {
        return `More likely to crack than bend. ${mat.name} has ${mat.brittleness} brittleness with only ${mat.elongation_at_break_pct}% elongation — it will snap rather than flex. Brittle fracture risk: ${brittle.risk_score}/100 vs fatigue risk: ${fatigue.risk_score}/100.`;
      }
      return `More likely to bend/fatigue than crack. ${mat.name} has ${mat.elongation_at_break_pct}% elongation — it can deform before failing. Fatigue risk: ${fatigue.risk_score}/100 vs brittle fracture: ${brittle.risk_score}/100.`;
    },
  },
];

const generalResponder = (ctx: ChatContext): string => {
  if (!ctx.input.isSimulationActive) {
    return `I can help analyze stress patterns, compare materials, and suggest design improvements. Load a model and apply forces to get started.\n\nTry asking:\n• "Where will this fail first?"\n• "Which material is best?"\n• "Why is the corner red?"\n• "How can I reduce risk?"`;
  }

  const mat = ctx.input.material;
  const risk = ctx.analysis
    ? ctx.analysis.material_agents.find(
        (a) => a.agent_id === `material-${mat.id}`,
      )?.risk_score ?? 0
    : 0;

  return `Current state: ${mat.name} under ${ctx.input.testMode ?? "loading"}, peak stress ${ctx.input.stress.maxStress.toFixed(1)} MPa, danger zone ${ctx.input.stress.dangerZonePct.toFixed(1)}%, risk ${risk}/100.\n\nYou can ask me about:\n• Material suitability and comparisons\n• Failure modes and weak points\n• Design improvement suggestions\n• Why specific areas show high stress`;
};

export function generateChatResponse(
  question: string,
  context: ChatContext,
): ChatMessage {
  const q = question.trim().toLowerCase();

  for (const matcher of matchers) {
    for (const pattern of matcher.patterns) {
      if (pattern.test(q)) {
        return {
          id: nextId(),
          role: "assistant",
          content: matcher.handler(context),
          timestamp: Date.now(),
        };
      }
    }
  }

  if (containsMaterialName(q)) {
    return handleMaterialQuestion(q, context);
  }

  return {
    id: nextId(),
    role: "assistant",
    content: generalResponder(context),
    timestamp: Date.now(),
  };
}

function containsMaterialName(q: string): boolean {
  return /\b(pla|petg|abs|nylon|tpu|resin)\b/i.test(q);
}

function handleMaterialQuestion(
  q: string,
  ctx: ChatContext,
): ChatMessage {
  const matMatch = q.match(/\b(pla|petg|abs|nylon|tpu|resin)\b/i);
  if (!matMatch)
    return {
      id: nextId(),
      role: "assistant",
      content: generalResponder(ctx),
      timestamp: Date.now(),
    };

  const matId = matMatch[1]!.toLowerCase();
  const agent = ctx.analysis?.material_agents.find(
    (a) => a.agent_id === `material-${matId}`,
  );

  if (agent) {
    return {
      id: nextId(),
      role: "assistant",
      content: `${agent.explanation}\n\nRisk: ${agent.risk_score}/100 | Confidence: ${(agent.confidence * 100).toFixed(0)}%\n${agent.recommendations.map((r) => `• ${r}`).join("\n")}`,
      timestamp: Date.now(),
    };
  }

  return {
    id: nextId(),
    role: "assistant",
    content: `Run the analysis to get detailed results for ${matId.toUpperCase()}.`,
    timestamp: Date.now(),
  };
}

export const SUGGESTED_PROMPTS = [
  "Where will this fail first?",
  "Which material is best for this load?",
  "How can I reduce risk?",
  "Why is the corner red?",
  "Is this more likely to bend or crack?",
  "What should I redesign?",
];
