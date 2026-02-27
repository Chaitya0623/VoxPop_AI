'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { generateValueQuestions } from '@/lib/mockAgents/valueQuestionAgent';
import { detectStructuralAsymmetries, enrichWithDatasetContext } from '@/lib/structuralAnalysis';
import { describePreferences } from '@/lib/preferenceInference';
import { runAutoML, detectDatasetHint } from '@/lib/automl/simulatedAutoML';
import { runMonteCarloAllocation } from '@/lib/automl/monteCarloAllocator';
import { computeCommunityWeights } from '@/lib/analytics';
import { ValueSurveyForm } from '@/components/ValueSurveyForm';
import { PersonalResultCard } from '@/components/PersonalResultCard';
import {
  SurveyResponse,
  PersonalRecommendation,
  DatasetAnalysis,
  StructuralAsymmetry,
  ValueQuestion,
} from '@/lib/types';
import { SAMPLE_DATASETS } from '@/lib/sampleDatasets';
import { analyzeDataset } from '@/lib/mockAgents/datasetAgent';
import {
  Loader2,
  Info,
  Brain,
  Database,
  Shield,
  ArrowRight,
  Sparkles,
  MessageSquare,
  BarChart3,
  Users,
  Rows3,
  Columns3,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const DOMAIN_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  'Criminal Justice': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '⚖️' },
  'Economics': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: '💰' },
  'Finance': { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '🏦' },
};

const HOW_IT_WORKS = [
  { step: 1, title: 'Pick a Dataset', description: 'Choose a real-world fairness dataset to explore', icon: Database },
  { step: 2, title: 'Answer Questions', description: 'Respond to bias-aware questions tailored to the data', icon: MessageSquare },
  { step: 3, title: 'Get Your Recommendation', description: 'See a personalized AI model allocation based on your values', icon: BarChart3 },
];

export default function SurveyPage() {
  const { responses, addResponse, setPersonalRecommendation } = useAppStore();

  // ALL survey state is local — independent of global store dataset
  const [localAnalysis, setLocalAnalysis] = useState<DatasetAnalysis | null>(null);
  const [localAsymmetries, setLocalAsymmetries] = useState<StructuralAsymmetry[]>([]);
  const [localQuestions, setLocalQuestions] = useState<ValueQuestion[]>([]);
  const [localPersonalRec, setLocalPersonalRec] = useState<PersonalRecommendation | null>(null);

  const [loading, setLoading] = useState(false);
  const [computingPersonal, setComputingPersonal] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  const handleDatasetSelect = async (dsId: string) => {
    const ds = SAMPLE_DATASETS.find((d) => d.id === dsId);
    if (!ds) return;
    setSelectedDatasetId(dsId);
    setLoading(true);
    setLocalPersonalRec(null);
    try {
      const analysis = await analyzeDataset(ds.fileName, ds.rows);
      setLocalAnalysis(analysis);

      let asymmetries = detectStructuralAsymmetries(analysis, ds.rows);
      asymmetries = enrichWithDatasetContext(asymmetries, analysis.fileName);
      setLocalAsymmetries(asymmetries);

      const questions = await generateValueQuestions(analysis, asymmetries);
      setLocalQuestions(questions);
    } finally {
      setLoading(false);
    }
  };

  // Handle survey submission → compute personal recommendation
  const handleSurveySubmit = async (data: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    const response: SurveyResponse = {
      ...data,
      id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    addResponse(response);

    if (data.inferredWeights && localAnalysis) {
      setComputingPersonal(true);
      try {
        const hint = detectDatasetHint(localAnalysis.fileName);
        const primaryAsymmetry = localAsymmetries[0] || null;

        const [autoMLResult, mcResult] = await Promise.all([
          runAutoML(data.inferredWeights, 'personal', hint),
          runMonteCarloAllocation(data.inferredWeights, primaryAsymmetry, 200, 'personal'),
        ]);

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
                ? `Your fairness weighting is ${data.inferredWeights.fairness > communityWeights.fairness ? 'higher' : 'lower'} than the community average.`
                : `Your values diverge notably from community consensus. You weight fairness ${data.inferredWeights.fairness > communityWeights.fairness ? 'more' : 'less'} heavily than most.`,
            }
          : null;

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
        setLocalPersonalRec(personalRec);
        setPersonalRecommendation(personalRec);
      } catch (err) {
        console.error('Failed to compute personal recommendation:', err);
      } finally {
        setComputingPersonal(false);
      }
    }
  };

  const showPicker = !localAnalysis || (!localQuestions.length && !loading);
  const userResponses = responses.filter((r) => !r.id.startsWith('sample-'));

  return (
    <div className="min-h-screen">
      {/* ── DATASET PICKER VIEW ── */}
      {showPicker && !loading && (
        <>
          {/* Hero banner */}
          <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
            {/* Decorative blobs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
            <div className="absolute top-10 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

            <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Your voice shapes AI fairness
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 animate-fade-in">
                Share Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Values
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-2 max-w-2xl mx-auto animate-fade-in">
                Pick a real-world dataset, answer tailored questions about fairness tradeoffs, and get a personalized AI model recommendation.
              </p>
              <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto animate-fade-in">
                Each response contributes to the community consensus on how AI should balance accuracy, fairness, and robustness.
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-10">
            {/* How it works — compact steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-primary">Step {item.step}</span>
                    </div>
                    <h3 className="text-sm font-semibold mb-0.5">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dataset Cards + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dataset cards — takes 2 cols */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-primary" />
                  <h2 className="text-lg font-bold">Choose a Dataset</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a dataset to generate tailored survey questions about its specific fairness challenges.
                </p>

                {SAMPLE_DATASETS.map((ds) => {
                  const cfg = DOMAIN_CONFIG[ds.domain] || DOMAIN_CONFIG['Finance'];
                  return (
                    <button
                      key={ds.id}
                      onClick={() => handleDatasetSelect(ds.id)}
                      disabled={loading}
                      className={cn(
                        'w-full text-left rounded-xl border transition-all group',
                        selectedDatasetId === ds.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'border-border hover:border-primary/40 hover:bg-card/80',
                        loading && selectedDatasetId !== ds.id && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <div className="flex">
                        {/* Color accent bar */}
                        <div className={cn('w-1.5 rounded-l-xl flex-shrink-0', cfg.bg.replace('/10', '/40'))} />

                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{cfg.icon}</span>
                              <div>
                                <h3 className="font-bold text-base group-hover:text-primary transition-colors">{ds.name}</h3>
                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.bg, cfg.color)}>
                                  {ds.domain}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              Start Survey
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                            {ds.description}
                          </p>

                          {/* Meta badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                              <Rows3 className="w-3 h-3" />
                              {ds.rows.length} rows
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                              <Columns3 className="w-3 h-3" />
                              {ds.columns.length} columns
                            </span>
                            {ds.sensitiveAttributes.map((attr) => (
                              <span
                                key={attr}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 font-medium"
                              >
                                <Eye className="w-3 h-3" />
                                {attr}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Community Stats */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">Community Activity</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Responses</span>
                      <span className="text-lg font-bold font-mono text-primary">{responses.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Your Contributions</span>
                      <span className="text-lg font-bold font-mono text-green-400">{userResponses.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Datasets Available</span>
                      <span className="text-lg font-bold font-mono">{SAMPLE_DATASETS.length}</span>
                    </div>
                  </div>
                  {userResponses.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        You&apos;ve contributed to the community!
                      </div>
                    </div>
                  )}
                </div>

                {/* Why participate */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                  <h3 className="text-sm font-bold mb-3 text-primary">Why Take the Survey?</h3>
                  <ul className="space-y-2.5">
                    {[
                      'Discover how your values compare to the community',
                      'Get a personalized AI model recommendation',
                      'Help shape fairer AI systems for everyone',
                      'Learn about bias in real-world datasets',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Shield className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quick link to dashboard */}
                {responses.length > 0 && (
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm font-medium">View Dashboard</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── LOADING STATE ── */}
      {loading && (
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">Analyzing Dataset</h3>
              <p className="text-sm text-muted-foreground">
                Detecting structural biases & generating tailored questions...
              </p>
            </div>
            {/* Animated steps */}
            <div className="flex flex-col gap-2 mt-2">
              {['Parsing data schema', 'Detecting asymmetries', 'Generating value questions'].map((s, i) => (
                <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: `${i * 400}ms` }}>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE SURVEY VIEW ── */}
      {!showPicker && !loading && (
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Dataset context bar */}
          {localAnalysis && localQuestions.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-1">
                      Survey for: {localAnalysis.fileName.replace('.csv', '').replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {localAnalysis.problemStatement}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setLocalAnalysis(null);
                    setLocalQuestions([]);
                    setLocalAsymmetries([]);
                    setLocalPersonalRec(null);
                    setSelectedDatasetId(null);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 whitespace-nowrap"
                >
                  Change Dataset
                </button>
              </div>
            </div>
          )}

          {/* Structural Asymmetries (compact) */}
          {localAsymmetries.length > 0 && localQuestions.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-8 animate-fade-in">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-400 mb-2">
                    Detected Biases in This Dataset
                  </h3>
                  {localAsymmetries.map((asym) => (
                    <div key={asym.attribute} className="mb-2 last:mb-0">
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
                      <ul className="text-xs text-muted-foreground space-y-0.5 ml-2">
                        {asym.disparities.slice(0, 2).map((d, i) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Value Survey */}
          {localQuestions.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Share Your Perspective</h2>
                  <p className="text-sm text-muted-foreground">
                    These questions are tailored to the biases detected in this dataset.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary font-mono">{responses.length}</div>
                  <div className="text-xs text-muted-foreground">total responses</div>
                </div>
              </div>

              <ValueSurveyForm
                valueQuestions={localQuestions}
                onSubmit={handleSurveySubmit}
              />
            </div>
          )}

          {/* Computing state */}
          {computingPersonal && (
            <div className="mb-10 flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Computing your personalized recommendation...
              </p>
            </div>
          )}

          {/* Personal Recommendation */}
          {localPersonalRec && !computingPersonal && (
            <div className="mb-10">
              <PersonalResultCard recommendation={localPersonalRec} />
              <div className="mt-4 text-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
                >
                  View Full Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
