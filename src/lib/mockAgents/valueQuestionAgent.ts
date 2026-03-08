// ============================================================
// VoxPop AI — Value Question Agent
// ============================================================
// Generates contextual, value-based survey questions from the
// structural asymmetries detected in the dataset.
//
// Instead of "How much do you value fairness?" (abstract), generates:
// "If one group faces 3x higher structural barriers, should they
//  receive proportionally more support?" (concrete, contextual)
//
// LLM Enhancement: Calls /api/value-questions for GPT-generated
// questions when available. Falls back to template questions.
// ============================================================

import {
  DatasetAnalysis,
  DatasetDecision,
  StructuralAsymmetry,
  ValueQuestion,
} from '@/lib/types';

// ---- LLM-Enhanced Generation ----

async function tryLLMQuestions(
  analysis: DatasetAnalysis,
  asymmetries: StructuralAsymmetry[],
): Promise<ValueQuestion[] | null> {
  try {
    const res = await fetch('/api/value-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: analysis.fileName,
        problemStatement: analysis.problemStatement,
        sensitiveAttributes: analysis.sensitiveAttributes,
        asymmetries: asymmetries.map((a) => ({
          attribute: a.attribute,
          severity: a.severity,
          disparities: a.disparities,
          summary: a.summary,
        })),
      }),
    });

    const data = await res.json();
    if (!data.llmEnabled || !data.questions) return null;

    return data.questions.map((q: ValueQuestion) => ({
      id: q.id,
      question: q.question,
      type: q.type === 'binary' ? 'binary' : 'likert',
      mapsTo: ['accuracy', 'fairness', 'robustness'].includes(q.mapsTo)
        ? q.mapsTo
        : 'fairness',
      weight: typeof q.weight === 'number' ? q.weight : 1.0,
      relatedAsymmetry: q.relatedAsymmetry || undefined,
    }));
  } catch {
    return null;
  }
}

// ---- Template Questions (Dataset-Specific) ----

function compasQuestions(asymmetries: StructuralAsymmetry[]): ValueQuestion[] {
  const raceAsym = asymmetries.find((a) => a.attribute.match(/race|ethnic/i));
  const disparity = raceAsym?.disparities[0] || 'different racial groups show different recidivism prediction rates';

  return [
    {
      id: 'vq-1',
      question: `The data shows that ${disparity}. Should the prediction model apply different thresholds for different groups to equalize false positive rates?`,
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.2,
      relatedAsymmetry: raceAsym?.attribute,
    },
    {
      id: 'vq-2',
      question: 'If adjusting for fairness means some higher-risk individuals receive lower scores, is that an acceptable tradeoff to reduce racial disparities?',
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.0,
    },
    {
      id: 'vq-3',
      question: 'Should the model prioritize correctly identifying people who will NOT reoffend, even if it means occasionally missing someone who will?',
      type: 'likert',
      mapsTo: 'accuracy',
      weight: 1.0,
    },
    {
      id: 'vq-4',
      question: 'Is it more important that the model performs consistently across all demographic groups, or that it achieves the highest overall accuracy?',
      type: 'binary',
      mapsTo: 'robustness',
      weight: 1.0,
    },
    {
      id: 'vq-5',
      question: 'Historical policing patterns may bias arrest data. Should the model attempt to correct for historically over-policed neighborhoods?',
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.3,
    },
  ];
}

function adultIncomeQuestions(asymmetries: StructuralAsymmetry[]): ValueQuestion[] {
  const genderAsym = asymmetries.find((a) => a.attribute.match(/sex|gender/i));
  const raceAsym = asymmetries.find((a) => a.attribute.match(/race|ethnic/i));
  const disparity = genderAsym?.disparities[0] || raceAsym?.disparities[0] || 'certain demographic groups earn significantly less';

  return [
    {
      id: 'vq-1',
      question: `The data shows ${disparity}. If a model learns these patterns, should it be constrained to predict equal income probability across groups?`,
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.2,
      relatedAsymmetry: genderAsym?.attribute || raceAsym?.attribute,
    },
    {
      id: 'vq-2',
      question: 'If historical income data reflects systemic discrimination, should the model be trained to predict what income SHOULD be (without discrimination) rather than what it IS?',
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.1,
    },
    {
      id: 'vq-3',
      question: 'Should a lending algorithm that uses this data prioritize accurately predicting repayment ability, even if that perpetuates existing income gaps?',
      type: 'likert',
      mapsTo: 'accuracy',
      weight: 1.0,
    },
    {
      id: 'vq-4',
      question: 'Would you accept a 5% decrease in overall prediction accuracy if it meant the model treated all demographic groups equally?',
      type: 'binary',
      mapsTo: 'fairness',
      weight: 1.0,
    },
    {
      id: 'vq-5',
      question: 'Should the model perform equally well in both urban high-data areas and rural low-data areas, even at the cost of peak performance?',
      type: 'likert',
      mapsTo: 'robustness',
      weight: 1.0,
    },
  ];
}

function germanCreditQuestions(asymmetries: StructuralAsymmetry[]): ValueQuestion[] {
  const ageAsym = asymmetries.find((a) => a.attribute.match(/age/i));
  const genderAsym = asymmetries.find((a) => a.attribute.match(/sex|gender/i));
  const disparity = ageAsym?.disparities[0] || genderAsym?.disparities[0] || 'certain groups have systematically different credit outcomes';

  return [
    {
      id: 'vq-1',
      question: `The data shows ${disparity}. Under EU regulations, should credit models be required to produce similar approval rates across demographic groups?`,
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.2,
      relatedAsymmetry: ageAsym?.attribute || genderAsym?.attribute,
    },
    {
      id: 'vq-2',
      question: 'If young applicants have less credit history but similar default rates after approval, should the model adjust for lack-of-data bias against younger applicants?',
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.0,
    },
    {
      id: 'vq-3',
      question: 'Should the bank use the most accurate model possible even if regulators cannot easily explain why certain applicants were rejected?',
      type: 'binary',
      mapsTo: 'accuracy',
      weight: 1.0,
    },
    {
      id: 'vq-4',
      question: 'Should the model be tested across different economic conditions (recession, boom) to ensure stable predictions, even if this reduces accuracy during good times?',
      type: 'likert',
      mapsTo: 'robustness',
      weight: 1.1,
    },
    {
      id: 'vq-5',
      question: 'If historical lending data shows bias against foreign workers, should the model exclude nationality-correlated features entirely?',
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.0,
    },
  ];
}

function genericQuestions(asymmetries: StructuralAsymmetry[]): ValueQuestion[] {
  const primaryAsym = asymmetries[0];
  const disparity = primaryAsym?.disparities[0] || 'different groups in the data show different outcome rates';

  return [
    {
      id: 'vq-1',
      question: `The data reveals that ${disparity}. If one group faces higher structural barriers, should they receive proportionally more support or adjusted thresholds?`,
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.2,
      relatedAsymmetry: primaryAsym?.attribute,
    },
    {
      id: 'vq-2',
      question: 'Should the system optimize for the best overall outcome, even if some groups benefit significantly more than others?',
      type: 'likert',
      mapsTo: 'accuracy',
      weight: 1.0,
    },
    {
      id: 'vq-3',
      question: 'If addressing structural inequality requires accepting lower overall performance, what level of sacrifice is acceptable?',
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.0,
    },
    {
      id: 'vq-4',
      question: 'Is it more important that the system works consistently for everyone, or that it achieves the best possible results on average?',
      type: 'binary',
      mapsTo: 'robustness',
      weight: 1.0,
    },
    {
      id: 'vq-5',
      question: 'Should resource allocation decisions account for historical disadvantages, even if current data does not directly measure them?',
      type: 'likert',
      mapsTo: 'fairness',
      weight: 1.1,
    },
  ];
}

/**
 * Detect which dataset template to use.
 */
function detectTemplate(fileName: string): 'compas' | 'adult-income' | 'german-credit' | 'generic' {
  const lower = fileName.toLowerCase();
  if (lower.includes('compas') || lower.includes('recidivism')) return 'compas';
  if (lower.includes('adult') || lower.includes('census') || lower.includes('income')) return 'adult-income';
  if (lower.includes('german') || lower.includes('credit')) return 'german-credit';
  return 'generic';
}

// ---- Decision-Specific Question Templates ----

function compasBailQuestions(asymmetries: StructuralAsymmetry[]): ValueQuestion[] {
  const raceAsym = asymmetries.find((a) => a.attribute.match(/race|ethnic/i));
  const disparity = raceAsym?.disparities[0] || 'bail amounts vary significantly across racial groups';
  return [
    { id: 'vq-1', question: `The data shows ${disparity}. Should bail amounts be adjusted to account for defendants' economic circumstances, even if risk scores suggest higher amounts?`, type: 'likert', mapsTo: 'fairness', weight: 1.2, relatedAsymmetry: raceAsym?.attribute },
    { id: 'vq-2', question: 'Should a bail algorithm factor in a defendant\'s ability to pay, or only their flight risk and public safety risk?', type: 'likert', mapsTo: 'fairness', weight: 1.1 },
    { id: 'vq-3', question: 'If cash bail disproportionately jails low-income defendants pre-trial, should the model recommend non-monetary alternatives (GPS monitoring, check-ins) more aggressively?', type: 'likert', mapsTo: 'fairness', weight: 1.3 },
    { id: 'vq-4', question: 'Should the system optimize for minimizing pre-trial detention rates, even if it means slightly higher failure-to-appear rates?', type: 'binary', mapsTo: 'accuracy', weight: 1.0 },
    { id: 'vq-5', question: 'Is it acceptable for a bail algorithm to use neighborhood data as a proxy for risk, knowing that policing patterns make certain neighborhoods appear riskier?', type: 'likert', mapsTo: 'robustness', weight: 1.0 },
  ];
}

function compasRehabQuestions(asymmetries: StructuralAsymmetry[]): ValueQuestion[] {
  const raceAsym = asymmetries.find((a) => a.attribute.match(/race|ethnic/i));
  const disparity = raceAsym?.disparities[0] || 'rehabilitation program access varies across groups';
  return [
    { id: 'vq-1', question: `The data shows ${disparity}. Should defendants from over-policed communities receive priority access to rehabilitation programs to counteract systemic bias?`, type: 'likert', mapsTo: 'fairness', weight: 1.3, relatedAsymmetry: raceAsym?.attribute },
    { id: 'vq-2', question: 'If a model predicts higher recidivism for a group, should that group get MORE rehabilitation resources (to reduce reoffending) or FEWER (as they seem less likely to benefit)?', type: 'likert', mapsTo: 'fairness', weight: 1.2 },
    { id: 'vq-3', question: 'Should the model prioritize assigning programs to those most likely to succeed, or to those with the greatest need regardless of predicted success?', type: 'likert', mapsTo: 'accuracy', weight: 1.0 },
    { id: 'vq-4', question: 'Is it more important that rehabilitation reduces overall recidivism rates, or that it reduces racial disparities in incarceration?', type: 'binary', mapsTo: 'fairness', weight: 1.1 },
    { id: 'vq-5', question: 'Should a rehabilitation assignment model be required to produce demographically balanced cohorts, even if the "optimal" cohort would be skewed?', type: 'likert', mapsTo: 'robustness', weight: 1.0 },
  ];
}

function adultJobPlacementQuestions(asymmetries: StructuralAsymmetry[]): ValueQuestion[] {
  const genderAsym = asymmetries.find((a) => a.attribute.match(/sex|gender/i));
  const disparity = genderAsym?.disparities[0] || 'occupational distribution varies significantly by gender';
  return [
    { id: 'vq-1', question: `The data shows ${disparity}. If a job placement model learns from historical data, should it actively recommend women for roles they\'ve been historically underrepresented in?`, type: 'likert', mapsTo: 'fairness', weight: 1.2, relatedAsymmetry: genderAsym?.attribute },
    { id: 'vq-2', question: 'Should the model recommend jobs based solely on predicted fit (skills, education), or also consider breaking historical occupational segregation?', type: 'likert', mapsTo: 'fairness', weight: 1.1 },
    { id: 'vq-3', question: 'If recommending a non-traditional career path has a higher variance in success, should the model still suggest it to promote diversity?', type: 'likert', mapsTo: 'robustness', weight: 1.0 },
    { id: 'vq-4', question: 'Should a job placement algorithm optimize for the candidate\'s expected salary, or for their predicted job satisfaction?', type: 'binary', mapsTo: 'accuracy', weight: 1.0 },
    { id: 'vq-5', question: 'If certain racial groups are underrepresented in high-paying fields due to educational access gaps, should the model adjust recommendations upward for those groups?', type: 'likert', mapsTo: 'fairness', weight: 1.3 },
  ];
}

function adultBenefitQuestions(asymmetries: StructuralAsymmetry[]): ValueQuestion[] {
  const raceAsym = asymmetries.find((a) => a.attribute.match(/race|ethnic/i));
  const genderAsym = asymmetries.find((a) => a.attribute.match(/sex|gender/i));
  const disparity = raceAsym?.disparities[0] || genderAsym?.disparities[0] || 'false denial rates differ across demographic groups';
  return [
    { id: 'vq-1', question: `The data shows ${disparity}. If a benefit screening model has higher false-denial rates for minorities, should it use looser thresholds for those groups?`, type: 'likert', mapsTo: 'fairness', weight: 1.2, relatedAsymmetry: raceAsym?.attribute || genderAsym?.attribute },
    { id: 'vq-2', question: 'Is it worse to incorrectly DENY benefits to someone who qualifies, or to incorrectly GRANT benefits to someone who doesn\'t?', type: 'likert', mapsTo: 'accuracy', weight: 1.1 },
    { id: 'vq-3', question: 'Should the model factor in systemic barriers (childcare costs, transportation access) that make it harder for some groups to demonstrate eligibility?', type: 'likert', mapsTo: 'fairness', weight: 1.3 },
    { id: 'vq-4', question: 'Should benefit eligibility be based on a single income threshold, or should it consider local cost-of-living differences?', type: 'binary', mapsTo: 'robustness', weight: 1.0 },
    { id: 'vq-5', question: 'If automated screening saves administrative costs but increases error rates for certain groups, should humans review all borderline cases from disadvantaged populations?', type: 'likert', mapsTo: 'fairness', weight: 1.0 },
  ];
}

function germanLoanAmountQuestions(asymmetries: StructuralAsymmetry[]): ValueQuestion[] {
  const ageAsym = asymmetries.find((a) => a.attribute.match(/age/i));
  const genderAsym = asymmetries.find((a) => a.attribute.match(/sex|gender/i));
  const disparity = genderAsym?.disparities[0] || ageAsym?.disparities[0] || 'recommended loan amounts differ across demographic groups';
  return [
    { id: 'vq-1', question: `The data shows ${disparity}. If women historically receive smaller loans despite similar financial profiles, should the model override that pattern?`, type: 'likert', mapsTo: 'fairness', weight: 1.2, relatedAsymmetry: genderAsym?.attribute || ageAsym?.attribute },
    { id: 'vq-2', question: 'Should young first-time borrowers receive loan amounts based on projected earning potential, or only on current financial history?', type: 'likert', mapsTo: 'fairness', weight: 1.0 },
    { id: 'vq-3', question: 'Is it better to cap loan amounts conservatively (fewer defaults but less financial inclusion) or recommend higher amounts (more defaults but greater opportunity)?', type: 'likert', mapsTo: 'accuracy', weight: 1.1 },
    { id: 'vq-4', question: 'Should the model use the same loan amount formula across all demographics, or allow group-specific adjustments?', type: 'binary', mapsTo: 'robustness', weight: 1.0 },
    { id: 'vq-5', question: 'If a model recommends lower amounts for single parents (who have higher expenses), is that a fair risk assessment or discriminatory?', type: 'likert', mapsTo: 'fairness', weight: 1.3 },
  ];
}

function germanInterestRateQuestions(asymmetries: StructuralAsymmetry[]): ValueQuestion[] {
  const ageAsym = asymmetries.find((a) => a.attribute.match(/age/i));
  const genderAsym = asymmetries.find((a) => a.attribute.match(/sex|gender/i));
  const disparity = ageAsym?.disparities[0] || genderAsym?.disparities[0] || 'risk-based pricing produces different rates across groups';
  return [
    { id: 'vq-1', question: `The data shows ${disparity}. If risk-based pricing results in systematically higher rates for women, should the bank use a single rate for all applicants in the same risk tier?`, type: 'likert', mapsTo: 'fairness', weight: 1.2, relatedAsymmetry: ageAsym?.attribute || genderAsym?.attribute },
    { id: 'vq-2', question: 'Should interest rates be fully transparent and explainable to the customer, even if that constrains the model to simpler (less accurate) algorithms?', type: 'likert', mapsTo: 'robustness', weight: 1.1 },
    { id: 'vq-3', question: 'If younger borrowers pay higher rates due to less credit history, should the bank offer a "first-time borrower" rate to level the playing field?', type: 'likert', mapsTo: 'fairness', weight: 1.0 },
    { id: 'vq-4', question: 'Should the model optimize for the bank\'s profit margin, or for minimizing the number of borrowers who fall into financial hardship?', type: 'binary', mapsTo: 'accuracy', weight: 1.0 },
    { id: 'vq-5', question: 'Under EU AI Act regulations, should all customers in the same credit-score band receive identical rates regardless of demographics?', type: 'likert', mapsTo: 'fairness', weight: 1.3 },
  ];
}

/** Map decision IDs to their question generators */
const DECISION_QUESTION_MAP: Record<string, (asym: StructuralAsymmetry[]) => ValueQuestion[]> = {
  'compas-bail': compasBailQuestions,
  'compas-rehab': compasRehabQuestions,
  'adult-job-placement': adultJobPlacementQuestions,
  'adult-benefit-eligibility': adultBenefitQuestions,
  'german-loan-amount': germanLoanAmountQuestions,
  'german-interest-rate': germanInterestRateQuestions,
};

/**
 * Generate contextual value-based survey questions.
 *
 * @param analysis    - The dataset analysis
 * @param asymmetries - Detected structural asymmetries
 * @returns Array of 5 contextual value questions
 */
export async function generateValueQuestions(
  analysis: DatasetAnalysis,
  asymmetries: StructuralAsymmetry[],
): Promise<ValueQuestion[]> {
  // Try LLM-enhanced generation first
  const llmQuestions = await tryLLMQuestions(analysis, asymmetries);
  if (llmQuestions && llmQuestions.length >= 3) {
    return llmQuestions;
  }

  // Check for decision-specific question templates
  const decisionId = analysis.activeDecision?.id;
  if (decisionId && DECISION_QUESTION_MAP[decisionId]) {
    return DECISION_QUESTION_MAP[decisionId](asymmetries);
  }

  // Fall back to dataset-specific templates
  const template = detectTemplate(analysis.fileName);

  switch (template) {
    case 'compas':
      return compasQuestions(asymmetries);
    case 'adult-income':
      return adultIncomeQuestions(asymmetries);
    case 'german-credit':
      return germanCreditQuestions(asymmetries);
    default:
      return genericQuestions(asymmetries);
  }
}
