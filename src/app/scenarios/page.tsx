'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { generateScenarios } from '@/lib/mockAgents/scenarioAgent';
import { runAutoML, detectDatasetHint } from '@/lib/automl/simulatedAutoML';
import { ScenarioCard } from '@/components/ScenarioCard';
import { AutoMLResult } from '@/lib/types';
import { Loader2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Info } from 'lucide-react';

export default function ScenariosPage() {
  const router = useRouter();
  const {
    datasetAnalysis,
    scenarios,
    setScenarios,
    scenarioAutoMLResults,
    setScenarioAutoMLResults,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!datasetAnalysis) return;
    if (scenarios.length > 0) return; // Already generated

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        // Step 1: Generate scenarios
        const generated = await generateScenarios(datasetAnalysis);
        setScenarios(generated);

        // Step 2: Run AutoML for each scenario (dataset-aware)
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Optimization Scenarios</h1>
        <p className="text-muted-foreground">
          The AI Scenario Agent has generated 3 optimization philosophies for your dataset.
          Each scenario comes with an AutoML model configuration.
        </p>
      </div>

      {/* Dataset Context */}
      {datasetAnalysis && (
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
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            AI agents are generating scenarios and running AutoML simulations...
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 flex items-center gap-3 text-sm text-danger">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && scenarios.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                autoMLResult={scenarioAutoMLResults[s.id]}
              />
            ))}
          </div>

          <div className="flex justify-between mt-10">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Upload
            </Link>
            <button
              onClick={() => router.push('/survey')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
            >
              Vote on Scenarios
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
