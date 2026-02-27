'use client';

// ============================================================
// VoxPop AI — Personal Result Card
// ============================================================
// Displays the instant personalized recommendation after a user
// completes the value-based survey. Shows allocation strategy,
// outcome predictions, and community comparison if available.
// ============================================================

import { PersonalRecommendation, MonteCarloResult } from '@/lib/types';
import { Sparkles, TrendingUp, Shield, Scale, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  recommendation: PersonalRecommendation;
}

function ConfidenceBadge({ confidence }: { confidence: MonteCarloResult['confidence'] }) {
  const colors = {
    low: 'bg-red-500/20 text-red-400',
    moderate: 'bg-amber-500/20 text-amber-400',
    high: 'bg-green-500/20 text-green-400',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', colors[confidence])}>
      Confidence: {confidence}
    </span>
  );
}

export function PersonalResultCard({ recommendation }: Props) {
  const { userWeights, monteCarloResult, autoMLResult, summary, communityComparison } = recommendation;

  return (
    <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Your Personal Recommendation</h3>
            <p className="text-xs text-muted-foreground">Based on your value responses</p>
          </div>
        </div>
        <ConfidenceBadge confidence={monteCarloResult.confidence} />
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-card/50 border border-border p-4 mb-6">
        <p className="text-sm leading-relaxed">{summary}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg bg-card/50 border border-border p-3 text-center">
          <TrendingUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-blue-400 font-mono">
            {monteCarloResult.expectedOutcome}%
          </div>
          <div className="text-xs text-muted-foreground">Expected Outcome</div>
        </div>
        <div className="rounded-lg bg-card/50 border border-border p-3 text-center">
          <Scale className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400 font-mono">
            +{monteCarloResult.fairnessImprovement}%
          </div>
          <div className="text-xs text-muted-foreground">Fairness Gain</div>
        </div>
        <div className="rounded-lg bg-card/50 border border-border p-3 text-center">
          <BarChart3 className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-amber-400 font-mono">
            -{monteCarloResult.efficiencySacrifice}%
          </div>
          <div className="text-xs text-muted-foreground">Efficiency Cost</div>
        </div>
        <div className="rounded-lg bg-card/50 border border-border p-3 text-center">
          <Shield className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <div className="text-sm font-bold text-purple-400 font-mono truncate" title={autoMLResult.modelType}>
            {autoMLResult.modelType}
          </div>
          <div className="text-xs text-muted-foreground">Model Selected</div>
        </div>
      </div>

      {/* Allocation Bars */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          Recommended Resource Allocation
        </h4>
        <div className="space-y-2">
          {monteCarloResult.optimalAllocation.map((arm) => (
            <div key={arm.groupName} className="flex items-center gap-3">
              <span className="text-xs font-medium w-40 truncate">{arm.groupName}</span>
              <div className="flex-1 bg-border rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                  style={{ width: `${arm.allocation * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold w-12 text-right">
                {(arm.allocation * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Your Value Weights */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3">Your Inferred Value Weights</h4>
        <div className="flex gap-3">
          {[
            { label: 'Accuracy', value: userWeights.accuracy, color: 'bg-blue-500' },
            { label: 'Fairness', value: userWeights.fairness, color: 'bg-green-500' },
            { label: 'Robustness', value: userWeights.robustness, color: 'bg-amber-500' },
          ].map((w) => (
            <div key={w.label} className="flex-1 rounded-lg bg-card/50 border border-border p-3 text-center">
              <div className={cn('w-3 h-3 rounded-full mx-auto mb-1', w.color)} />
              <div className="text-lg font-bold font-mono">{w.value}%</div>
              <div className="text-xs text-muted-foreground">{w.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Comparison */}
      {communityComparison ? (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-accent" />
            <h4 className="text-sm font-semibold text-accent">Community Comparison</h4>
          </div>
          <p className="text-sm text-muted-foreground">{communityComparison.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div>
              <span className="text-muted-foreground">Your fairness: </span>
              <span className="font-bold text-green-400">{communityComparison.userFairnessWeight}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Community avg: </span>
              <span className="font-bold text-primary">{communityComparison.communityFairnessWeight}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Divergence: </span>
              <span className="font-bold">{communityComparison.divergencePercent}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Collecting Community Input</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Community comparison will appear once more users have voted.
          </p>
        </div>
      )}

      {/* MC Simulation info */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        Based on {monteCarloResult.totalRuns.toLocaleString()} Monte Carlo simulations
      </div>
    </div>
  );
}
