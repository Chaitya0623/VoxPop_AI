// ============================================================
// VoxPop AI — Sample Vote Generator
// ============================================================
// Generates realistic simulated community votes to seed the
// dashboard with meaningful data alongside the user's real vote.
// ============================================================

import { SurveyResponse, GuidingPrinciple } from '@/lib/types';

const PRINCIPLES: GuidingPrinciple[] = [
  'equal_opportunity',
  'equal_outcome',
  'profit_maximization',
  'social_equity',
];

const SCENARIO_IDS = ['scenario-a', 'scenario-b', 'scenario-c'];

/** Deterministic pseudo-random from seed */
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s % 10000) / 10000;
  };
}

/**
 * Generate a spread of realistic community votes.
 *
 * The votes are designed to create interesting dashboard patterns:
 * - A moderate preference toward balanced/fairness scenarios
 * - Diverse guiding principles
 * - A visible preference drift over time
 * - Enough polarization to make the index meaningful
 *
 * @param count      Number of votes to generate (default: 12)
 * @param startTime  Timestamp baseline for the first vote
 */
export function generateSampleVotes(
  count = 12,
  startTime?: number,
): SurveyResponse[] {
  const baseTime = startTime ?? Date.now() - 3600_000; // 1 hour ago
  const rand = seededRng(42);

  // Vote profiles representing different community segments
  const profiles = [
    // Data scientists — lean accuracy
    { scenario: 'scenario-a', accFair: 78, principle: 'profit_maximization' as GuidingPrinciple, confidence: 4 },
    { scenario: 'scenario-a', accFair: 82, principle: 'profit_maximization' as GuidingPrinciple, confidence: 5 },
    { scenario: 'scenario-a', accFair: 71, principle: 'equal_opportunity' as GuidingPrinciple, confidence: 3 },

    // Policy/ethics advocates — lean fairness
    { scenario: 'scenario-c', accFair: 18, principle: 'social_equity' as GuidingPrinciple, confidence: 5 },
    { scenario: 'scenario-c', accFair: 25, principle: 'equal_outcome' as GuidingPrinciple, confidence: 4 },
    { scenario: 'scenario-c', accFair: 12, principle: 'social_equity' as GuidingPrinciple, confidence: 4 },
    { scenario: 'scenario-c', accFair: 22, principle: 'equal_opportunity' as GuidingPrinciple, confidence: 3 },

    // Pragmatists — balanced middle
    { scenario: 'scenario-b', accFair: 55, principle: 'equal_opportunity' as GuidingPrinciple, confidence: 4 },
    { scenario: 'scenario-b', accFair: 48, principle: 'equal_opportunity' as GuidingPrinciple, confidence: 3 },
    { scenario: 'scenario-b', accFair: 42, principle: 'social_equity' as GuidingPrinciple, confidence: 4 },
    { scenario: 'scenario-b', accFair: 60, principle: 'profit_maximization' as GuidingPrinciple, confidence: 2 },
    { scenario: 'scenario-b', accFair: 35, principle: 'equal_outcome' as GuidingPrinciple, confidence: 5 },

    // Extra diverse votes
    { scenario: 'scenario-a', accFair: 88, principle: 'profit_maximization' as GuidingPrinciple, confidence: 5 },
    { scenario: 'scenario-c', accFair: 15, principle: 'equal_outcome' as GuidingPrinciple, confidence: 5 },
    { scenario: 'scenario-b', accFair: 50, principle: 'equal_opportunity' as GuidingPrinciple, confidence: 3 },
  ];

  const votesToGenerate = Math.min(count, profiles.length);
  const timeStep = Math.floor(300_000 / votesToGenerate); // spread across ~5 min

  const votes: SurveyResponse[] = [];

  for (let i = 0; i < votesToGenerate; i++) {
    const p = profiles[i];
    // Add slight randomness so it doesn't look perfectly scripted
    const jitter = Math.round((rand() - 0.5) * 8);

    votes.push({
      id: `sample-${i + 1}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: baseTime + i * timeStep + Math.round(rand() * 10000),
      selectedScenarioId: p.scenario,
      accuracyVsFairness: Math.max(0, Math.min(100, p.accFair + jitter)),
      guidingPrinciple: p.principle,
      confidenceRating: p.confidence,
    });
  }

  return votes;
}
