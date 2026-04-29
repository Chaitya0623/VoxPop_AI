'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { computeInsights, computeCommunityWeights, computeSupportPercentage, computeBlendedCommunityWeights } from '@/lib/analytics';
import { runAutoML, detectDatasetHint } from '@/lib/automl/simulatedAutoML';
import { runMonteCarloAllocation } from '@/lib/automl/monteCarloAllocator';
import { CommunityRecommendation, ObjectiveWeights, PaperRecord, PaperPrior, ResearchEvidence } from '@/lib/types';
import { inferPaperPriors, explainRecommendation, rankCandidateModels } from '@/lib/paperKnowledge';
import { RecommendationCard } from '@/components/RecommendationCard';
import { PersonalResultCard } from '@/components/PersonalResultCard';
import { CommunityComparisonCard } from '@/components/CommunityComparisonCard';
import { ScenarioPieChart } from '@/components/charts/ScenarioPieChart';
import { PrincipleBarChart } from '@/components/charts/PrincipleBarChart';
import { DriftLineChart } from '@/components/charts/DriftLineChart';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Activity,
  Target,
  Shield,
  Loader2,
  Info,
  User,
} from 'lucide-react';
import Link from 'next/link';

function generateJustification(weights: ObjectiveWeights): string {
  const dominant =
    weights.accuracy >= weights.fairness && weights.accuracy >= weights.robustness
      ? 'accuracy'
      : weights.fairness >= weights.robustness
      ? 'fairness'
      : 'robustness';

  const justifications: Record<string, string> = {
    accuracy: `The community's aggregated preferences lean toward predictive performance, with accuracy weighted at ${weights.accuracy}%. This suggests stakeholders prioritize reliable predictions and are willing to accept moderate fairness tradeoffs. The selected model configuration reflects this preference while maintaining baseline fairness and robustness guarantees.`,
    fairness: `The community has expressed a strong preference for equitable outcomes, with fairness weighted at ${weights.fairness}%. This indicates collective concern about disparate impact and demographic parity. The recommended model applies fairness constraints that may reduce raw accuracy but ensure more equitable treatment across protected groups.`,
    robustness: `The community values model stability and reliability, with robustness weighted at ${weights.robustness}%. This preference suggests stakeholders want models that perform consistently across different conditions and subpopulations, even at the cost of peak performance.`,
  };

  return justifications[dominant];
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    responses,
    recommendation,
    setRecommendation,
    datasetAnalysis,
    structuralAsymmetries,
    personalRecommendation,
    reset,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'community' | 'personal'>('community');
  const [paperCorpus, setPaperCorpus] = useState<PaperRecord[]>([]);
  const [paperPrior, setPaperPrior] = useState<PaperPrior | null>(null);
  const [researchEvidence, setResearchEvidence] = useState<ResearchEvidence | null>(null);

  const insights = useMemo(() => computeInsights(responses), [responses]);
  const communityWeights = useMemo(() => computeCommunityWeights(responses), [responses]);

  useEffect(() => {
    let active = true;
    const loadPapers = async () => {
      try {
        const res = await fetch('/api/papers');
        const data = await res.json();
        if (!active) return;
        setPaperCorpus(data.papers || []);
      } catch (err) {
        if (!active) return;
        setPaperCorpus([]);
      }
    };

    loadPapers();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (responses.length === 0) return;
    const shouldRecompute = !recommendation || (paperCorpus.length > 0 && !recommendation.researchEvidence);
    if (!shouldRecompute) return;

    const computeRecommendation = async () => {
      setLoading(true);
      try {
        const hint = detectDatasetHint(datasetAnalysis?.fileName);
        const primaryAsymmetry = structuralAsymmetries[0] || null;
        const domain = datasetAnalysis?.fileName?.toLowerCase().includes('compas')
          ? 'criminal_justice'
          : datasetAnalysis?.fileName?.toLowerCase().includes('adult')
          ? 'economics'
          : datasetAnalysis?.fileName?.toLowerCase().includes('german')
          ? 'finance'
          : 'general';

        const problemType = datasetAnalysis?.taskType || 'classification';
        const fairnessDefinition = datasetAnalysis?.sensitiveAttributes?.length ? 'equity' : undefined;
        const constraints = datasetAnalysis?.sensitiveAttributes?.length ? ['historical_bias'] : [];

        const prior = paperCorpus.length > 0
          ? inferPaperPriors(paperCorpus, {
              problemType,
              domain,
              fairnessDefinition,
              constraints,
              sensitiveAttributes: datasetAnalysis?.sensitiveAttributes || [],
            })
          : null;

        const blendedWeights = computeBlendedCommunityWeights(responses, prior || undefined);
        const rankedModels = prior ? rankCandidateModels(blendedWeights, prior.modelScores) : [];
        const evidence = prior
          ? explainRecommendation(datasetAnalysis, prior, blendedWeights, rankedModels, {
              domain,
              fairnessDefinition,
              problemType,
            })
          : null;

        setPaperPrior(prior);
        setResearchEvidence(evidence);

        // Run AutoML + Monte Carlo for community weights
        const [autoMLResult, mcResult] = await Promise.all([
          runAutoML(blendedWeights, 'community', hint, prior),
          runMonteCarloAllocation(blendedWeights, primaryAsymmetry, 200, 'community', prior?.allocationProfile || null),
        ]);
        const supportPercentage = computeSupportPercentage(responses, blendedWeights);
        const justification = prior
          ? `${generateJustification(blendedWeights)} Research priors from ${prior.matchedPapers.length} papers were blended with community history to refine the selection.`
          : generateJustification(blendedWeights);

        const rec: CommunityRecommendation = {
          communityWeights: blendedWeights,
          autoMLResult,
          justification,
          supportPercentage,
          monteCarloResult: mcResult,
          researchEvidence: evidence,
        };
        setRecommendation(rec);
      } finally {
        setLoading(false);
      }
    };

    computeRecommendation();
  }, [responses, recommendation, communityWeights, setRecommendation, datasetAnalysis, structuralAsymmetries, paperCorpus]);

  if (responses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Dataset Selected</h2>
        <p className="text-muted-foreground mb-6">
          Choose a dataset first to see community insights and explore fairness tradeoffs.
        </p>
        <Link
          href="/datasets"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Datasets
        </Link>
      </div>
    );
  }

  const TrendIcon =
    insights.trendDirection === 'increasing_fairness'
      ? TrendingUp
      : insights.trendDirection === 'increasing_efficiency'
      ? TrendingDown
      : Minus;

  const trendLabel =
    insights.trendDirection === 'increasing_fairness'
      ? 'Increasing Fairness'
      : insights.trendDirection === 'increasing_efficiency'
      ? 'Increasing Efficiency'
      : 'Stable';

  const trendColor =
    insights.trendDirection === 'increasing_fairness'
      ? 'text-green-400'
      : insights.trendDirection === 'increasing_efficiency'
      ? 'text-blue-400'
      : 'text-muted-foreground';

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Personal and community insights, allocation recommendations, and model configuration.
        </p>
      </div>

      {/* Dataset Context */}
      {datasetAnalysis && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-primary mb-1">
                Dataset: {datasetAnalysis.fileName}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {datasetAnalysis.problemStatement}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mode Tabs: Personal / Community */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('community')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all',
            activeTab === 'community'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
              : 'bg-secondary text-foreground hover:bg-secondary/80',
          )}
        >
          <Users className="w-4 h-4" />
          Community View
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          disabled={!personalRecommendation}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all',
            activeTab === 'personal'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
              : 'bg-secondary text-foreground hover:bg-secondary/80',
            !personalRecommendation && 'opacity-40 cursor-not-allowed',
          )}
        >
          <User className="w-4 h-4" />
          Personal View
          {!personalRecommendation && (
            <span className="text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded">Vote first</span>
          )}
        </button>
      </div>

      {/* ====== COMMUNITY TAB ====== */}
      {activeTab === 'community' && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                icon: Users,
                label: 'Total Responses',
                value: insights.totalResponses,
                color: 'text-primary',
              },
              {
                icon: Activity,
                label: 'Polarization Index',
                value: insights.polarizationIndex.toFixed(2),
                color:
                  insights.polarizationIndex > 0.6
                    ? 'text-danger'
                    : insights.polarizationIndex > 0.3
                    ? 'text-warning'
                    : 'text-success',
              },
              {
                icon: Shield,
                label: 'Stability Score',
                value: insights.stabilityScore.toFixed(2),
                color:
                  insights.stabilityScore > 0.7
                    ? 'text-success'
                    : insights.stabilityScore > 0.4
                    ? 'text-warning'
                    : 'text-danger',
              },
              {
                icon: Target,
                label: 'Trend Direction',
                value: trendLabel,
                color: trendColor,
                customIcon: TrendIcon,
              },
            ].map((stat) => {
              const Icon = stat.customIcon || stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-4 animate-fade-in"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Icon className="w-4 h-4" />
                    {stat.label}
                  </div>
                  <div className={cn('text-2xl font-bold font-mono', stat.color)}>
                    {stat.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ScenarioPieChart
              data={insights.scenarioSplit}
              title="Scenario Preference Split"
            />
            <PrincipleBarChart
              data={insights.principleSplit}
              title="Guiding Principle Distribution"
            />
          </div>

          {insights.preferenceDrift.length > 1 && (
            <div className="mb-8">
              <DriftLineChart
                data={insights.preferenceDrift}
                title="Preference Drift Over Time"
              />
            </div>
          )}

          {/* Community Recommendation */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Community-Aligned Recommendation</h2>
            {loading && (
              <div className="flex items-center gap-3 py-12 justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Computing community-aligned model & allocation...</span>
              </div>
            )}
            {recommendation?.researchEvidence?.enabled && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-200 mb-1">Research-Informed Recommendation</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Model selection blended literature priors with past and current community responses.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {recommendation.researchEvidence.matchedSignals.map((signal) => (
                        <span key={signal} className="px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
                          {signal}
                        </span>
                      ))}
                    </div>
                    <div className="grid gap-2">
                      {recommendation.researchEvidence.matchedPapers.slice(0, 4).map((paper) => (
                        <div key={paper.id} className="rounded-md border border-border bg-secondary/60 p-2">
                          <div className="text-xs font-semibold text-foreground">{paper.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {paper.venue || 'Literature'}{paper.year ? ` • ${paper.year}` : ''} • {paper.methodCategory || 'general'}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {paper.problemType || 'general'} • {paper.domain || 'general'} • {paper.fairnessDefinition || 'not_explicit'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {recommendation && <RecommendationCard recommendation={recommendation} />}
          </div>

          {/* Community Monte Carlo Allocation */}
          {recommendation?.monteCarloResult && (
            <div className="rounded-xl border border-border bg-card p-6 mb-8">
              <h3 className="text-lg font-bold mb-4">Community-Informed Allocation Strategy</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <div className="text-xl font-bold text-blue-400 font-mono">
                    {recommendation.monteCarloResult.expectedOutcome}%
                  </div>
                  <div className="text-xs text-muted-foreground">Expected Outcome</div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <div className="text-xl font-bold text-green-400 font-mono">
                    +{recommendation.monteCarloResult.fairnessImprovement}%
                  </div>
                  <div className="text-xs text-muted-foreground">Fairness Gain</div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <div className="text-xl font-bold text-amber-400 font-mono">
                    -{recommendation.monteCarloResult.efficiencySacrifice}%
                  </div>
                  <div className="text-xs text-muted-foreground">Efficiency Cost</div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <div className="text-xl font-bold text-purple-400 font-mono capitalize">
                    {recommendation.monteCarloResult.confidence}
                  </div>
                  <div className="text-xs text-muted-foreground">MC Confidence</div>
                </div>
              </div>
              <div className="space-y-2">
                {recommendation.monteCarloResult.optimalAllocation.map((arm) => (
                  <div key={arm.groupName} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-40 truncate">{arm.groupName}</span>
                    <div className="flex-1 bg-border rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-500"
                        style={{ width: `${arm.allocation * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold w-12 text-right">
                      {(arm.allocation * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Based on {recommendation.monteCarloResult.totalRuns.toLocaleString()} Monte Carlo simulations
              </p>
            </div>
          )}
        </>
      )}

      {/* ====== PERSONAL TAB ====== */}
      {activeTab === 'personal' && personalRecommendation && (
        <>
          <PersonalResultCard recommendation={personalRecommendation} />

          {/* Community Comparison */}
          {recommendation && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Your Values vs Community</h2>
              <CommunityComparisonCard
                personal={personalRecommendation}
                community={recommendation}
              />
            </div>
          )}
        </>
      )}

      {/* Structural Asymmetries */}
      {structuralAsymmetries.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 mb-8 animate-fade-in">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-2">
                Structural Asymmetries in This Dataset
              </h3>
              {structuralAsymmetries.map((asym) => (
                <div key={asym.attribute} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{asym.attribute}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      asym.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      asym.severity === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400',
                    )}>
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

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Link
          href="/survey"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Take Survey
        </Link>
        <button
          onClick={() => {
            reset();
            router.push('/datasets');
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
        >
          Change Dataset
        </button>
      </div>
    </div>
  );
}
