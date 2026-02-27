'use client';

// ============================================================
// VoxPop AI — Value-Based Survey Form
// ============================================================
// Contextual value questions generated from structural asymmetry
// detection. No scenario selection — just answer value questions
// and get your personalized recommendation.
// ============================================================

import { useState } from 'react';
import { ValueQuestion, ValueResponse, SurveyResponse, GuidingPrinciple } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Send, Star, ChevronRight, ChevronLeft, Sparkles, MessageCircle } from 'lucide-react';
import {
  inferObjectiveWeights,
  computeAccuracyVsFairness,
  inferGuidingPrinciple,
} from '@/lib/preferenceInference';

interface Props {
  valueQuestions: ValueQuestion[];
  onSubmit: (response: Omit<SurveyResponse, 'id' | 'timestamp'>) => void;
}

const LIKERT_LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

export function ValueSurveyForm({ valueQuestions, onSubmit }: Props) {
  const [step, setStep] = useState(0); // 0..N-1 = value questions, N = confidence
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [confidence, setConfidence] = useState(3);
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = valueQuestions.length + 1; // questions + confidence

  const setResponse = (questionId: string, answer: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: answer }));
  };

  const currentQuestion = step < valueQuestions.length
    ? valueQuestions[step]
    : null;

  const canProceed = () => {
    if (currentQuestion) return responses[currentQuestion.id] !== undefined;
    return true; // confidence step always valid
  };

  const handleSubmit = () => {
    // Build value responses
    const valueResponses: ValueResponse[] = valueQuestions.map((q) => ({
      questionId: q.id,
      answer: responses[q.id] ?? 3, // default neutral
    }));

    // Infer weights from value responses
    const inferredWeights = inferObjectiveWeights(valueQuestions, valueResponses);
    const accuracyVsFairness = computeAccuracyVsFairness(inferredWeights);
    const guidingPrinciple = inferGuidingPrinciple(inferredWeights);

    onSubmit({
      selectedScenarioId: 'value-survey',
      accuracyVsFairness,
      guidingPrinciple,
      confidenceRating: confidence,
      valueResponses,
      inferredWeights,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="animate-fade-in text-center py-16">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Values Recorded!</h3>
        <p className="text-muted-foreground mb-2">
          Your personal recommendation is being computed...
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Scroll down to see your personalized allocation based on your values.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setStep(0);
            setResponses({});
            setConfidence(3);
          }}
          className="px-6 py-2.5 rounded-lg bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
        >
          Submit Another Response
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress indicator */}
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full flex-1 transition-colors',
              i <= step ? 'bg-primary' : 'bg-border',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Question {step + 1} of {totalSteps}
      </p>

      {/* Value Questions */}
      {currentQuestion && (
        <section className="animate-fade-in">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Question {step + 1} of {valueQuestions.length}
              </h3>
              {currentQuestion.relatedAsymmetry && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning">
                  Related to: {currentQuestion.relatedAsymmetry}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-base font-medium leading-relaxed mb-6">
              {currentQuestion.question}
            </p>

            {currentQuestion.type === 'likert' ? (
              <div className="space-y-2">
                {LIKERT_LABELS.map((label, i) => {
                  const value = i + 1;
                  const isSelected = responses[currentQuestion.id] === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setResponse(currentQuestion.id, value)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3',
                        isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary'
                          : 'border-border hover:border-primary/50 hover:bg-card/80',
                      )}
                    >
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                          isSelected ? 'border-primary' : 'border-muted-foreground/40',
                        )}
                      >
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{value}. {label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 1, label: 'Yes', color: 'bg-green-500/10 border-green-500/30 hover:border-green-500' },
                  { value: 0, label: 'No', color: 'bg-red-500/10 border-red-500/30 hover:border-red-500' },
                ].map((opt) => {
                  const isSelected = responses[currentQuestion.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setResponse(currentQuestion.id, opt.value)}
                      className={cn(
                        'px-6 py-4 rounded-xl border text-center font-semibold text-lg transition-all',
                        isSelected
                          ? 'ring-2 ring-primary border-primary bg-primary/10'
                          : opt.color,
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Maps-to indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  currentQuestion.mapsTo === 'fairness'
                    ? 'bg-green-500'
                    : currentQuestion.mapsTo === 'accuracy'
                    ? 'bg-blue-500'
                    : 'bg-amber-500',
                )}
              />
              This question informs the {currentQuestion.mapsTo} dimension
            </div>
          </div>
        </section>
      )}

      {/* Final Step — Confidence */}
      {step === totalSteps - 1 && (
        <section className="animate-fade-in">
          <h3 className="text-lg font-semibold mb-1">How confident are you in your answers?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Rate how certain you feel about the values you expressed above.
          </p>
          <div className="rounded-xl border border-border bg-card p-6">
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
          </div>
        </section>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className={cn(
            'px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all',
            step > 0
              ? 'bg-secondary text-foreground hover:bg-secondary/80'
              : 'bg-secondary/50 text-muted-foreground cursor-not-allowed',
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {step < totalSteps - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className={cn(
              'px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all',
              canProceed()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-secondary text-muted-foreground cursor-not-allowed',
            )}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
          >
            <Send className="w-4 h-4" />
            Submit Vote
          </button>
        )}
      </div>
    </div>
  );
}
