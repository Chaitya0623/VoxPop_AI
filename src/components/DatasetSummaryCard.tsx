'use client';

import { DatasetAnalysis } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Database,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Target,
  Shield,
} from 'lucide-react';

interface Props {
  analysis: DatasetAnalysis;
}

export function DatasetSummaryCard({ analysis }: Props) {
  const riskColors = {
    low: 'text-success border-success/30 bg-success/10',
    medium: 'text-warning border-warning/30 bg-warning/10',
    high: 'text-danger border-danger/30 bg-danger/10',
  };

  const RiskIcon = {
    low: CheckCircle2,
    medium: AlertCircle,
    high: AlertTriangle,
  }[analysis.riskAssessment.level];

  return (
    <div className="animate-fade-in rounded-xl border border-border bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{analysis.fileName}</h3>
            <p className="text-sm text-muted-foreground">
              {analysis.rowCount.toLocaleString()} rows × {analysis.columnCount} columns
            </p>
          </div>
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border',
            riskColors[analysis.riskAssessment.level],
          )}
        >
          {analysis.riskAssessment.level.toUpperCase()} RISK
        </span>
      </div>

      {/* Task & Target */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Target className="w-4 h-4" />
            Task Type
          </div>
          <p className="font-medium capitalize">{analysis.taskType}</p>
        </div>
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Database className="w-4 h-4" />
            Target
          </div>
          <p className="font-medium font-mono text-sm">{analysis.targetColumn}</p>
        </div>
      </div>

      {/* Sensitive Attributes */}
      {analysis.sensitiveAttributes.length > 0 && (
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Shield className="w-4 h-4" />
            Sensitive Attributes Detected
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.sensitiveAttributes.map((attr) => (
              <span
                key={attr}
                className="px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-medium border border-warning/20"
              >
                {attr}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      <div className={cn('rounded-lg p-4 border', riskColors[analysis.riskAssessment.level])}>
        <div className="flex items-center gap-2 mb-2">
          <RiskIcon className="w-5 h-5" />
          <span className="font-semibold text-sm">Risk Assessment</span>
        </div>
        <p className="text-sm mb-2">{analysis.riskAssessment.summary}</p>
        <ul className="space-y-1">
          {analysis.riskAssessment.details.map((d, i) => (
            <li key={i} className="text-xs opacity-80 flex items-start gap-1.5">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      {/* Suggested Tradeoffs */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Suggested Tradeoff Dimensions</h4>
        <div className="flex flex-wrap gap-2">
          {analysis.suggestedTradeoffs.map((t) => (
            <span
              key={t}
              className="px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
