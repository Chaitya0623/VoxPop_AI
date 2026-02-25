// ============================================================
// VoxPop AI — Scenario Agent
// ============================================================
// Generates optimization philosophies based on dataset analysis.
// Uses OpenAI GPT when API key is available for dataset-specific
// scenarios; falls back to curated templates for known datasets
// and generic templates for custom uploads.
// ============================================================

import { DatasetAnalysis, Scenario } from '@/lib/types';

// ---- Dataset-specific scenario factories ----

function compasScenarios(analysis: DatasetAnalysis): Scenario[] {
  const sensitiveList = analysis.sensitiveAttributes.join(', ') || 'race, sex';
  return [
    {
      id: 'scenario-a',
      title: 'Maximum Accuracy Predictor',
      weights: { accuracy: 80, fairness: 10, robustness: 10 },
      narrative:
        `Optimize the recidivism predictor purely for accuracy on the "two_year_recid" target. The model uses all available features — including race and prior-contact variables — to maximize AUC. This mirrors the original COMPAS approach: effective at ranking risk, but known to produce false-positive rates for Black defendants that are nearly double those for white defendants.`,
      estimatedPerformance: 'AUC: ~0.96, Accuracy: ~93%, FPR gap (Black vs. White): ~18%',
      whoBenefits: 'Courts seeking the strongest predictive signal. Majority demographic groups whose patterns dominate training data.',
      whoMayLose: 'Black defendants falsely flagged as high-risk. Communities already over-policed. Public trust in the justice system.',
      tradeoffExplanation:
        `Peak accuracy comes at the cost of racial disparity in false-positive rates. ProPublica found exactly this pattern in the deployed COMPAS tool — the model is "right" overall but systematically wrong for Black defendants.`,
    },
    {
      id: 'scenario-b',
      title: 'Balanced Risk Assessment',
      weights: { accuracy: 50, fairness: 30, robustness: 20 },
      narrative:
        `Balance recidivism prediction accuracy with equalized false-positive rates across racial groups. The model applies calibration constraints so that a "high-risk" score means roughly the same probability of re-offense regardless of the defendant's race (${sensitiveList}). Some overall accuracy is sacrificed to close the racial FPR gap.`,
      estimatedPerformance: 'AUC: ~0.91, Accuracy: ~88%, FPR gap: <5%, Calibration error: <3%',
      whoBenefits: 'All defendants receiving more calibrated risk scores. Courts wanting defensible, auditable decisions. Civil liberties organizations.',
      whoMayLose: 'Some accuracy is lost in the majority group. Edge cases near the decision boundary are harder to classify.',
      tradeoffExplanation:
        'A pragmatic middle ground — sacrifices ~5% accuracy to dramatically reduce racial disparity in false-positive rates while maintaining strong overall AUC.',
    },
    {
      id: 'scenario-c',
      title: 'Equalized Justice Model',
      weights: { accuracy: 25, fairness: 55, robustness: 20 },
      narrative:
        `Enforce strict equalized odds across race and sex. The model is constrained so that true-positive and false-positive rates are nearly identical for Black and white defendants. Features correlated with race (e.g., neighborhood, prior police contact frequency) are down-weighted or removed. This prioritizes the principle that equal crimes should produce equal risk scores.`,
      estimatedPerformance: 'AUC: ~0.85, Accuracy: ~81%, FPR gap: <1%, Equalized odds violation: <2%',
      whoBenefits: `Defendants in protected groups (${sensitiveList}). Advocacy organizations. Judges seeking legally defensible AI recommendations.`,
      whoMayLose: 'Overall prediction accuracy drops ~12%. High-risk individuals in majority groups may receive lower scores than warranted.',
      tradeoffExplanation:
        `Strict equalized odds enforcement closes racial gaps almost entirely but reduces the model's ability to discriminate between true recidivists and non-recidivists in the overall population.`,
    },
  ];
}

function adultIncomeScenarios(analysis: DatasetAnalysis): Scenario[] {
  const sensitiveList = analysis.sensitiveAttributes.join(', ') || 'race, sex, marital_status';
  return [
    {
      id: 'scenario-a',
      title: 'Peak Earnings Predictor',
      weights: { accuracy: 80, fairness: 10, robustness: 10 },
      narrative:
        `Maximize prediction accuracy for the ">50K" income class. The model leverages all census features including gender, race, and marital status as strong predictive signals. This approach achieves the highest AUC but encodes historical wage gaps — women and minorities are predicted to earn less because they historically have, regardless of qualifications.`,
      estimatedPerformance: 'Accuracy: ~93%, AUC: ~0.97, F1: ~0.91, Gender parity gap: ~22%',
      whoBenefits: 'Organizations needing maximum predictive power for income estimation. Demographic groups that historically earn more (white males, married).',
      whoMayLose: 'Women, minorities, and single individuals — the model perpetuates wage gaps. Anyone screened out of loans, housing, or benefits by this prediction.',
      tradeoffExplanation:
        `Using gender and race directly boosts accuracy because they genuinely correlate with income — but that correlation reflects systemic discrimination, not individual merit. A lending model using this predictor would encode the wage gap.`,
    },
    {
      id: 'scenario-b',
      title: 'Bias-Aware Income Model',
      weights: { accuracy: 50, fairness: 30, robustness: 20 },
      narrative:
        `Balance income prediction accuracy with demographic parity across ${sensitiveList}. The model applies reweighting and adversarial debiasing so that prediction rates are more similar across genders and racial groups. Education and occupation remain strong features, but their interaction with protected attributes is regularized.`,
      estimatedPerformance: 'Accuracy: ~88%, AUC: ~0.93, F1: ~0.86, Demographic parity gap: <6%',
      whoBenefits: 'Broad stakeholder base. Organizations wanting reasonable accuracy without gender/race liability. HR and lending compliance teams.',
      whoMayLose: 'Slight accuracy drop for majority group. Some high-earning individuals in majority groups may be under-predicted.',
      tradeoffExplanation:
        'Sacrifices ~5% accuracy to shrink the gender prediction gap from ~22% to under 6%. A practical choice for any system where income predictions affect real-world access to resources.',
    },
    {
      id: 'scenario-c',
      title: 'Equal Opportunity Predictor',
      weights: { accuracy: 25, fairness: 55, robustness: 20 },
      narrative:
        `Enforce equal opportunity: the model must predict ">50K" at the same true-positive rate for men and women, and across racial groups. Gender-correlated features like marital status and hours-per-week are transformed to remove demographic signal. The model focuses on education level and occupation type as primary predictors.`,
      estimatedPerformance: 'Accuracy: ~82%, AUC: ~0.87, F1: ~0.79, Gender parity gap: <1%',
      whoBenefits: `Women and minorities who are equally qualified but historically underpaid. Regulators enforcing anti-discrimination law. Communities affected by automated screening.`,
      whoMayLose: 'Overall accuracy drops ~11%. Some high-income majority-group individuals may be misclassified.',
      tradeoffExplanation:
        `Strict equal opportunity constraints ensure that a qualified woman is just as likely to be predicted ">50K" as a qualified man — but the model loses the ability to exploit gender-correlated wage patterns for accuracy.`,
    },
  ];
}

function germanCreditScenarios(analysis: DatasetAnalysis): Scenario[] {
  const sensitiveList = analysis.sensitiveAttributes.join(', ') || 'sex, age';
  return [
    {
      id: 'scenario-a',
      title: 'Profit-Maximizing Lender',
      weights: { accuracy: 80, fairness: 10, robustness: 10 },
      narrative:
        `Maximize credit risk prediction accuracy to minimize bank losses. The model uses all features — including age, sex, and employment status — to identify the most likely defaulters. Young applicants and women are flagged as higher risk because they historically default more in this dataset. This maximizes profit but may violate EU AI Act requirements.`,
      estimatedPerformance: 'Accuracy: ~92%, AUC: ~0.95, Default detection rate: ~89%, Age parity gap: ~20%',
      whoBenefits: 'Banks minimizing default losses. Older male applicants with established credit history.',
      whoMayLose: 'Young applicants (under 30), women, and foreign workers systematically denied credit. Financial inclusion goals undermined.',
      tradeoffExplanation:
        `Peak accuracy in credit scoring correlates with demographic discrimination — age and sex are strong predictors precisely because of structural inequality in wealth accumulation. The EU AI Act classifies this as high-risk AI requiring fairness audits.`,
    },
    {
      id: 'scenario-b',
      title: 'Responsible Lending Model',
      weights: { accuracy: 50, fairness: 30, robustness: 20 },
      narrative:
        `Balance credit risk accuracy with fair treatment across ${sensitiveList}. The model applies fairness constraints so that approval rates are more equitable across age groups and genders. Financial behavior features (savings, credit history) remain primary predictors, but demographic proxies are regularized.`,
      estimatedPerformance: 'Accuracy: ~87%, AUC: ~0.92, Default detection: ~83%, Age parity gap: <6%',
      whoBenefits: 'Broader range of creditworthy applicants. Banks seeking EU AI Act compliance. Financial inclusion advocates.',
      whoMayLose: 'Some default risk increases (~2-3%) as borderline applicants from disadvantaged groups are approved. Bank profit margin slightly reduced.',
      tradeoffExplanation:
        'A ~5% accuracy drop closes the age-based approval gap from 20% to under 6%. This is the sweet spot for banks that want competitive lending while meeting regulatory fairness requirements.',
    },
    {
      id: 'scenario-c',
      title: 'Inclusive Credit Access',
      weights: { accuracy: 25, fairness: 55, robustness: 20 },
      narrative:
        `Enforce demographic parity in credit approvals across age, sex, and employment status. The model ensures that approval rates are nearly identical regardless of demographic group. Credit amount, duration, and purpose remain features, but age and sex are excluded, and their proxies are actively debiased.`,
      estimatedPerformance: 'Accuracy: ~80%, AUC: ~0.86, Default detection: ~75%, Age parity gap: <1%',
      whoBenefits: `Young applicants, women, and foreign workers who gain equal access to credit. Regulators enforcing the EU AI Act. Communities historically excluded from banking.`,
      whoMayLose: 'Bank default rates increase ~5-7%. Overall prediction accuracy drops ~12%. Profitable older-male segment slightly under-served.',
      tradeoffExplanation:
        `Strict demographic parity eliminates age and gender bias in approvals but significantly reduces the model's ability to predict defaults. Banks take on more risk in exchange for inclusive lending practices.`,
    },
  ];
}

function genericScenarios(analysis: DatasetAnalysis): Scenario[] {
  const sensitiveList = analysis.sensitiveAttributes.join(', ') || 'none detected';
  const task = analysis.taskType;
  const hasSensitive = analysis.sensitiveAttributes.length > 0;

  return [
    {
      id: 'scenario-a',
      title: 'Efficiency Maximizer',
      weights: { accuracy: 80, fairness: 10, robustness: 10 },
      narrative: `This strategy prioritizes raw predictive performance on the "${analysis.targetColumn}" ${task} task. The model is optimized almost exclusively for accuracy, using aggressive feature engineering and complex ensembles. Fairness constraints are minimal — the model may leverage correlations with sensitive attributes (${sensitiveList}) if they improve performance.`,
      estimatedPerformance: task === 'classification'
        ? 'Accuracy: ~94%, AUC: ~0.97, F1: ~0.92'
        : 'RMSE: ~0.12, R²: ~0.95, MAE: ~0.08',
      whoBenefits: 'Organizations seeking maximum predictive accuracy. Majority demographic groups whose patterns dominate training data.',
      whoMayLose: `Minority subgroups, especially those defined by ${sensitiveList}. Individuals whose profiles differ from the majority pattern.`,
      tradeoffExplanation: hasSensitive
        ? `High accuracy comes at the cost of potential disparate impact across ${sensitiveList}. The model may exhibit up to 15-20% performance gaps between subgroups.`
        : 'High accuracy with minimal fairness constraints. Potential for hidden proxy-variable biases.',
    },
    {
      id: 'scenario-b',
      title: 'Balanced Tradeoff',
      weights: { accuracy: 50, fairness: 30, robustness: 20 },
      narrative: `This strategy seeks a balanced approach to the "${analysis.targetColumn}" ${task} task. It applies moderate fairness constraints while maintaining competitive accuracy. The model is regularized for robustness and tested across demographic subgroups (${sensitiveList}).`,
      estimatedPerformance: task === 'classification'
        ? 'Accuracy: ~89%, AUC: ~0.93, F1: ~0.87, Demographic Parity Gap: <5%'
        : 'RMSE: ~0.18, R²: ~0.89, Subgroup RMSE Variance: <10%',
      whoBenefits: 'Broad stakeholder base. Organizations wanting reasonable accuracy without major fairness liabilities.',
      whoMayLose: 'Peak-performance seekers who need the absolute highest accuracy. Edge cases in all subgroups may still be misclassified.',
      tradeoffExplanation: 'A pragmatic middle ground — sacrifices ~5% accuracy for significantly improved fairness and robustness metrics. Suitable for most production deployments.',
    },
    {
      id: 'scenario-c',
      title: 'Fairness-Constrained Model',
      weights: { accuracy: 25, fairness: 55, robustness: 20 },
      narrative: `This strategy puts fairness at the center of the "${analysis.targetColumn}" ${task} task. Hard constraints ensure equalized odds across all sensitive attributes (${sensitiveList}). The model sacrifices predictive ceiling for equitable outcomes.`,
      estimatedPerformance: task === 'classification'
        ? 'Accuracy: ~82%, AUC: ~0.87, F1: ~0.80, Demographic Parity Gap: <1%'
        : 'RMSE: ~0.25, R²: ~0.80, Subgroup RMSE Variance: <2%',
      whoBenefits: `Underrepresented groups defined by ${sensitiveList}. Regulators and compliance teams. Communities affected by model decisions.`,
      whoMayLose: 'Overall prediction accuracy decreases. Organizations in competitive markets where marginal accuracy matters.',
      tradeoffExplanation: hasSensitive
        ? `Enforces strict demographic parity and equalized odds across ${sensitiveList}. Accuracy drops ~12% vs. unconstrained model, but fairness metrics improve dramatically.`
        : 'Applies conservative fairness priors even without detected sensitive attributes, guarding against proxy discrimination.',
    },
  ];
}

/**
 * Try to generate scenarios via the LLM API route.
 * Returns null if LLM is unavailable or fails.
 */
async function tryLLMScenarios(analysis: DatasetAnalysis): Promise<Scenario[] | null> {
  try {
    const res = await fetch('/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: analysis.fileName,
        taskType: analysis.taskType,
        targetColumn: analysis.targetColumn,
        sensitiveAttributes: analysis.sensitiveAttributes,
        problemStatement: analysis.problemStatement,
        riskLevel: analysis.riskAssessment.level,
        rowCount: analysis.rowCount,
        columnNames: analysis.columns.map((c) => c.name),
      }),
    });

    const result = await res.json();

    if (result.llmEnabled && result.scenarios && result.scenarios.length === 3) {
      // Validate and patch scenario structure
      return result.scenarios.map((s: Scenario) => ({
        id: s.id,
        title: s.title,
        weights: s.weights,
        narrative: s.narrative,
        estimatedPerformance: s.estimatedPerformance,
        whoBenefits: s.whoBenefits,
        whoMayLose: s.whoMayLose,
        tradeoffExplanation: s.tradeoffExplanation,
      }));
    }
  } catch {
    // LLM unavailable — fall through to template
  }
  return null;
}

/**
 * Generate 3 optimization scenarios given a dataset analysis.
 *
 * Attempts LLM generation first (if OPENAI_API_KEY is set),
 * then falls back to curated templates for known datasets,
 * then to generic templates.
 */
export async function generateScenarios(
  analysis: DatasetAnalysis,
): Promise<Scenario[]> {
  // Try LLM-powered generation first
  const llmScenarios = await tryLLMScenarios(analysis);
  if (llmScenarios) return llmScenarios;

  // Fall back to curated / generic templates
  const lower = analysis.fileName.toLowerCase();

  if (lower.includes('compas') || lower.includes('recidivism')) {
    return compasScenarios(analysis);
  }
  if (lower.includes('adult') || lower.includes('census') || lower.includes('income')) {
    return adultIncomeScenarios(analysis);
  }
  if (lower.includes('german') || lower.includes('credit')) {
    return germanCreditScenarios(analysis);
  }

  return genericScenarios(analysis);
}
