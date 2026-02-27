// ============================================================
// VoxPop AI — Analytics Module
// ============================================================

import {
  SurveyResponse,
  CommunityInsights,
  ObjectiveWeights,
  PreferenceDriftPoint,
  GuidingPrinciple,
} from '@/lib/types';

const PRINCIPLE_LABELS: Record<GuidingPrinciple, string> = {
  equal_opportunity: 'Equal Opportunity',
  equal_outcome: 'Equal Outcome',
  profit_maximization: 'Profit Maximization',
  social_equity: 'Social Equity',
};

const SCENARIO_LABELS: Record<string, string> = {
  'scenario-a': 'Efficiency Maximizer',
  'scenario-b': 'Balanced Tradeoff',
  'scenario-c': 'Fairness-Constrained',
};

/**
 * Compute community-aggregated objective weights from all responses.
 */
export function computeCommunityWeights(responses: SurveyResponse[]): ObjectiveWeights {
  if (responses.length === 0) {
    return { accuracy: 50, fairness: 30, robustness: 20 };
  }

  let totalAccuracy = 0;
  let totalFairness = 0;

  for (const r of responses) {
    // accuracyVsFairness: 0 = full fairness, 100 = full accuracy
    totalAccuracy += r.accuracyVsFairness;
    totalFairness += 100 - r.accuracyVsFairness;
  }

  const avgAccuracy = totalAccuracy / responses.length;
  const avgFairness = totalFairness / responses.length;

  // Distribute: accuracy + fairness + robustness = 100
  // Robustness gets a baseline share
  const robustness = 15;
  const remaining = 100 - robustness;
  const accuracy = Math.round((avgAccuracy / 100) * remaining);
  const fairness = remaining - accuracy;

  return { accuracy, fairness, robustness };
}

/**
 * Compute full community insights from responses.
 */
export function computeInsights(responses: SurveyResponse[]): CommunityInsights {
  // Scenario split
  const scenarioCounts: Record<string, number> = {};
  for (const r of responses) {
    scenarioCounts[r.selectedScenarioId] = (scenarioCounts[r.selectedScenarioId] || 0) + 1;
  }
  const scenarioSplit = Object.entries(scenarioCounts).map(([id, value]) => ({
    name: SCENARIO_LABELS[id] || id,
    value,
  }));

  // Principle split
  const principleCounts: Record<string, number> = {};
  for (const r of responses) {
    const label = PRINCIPLE_LABELS[r.guidingPrinciple] || r.guidingPrinciple;
    principleCounts[label] = (principleCounts[label] || 0) + 1;
  }
  const principleSplit = Object.entries(principleCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Preference drift over time (group by chunks of responses)
  const sorted = [...responses].sort((a, b) => a.timestamp - b.timestamp);
  const chunkSize = Math.max(1, Math.floor(sorted.length / 6));
  const preferenceDrift: PreferenceDriftPoint[] = [];

  for (let i = 0; i < sorted.length; i += chunkSize) {
    const chunk = sorted.slice(i, i + chunkSize);
    const avgAcc = chunk.reduce((s, r) => s + r.accuracyVsFairness, 0) / chunk.length;
    const avgFair = 100 - avgAcc;
    preferenceDrift.push({
      timestamp: chunk[0].timestamp,
      label: `Vote ${i + 1}–${Math.min(i + chunkSize, sorted.length)}`,
      averageAccuracyPref: +avgAcc.toFixed(1),
      averageFairnessPref: +avgFair.toFixed(1),
    });
  }

  // Polarization = 1 - (largest_cluster / total)
  const maxCluster = Math.max(...Object.values(scenarioCounts), 0);
  const polarizationIndex = responses.length > 0
    ? +(1 - maxCluster / responses.length).toFixed(3)
    : 0;

  // Stability score (inverse of variance in accuracy preference)
  const mean = responses.length > 0
    ? responses.reduce((s, r) => s + r.accuracyVsFairness, 0) / responses.length
    : 50;
  const variance = responses.length > 0
    ? responses.reduce((s, r) => s + (r.accuracyVsFairness - mean) ** 2, 0) / responses.length
    : 0;
  const stabilityScore = +Math.max(0, 1 - variance / 2500).toFixed(3); // 2500 = max possible variance

  // Trend direction
  let trendDirection: CommunityInsights['trendDirection'] = 'stable';
  if (preferenceDrift.length >= 2) {
    const first = preferenceDrift[0].averageFairnessPref;
    const last = preferenceDrift[preferenceDrift.length - 1].averageFairnessPref;
    if (last - first > 3) trendDirection = 'increasing_fairness';
    else if (first - last > 3) trendDirection = 'increasing_efficiency';
  }

  return {
    scenarioSplit,
    principleSplit,
    preferenceDrift,
    polarizationIndex,
    stabilityScore,
    trendDirection,
    totalResponses: responses.length,
  };
}

/**
 * Compute support percentage for the community recommendation.
 * (Percentage of voters whose preferred scenario aligns closest with community weights)
 */
export function computeSupportPercentage(
  responses: SurveyResponse[],
  communityWeights: ObjectiveWeights,
): number {
  if (responses.length === 0) return 0;

  // Simple: count how many voters are within ±15 of the community accuracy level
  const communityAccLevel = communityWeights.accuracy;
  const supporters = responses.filter((r) => {
    const voterAccLevel = (r.accuracyVsFairness / 100) * 85; // rough mapping
    return Math.abs(voterAccLevel - communityAccLevel) < 20;
  });

  return +((supporters.length / responses.length) * 100).toFixed(1);
}

/**
 * Compute how a user's inferred weights compare to the community average.
 * Returns a divergence score from 0 (identical) to 100 (maximally different).
 */
export function computeWeightDivergence(
  userWeights: ObjectiveWeights,
  communityWeights: ObjectiveWeights,
): number {
  const dAcc = Math.abs(userWeights.accuracy - communityWeights.accuracy);
  const dFair = Math.abs(userWeights.fairness - communityWeights.fairness);
  const dRob = Math.abs(userWeights.robustness - communityWeights.robustness);
  // Max possible divergence is 200 (one weight at 100 vs 0, for two dimensions)
  return +((dAcc + dFair + dRob) / 2).toFixed(1);
}

/**
 * Compute aggregate inferred weights from responses that have them.
 * Falls back to the legacy accuracyVsFairness-based computation.
 */
export function computeInferredCommunityWeights(
  responses: SurveyResponse[],
): ObjectiveWeights | null {
  const withInferred = responses.filter((r) => r.inferredWeights);
  if (withInferred.length === 0) return null;

  let totalAcc = 0;
  let totalFair = 0;
  let totalRob = 0;

  for (const r of withInferred) {
    totalAcc += r.inferredWeights!.accuracy;
    totalFair += r.inferredWeights!.fairness;
    totalRob += r.inferredWeights!.robustness;
  }

  const n = withInferred.length;
  return {
    accuracy: Math.round(totalAcc / n),
    fairness: Math.round(totalFair / n),
    robustness: Math.round(totalRob / n),
  };
}
