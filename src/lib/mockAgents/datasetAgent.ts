// ============================================================
// VoxPop AI — Dataset Agent
// ============================================================
// Analyzes uploaded datasets. Uses OpenAI GPT for risk
// assessment and problem statement when API key is available,
// falls back to heuristic analysis otherwise.
// ============================================================

import { DatasetAnalysis, DatasetColumn } from '@/lib/types';

/** Infer column type from sample values */
function inferColumnType(values: (string | number | boolean | null)[]): DatasetColumn['type'] {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'text';

  const allBool = nonNull.every(
    (v) => typeof v === 'boolean' || v === 'true' || v === 'false' || v === '0' || v === '1'
  );
  if (allBool && nonNull.length > 0) return 'boolean';

  const allNumeric = nonNull.every((v) => !isNaN(Number(v)));
  if (allNumeric) return 'numeric';

  // Simple date check
  const looksLikeDate = nonNull.every(
    (v) => typeof v === 'string' && !isNaN(Date.parse(v)) && v.includes('-')
  );
  if (looksLikeDate) return 'date';

  const uniqueRatio = new Set(nonNull.map(String)).size / nonNull.length;
  if (uniqueRatio < 0.3) return 'categorical';

  return 'text';
}

/** Known sensitive attribute name patterns */
const SENSITIVE_PATTERNS = [
  /gender/i, /sex/i, /race/i, /ethnicity/i, /age/i, /religion/i,
  /disability/i, /marital/i, /nation/i, /orient/i, /income/i,
  /zip/i, /postal/i, /color/i, /ancestry/i,
];

function detectSensitiveAttributes(columns: DatasetColumn[]): string[] {
  return columns
    .filter((col) => SENSITIVE_PATTERNS.some((p) => p.test(col.name)))
    .map((col) => col.name);
}

function detectTaskType(columns: DatasetColumn[], lastCol: DatasetColumn): 'classification' | 'regression' {
  if (lastCol.type === 'categorical' || lastCol.type === 'boolean') return 'classification';
  if (lastCol.type === 'numeric' && lastCol.unique <= 10) return 'classification';
  return 'regression';
}

function generateRiskAssessment(sensitive: string[], taskType: string) {
  if (sensitive.length === 0) {
    return {
      level: 'low' as const,
      summary: 'No obvious sensitive attributes detected.',
      details: [
        'No demographic columns found in the dataset.',
        'Standard ML pipeline can be applied.',
        'Consider proxy variable analysis for hidden biases.',
      ],
    };
  }
  if (sensitive.length <= 2) {
    return {
      level: 'medium' as const,
      summary: `Found ${sensitive.length} sensitive attribute(s): ${sensitive.join(', ')}.`,
      details: [
        `Sensitive columns detected: ${sensitive.join(', ')}.`,
        `${taskType === 'classification' ? 'Classification' : 'Regression'} tasks with sensitive features require fairness constraints.`,
        'Recommend fairness-aware model selection.',
        'Disparate impact analysis recommended before deployment.',
      ],
    };
  }
  return {
    level: 'high' as const,
    summary: `Multiple sensitive attributes detected (${sensitive.length}): ${sensitive.join(', ')}.`,
    details: [
      `High-risk dataset with ${sensitive.length} sensitive columns.`,
      'Strong fairness constraints required.',
      'Intersectional bias analysis recommended.',
      'Consider regulatory compliance (e.g., EEOC, GDPR).',
      'Mandatory human oversight before deployment.',
    ],
  };
}

/** Generate a human-readable problem statement for the dataset */
function generateProblemStatement(
  fileName: string,
  targetColumn: string,
  taskType: 'classification' | 'regression',
  sensitiveAttributes: string[],
): string {
  const sensitiveList = sensitiveAttributes.length > 0
    ? sensitiveAttributes.join(', ')
    : 'none detected';

  // Dataset-specific statements for known sample datasets
  const lower = fileName.toLowerCase();
  if (lower.includes('compas') || lower.includes('recidivism')) {
    return 'Predict whether a criminal defendant will re-offend within two years. The challenge: build a recidivism prediction model that is accurate enough to inform judicial decisions without systematically discriminating against Black defendants, who are historically flagged as high-risk at nearly double the false-positive rate of white defendants.';
  }
  if (lower.includes('adult') || lower.includes('census') || lower.includes('income')) {
    return 'Predict whether an individual earns more than $50K per year based on census attributes like education, occupation, and work hours. The challenge: historical wage data reflects systemic gender and racial pay gaps — a high-accuracy model risks encoding and perpetuating these disparities in automated hiring, lending, or benefit eligibility systems.';
  }
  if (lower.includes('german') || lower.includes('credit')) {
    return 'Classify bank loan applicants as good or bad credit risk based on financial history, employment, and demographics. The challenge: an accuracy-optimized model may systematically deny credit to younger applicants, women, and foreign workers — the EU AI Act now classifies credit scoring as high-risk AI requiring mandatory fairness audits.';
  }

  // Generic fallback for user-uploaded datasets
  return `${taskType === 'classification' ? 'Classify' : 'Predict'} the "${targetColumn}" outcome using the available features. The dataset contains sensitive attributes (${sensitiveList}) that may introduce bias — the core challenge is finding a model that balances predictive performance with equitable outcomes across demographic groups.`;
}

/**
 * Analyze an uploaded dataset.
 *
 * If the OPENAI_API_KEY is set, the risk assessment, problem statement,
 * and sensitive attribute detection are enhanced by GPT. Otherwise,
 * falls back to heuristic analysis.
 */
export async function analyzeDataset(
  fileName: string,
  rows: Record<string, string | number | boolean>[],
): Promise<DatasetAnalysis> {
  if (rows.length === 0) {
    throw new Error('Dataset is empty.');
  }

  const columnNames = Object.keys(rows[0]);

  const columns: DatasetColumn[] = columnNames.map((name) => {
    const values = rows.map((r) => r[name]);
    const type = inferColumnType(values);
    const uniqueSet = new Set(values.map(String));
    const missing = values.filter((v) => v === null || v === undefined || v === '').length;
    return {
      name,
      type,
      unique: uniqueSet.size,
      missing,
      sample: values.slice(0, 3).map(String),
    };
  });

  const lastCol = columns[columns.length - 1];
  const heuristicSensitive = detectSensitiveAttributes(columns);
  const taskType = detectTaskType(columns, lastCol);

  // Default heuristic results
  let sensitiveAttributes = heuristicSensitive;
  let problemStatement = generateProblemStatement(fileName, lastCol.name, taskType, sensitiveAttributes);
  let riskAssessment = generateRiskAssessment(sensitiveAttributes, taskType);
  let suggestedTradeoffs = [
    'Accuracy vs. Demographic Parity',
    'Model Complexity vs. Interpretability',
    'Performance vs. Robustness to Distribution Shift',
    'Individual Fairness vs. Group Fairness',
  ];

  // Try LLM enhancement
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        columns: columns.map((c) => ({ name: c.name, type: c.type, unique: c.unique, missing: c.missing })),
        sampleRows: rows.slice(0, 5),
        rowCount: rows.length,
        columnCount: columns.length,
        taskType,
        targetColumn: lastCol.name,
        sensitiveAttributes: heuristicSensitive,
      }),
    });

    const llmResult = await res.json();

    if (llmResult.llmEnabled) {
      if (llmResult.problemStatement) problemStatement = llmResult.problemStatement;
      if (llmResult.riskAssessment) riskAssessment = llmResult.riskAssessment;
      if (llmResult.suggestedTradeoffs) suggestedTradeoffs = llmResult.suggestedTradeoffs;
      if (llmResult.sensitiveAttributes && llmResult.sensitiveAttributes.length > 0) {
        // Merge LLM-detected sensitive attributes with heuristic ones
        const merged = new Set([...heuristicSensitive, ...llmResult.sensitiveAttributes]);
        // Only keep attributes that actually exist as columns
        sensitiveAttributes = [...merged].filter((a) => columnNames.includes(a));
      }
    }
  } catch {
    // LLM unavailable — silently use heuristic fallback
  }

  return {
    fileName,
    rowCount: rows.length,
    columnCount: columns.length,
    columns,
    taskType,
    targetColumn: lastCol.name,
    sensitiveAttributes,
    problemStatement,
    riskAssessment,
    suggestedTradeoffs,
    previewRows: rows.slice(0, 5),
  };
}
