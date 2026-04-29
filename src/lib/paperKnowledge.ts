import {
  DatasetAnalysis,
  ObjectiveWeights,
  ModelType,
  PaperRecord,
  PaperPrior,
  PaperSummary,
  AllocationProfile,
  ResearchEvidence,
} from '@/lib/types';

export interface PaperFilter {
  problem_type?: string[];
  domain?: string[];
  fairness_definition?: string[];
  method_category?: string[];
  constraints?: string[];
  sensitive_attributes?: string[];
}

export async function fetchPaperCorpus(): Promise<PaperRecord[]> {
  const res = await fetch('/api/papers');
  if (!res.ok) return [];
  const data = await res.json();
  return data.papers || [];
}

function normalizeList(values?: string[] | null): string[] {
  return (values || []).map((v) => v.trim().toLowerCase()).filter(Boolean);
}

function normalizeValue(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

function matchAny(haystack: string[], needles?: string[]): boolean {
  if (!needles || needles.length === 0) return true;
  const needleSet = new Set(needles.map((n) => n.toLowerCase()));
  return haystack.some((v) => needleSet.has(v.toLowerCase()));
}

export function filterPapers(papers: PaperRecord[], filter: PaperFilter): PaperRecord[] {
  return papers.filter((p) => {
    const problemType = normalizeValue(p.problem_type);
    const domain = normalizeValue(p.domain);
    const fairnessDef = normalizeValue(p.fairness_definition);
    const methodCategory = normalizeValue(p.method?.category);
    const constraints = normalizeList(p.setting?.constraints);
    const sensitive = normalizeList(p.setting?.sensitive_attributes);

    if (filter.problem_type && !filter.problem_type.includes(problemType)) return false;
    if (filter.domain && !filter.domain.includes(domain)) return false;
    if (filter.fairness_definition && !filter.fairness_definition.includes(fairnessDef)) return false;
    if (filter.method_category && !filter.method_category.includes(methodCategory)) return false;
    if (filter.constraints && !matchAny(constraints, filter.constraints)) return false;
    if (filter.sensitive_attributes && !matchAny(sensitive, filter.sensitive_attributes)) return false;

    return true;
  });
}

function mapTradeoff(value?: string | null, fallback: number): number {
  const v = normalizeValue(value);
  if (!v || v === 'n/a' || v === 'na') return fallback;
  if (v === 'high') return 70;
  if (v === 'medium') return 55;
  if (v === 'low') return 35;
  const numeric = Number(v);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampWeights(weights: ObjectiveWeights): ObjectiveWeights {
  const accuracy = Math.max(5, Math.min(90, weights.accuracy));
  const fairness = Math.max(5, Math.min(90, weights.fairness));
  const robustness = Math.max(5, Math.min(70, weights.robustness));
  const total = accuracy + fairness + robustness;
  return {
    accuracy: Math.round((accuracy / total) * 100),
    fairness: Math.round((fairness / total) * 100),
    robustness: 100 - Math.round((accuracy / total) * 100) - Math.round((fairness / total) * 100),
  };
}

function summarizePaper(paper: PaperRecord): PaperSummary {
  return {
    id: paper.id,
    title: paper.paper?.title || paper.id,
    year: paper.paper?.year || undefined,
    venue: paper.paper?.venue || undefined,
    problemType: paper.problem_type || 'general',
    domain: paper.domain || 'general',
    fairnessDefinition: paper.fairness_definition || 'not_explicitly_formalized',
    methodCategory: paper.method?.category || 'general',
  };
}

export interface PaperContext {
  problemType?: string;
  domain?: string;
  fairnessDefinition?: string;
  constraints?: string[];
  sensitiveAttributes?: string[];
}

function getDefaultWeights(): ObjectiveWeights {
  return { accuracy: 40, fairness: 40, robustness: 20 };
}

function buildModelScoreBase(): Record<ModelType, number> {
  return {
    LogisticRegression: 0,
    RandomForest: 0,
    XGBoost: 0,
    GradientBoosting: 0,
    SVM: 0,
  };
}

function applyMethodBias(scores: Record<ModelType, number>, category: string) {
  switch (category) {
    case 'policy_analysis':
    case 'participatory_design':
    case 'evaluation':
      scores.LogisticRegression += 0.6;
      scores.SVM += 0.4;
      break;
    case 'predictive_modeling':
      scores.XGBoost += 0.6;
      scores.RandomForest += 0.4;
      break;
    case 'optimization':
    case 'resource_allocation':
      scores.RandomForest += 0.5;
      scores.GradientBoosting += 0.4;
      break;
    case 'robust_optimization':
      scores.RandomForest += 0.5;
      scores.SVM += 0.3;
      break;
    case 'causal_inference':
      scores.LogisticRegression += 0.5;
      scores.GradientBoosting += 0.2;
      break;
    case 'ranking':
      scores.GradientBoosting += 0.5;
      scores.XGBoost += 0.3;
      break;
    default:
      scores.RandomForest += 0.2;
  }
}

function deriveAllocationProfile(papers: PaperRecord[]): AllocationProfile {
  let fairness = 0;
  let efficiency = 0;
  let robustness = 0;
  const constraints: string[] = [];

  for (const p of papers) {
    const fairGain = mapTradeoff(p.tradeoffs?.fairness_gain || null, 50);
    fairness += fairGain;
    const acc = mapTradeoff(p.tradeoffs?.accuracy || null, 50);
    efficiency += acc;
    const methodCategory = normalizeValue(p.method?.category);
    if (methodCategory.includes('robust')) {
      robustness += 60;
    } else if (methodCategory.includes('simulation')) {
      robustness += 50;
    } else {
      robustness += 35;
    }
    constraints.push(...normalizeList(p.setting?.constraints));
  }

  const count = Math.max(papers.length, 1);
  return {
    fairnessEmphasis: Math.round(fairness / count),
    efficiencyEmphasis: Math.round(efficiency / count),
    robustnessEmphasis: Math.round(robustness / count),
    constraints: Array.from(new Set(constraints)),
  };
}

export function inferPaperPriors(papers: PaperRecord[], context: PaperContext): PaperPrior {
  const filter: PaperFilter = {
    problem_type: context.problemType ? [context.problemType] : undefined,
    domain: context.domain ? [context.domain, 'general'] : undefined,
    fairness_definition: context.fairnessDefinition ? [context.fairnessDefinition] : undefined,
    constraints: context.constraints,
    sensitive_attributes: context.sensitiveAttributes,
  };

  let matched = filterPapers(papers, filter);
  if (matched.length === 0) {
    matched = filterPapers(papers, { domain: context.domain ? [context.domain, 'general'] : undefined });
  }
  if (matched.length === 0) matched = papers.slice(0, 25);

  const weights = { ...getDefaultWeights() };
  const modelScores = buildModelScoreBase();
  const signals: string[] = [];

  for (const paper of matched) {
    const tradeoffAcc = mapTradeoff(paper.tradeoffs?.accuracy || null, 50);
    const tradeoffFair = mapTradeoff(paper.tradeoffs?.fairness_gain || null, 50);
    const methodCategory = normalizeValue(paper.method?.category);

    weights.accuracy += (tradeoffAcc - 50) * 0.2;
    weights.fairness += (tradeoffFair - 50) * 0.25;
    if (methodCategory.includes('robust') || methodCategory.includes('simulation')) {
      weights.robustness += 6;
    }

    applyMethodBias(modelScores, methodCategory);
    signals.push(`${paper.paper?.title || paper.id} (${paper.method?.category || 'general'})`);
  }

  const allocationProfile = deriveAllocationProfile(matched);
  const normalizedWeights = clampWeights(weights);
  const topPapers = matched.slice(0, 6).map(summarizePaper);

  return {
    weights: normalizedWeights,
    modelScores,
    allocationProfile,
    matchedPapers: topPapers,
    signals,
  };
}

export function rankCandidateModels(
  weights: ObjectiveWeights,
  modelScores: Record<ModelType, number>,
): { model: ModelType; score: number }[] {
  const base: Record<ModelType, number> = {
    LogisticRegression: weights.fairness * 0.6 + weights.robustness * 0.2,
    SVM: weights.fairness * 0.4 + weights.robustness * 0.3,
    RandomForest: weights.accuracy * 0.5 + weights.robustness * 0.3,
    GradientBoosting: weights.accuracy * 0.6 + weights.robustness * 0.2,
    XGBoost: weights.accuracy * 0.7 + weights.robustness * 0.1,
  };

  const combined = Object.entries(base).map(([model, score]) => ({
    model: model as ModelType,
    score: score + (modelScores[model as ModelType] || 0) * 25,
  }));

  return combined.sort((a, b) => b.score - a.score);
}

export function blendCommunityAndResearchWeights(
  community: ObjectiveWeights,
  paperPrior: ObjectiveWeights,
  recent?: ObjectiveWeights | null,
): ObjectiveWeights {
  const weights = {
    accuracy: community.accuracy * 0.6 + paperPrior.accuracy * 0.25,
    fairness: community.fairness * 0.6 + paperPrior.fairness * 0.25,
    robustness: community.robustness * 0.6 + paperPrior.robustness * 0.25,
  };

  if (recent) {
    weights.accuracy += recent.accuracy * 0.15;
    weights.fairness += recent.fairness * 0.15;
    weights.robustness += recent.robustness * 0.15;
  }

  return clampWeights(weights);
}

export function explainRecommendation(
  analysis: DatasetAnalysis | null,
  paperPrior: PaperPrior,
  blendedWeights: ObjectiveWeights,
  rankedModels: { model: ModelType; score: number }[],
  context?: { domain?: string; fairnessDefinition?: string; problemType?: string },
): ResearchEvidence {
  const matchedFields = [
    context?.problemType ? `problem type: ${context.problemType}` : analysis?.taskType ? `problem type: ${analysis.taskType}` : null,
    context?.domain ? `domain: ${context.domain}` : null,
    context?.fairnessDefinition ? `fairness definition: ${context.fairnessDefinition}` : null,
    analysis?.activeDecision?.name ? `decision lens: ${analysis.activeDecision.name}` : null,
    analysis?.sensitiveAttributes?.length ? `sensitive attributes: ${analysis.sensitiveAttributes.join(', ')}` : null,
  ].filter(Boolean) as string[];

  return {
    enabled: true,
    matchedPapers: paperPrior.matchedPapers,
    matchedSignals: matchedFields,
    paperPriorWeights: paperPrior.weights,
    blendedWeights,
    modelRanking: rankedModels.slice(0, 4),
  };
}