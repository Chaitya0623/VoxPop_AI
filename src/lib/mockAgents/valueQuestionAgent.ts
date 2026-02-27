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
