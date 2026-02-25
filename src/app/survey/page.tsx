'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { SurveyForm } from '@/components/SurveyForm';
import { SurveyResponse } from '@/lib/types';
import { generateSampleVotes } from '@/lib/sampleVotes';
import { AlertCircle, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

export default function SurveyPage() {
  const router = useRouter();
  const { scenarios, responses, addResponse } = useAppStore();

  const handleSubmit = (data: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    const isFirstVote = responses.length === 0;

    // If first vote, seed with sample community votes for richer dashboard
    if (isFirstVote) {
      const sampleVotes = generateSampleVotes(12);
      sampleVotes.forEach((sv) => addResponse(sv));
    }

    const response: SurveyResponse = {
      ...data,
      id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    // FUTURE: Replace with API POST call
    addResponse(response);
  };

  if (scenarios.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Scenarios Generated</h2>
        <p className="text-muted-foreground mb-6">
          Upload a dataset and generate scenarios before voting.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Start from Upload
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Survey</h1>
            <p className="text-muted-foreground">
              Cast your vote on the preferred optimization strategy and guiding principle.
            </p>
            {responses.length === 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent/10 border border-accent/20 p-3">
                <Users className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-xs text-accent">
                  Your first vote will also seed 12 simulated community votes to make the dashboard analysis richer.
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary font-mono">{responses.length}</div>
            <div className="text-xs text-muted-foreground">votes so far</div>
          </div>
        </div>
      </div>

      <SurveyForm scenarios={scenarios} onSubmit={handleSubmit} />

      <div className="flex justify-between mt-10">
        <Link
          href="/scenarios"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scenarios
        </Link>
        {responses.length > 0 && (
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
          >
            View Dashboard →
          </button>
        )}
      </div>
    </div>
  );
}
