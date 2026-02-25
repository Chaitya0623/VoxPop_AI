'use client';

import { Scenario, AutoMLResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Zap,
  Scale,
  Shield,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  scenario: Scenario;
  autoMLResult?: AutoMLResult;
  selected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

const SCENARIO_ICONS: Record<string, React.ElementType> = {
  'scenario-a': Zap,
  'scenario-b': Scale,
  'scenario-c': Shield,
};

const SCENARIO_COLORS: Record<string, string> = {
  'scenario-a': 'border-blue-500/30 bg-blue-500/5',
  'scenario-b': 'border-purple-500/30 bg-purple-500/5',
  'scenario-c': 'border-green-500/30 bg-green-500/5',
};

const SCENARIO_ACCENT: Record<string, string> = {
  'scenario-a': 'text-blue-400',
  'scenario-b': 'text-purple-400',
  'scenario-c': 'text-green-400',
};

export function ScenarioCard({ scenario, autoMLResult, selected, onSelect, selectable }: Props) {
  const [expanded, setExpanded] = useState(false);
  const Icon = SCENARIO_ICONS[scenario.id] || Zap;
  const colorClass = SCENARIO_COLORS[scenario.id] || '';
  const accentClass = SCENARIO_ACCENT[scenario.id] || 'text-primary';

  return (
    <div
      className={cn(
        'rounded-xl border p-5 transition-all animate-fade-in',
        colorClass,
        selected && 'ring-2 ring-primary shadow-lg shadow-primary/10',
        selectable && 'cursor-pointer hover:shadow-md',
      )}
      onClick={selectable ? onSelect : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-card')}>
            <Icon className={cn('w-5 h-5', accentClass)} />
          </div>
          <div>
            <h3 className="font-semibold text-base">{scenario.title}</h3>
            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
              <span>Acc: {scenario.weights.accuracy}%</span>
              <span>Fair: {scenario.weights.fairness}%</span>
              <span>Rob: {scenario.weights.robustness}%</span>
            </div>
          </div>
        </div>
        {selectable && (
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
              selected
                ? 'border-primary bg-primary'
                : 'border-muted-foreground',
            )}
          >
            {selected && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        )}
      </div>

      {/* Weight bars */}
      <div className="space-y-1.5 mb-4">
        {[
          { label: 'Accuracy', value: scenario.weights.accuracy, color: 'bg-blue-500' },
          { label: 'Fairness', value: scenario.weights.fairness, color: 'bg-green-500' },
          { label: 'Robustness', value: scenario.weights.robustness, color: 'bg-amber-500' },
        ].map((bar) => (
          <div key={bar.label} className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted-foreground">{bar.label}</span>
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', bar.color)}
                style={{ width: `${bar.value}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono">{bar.value}%</span>
          </div>
        ))}
      </div>

      {/* Narrative */}
      <p className="text-sm text-secondary-foreground leading-relaxed mb-3">
        {scenario.narrative}
      </p>

      {/* AutoML result summary */}
      {autoMLResult && (
        <div className="rounded-lg bg-card border border-border p-3 mb-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            AutoML Result: <span className="text-foreground">{autoMLResult.modelType}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(autoMLResult.metrics).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-mono">{((val as number) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs">
            <span className="text-muted-foreground">Composite Score</span>
            <span className="font-mono font-semibold text-primary">
              {(autoMLResult.compositeScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Expandable details */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Less' : 'More'} details
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 text-sm animate-fade-in">
          <div className="rounded-lg bg-card p-3 border border-border">
            <div className="font-medium text-xs text-muted-foreground mb-1">Estimated Performance</div>
            <p className="text-xs font-mono">{scenario.estimatedPerformance}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-success/5 border border-success/20 p-3">
              <div className="flex items-center gap-1 text-xs font-medium text-success mb-1">
                <TrendingUp className="w-3 h-3" /> Who Benefits
              </div>
              <p className="text-xs text-secondary-foreground">{scenario.whoBenefits}</p>
            </div>
            <div className="rounded-lg bg-danger/5 border border-danger/20 p-3">
              <div className="flex items-center gap-1 text-xs font-medium text-danger mb-1">
                <TrendingDown className="w-3 h-3" /> Who May Lose
              </div>
              <p className="text-xs text-secondary-foreground">{scenario.whoMayLose}</p>
            </div>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border">
            <div className="font-medium text-xs text-muted-foreground mb-1">Tradeoff Explanation</div>
            <p className="text-xs text-secondary-foreground">{scenario.tradeoffExplanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
