'use client';

import { CommunityRecommendation } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Award, Cpu, BarChart3, Users } from 'lucide-react';

interface Props {
  recommendation: CommunityRecommendation;
}

export function RecommendationCard({ recommendation }: Props) {
  const { communityWeights, autoMLResult, justification, supportPercentage } = recommendation;

  return (
    <div className="animate-fade-in rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-5 animate-pulse-glow">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Award className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-xl">Community-Aligned Model</h3>
          <p className="text-sm text-muted-foreground">
            Aggregated from community preferences
          </p>
        </div>
      </div>

      {/* Community Weights */}
      <div className="rounded-lg bg-card border border-border p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Community Objective Weights
        </h4>
        <div className="space-y-2">
          {[
            { label: 'Accuracy', value: communityWeights.accuracy, color: 'bg-blue-500' },
            { label: 'Fairness', value: communityWeights.fairness, color: 'bg-green-500' },
            { label: 'Robustness', value: communityWeights.robustness, color: 'bg-amber-500' },
          ].map((bar) => (
            <div key={bar.label} className="flex items-center gap-3 text-sm">
              <span className="w-20 text-muted-foreground">{bar.label}</span>
              <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-1000', bar.color)}
                  style={{ width: `${bar.value}%` }}
                />
              </div>
              <span className="w-10 text-right font-mono font-semibold">{bar.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Model Config */}
      <div className="rounded-lg bg-card border border-border p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4" /> Selected Model Configuration
        </h4>
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold">
            {autoMLResult.modelType}
          </span>
          <span className="text-xs text-muted-foreground">
            Composite Score: <span className="font-mono text-foreground">{(autoMLResult.compositeScore * 100).toFixed(1)}%</span>
          </span>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Accuracy', value: autoMLResult.metrics.accuracy, color: 'text-blue-500' },
            { label: 'Fairness', value: autoMLResult.metrics.fairnessScore, color: 'text-green-500' },
            { label: 'Robustness', value: autoMLResult.metrics.robustnessScore, color: 'text-amber-500' },
            { label: 'Interpretability', value: autoMLResult.metrics.interpretabilityScore, color: 'text-purple-400' },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-secondary p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
              <div className={cn('text-lg font-bold font-mono', m.color)}>
                {(m.value * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        {/* Hyperparameters */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">Hyperparameters</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(autoMLResult.hyperparameters).map(([k, v]) => (
              <span key={k} className="px-2 py-0.5 rounded bg-secondary text-xs font-mono">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Support + Justification */}
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-card border border-border p-4 flex-1">
          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Community Support
          </h4>
          <div className="text-3xl font-bold text-primary font-mono">
            {supportPercentage.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            of voters align with this configuration
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-card border border-border p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Justification</h4>
        <p className="text-sm text-secondary-foreground leading-relaxed">{justification}</p>
      </div>
    </div>
  );
}
