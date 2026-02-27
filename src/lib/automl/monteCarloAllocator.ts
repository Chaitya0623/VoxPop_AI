// ============================================================
// VoxPop AI — Monte Carlo Allocation Simulator
// ============================================================
// Runs Monte Carlo simulations to find optimal resource allocation
// across groups, balancing outcome maximization (efficiency) with
// equitable distribution (fairness).
//
// Example: Courtroom transportation budget allocation —
//   Group A (near court): baseline attendance 92%
//   Group B (far from court): baseline attendance 65%
//   Budget can improve attendance proportional to allocation.
//   MC finds the Pareto-optimal budget split.
//
// FUTURE: Replace with a real optimization engine or plug into
//         AutoML pipeline for joint model+allocation optimization.
// ============================================================

import {
  ObjectiveWeights,
  StructuralAsymmetry,
  AllocationArm,
  MonteCarloResult,
} from '@/lib/types';

/** Deterministic pseudo-random from a seed string */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return (h % 10000) / 10000;
  };
}

/** Gaussian noise via Box-Muller transform */
function gaussianNoise(rand: () => number, stddev: number): number {
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2 * Math.PI * u2);
  return z * stddev;
}

interface GroupProfile {
  name: string;
  /** Baseline outcome without extra resource allocation (0–1) */
  baselineOutcome: number;
  /** How much the group's outcome improves per unit of allocation (0–1) */
  responsiveness: number;
  /** Population fraction of total */
  populationShare: number;
}

/**
 * Build group profiles from structural asymmetry data.
 * Falls back to synthetic 2-group model if asymmetry data is sparse.
 */
function buildGroupProfiles(asymmetry: StructuralAsymmetry | null): GroupProfile[] {
  if (!asymmetry || asymmetry.groups.length < 2) {
    // Default: 2-group model (advantaged vs disadvantaged)
    return [
      { name: 'Group A (Advantaged)', baselineOutcome: 0.85, responsiveness: 0.1, populationShare: 0.5 },
      { name: 'Group B (Disadvantaged)', baselineOutcome: 0.55, responsiveness: 0.35, populationShare: 0.5 },
    ];
  }

  const groups = asymmetry.groups;
  const totalCount = groups.reduce((s, g) => s + g.count, 0);

  // Use target rate if available, otherwise synthesize from group ordering
  const hasTargetRate = groups.some((g) => {
    const rateKey = Object.keys(g.metrics).find((k) => k.endsWith('_rate'));
    return rateKey && g.metrics[rateKey] !== undefined;
  });

  return groups.map((g, i) => {
    let baselineOutcome: number;

    if (hasTargetRate) {
      const rateKey = Object.keys(g.metrics).find((k) => k.endsWith('_rate'));
      baselineOutcome = rateKey ? g.metrics[rateKey] : 0.7;
    } else {
      // Distribute baselines: first group gets higher baseline
      baselineOutcome = 0.85 - i * (0.25 / Math.max(groups.length - 1, 1));
    }

    // Groups with lower baselines are more responsive to resource allocation
    const responsiveness = Math.max(0.05, 0.4 * (1 - baselineOutcome));

    return {
      name: g.groupName,
      baselineOutcome: Math.max(0.3, Math.min(0.95, baselineOutcome)),
      responsiveness,
      populationShare: totalCount > 0 ? g.count / totalCount : 1 / groups.length,
    };
  });
}

/**
 * Simulate outcome for a given allocation and group profiles.
 *
 * @param allocations - Per-group allocation fractions (sum to 1)
 * @param profiles    - Group profiles
 * @param rand        - Seeded random function
 * @returns { overallOutcome, fairnessGap }
 */
function simulateOutcome(
  allocations: number[],
  profiles: GroupProfile[],
  rand: () => number,
): { overallOutcome: number; fairnessGap: number } {
  const outcomes: number[] = [];

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    const alloc = allocations[i] || 0;

    // Outcome = baseline + allocation * responsiveness + noise
    const noise = gaussianNoise(rand, 0.02);
    const outcome = Math.min(1, Math.max(0, p.baselineOutcome + alloc * p.responsiveness + noise));
    outcomes.push(outcome);
  }

  // Overall outcome: population-weighted average
  const overallOutcome = outcomes.reduce(
    (s, o, i) => s + o * profiles[i].populationShare,
    0,
  );

  // Fairness gap: max outcome spread across groups
  const fairnessGap = Math.max(...outcomes) - Math.min(...outcomes);

  return { overallOutcome, fairnessGap };
}

/**
 * Generate allocation vectors to sample across the allocation space.
 * For N groups, generates points on the N-simplex.
 */
function generateAllocationGrid(
  numGroups: number,
  steps: number,
): number[][] {
  if (numGroups === 2) {
    // Simple case: just vary the split
    const grid: number[][] = [];
    for (let i = 0; i <= steps; i++) {
      const a = i / steps;
      grid.push([a, 1 - a]);
    }
    return grid;
  }

  // For more groups: random simplex sampling
  const grid: number[][] = [];
  const rand = seededRandom('grid-' + numGroups);
  for (let i = 0; i < steps * 5; i++) {
    const raw = Array.from({ length: numGroups }, () => -Math.log(Math.max(rand(), 0.0001)));
    const total = raw.reduce((s, v) => s + v, 0);
    grid.push(raw.map((v) => v / total));
  }
  return grid;
}

/**
 * Run Monte Carlo allocation simulation.
 *
 * @param weights    - User's objective weights (from preference inference)
 * @param asymmetry  - The primary structural asymmetry to simulate
 * @param numRuns    - Number of MC simulations per allocation (default: 200)
 * @param seed       - Seed for reproducibility
 * @returns MonteCarloResult with optimal allocation and Pareto frontier
 */
export async function runMonteCarloAllocation(
  weights: ObjectiveWeights,
  asymmetry: StructuralAsymmetry | null,
  numRuns: number = 200,
  seed: string = 'mc-default',
): Promise<MonteCarloResult> {
  // Simulate computation delay
  await new Promise((r) => setTimeout(r, 600));

  const profiles = buildGroupProfiles(asymmetry);
  const numGroups = profiles.length;

  // Fairness weight factor: 0 to 1
  const fairnessWeight = weights.fairness / 100;
  const accuracyWeight = weights.accuracy / 100;

  // Generate allocation grid
  const allocationGrid = generateAllocationGrid(numGroups, 20);

  // For each allocation point, run MC simulations
  const results: {
    allocations: number[];
    avgOutcome: number;
    avgFairnessGap: number;
    score: number;            // combined objective score
  }[] = [];

  for (const alloc of allocationGrid) {
    const rand = seededRandom(seed + alloc.join('-'));
    let totalOutcome = 0;
    let totalGap = 0;

    for (let run = 0; run < numRuns; run++) {
      const { overallOutcome, fairnessGap } = simulateOutcome(alloc, profiles, rand);
      totalOutcome += overallOutcome;
      totalGap += fairnessGap;
    }

    const avgOutcome = totalOutcome / numRuns;
    const avgGap = totalGap / numRuns;

    // Combined score: weighted combination of outcome and fairness (lower gap = better)
    const score = accuracyWeight * avgOutcome + fairnessWeight * (1 - avgGap);

    results.push({
      allocations: alloc,
      avgOutcome,
      avgFairnessGap: avgGap,
      score,
    });
  }

  // Find optimal (highest combined score)
  results.sort((a, b) => b.score - a.score);
  const optimal = results[0];

  // Compute pure-efficiency baseline (equal allocation)
  const equalAlloc = Array(numGroups).fill(1 / numGroups);
  const equalRand = seededRandom(seed + 'equal');
  let equalOutcome = 0;
  for (let run = 0; run < numRuns; run++) {
    equalOutcome += simulateOutcome(equalAlloc, profiles, equalRand).overallOutcome;
  }
  equalOutcome /= numRuns;

  // Efficiency sacrifice: how much outcome we lose vs equal allocation
  const efficiencySacrifice = Math.max(0, (equalOutcome - optimal.avgOutcome) / equalOutcome * 100);

  // Fairness improvement: gap reduction vs equal allocation
  const equalGapRand = seededRandom(seed + 'equal-gap');
  let equalGap = 0;
  for (let run = 0; run < numRuns; run++) {
    equalGap += simulateOutcome(equalAlloc, profiles, equalGapRand).fairnessGap;
  }
  equalGap /= numRuns;
  const fairnessImprovement = equalGap > 0
    ? Math.max(0, (equalGap - optimal.avgFairnessGap) / equalGap * 100)
    : 0;

  // Build Pareto frontier: non-dominated points
  const sorted = [...results].sort((a, b) => b.avgOutcome - a.avgOutcome);
  const paretoFrontier: { outcome: number; fairnessGap: number; allocation: number }[] = [];
  let bestGapSoFar = Infinity;

  for (const r of sorted) {
    if (r.avgFairnessGap < bestGapSoFar) {
      bestGapSoFar = r.avgFairnessGap;
      // Use first group's allocation as the "allocation" metric (for 2-group: Group A's share)
      paretoFrontier.push({
        outcome: +r.avgOutcome.toFixed(4),
        fairnessGap: +r.avgFairnessGap.toFixed(4),
        allocation: +r.allocations[0].toFixed(3),
      });
    }
  }

  // Determine confidence based on number of runs and result stability
  const topScores = results.slice(0, 5).map((r) => r.score);
  const scoreVariance = topScores.length > 1
    ? topScores.reduce((s, v) => s + (v - topScores[0]) ** 2, 0) / topScores.length
    : 0;
  const confidence: MonteCarloResult['confidence'] =
    numRuns >= 500 && scoreVariance < 0.001 ? 'high'
    : numRuns >= 100 ? 'moderate'
    : 'low';

  // Build allocation arms with group names
  const optimalAllocation: AllocationArm[] = profiles.map((p, i) => ({
    groupName: p.name,
    allocation: +optimal.allocations[i].toFixed(3),
  }));

  return {
    totalRuns: numRuns * allocationGrid.length,
    optimalAllocation,
    expectedOutcome: +(optimal.avgOutcome * 100).toFixed(1),
    fairnessImprovement: +fairnessImprovement.toFixed(1),
    efficiencySacrifice: +efficiencySacrifice.toFixed(1),
    confidence,
    paretoFrontier,
  };
}
