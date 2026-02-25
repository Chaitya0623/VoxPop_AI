'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { computeInsights, computeCommunityWeights, computeSupportPercentage } from '@/lib/analytics';
import { runAutoML, detectDatasetHint } from '@/lib/automl/simulatedAutoML';
import { CommunityRecommendation, ObjectiveWeights } from '@/lib/types';
import { RecommendationCard } from '@/components/RecommendationCard';
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
  const { responses, recommendation, setRecommendation, datasetAnalysis } = useAppStore();
  const [loading, setLoading] = useState(false);

  const insights = useMemo(() => computeInsights(responses), [responses]);
  const communityWeights = useMemo(() => computeCommunityWeights(responses), [responses]);

  useEffect(() => {
    if (responses.length === 0) return;
    if (recommendation) return;

    const computeRecommendation = async () => {
      setLoading(true);
      try {
        const hint = detectDatasetHint(datasetAnalysis?.fileName);
        const autoMLResult = await runAutoML(communityWeights, 'community', hint);
        const supportPercentage = computeSupportPercentage(responses, communityWeights);
        const justification = generateJustification(communityWeights);

        const rec: CommunityRecommendation = {
          communityWeights,
          autoMLResult,
          justification,
          supportPercentage,
        };
        setRecommendation(rec);
      } finally {
        setLoading(false);
      }
    };

    computeRecommendation();
  }, [responses, recommendation, communityWeights, setRecommendation]);

  if (responses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Votes Yet</h2>
        <p className="text-muted-foreground mb-6">
          Submit at least one vote to see community insights and the aligned model recommendation.
        </p>
        <Link
          href="/survey"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to Survey
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
        <h1 className="text-3xl font-bold mb-2">Community Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time view of community preferences, bias splits, and the aligned model recommendation.
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

      {/* Community Aligned Recommendation */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Community-Aligned Model Recommendation</h2>
        {loading && (
          <div className="flex items-center gap-3 py-12 justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Computing community-aligned model...</span>
          </div>
        )}
        {recommendation && <RecommendationCard recommendation={recommendation} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link
          href="/survey"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Add More Votes
        </Link>
      </div>
    </div>
  );
}
