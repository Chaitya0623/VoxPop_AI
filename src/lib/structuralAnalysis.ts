// ============================================================
// VoxPop AI — Structural Asymmetry Detection
// ============================================================
// Analyzes dataset rows to detect group-level structural barriers.
// Example: In a courtroom transportation dataset, Group B has 3x
// longer commute and lower income — a STRUCTURAL barrier, not a
// preference difference.
//
// FUTURE: Call /api/structural-analysis for LLM-enhanced interpretation.
// ============================================================

import {
  DatasetAnalysis,
  StructuralAsymmetry,
  GroupStats,
} from '@/lib/types';

/**
 * Identify numeric columns in the dataset (excluding the target).
 */
function getNumericColumns(
  analysis: DatasetAnalysis,
): string[] {
  return analysis.columns
    .filter((c) => c.type === 'numeric' && c.name !== analysis.targetColumn)
    .map((c) => c.name);
}

/**
 * Compute mean of a numeric array, ignoring NaN.
 */
function safeMean(values: number[]): number {
  const valid = values.filter((v) => !isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}

/**
 * Compute standard deviation of a numeric array.
 */
function safeStd(values: number[]): number {
  const valid = values.filter((v) => !isNaN(v));
  if (valid.length < 2) return 0;
  const mean = safeMean(valid);
  const variance = valid.reduce((s, v) => s + (v - mean) ** 2, 0) / valid.length;
  return Math.sqrt(variance);
}

/**
 * Detect structural asymmetries for each sensitive attribute in a dataset.
 *
 * For each sensitive attribute, groups the data rows, computes numeric
 * statistics per group, and identifies significant disparities.
 */
export function detectStructuralAsymmetries(
  analysis: DatasetAnalysis,
  rows: Record<string, string | number | boolean>[],
): StructuralAsymmetry[] {
  const sensitiveAttrs = analysis.sensitiveAttributes;
  if (sensitiveAttrs.length === 0) return [];

  const numericCols = getNumericColumns(analysis);
  const asymmetries: StructuralAsymmetry[] = [];

  for (const attr of sensitiveAttrs) {
    // Group rows by the sensitive attribute value
    const groups: Record<string, Record<string, string | number | boolean>[]> = {};
    for (const row of rows) {
      const groupKey = String(row[attr] ?? 'Unknown');
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(row);
    }

    const groupNames = Object.keys(groups);
    if (groupNames.length < 2 || groupNames.length > 10) continue; // skip if too few or too many groups

    // Compute per-group stats for each numeric column
    const groupStatsList: GroupStats[] = groupNames.map((name) => {
      const groupRows = groups[name];
      const metrics: Record<string, number> = {};
      for (const col of numericCols) {
        const values = groupRows.map((r) => Number(r[col])).filter((v) => !isNaN(v));
        metrics[col] = +safeMean(values).toFixed(3);
      }
      // Also compute target rate if target is binary-ish
      const targetValues = groupRows.map((r) => Number(r[analysis.targetColumn]));
      const validTargets = targetValues.filter((v) => !isNaN(v));
      if (validTargets.length > 0) {
        metrics[`${analysis.targetColumn}_rate`] = +(
          validTargets.filter((v) => v === 1).length / validTargets.length
        ).toFixed(3);
      }
      return { groupName: name, count: groupRows.length, metrics };
    });

    // Detect disparities: compare each numeric column across groups
    const disparities: string[] = [];
    let maxRatio = 1;

    for (const col of numericCols) {
      const values = groupStatsList.map((g) => g.metrics[col]).filter((v) => v !== undefined);
      if (values.length < 2) continue;

      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      if (minVal <= 0) continue; // skip if zero/negative (ratio undefined)

      const ratio = maxVal / minVal;
      if (ratio > 1.3) {
        // Find which groups
        const highGroup = groupStatsList.find((g) => g.metrics[col] === maxVal);
        const lowGroup = groupStatsList.find((g) => g.metrics[col] === minVal);
        if (highGroup && lowGroup) {
          disparities.push(
            `${highGroup.groupName} has ${ratio.toFixed(1)}x higher ${col} than ${lowGroup.groupName} (${maxVal.toFixed(1)} vs ${minVal.toFixed(1)})`
          );
          maxRatio = Math.max(maxRatio, ratio);
        }
      }
    }

    // Check target rate disparity
    const targetRateKey = `${analysis.targetColumn}_rate`;
    const targetRates = groupStatsList
      .map((g) => ({ name: g.groupName, rate: g.metrics[targetRateKey] }))
      .filter((g) => g.rate !== undefined);

    if (targetRates.length >= 2) {
      const rates = targetRates.map((g) => g.rate);
      const gap = Math.max(...rates) - Math.min(...rates);
      if (gap > 0.1) {
        const highGroup = targetRates.find((g) => g.rate === Math.max(...rates));
        const lowGroup = targetRates.find((g) => g.rate === Math.min(...rates));
        if (highGroup && lowGroup) {
          disparities.push(
            `${analysis.targetColumn} rate gap: ${highGroup.name} at ${(highGroup.rate * 100).toFixed(0)}% vs ${lowGroup.name} at ${(lowGroup.rate * 100).toFixed(0)}% (${(gap * 100).toFixed(0)}pp difference)`
          );
        }
      }
    }

    if (disparities.length === 0) continue;

    // Determine severity
    const severity: StructuralAsymmetry['severity'] =
      maxRatio > 2.5 || disparities.length >= 4
        ? 'high'
        : maxRatio > 1.6 || disparities.length >= 2
        ? 'moderate'
        : 'low';

    // Generate summary
    const summary = generateSummary(attr, groupStatsList, disparities, severity);

    asymmetries.push({
      attribute: attr,
      groups: groupStatsList,
      disparities,
      severity,
      summary,
    });
  }

  return asymmetries;
}

/**
 * Generate a plain-language summary of the structural asymmetry.
 */
function generateSummary(
  attribute: string,
  groups: GroupStats[],
  disparities: string[],
  severity: StructuralAsymmetry['severity'],
): string {
  const groupList = groups.map((g) => `${g.groupName} (n=${g.count})`).join(', ');
  const severityLabel = {
    low: 'minor',
    moderate: 'notable',
    high: 'significant',
  }[severity];

  return (
    `Analysis of "${attribute}" reveals ${severityLabel} structural differences across groups: ${groupList}. ` +
    `${disparities.length} disparity indicator${disparities.length > 1 ? 's' : ''} detected. ` +
    `These reflect structural conditions in the data, not necessarily individual preferences. ` +
    `Resource allocation decisions should account for these asymmetries.`
  );
}

/**
 * Dataset-specific asymmetry enrichment for known Kaggle datasets.
 * Provides richer, domain-aware disparity descriptions.
 */
export function enrichWithDatasetContext(
  asymmetries: StructuralAsymmetry[],
  fileName: string,
): StructuralAsymmetry[] {
  const lower = fileName.toLowerCase();

  if (lower.includes('compas') || lower.includes('recidivism')) {
    return asymmetries.map((a) => ({
      ...a,
      summary: a.summary + ' In criminal justice contexts, structural barriers compound across generations — higher policing in certain neighborhoods leads to higher arrest rates, which biases recidivism prediction models.',
    }));
  }

  if (lower.includes('adult') || lower.includes('census') || lower.includes('income')) {
    return asymmetries.map((a) => ({
      ...a,
      summary: a.summary + ' Historical employment discrimination creates persistent income gaps. Models trained on these patterns risk perpetuating systemic inequality.',
    }));
  }

  if (lower.includes('german') || lower.includes('credit')) {
    return asymmetries.map((a) => ({
      ...a,
      summary: a.summary + ' Credit scoring systems that reflect historical lending discrimination can deny opportunities to qualified applicants from underserved communities.',
    }));
  }

  return asymmetries;
}
