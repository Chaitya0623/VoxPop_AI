// ============================================================
// VoxPop AI — Simulated AutoML Engine
// ============================================================
// Takes objective weights and produces a model configuration.
// FUTURE: Replace with a real AutoML pipeline (e.g., Auto-sklearn,
//         FLAML, H2O) while keeping the same interface.
// ============================================================

import { AutoMLResult, ModelType, ObjectiveWeights, Hyperparameters, ModelMetrics, PaperPrior } from '@/lib/types';
import { rankCandidateModels } from '@/lib/paperKnowledge';

/** Known dataset hints for model selection */
export type DatasetHint = 'compas' | 'adult-income' | 'german-credit' | 'generic';

/** Detect dataset hint from filename */
export function detectDatasetHint(fileName?: string): DatasetHint {
  if (!fileName) return 'generic';
  const lower = fileName.toLowerCase();
  if (lower.includes('compas') || lower.includes('recidivism')) return 'compas';
  if (lower.includes('adult') || lower.includes('census') || lower.includes('income')) return 'adult-income';
  if (lower.includes('german') || lower.includes('credit')) return 'german-credit';
  return 'generic';
}

/** Deterministic pseudo-random from a seed string */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return (h % 1000) / 1000;
  };
}

function selectModelType(
  weights: ObjectiveWeights,
  rand: () => number,
  hint: DatasetHint,
  paperPrior?: PaperPrior | null,
): ModelType {
  const { accuracy, fairness, robustness } = weights;

  if (paperPrior) {
    const hintBias: Record<ModelType, number> = {
      LogisticRegression: 0,
      RandomForest: 0,
      XGBoost: 0,
      GradientBoosting: 0,
      SVM: 0,
    };
    if (hint === 'compas' || hint === 'german-credit') {
      hintBias.LogisticRegression += 0.4;
      hintBias.RandomForest += 0.2;
    }
    if (hint === 'adult-income') {
      hintBias.XGBoost += 0.4;
      hintBias.GradientBoosting += 0.2;
    }

    const combinedScores: Record<ModelType, number> = {
      LogisticRegression: paperPrior.modelScores.LogisticRegression + hintBias.LogisticRegression,
      RandomForest: paperPrior.modelScores.RandomForest + hintBias.RandomForest,
      XGBoost: paperPrior.modelScores.XGBoost + hintBias.XGBoost,
      GradientBoosting: paperPrior.modelScores.GradientBoosting + hintBias.GradientBoosting,
      SVM: paperPrior.modelScores.SVM + hintBias.SVM,
    };

    const ranked = rankCandidateModels(weights, combinedScores);
    const preferred = ranked[0]?.model;
    if (preferred) return preferred;
  }

  // Dataset-specific model preferences
  if (hint === 'compas') {
    // Criminal justice: interpretability matters for legal defensibility
    if (fairness >= 50) return 'LogisticRegression'; // Interpretable, auditable
    if (accuracy >= 60) return rand() > 0.5 ? 'GradientBoosting' : 'RandomForest';
    return 'LogisticRegression'; // Default to interpretable for justice systems
  }

  if (hint === 'adult-income') {
    // Income prediction: tabular data, tree-based models excel
    if (accuracy >= 60) return rand() > 0.3 ? 'XGBoost' : 'GradientBoosting';
    if (fairness >= 50) return rand() > 0.4 ? 'LogisticRegression' : 'RandomForest';
    return 'RandomForest';
  }

  if (hint === 'german-credit') {
    // Credit scoring: regulatory requirements favor interpretable models
    if (fairness >= 50) return 'LogisticRegression'; // EU AI Act: interpretability required
    if (accuracy >= 60) return rand() > 0.5 ? 'XGBoost' : 'RandomForest';
    if (robustness >= 40) return 'RandomForest';
    return 'LogisticRegression'; // Default to interpretable for regulated domain
  }

  // Generic fallback
  if (accuracy >= 60) {
    return rand() > 0.4 ? 'XGBoost' : 'GradientBoosting';
  }
  if (fairness >= 50) {
    return rand() > 0.5 ? 'LogisticRegression' : 'SVM';
  }
  if (robustness >= 40) {
    return 'RandomForest';
  }
  return 'RandomForest';
}

function generateHyperparameters(
  modelType: ModelType,
  rand: () => number,
  weights?: ObjectiveWeights,
): Hyperparameters {
  const fairness = weights?.fairness || 0;
  const accuracy = weights?.accuracy || 0;
  switch (modelType) {
    case 'XGBoost':
      return {
        n_estimators: Math.round(100 + rand() * (accuracy > 60 ? 500 : 350)),
        max_depth: Math.round(3 + rand() * (fairness > 55 ? 4 : 8)),
        learning_rate: +(0.01 + rand() * (accuracy > 60 ? 0.22 : 0.16)).toFixed(3),
        subsample: +(0.6 + rand() * 0.4).toFixed(2),
        colsample_bytree: +(0.5 + rand() * 0.5).toFixed(2),
        reg_alpha: +(rand() * 1).toFixed(2),
        reg_lambda: +(rand() * 2).toFixed(2),
      };
    case 'GradientBoosting':
      return {
        n_estimators: Math.round(100 + rand() * (accuracy > 60 ? 350 : 250)),
        max_depth: Math.round(3 + rand() * (fairness > 55 ? 3 : 6)),
        learning_rate: +(0.01 + rand() * (accuracy > 60 ? 0.16 : 0.12)).toFixed(3),
        min_samples_split: Math.round(2 + rand() * (fairness > 55 ? 6 : 10)),
        min_samples_leaf: Math.round(1 + rand() * (fairness > 55 ? 5 : 4)),
      };
    case 'RandomForest':
      return {
        n_estimators: Math.round(100 + rand() * (accuracy > 60 ? 450 : 320)),
        max_depth: Math.round(5 + rand() * (fairness > 55 ? 10 : 16)),
        min_samples_split: Math.round(2 + rand() * (fairness > 55 ? 10 : 8)),
        min_samples_leaf: Math.round(1 + rand() * (fairness > 55 ? 6 : 4)),
        max_features: rand() > 0.5 ? 'sqrt' : 'log2',
        bootstrap: true,
      };
    case 'LogisticRegression':
      return {
        C: +(0.01 + rand() * (fairness > 55 ? 4.5 : 9.99)).toFixed(3),
        penalty: rand() > 0.5 ? 'l2' : 'l1',
        solver: 'saga',
        max_iter: Math.round(500 + rand() * 500),
        class_weight: 'balanced',
      };
    case 'SVM':
      return {
        C: +(0.1 + rand() * (fairness > 55 ? 4.5 : 9.9)).toFixed(3),
        kernel: rand() > 0.5 ? 'rbf' : 'linear',
        gamma: 'scale',
        class_weight: 'balanced',
      };
  }
}

function computeMetrics(weights: ObjectiveWeights, modelType: ModelType, rand: () => number): ModelMetrics {
  const { accuracy: aw, fairness: fw, robustness: rw } = weights;

  // Base metrics influenced by weights — higher weight → better metric
  const accuracyBase = 0.70 + (aw / 100) * 0.25;
  const fairnessBase = 0.50 + (fw / 100) * 0.45;
  const robustnessBase = 0.55 + (rw / 100) * 0.35;

  // Model-type bonuses
  const accBonus = ['XGBoost', 'GradientBoosting'].includes(modelType) ? 0.03 : 0;
  const fairBonus = ['LogisticRegression', 'SVM'].includes(modelType) ? 0.05 : 0;
  const robBonus = modelType === 'RandomForest' ? 0.04 : 0;
  const interpBonus = modelType === 'LogisticRegression' ? 0.20 : modelType === 'SVM' ? 0.10 : 0;

  // Add small randomness
  const noise = () => (rand() - 0.5) * 0.04;

  const accuracy = Math.min(0.99, Math.max(0.60, accuracyBase + accBonus + noise()));
  const fairnessScore = Math.min(0.99, Math.max(0.40, fairnessBase + fairBonus + noise()));
  const robustnessScore = Math.min(0.99, Math.max(0.45, robustnessBase + robBonus + noise()));
  const interpretabilityScore = Math.min(0.99, Math.max(0.30,
    0.40 + interpBonus + (1 - aw / 100) * 0.2 + noise()
  ));

  return {
    accuracy: +accuracy.toFixed(3),
    fairnessScore: +fairnessScore.toFixed(3),
    robustnessScore: +robustnessScore.toFixed(3),
    interpretabilityScore: +interpretabilityScore.toFixed(3),
  };
}

function computeCompositeScore(weights: ObjectiveWeights, metrics: ModelMetrics): number {
  const total = weights.accuracy + weights.fairness + weights.robustness;
  if (total === 0) return 0;
  const score =
    (weights.accuracy / total) * metrics.accuracy +
    (weights.fairness / total) * metrics.fairnessScore +
    (weights.robustness / total) * metrics.robustnessScore;
  return +score.toFixed(3);
}

/**
 * Run the simulated AutoML engine.
 *
 * @param weights     - Objective weighting (accuracy, fairness, robustness — each 0–100)
 * @param seed        - Optional seed for deterministic results
 * @param datasetHint - Optional dataset type for domain-aware model selection
 *
 * FUTURE: Replace with a real AutoML pipeline call.
 */
export async function runAutoML(
  weights: ObjectiveWeights,
  seed?: string,
  datasetHint?: DatasetHint,
  paperPrior?: PaperPrior | null,
): Promise<AutoMLResult> {
  // Simulate computation
  await new Promise((r) => setTimeout(r, 800));

  const seedStr = seed || `${weights.accuracy}-${weights.fairness}-${weights.robustness}`;
  const rand = seededRandom(seedStr);

  const hint = datasetHint || 'generic';
  const modelType = selectModelType(weights, rand, hint, paperPrior);
  const hyperparameters = generateHyperparameters(modelType, rand, paperPrior?.weights || weights);
  const metrics = computeMetrics(weights, modelType, rand);
  const compositeScore = computeCompositeScore(weights, metrics);

  return {
    modelType,
    hyperparameters,
    metrics,
    compositeScore,
  };
}
