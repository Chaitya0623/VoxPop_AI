// ============================================================
// VoxPop AI — Preference Inference Engine
// ============================================================
// Maps value question responses → ObjectiveWeights { accuracy,
// fairness, robustness } that sum to 100.
//
// Each question has a `mapsTo` field indicating which objective
// it primarily influences, and a `weight` multiplier for how
// strongly the answer affects that objective.
//
// Likert answers (1–5): 1=strongly disagree, 5=strongly agree
//   - For fairness questions: high agreement → increase fairness weight
//   - For accuracy questions: high agreement → increase accuracy weight
//   - For robustness questions: high agreement → increase robustness weight
//
// Binary answers (0 or 1):
//   - 1 = yes (increases mapped objective), 0 = no (decreases it)
//
// FUTURE: Replace with learned inference model trained on user
//         behavior data, or use LLM to interpret open-ended answers.
// ============================================================

import {
  ValueQuestion,
  ValueResponse,
  ObjectiveWeights,
} from '@/lib/types';

/**
 * Normalize a likert response (1–5) to a -1.0 … +1.0 signal.
 * 3 is neutral (0.0), 1 is -1.0, 5 is +1.0.
 */
function normalizeLikert(answer: number): number {
  return (Math.min(5, Math.max(1, answer)) - 3) / 2;
}

/**
 * Normalize a binary response (0 or 1) to a -0.5 … +0.5 signal.
 * 1 = +0.5 (agrees), 0 = -0.5 (disagrees).
 */
function normalizeBinary(answer: number): number {
  return answer >= 1 ? 0.5 : -0.5;
}

/**
 * Infer ObjectiveWeights from a set of value question responses.
 *
 * Algorithm:
 * 1. Start with baseline weights: accuracy=40, fairness=40, robustness=20
 * 2. For each response, compute a signal strength (-1 to +1)
 * 3. Apply the signal to the mapped objective (increase or decrease)
 * 4. Normalize so weights sum to 100
 *
 * @param questions - The value questions that were asked
 * @param responses - The user's responses
 * @returns Inferred ObjectiveWeights summing to 100
 */
export function inferObjectiveWeights(
  questions: ValueQuestion[],
  responses: ValueResponse[],
): ObjectiveWeights {
  // Baseline weights
  let accuracy = 40;
  let fairness = 40;
  let robustness = 20;

  // Build response lookup
  const responseMap = new Map<string, number>();
  for (const r of responses) {
    responseMap.set(r.questionId, r.answer);
  }

  // Accumulate signals
  for (const q of questions) {
    const answer = responseMap.get(q.id);
    if (answer === undefined) continue;

    const signal =
      q.type === 'binary'
        ? normalizeBinary(answer)
        : normalizeLikert(answer);

    const strength = signal * q.weight * 15; // Scale factor: each question can shift ±15 points

    switch (q.mapsTo) {
      case 'accuracy':
        // Agreeing with accuracy questions increases accuracy, decreases fairness
        accuracy += strength;
        fairness -= strength * 0.6;
        robustness -= strength * 0.4;
        break;
      case 'fairness':
        // Agreeing with fairness questions increases fairness, decreases accuracy
        fairness += strength;
        accuracy -= strength * 0.6;
        robustness -= strength * 0.4;
        break;
      case 'robustness':
        // Agreeing with robustness questions increases robustness, decreases both others equally
        robustness += strength;
        accuracy -= strength * 0.5;
        fairness -= strength * 0.5;
        break;
    }
  }

  // Clamp to minimum 5 each
  accuracy = Math.max(5, accuracy);
  fairness = Math.max(5, fairness);
  robustness = Math.max(5, robustness);

  // Normalize to sum to 100
  const total = accuracy + fairness + robustness;
  accuracy = Math.round((accuracy / total) * 100);
  fairness = Math.round((fairness / total) * 100);
  robustness = 100 - accuracy - fairness; // Ensure exact sum

  return { accuracy, fairness, robustness };
}

/**
 * Compute a simple "fairness lean" score from 0–100 based on inferred weights.
 * 0 = pure efficiency, 100 = pure fairness. Used for legacy compatibility
 * with the accuracyVsFairness field in SurveyResponse.
 */
export function computeAccuracyVsFairness(weights: ObjectiveWeights): number {
  // Map: if fairness is dominant, lean toward 0 (full fairness)
  // if accuracy is dominant, lean toward 100 (full accuracy)
  const total = weights.accuracy + weights.fairness;
  if (total === 0) return 50;
  return Math.round((weights.accuracy / total) * 100);
}

/**
 * Determine the closest guiding principle based on inferred weights.
 * Used for legacy compatibility with SurveyResponse.
 */
export function inferGuidingPrinciple(
  weights: ObjectiveWeights,
): 'equal_opportunity' | 'equal_outcome' | 'profit_maximization' | 'social_equity' {
  if (weights.fairness >= 50) {
    // Strong fairness lean — differentiate between equal_opportunity and social_equity
    return weights.robustness >= 20 ? 'social_equity' : 'equal_opportunity';
  }
  if (weights.accuracy >= 55) {
    return 'profit_maximization';
  }
  return 'equal_outcome'; // balanced
}

/**
 * Generate a human-readable summary of the inferred preferences.
 */
export function describePreferences(weights: ObjectiveWeights): string {
  const parts: string[] = [];

  if (weights.fairness >= 50) {
    parts.push(`You strongly value equitable outcomes (fairness: ${weights.fairness}%).`);
  } else if (weights.fairness >= 35) {
    parts.push(`You value balanced fairness (${weights.fairness}%).`);
  }

  if (weights.accuracy >= 50) {
    parts.push(`You prioritize predictive performance (accuracy: ${weights.accuracy}%).`);
  } else if (weights.accuracy >= 35) {
    parts.push(`You seek balanced accuracy (${weights.accuracy}%).`);
  }

  if (weights.robustness >= 25) {
    parts.push(`You value model consistency across conditions (robustness: ${weights.robustness}%).`);
  }

  return parts.join(' ') || `Balanced preferences: accuracy ${weights.accuracy}%, fairness ${weights.fairness}%, robustness ${weights.robustness}%.`;
}
