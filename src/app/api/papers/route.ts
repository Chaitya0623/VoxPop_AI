import { NextResponse } from 'next/server';
import { loadPaperCorpus } from '@/lib/paperCorpus.server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const papers = await loadPaperCorpus();
    return NextResponse.json({ papers });
  } catch (err) {
    return NextResponse.json({ papers: [], error: 'Failed to load papers.' }, { status: 500 });
  }
}