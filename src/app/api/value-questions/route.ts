// ============================================================
// VoxPop AI — /api/value-questions  (POST)
// ============================================================
// Generates contextual value questions using OpenAI GPT based on
// detected structural asymmetries. Falls back to template questions
// if no API key is set.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, isLLMEnabled } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, problemStatement, sensitiveAttributes, asymmetries } = body;

    if (!isLLMEnabled()) {
      return NextResponse.json({ llmEnabled: false });
    }

    const client = getOpenAIClient()!;

    const asymmetryText = asymmetries
      .map(
        (a: { attribute: string; severity: string; disparities: string[] }) =>
          `  - Attribute: "${a.attribute}" (severity: ${a.severity})\n    Disparities: ${a.disparities.join('; ')}`
      )
      .join('\n');

    const prompt = `You are an AI ethics advisor generating contextual value-based survey questions.

## Context
- **Dataset**: ${fileName}
- **Problem**: ${problemStatement}
- **Sensitive attributes**: ${sensitiveAttributes.join(', ')}

## Detected Structural Asymmetries
${asymmetryText || 'No specific asymmetries detected.'}

Generate 5 contextual value questions that help determine a person's fairness vs efficiency preferences.

CRITICAL RULES:
- Questions must reference SPECIFIC findings from the asymmetries above
- Do NOT ask abstract questions like "How important is fairness?"
- DO ask concrete questions like "Given that Group B faces 3x higher barriers, should they receive proportionally more support?"
- Each question should clearly map to either 'accuracy', 'fairness', or 'robustness'
- Mix binary (yes/no) and likert (1-5 scale) question types
- Include 2-3 fairness questions, 1-2 accuracy questions, and 1 robustness question

Respond with ONLY valid JSON (no markdown):
{
  "questions": [
    {
      "id": "vq-1",
      "question": "The question text referencing specific structural findings",
      "type": "likert" | "binary",
      "mapsTo": "accuracy" | "fairness" | "robustness",
      "weight": 1.0,
      "relatedAsymmetry": "the attribute name this relates to"
    }
  ]
}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ llmEnabled: false });
    }

    const parsed = JSON.parse(content);
    return NextResponse.json({ llmEnabled: true, ...parsed });
  } catch (error) {
    console.error('[/api/value-questions]', error);
    return NextResponse.json({ llmEnabled: false, error: 'LLM call failed' });
  }
}
