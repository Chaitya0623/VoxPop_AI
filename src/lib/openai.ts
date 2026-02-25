// ============================================================
// VoxPop AI — OpenAI Client (Server-Side Only)
// ============================================================

import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'your_openai_api_key_here') return null;

  if (!_client) {
    _client = new OpenAI({ apiKey: key });
  }
  return _client;
}

export function isLLMEnabled(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return !!key && key !== 'your_openai_api_key_here';
}
