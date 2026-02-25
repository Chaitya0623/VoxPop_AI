// ============================================================
// VoxPop AI — /api/analyze  (POST)
// ============================================================
// Analyzes a dataset using OpenAI GPT to produce risk assessment,
// problem statement, sensitive attribute analysis, and suggested
// tradeoffs. Falls back to heuristic analysis if no API key.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, isLLMEnabled } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, columns, sampleRows, rowCount, columnCount, taskType, targetColumn, sensitiveAttributes } = body;

    if (!isLLMEnabled()) {
      return NextResponse.json({ llmEnabled: false });
    }

    const client = getOpenAIClient()!;

    const sampleData = JSON.stringify(sampleRows.slice(0, 5), null, 2);
    const columnSummary = columns
      .map((c: { name: string; type: string; unique: number; missing: number }) =>
        `  - ${c.name} (${c.type}, ${c.unique} unique, ${c.missing} missing)`
      )
      .join('\n');

    const prompt = `You are an AI fairness analyst. Analyze this dataset for ML fairness risks.

## Dataset
- **File**: ${fileName}
- **Size**: ${rowCount} rows × ${columnCount} columns
- **Task**: ${taskType} on target "${targetColumn}"
- **Detected sensitive attributes**: ${sensitiveAttributes.join(', ') || 'none'}

## Columns
${columnSummary}

## Sample Rows (first 5)
\`\`\`json
${sampleData}
\`\`\`

Respond with ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "problemStatement": "A 2-3 sentence description of what ML problem this dataset solves, and the core fairness challenge involved. Be specific to this dataset.",
  "riskAssessment": {
    "level": "low" | "medium" | "high",
    "summary": "One-sentence summary of the fairness risk level.",
    "details": ["array", "of", "3-5", "specific", "risk", "observations"]
  },
  "suggestedTradeoffs": ["array", "of", "4", "relevant", "tradeoff", "dimensions"],
  "sensitiveAttributes": ["corrected/expanded list of sensitive columns if the heuristic missed any"]
}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ llmEnabled: false });
    }

    const parsed = JSON.parse(content);
    return NextResponse.json({ llmEnabled: true, ...parsed });
  } catch (error) {
    console.error('[/api/analyze]', error);
    return NextResponse.json({ llmEnabled: false, error: 'LLM call failed' });
  }
}
