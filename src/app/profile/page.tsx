'use client';

import { useAppStore } from '@/store/useAppStore';
import { User, Database, MessageSquare, BarChart3, Clock, Scale, Trash2, Brain } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const {
    responses,
    personalRecommendation,
    reset,
  } = useAppStore();

  // Get user's own responses (not seeded ones — those have 'sample' prefix)
  const userResponses = responses.filter((r) => !r.id.startsWith('sample-'));
  const seededCount = responses.length - userResponses.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground text-sm">Your activity and preferences on VoxPop AI</p>
          </div>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MessageSquare className="w-4 h-4" />
            Surveys Taken
          </div>
          <div className="text-2xl font-bold font-mono text-primary">{userResponses.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Scale className="w-4 h-4" />
            Fairness Weight
          </div>
          <div className="text-2xl font-bold font-mono text-green-400">
            {personalRecommendation ? `${personalRecommendation.userWeights.fairness}%` : '—'}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Brain className="w-4 h-4" />
            Accuracy Weight
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {personalRecommendation ? `${personalRecommendation.userWeights.accuracy}%` : '—'}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <BarChart3 className="w-4 h-4" />
            Community Size
          </div>
          <div className="text-2xl font-bold font-mono">{responses.length}</div>
        </div>
      </div>

      {/* Current inferred values */}
      {personalRecommendation && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Your Inferred Values</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Based on your most recent survey responses, here is how the platform understands your priorities:
          </p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Accuracy', value: personalRecommendation.userWeights.accuracy, color: 'bg-blue-500', textColor: 'text-blue-400' },
              { label: 'Fairness', value: personalRecommendation.userWeights.fairness, color: 'bg-green-500', textColor: 'text-green-400' },
              { label: 'Robustness', value: personalRecommendation.userWeights.robustness, color: 'bg-amber-500', textColor: 'text-amber-400' },
            ].map((w) => (
              <div key={w.label} className="rounded-lg bg-card border border-border p-4 text-center">
                <div className={cn('w-3 h-3 rounded-full mx-auto mb-2', w.color)} />
                <div className={cn('text-2xl font-bold font-mono', w.textColor)}>{w.value}%</div>
                <div className="text-xs text-muted-foreground">{w.label}</div>
              </div>
            ))}
          </div>
          {personalRecommendation.communityComparison && (
            <p className="text-sm text-muted-foreground">
              {personalRecommendation.communityComparison.description}
            </p>
          )}
        </div>
      )}

      {/* Survey response history */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Survey History</h2>
        {userResponses.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              You haven&apos;t taken any surveys yet.
            </p>
            <Link
              href="/survey"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
            >
              Take Your First Survey
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {userResponses.map((r, i) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">#{i + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        Survey Response
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(r.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-1 rounded-full bg-secondary">
                      Confidence: {r.confidenceRating}/5
                    </span>
                    {r.inferredWeights && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">A:{r.inferredWeights.accuracy}%</span>
                        <span className="text-green-400">F:{r.inferredWeights.fairness}%</span>
                        <span className="text-amber-400">R:{r.inferredWeights.robustness}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
        <Link
          href="/datasets"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
        >
          <Database className="w-4 h-4" />
          Explore Datasets
        </Link>
        <Link
          href="/survey"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Take Another Survey
        </Link>
        <button
          onClick={() => {
            if (confirm('This will clear all your data. Are you sure?')) {
              reset();
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-danger/30 text-danger font-medium text-sm hover:bg-danger/10 transition-colors ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          Reset All Data
        </button>
      </div>
    </div>
  );
}
