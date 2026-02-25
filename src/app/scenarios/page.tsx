'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { generateScenarios } from '@/lib/mockAgents/scenarioAgent';
import { runAutoML, detectDatasetHint } from '@/lib/automl/simulatedAutoML';
import { ScenarioCard } from '@/components/ScenarioCard';
import { SurveyForm } from '@/components/SurveyForm';
import { AutoMLResult, SurveyResponse } from '@/lib/types';
import { generateSampleVotes } from '@/lib/sampleVotes';
import { Loader2, ArrowRight, ArrowLeft, AlertCircle, Info, Users } from 'lucide-react';
import Link from 'next/link';

export default function ScenariosPage() {
  const router = useRouter();
  const {
    datasetAnalysis,
    scenarios,
    setScenarios,
    scenarioAutoMLResults,
    setScenarioAutoMLResults,
    responses,
    addResponse,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!datasetAnalysis) return;
    if (scenarios.length > 0) return;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const generated = await generateScenarios(datasetAnalysis);
        setScenarios(generated);

        const hint = detectDatasetHint(datasetAnalysis.fileName);
        const results: Record<string, AutoMLResult> = {};
        for (const s of generated) {
          results[s.id] = await runAutoML(s.weights, s.id, hint);
        }
        setScenarioAutoMLResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate scenarios.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [datasetAnalysis, scenarios.length, setScenarios, setScenarioAutoMLResults]);

  const handleSurveySubmit = (data: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    const isFirstVote = responses.length === 0;

    if (isFirstVote) {
      const sampleVotes = generateSampleVotes(12);
      sampleVotes.forEach((sv) => addResponse(sv));
    }

    const response: SurveyResponse = {
      ...data,
      id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    addResponse(response);
  };

  if (!datasetAnalysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Dataset Uploaded</h2>
        <p className="text-muted-foreground mb-6">
          Please upload a dataset first so the AI agents can generate optimization scenarios.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to Upload
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Scenarios & Vote</h1>
        <p className="text-muted-foreground">
          Explore AI-generated optimization scenarios, then cast your vote on the preferred strategy.
        </p>
      </div>

      {/* Dataset Context */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 mb-8">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-primary mb-1">
              What are we solving? — {datasetAnalysis.fileName}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {datasetAnalysis.problemStatement}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-foreground">
                Task: {datasetAnalysis.taskType}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-foreground">
                Target: {datasetAnalysis.targetColumn}
              </span>
              {datasetAnalysis.sensitiveAttributes.map((attr) => (
                <span key={attr} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning">
                  Sensitive: {attr}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            AI agents are generating scenarios and running AutoML simulations...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 flex items-center gap-3 text-sm text-danger">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Scenarios + Survey */}
      {!loading && scenarios.length > 0 && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1">Optimization Scenarios</h2>
            <p className="text-sm text-muted-foreground">
              Each scenario represents a different philosophy for training your model.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                autoMLResult={scenarioAutoMLResults[s.id]}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="relative my-12">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                Now cast your vote
              </span>
            </div>
          </div>

          {/* Survey Section */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Community Vote</h2>
                <p className="text-sm text-muted-foreground">
                  Select your preferred scenario and set your tradeoff preferences.
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

            <SurveyForm scenarios={scenarios} onSubmit={handleSurveySubmit} />
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-10">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Upload
            </Link>
            {responses.length > 0 && (
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
              >
                View Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}