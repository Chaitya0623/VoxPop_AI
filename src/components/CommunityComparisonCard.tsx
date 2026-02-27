'use client';

// ============================================================
// VoxPop AI — Community Comparison Card
// ============================================================
// Shows how the user's personal values compare to the community
// consensus, with visual bars for weight comparison and a
// Monte Carlo allocation comparison.
// ============================================================

import { PersonalRecommendation, CommunityRecommendation, MonteCarloResult } from '@/lib/types';
import { Users, User, ArrowRight, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  personal: PersonalRecommendation;
  community: CommunityRecommendation;
}

function WeightComparisonBar({
  label,
  userValue,
  communityValue,
  color,
}: {
  label: string;
  userValue: number;
  communityValue: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          You: {userValue}% | Community: {communityValue}%
        </span>
      </div>
      <div className="relative h-4 rounded-full bg-border overflow-hidden">
        {/* Community bar (behind) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-30"
          style={{ width: `${communityValue}%`, backgroundColor: color }}
        />
        {/* User bar (front) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${userValue}%`, backgroundColor: color }}
        />
        {/* Community marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/60"
          style={{ left: `${communityValue}%` }}
          title={`Community: ${communityValue}%`}
        />
      </div>
    </div>
  );
}

function AllocationComparison({
  personal,
  community,
}: {
  personal: MonteCarloResult;
  community: MonteCarloResult;
}) {
  const groups = personal.optimalAllocation.map((arm) => arm.groupName);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Scale className="w-4 h-4" />
        Allocation Comparison
      </h4>
      {groups.map((groupName) => {
        const personalAlloc = personal.optimalAllocation.find((a) => a.groupName === groupName);
        const communityAlloc = community.optimalAllocation.find((a) => a.groupName === groupName);
        const pVal = personalAlloc ? personalAlloc.allocation * 100 : 0;
        const cVal = communityAlloc ? communityAlloc.allocation * 100 : 0;
        const diff = pVal - cVal;

        return (
          <div key={groupName} className="flex items-center gap-3 text-sm">
            <span className="w-40 truncate font-medium">{groupName}</span>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-primary" />
                <span className="font-mono text-xs">{pVal.toFixed(0)}%</span>
              </div>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-accent" />
                <span className="font-mono text-xs">{cVal.toFixed(0)}%</span>
              </div>
              <span
                className={cn(
                  'text-xs font-mono',
                  diff > 2 ? 'text-green-400' : diff < -2 ? 'text-red-400' : 'text-muted-foreground',
                )}
              >
                ({diff > 0 ? '+' : ''}{diff.toFixed(0)}pp)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CommunityComparisonCard({ personal, community }: Props) {
  const divergence = personal.communityComparison?.divergencePercent ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border-2 border-background">
            <Users className="w-4 h-4 text-accent" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold">Your Values vs Community</h3>
          <p className="text-xs text-muted-foreground">
            How your preferences compare to the community consensus
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold',
              divergence < 5
                ? 'bg-green-500/20 text-green-400'
                : divergence < 15
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-red-500/20 text-red-400',
            )}
          >
            {divergence < 5 ? 'Aligned' : divergence < 15 ? 'Moderate Divergence' : 'High Divergence'}
          </span>
        </div>
      </div>

      {/* Weight Comparison */}
      <div className="space-y-4 mb-6">
        <WeightComparisonBar
          label="Accuracy"
          userValue={personal.userWeights.accuracy}
          communityValue={community.communityWeights.accuracy}
          color="#3b82f6"
        />
        <WeightComparisonBar
          label="Fairness"
          userValue={personal.userWeights.fairness}
          communityValue={community.communityWeights.fairness}
          color="#22c55e"
        />
        <WeightComparisonBar
          label="Robustness"
          userValue={personal.userWeights.robustness}
          communityValue={community.communityWeights.robustness}
          color="#f59e0b"
        />
      </div>

      {/* Allocation Comparison */}
      {community.monteCarloResult && (
        <AllocationComparison
          personal={personal.monteCarloResult}
          community={community.monteCarloResult}
        />
      )}

      {/* Description */}
      {personal.communityComparison && (
        <div className="mt-4 rounded-lg bg-secondary/50 p-3">
          <p className="text-sm text-muted-foreground">
            {personal.communityComparison.description}
          </p>
        </div>
      )}
    </div>
  );
}
