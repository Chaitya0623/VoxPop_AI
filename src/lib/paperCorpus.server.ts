import fs from 'fs/promises';
import path from 'path';
import { PaperRecord } from '@/lib/types';

let cached: PaperRecord[] | null = null;

export async function loadPaperCorpus(): Promise<PaperRecord[]> {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), 'data', 'papers.jsonl');
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const parsed: PaperRecord[] = [];

  for (const line of lines) {
    parsed.push(JSON.parse(line));
  }

  cached = parsed;
  return parsed;
}