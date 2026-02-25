// ============================================================
// VoxPop AI — /api/scenarios  (POST)
// ============================================================
// Generates 3 optimization scenarios using OpenAI GPT, tailored
// to the specific dataset. Falls back to template scenarios if
// no API key is set.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, isLLMEnabled } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, taskType, targetColumn, sensitiveAttributes, problemStatement, riskLevel, rowCount, columnNames } = body;

    if (!isLLMEnabled()) {
      return NextResponse.json({ llmEnabled: false });
    }

    const client = getOpenAIClient()!;

    const prompt = `You are an AI fairness expert generating optimization scenarios for an ML alignment platform.

## Dataset Context
- **File**: ${fileName}
- **Task**: ${taskType} on target "${targetColumn}"
- **Rows**: ${rowCount}
- **Columns**: ${columnNames.join(', ')}
- **Sensitive attributes**: ${sensitiveAttributes.join(', ') || 'none'}
- **Problem**: ${problemStatement}
- **Risk level**: ${riskLevel}

Generate exactly 3 optimization scenarios that represent different philosophical approaches to this specific ML problem. Each scenario must be deeply specific to THIS dataset — reference actual column names, known biases, real-world implications.

Scenario A: Maximize accuracy (weights: accuracy=80, fairness=10, robustness=10)
Scenario B: Balanced tradeoff (weights: accuracy=50, fairness=30, robustness=20)
Scenario C: Fairness-first (weights: accuracy=25, fairness=55, robustness=20)

Respond with ONLY valid JSON (no markdown):
{
  "scenarios": [
    {
      "id": "scenario-a",
      "title": "Short title (2-4 words, specific to domain)",
      "weights": { "accuracy": 80, "fairness": 10, "robustness": 10 },
      "narrative": "2-3 sentences explaining this approach for THIS specific dataset. Reference specific columns, known biases, and real-world consequences.",
      "estimatedPerformance": "Realistic metrics string like 'Accuracy: ~93%, AUC: ~0.96, FPR gap: ~18%'",
      "whoBenefits": "Who specifically benefits from this approach in this domain",
      "whoMayLose": "Who specifically is harmed or disadvantaged",
      "tradeoffExplanation": "1-2 sentences on the core tradeoff, specific to this dataset"
    },
    { "id": "scenario-b", ... },
    { "id": "scenario-c", ... }
  ]
}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ llmEnabled: false });
    }

    const parsed = JSON.parse(content);
    return NextResponse.json({ llmEnabled: true, ...parsed });
  } catch (error) {
    console.error('[/api/scenarios]', error);
    return NextResponse.json({ llmEnabled: false, error: 'LLM call failed' });
  }
}
