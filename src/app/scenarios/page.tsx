'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { generateScenarios } from '@/lib/mockAgents/scenarioAgent';
import { generateValueQuestions } from '@/lib/mockAgents/valueQuestionAgent';
import { detectStructuralAsymmetries, enrichWithDatasetContext } from '@/lib/structuralAnalysis';
import {
  inferObjectiveWeights,
  computeAccuracyVsFairness,
  describePreferences,
} from '@/lib/preferenceInference';
import { runAutoML, detectDatasetHint } from '@/lib/automl/simulatedAutoML';
import { runMonteCarloAllocation } from '@/lib/automl/monteCarloAllocator';
import { computeCommunityWeights } from '@/lib/analytics';
import { ScenarioCard } from '@/components/ScenarioCard';
import { ValueSurveyForm } from '@/components/ValueSurveyForm';
import { PersonalResultCard } from '@/components/PersonalResultCard';
import {
  AutoMLResult,
  SurveyResponse,
  PersonalRecommendation,
} from '@/lib/types';
import { generateSampleVotes } from '@/lib/sampleVotes';
import { Loader2, ArrowRight, ArrowLeft, AlertCircle, Info, Users, Brain } from 'lucide-react';
import Link from 'next/link';

export default function ScenariosPage() {
  const router = useRouter();
  const {
    datasetAnalysis,
    scenarios,
    setScenarios,
    scenarioAutoMLResults,
    setScenarioAutoMLResults,
    structuralAsymmetries,
    setStructuralAsymmetries,
    valueQuestions,
    setValueQuestions,
    responses,
    addResponse,
    personalRecommendation,
    setPersonalRecommendation,
    reset,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [computingPersonal, setComputingPersonal] = useState(false);
  const [error, setError] = useState('');

  // Phase 1: Structural analysis + Scenario generation + Value question generation
  useEffect(() => {
    if (!datasetAnalysis) return;
    if (scenarios.length > 0) return; // already generated

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        // Step 1: Detect structural asymmetries from the dataset
        const rows = datasetAnalysis.previewRows.length > 0
          ? datasetAnalysis.previewRows
          : [];
        let asymmetries = detectStructuralAsymmetries(datasetAnalysis, rows);
        asymmetries = enrichWithDatasetContext(asymmetries, datasetAnalysis.fileName);
        setStructuralAsymmetries(asymmetries);

        // Step 2: Generate scenarios (can run in parallel with value questions)
        const [generated, questions] = await Promise.all([
          generateScenarios(datasetAnalysis),
          generateValueQuestions(datasetAnalysis, asymmetries),
        ]);

        setScenarios(generated);
        setValueQuestions(questions);

        // Step 3: Run AutoML for each scenario
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
  }, [datasetAnalysis, scenarios.length, setScenarios, setScenarioAutoMLResults, setStructuralAsymmetries, setValueQuestions]);

  // Handle survey submission → compute personal recommendation
  const handleSurveySubmit = async (data: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    const isFirstVote = responses.length === 0;

    // Seed sample community votes on first user vote
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

    // Compute personal recommendation (instant, based on this user's values)
    if (data.inferredWeights && datasetAnalysis) {
      setComputingPersonal(true);
      try {
        const hint = detectDatasetHint(datasetAnalysis.fileName);
        const primaryAsymmetry = structuralAsymmetries[0] || null;

        // Run AutoML + Monte Carlo in parallel using user's inferred weights
        const [autoMLResult, mcResult] = await Promise.all([
          runAutoML(data.inferredWeights, 'personal', hint),
          runMonteCarloAllocation(data.inferredWeights, primaryAsymmetry, 200, 'personal'),
        ]);

        // Build community comparison
        const allResponses = [...useAppStore.getState().responses];
        const communityWeights = computeCommunityWeights(allResponses);
        const divergence = Math.abs(data.inferredWeights.fairness - communityWeights.fairness);
        const comparison = allResponses.length >= 3
          ? {
              userFairnessWeight: data.inferredWeights.fairness,
              communityFairnessWeight: communityWeights.fairness,
              divergencePercent: +divergence.toFixed(1),
              description: divergence < 5
                ? 'Your values closely align with the community consensus.'
                : divergence < 15
                ? `Your fairness weighting is ${data.inferredWeights.fairness > communityWeights.fairness ? 'higher' : 'lower'} than the community average. This is within the normal range of perspectives.`
                : `Your values diverge notably from the community consensus. You weight fairness ${data.inferredWeights.fairness > communityWeights.fairness ? 'more' : 'less'} heavily than most respondents.`,
            }
          : null;

        // Build summary
        const allocationParts = mcResult.optimalAllocation
          .map((a) => `${a.groupName}: ${(a.allocation * 100).toFixed(0)}%`)
          .join(', ');
        const prefDescription = describePreferences(data.inferredWeights);

        const personalRec: PersonalRecommendation = {
          userWeights: data.inferredWeights,
          autoMLResult,
          monteCarloResult: mcResult,
          summary:
            `${prefDescription} Based on your values, we recommend allocating resources as: ${allocationParts}. ` +
            `Expected outcome: ${mcResult.expectedOutcome}%. ` +
            `Fairness improvement: +${mcResult.fairnessImprovement}%. ` +
            `Efficiency sacrifice: ${mcResult.efficiencySacrifice}%.`,
          communityComparison: comparison,
        };

        setPersonalRecommendation(personalRec);
      } catch (err) {
        console.error('Failed to compute personal recommendation:', err);
      } finally {
        setComputingPersonal(false);
      }
    }
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
          Explore AI-generated optimization scenarios, answer value questions, and get your personalized recommendation.
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

      {/* Structural Asymmetry Findings */}
      {structuralAsymmetries.length > 0 && !loading && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 mb-8 animate-fade-in">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-2">
                Structural Asymmetries Detected
              </h3>
              {structuralAsymmetries.map((asym) => (
                <div key={asym.attribute} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{asym.attribute}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      asym.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      asym.severity === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {asym.severity}
                    </span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-2">
                    {asym.disparities.slice(0, 3).map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Analyzing structural asymmetries, generating scenarios & value questions...
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

      {/* Scenarios + Value Survey */}
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
                Share your values & get a personal recommendation
              </span>
            </div>
          </div>

          {/* Value Survey Section */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Value-Based Survey</h2>
                <p className="text-sm text-muted-foreground">
                  Answer contextual questions about this dataset&apos;s fairness challenges.
                  Your answers will generate a personalized recommendation.
                </p>
                {responses.length === 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent/10 border border-accent/20 p-3">
                    <Users className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-accent">
                      Your first vote will also seed 12 simulated community votes to make the dashboard richer.
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary font-mono">{responses.length}</div>
                <div className="text-xs text-muted-foreground">votes so far</div>
              </div>
            </div>

            {valueQuestions.length > 0 ? (
              <ValueSurveyForm
                valueQuestions={valueQuestions}
                onSubmit={handleSurveySubmit}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Loading value questions...
              </p>
            )}
          </div>

          {/* Personal Recommendation */}
          {computingPersonal && (
            <div className="max-w-4xl mx-auto mb-10 flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Running Monte Carlo simulations and computing your personalized recommendation...
              </p>
            </div>
          )}

          {personalRecommendation && !computingPersonal && (
            <div className="max-w-4xl mx-auto mb-10">
              <PersonalResultCard recommendation={personalRecommendation} />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-10">
            <div className="flex gap-3">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Upload
              </Link>
              <button
                onClick={() => {
                  reset();
                  router.push('/upload');
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-muted-foreground font-medium text-sm hover:text-foreground hover:border-primary/50 transition-colors"
              >
                Change Dataset
              </button>
            </div>
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