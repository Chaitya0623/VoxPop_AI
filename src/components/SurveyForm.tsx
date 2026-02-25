'use client';

import { useState } from 'react';
import { Scenario, GuidingPrinciple, SurveyResponse } from '@/lib/types';
import { ScenarioCard } from '@/components/ScenarioCard';
import { cn } from '@/lib/utils';
import { Send, Star } from 'lucide-react';

interface Props {
  scenarios: Scenario[];
  onSubmit: (response: Omit<SurveyResponse, 'id' | 'timestamp'>) => void;
}

const PRINCIPLES: { value: GuidingPrinciple; label: string; description: string }[] = [
  { value: 'equal_opportunity', label: 'Equal Opportunity', description: 'Everyone gets a fair chance' },
  { value: 'equal_outcome', label: 'Equal Outcome', description: 'Results are equitable across groups' },
  { value: 'profit_maximization', label: 'Profit Maximization', description: 'Optimize for business value' },
  { value: 'social_equity', label: 'Social Equity', description: 'Prioritize disadvantaged groups' },
];

export function SurveyForm({ scenarios, onSubmit }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [accuracyVsFairness, setAccuracyVsFairness] = useState(50);
  const [guidingPrinciple, setGuidingPrinciple] = useState<GuidingPrinciple | ''>('');
  const [confidence, setConfidence] = useState(3);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = selectedScenario && guidingPrinciple;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      selectedScenarioId: selectedScenario,
      accuracyVsFairness,
      guidingPrinciple: guidingPrinciple as GuidingPrinciple,
      confidenceRating: confidence,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="animate-fade-in text-center py-16">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Vote Recorded!</h3>
        <p className="text-muted-foreground mb-6">
          Your preference has been added to the community pool.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setSelectedScenario('');
            setGuidingPrinciple('');
            setAccuracyVsFairness(50);
            setConfidence(3);
          }}
          className="px-6 py-2.5 rounded-lg bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
        >
          Submit Another Vote
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Step 1 — Scenario Selection */}
      <section>
        <h3 className="text-lg font-semibold mb-1">1. Select Your Preferred Scenario</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose the optimization strategy you believe is best for the community.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {scenarios.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              selected={selectedScenario === s.id}
              onSelect={() => setSelectedScenario(s.id)}
              selectable
            />
          ))}
        </div>
      </section>

      {/* Step 2 — Accuracy vs Fairness slider */}
      <section>
        <h3 className="text-lg font-semibold mb-1">2. Accuracy vs Fairness Preference</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Where do you stand on this tradeoff?
        </p>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-3">
            <span className="text-green-400 font-medium">← Full Fairness</span>
            <span className="text-blue-400 font-medium">Full Accuracy →</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={accuracyVsFairness}
            onChange={(e) => setAccuracyVsFairness(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-gradient-to-r from-green-500 to-blue-500 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="text-center mt-2 text-sm font-mono">
            <span className="text-blue-400">Accuracy {accuracyVsFairness}%</span>
            {' / '}
            <span className="text-green-400">Fairness {100 - accuracyVsFairness}%</span>
          </div>
        </div>
      </section>

      {/* Step 3 — Guiding Principle */}
      <section>
        <h3 className="text-lg font-semibold mb-1">3. Select Your Guiding Principle</h3>
        <p className="text-sm text-muted-foreground mb-4">
          What value should drive the model&apos;s behavior?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PRINCIPLES.map((p) => (
            <button
              key={p.value}
              onClick={() => setGuidingPrinciple(p.value)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all',
                guidingPrinciple === p.value
                  ? 'border-primary bg-primary/10 ring-2 ring-primary'
                  : 'border-border bg-card hover:border-primary/50',
              )}
            >
              <div className="font-medium text-sm">{p.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{p.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Step 4 — Confidence */}
      <section>
        <h3 className="text-lg font-semibold mb-1">4. Confidence Rating</h3>
        <p className="text-sm text-muted-foreground mb-4">
          How confident are you in your choices?
        </p>
        <div className="flex items-center gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setConfidence(n)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'w-8 h-8 transition-colors',
                  n <= confidence ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {confidence}/5 — {['', 'Not confident', 'Slightly confident', 'Moderately confident', 'Confident', 'Very confident'][confidence]}
        </p>
      </section>

      {/* Submit */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'px-8 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all',
            canSubmit
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
              : 'bg-secondary text-muted-foreground cursor-not-allowed',
          )}
        >
          <Send className="w-4 h-4" />
          Submit Vote
        </button>
      </div>
    </div>
  );
}
