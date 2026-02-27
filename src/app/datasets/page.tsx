'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  Loader2,
  ArrowRight,
  AlertCircle,
  Database,
  ExternalLink,
  Shield,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react';
import { analyzeDataset } from '@/lib/mockAgents/datasetAgent';
import { detectStructuralAsymmetries, enrichWithDatasetContext } from '@/lib/structuralAnalysis';
import { generateScenarios } from '@/lib/mockAgents/scenarioAgent';
import { generateValueQuestions } from '@/lib/mockAgents/valueQuestionAgent';
import { runAutoML, detectDatasetHint } from '@/lib/automl/simulatedAutoML';
import { generateSampleVotes } from '@/lib/sampleVotes';
import { computeCommunityWeights } from '@/lib/analytics';
import { runMonteCarloAllocation } from '@/lib/automl/monteCarloAllocator';
import { useAppStore } from '@/store/useAppStore';
import { SAMPLE_DATASETS, SampleDataset } from '@/lib/sampleDatasets';
import { cn } from '@/lib/utils';
import { AutoMLResult, CommunityRecommendation, ObjectiveWeights } from '@/lib/types';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row;
  });
}

function generateJustification(weights: ObjectiveWeights): string {
  const dominant =
    weights.accuracy >= weights.fairness && weights.accuracy >= weights.robustness
      ? 'accuracy'
      : weights.fairness >= weights.robustness
      ? 'fairness'
      : 'robustness';
  const map: Record<string, string> = {
    accuracy: `Community preferences lean toward predictive performance, with accuracy weighted at ${weights.accuracy}%.`,
    fairness: `Community has expressed a strong preference for equitable outcomes, with fairness weighted at ${weights.fairness}%.`,
    robustness: `Community values model stability and reliability, with robustness weighted at ${weights.robustness}%.`,
  };
  return map[dominant];
}

export default function DatasetsPage() {
  const router = useRouter();
  const {
    datasetAnalysis,
    setDatasetAnalysis,
    setStructuralAsymmetries,
    setScenarios,
    setScenarioAutoMLResults,
    setValueQuestions,
    addResponse,
    setRecommendation,
    responses,
    reset,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null);

  const selectAndAnalyze = useCallback(
    async (dataset: SampleDataset) => {
      setError('');
      setSelectedId(dataset.id);
      setAnalyzing(true);

      try {
        // Reset previous data
        reset();

        // Step 1: Analyze dataset
        const analysis = await analyzeDataset(dataset.fileName, dataset.rows);
        setDatasetAnalysis(analysis);

        // Step 2: Detect structural asymmetries
        let asymmetries = detectStructuralAsymmetries(analysis, dataset.rows);
        asymmetries = enrichWithDatasetContext(asymmetries, analysis.fileName);
        setStructuralAsymmetries(asymmetries);

        // Step 3: Generate scenarios + value questions in parallel
        const [generated, questions] = await Promise.all([
          generateScenarios(analysis),
          generateValueQuestions(analysis, asymmetries),
        ]);
        setScenarios(generated);
        setValueQuestions(questions);

        // Step 4: Run AutoML for each scenario
        const hint = detectDatasetHint(analysis.fileName);
        const results: Record<string, AutoMLResult> = {};
        for (const s of generated) {
          results[s.id] = await runAutoML(s.weights, s.id, hint);
        }
        setScenarioAutoMLResults(results);

        // Step 5: Seed sample community votes so dashboard has data
        const sampleVotes = generateSampleVotes(15);
        sampleVotes.forEach((sv) => addResponse(sv));

        // Step 6: Compute community recommendation
        const allResponses = [...useAppStore.getState().responses];
        const communityWeights = computeCommunityWeights(allResponses);
        const primaryAsymmetry = asymmetries[0] || null;
        const [autoMLResult, mcResult] = await Promise.all([
          runAutoML(communityWeights, 'community', hint),
          runMonteCarloAllocation(communityWeights, primaryAsymmetry, 200, 'community'),
        ]);
        const rec: CommunityRecommendation = {
          communityWeights,
          autoMLResult,
          justification: generateJustification(communityWeights),
          supportPercentage: 72,
          monteCarloResult: mcResult,
        };
        setRecommendation(rec);

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze dataset.');
      } finally {
        setAnalyzing(false);
        setSelectedId(null);
      }
    },
    [reset, setDatasetAnalysis, setStructuralAsymmetries, setScenarios, setValueQuestions, setScenarioAutoMLResults, addResponse, setRecommendation, router],
  );

  const processFile = useCallback(
    async (file: File) => {
      setError('');
      setLoading(true);
      try {
        const text = await file.text();
        let rows: Record<string, string | number | boolean>[];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          rows = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          rows = parseCSV(text);
        }

        if (rows.length === 0) throw new Error('No data rows found in file.');

        reset();
        const analysis = await analyzeDataset(file.name, rows);
        setDatasetAnalysis(analysis);

        let asymmetries = detectStructuralAsymmetries(analysis, rows);
        asymmetries = enrichWithDatasetContext(asymmetries, analysis.fileName);
        setStructuralAsymmetries(asymmetries);

        const [generated, questions] = await Promise.all([
          generateScenarios(analysis),
          generateValueQuestions(analysis, asymmetries),
        ]);
        setScenarios(generated);
        setValueQuestions(questions);

        const sampleVotes = generateSampleVotes(15);
        sampleVotes.forEach((sv) => addResponse(sv));

        router.push('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file.');
      } finally {
        setLoading(false);
      }
    },
    [reset, setDatasetAnalysis, setStructuralAsymmetries, setScenarios, setValueQuestions, addResponse, router],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const isProcessing = loading || analyzing;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Datasets</h1>
        <p className="text-muted-foreground">
          Choose a dataset to explore how AI models treat different groups. Each dataset highlights a real-world fairness challenge.
        </p>
      </div>

      {/* Analyzing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4 animate-fade-in">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div>
              <p className="text-lg font-semibold">Analyzing dataset...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Detecting structural biases, generating insights & computing community recommendations
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 flex items-center gap-3 text-sm text-danger">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Dataset Cards */}
      <div className="space-y-4 mb-10">
        {SAMPLE_DATASETS.map((ds) => {
          const isExpanded = expandedDataset === ds.id;
          return (
            <div
              key={ds.id}
              className={cn(
                'rounded-xl border bg-card overflow-hidden transition-all',
                isExpanded ? 'border-primary/50' : 'border-border hover:border-primary/30',
              )}
            >
              {/* Card header - always visible */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        ds.domain === 'Criminal Justice' ? 'bg-red-500/10' :
                        ds.domain === 'Economics' ? 'bg-blue-500/10' :
                        'bg-green-500/10',
                      )}>
                        <Shield className={cn(
                          'w-4.5 h-4.5',
                          ds.domain === 'Criminal Justice' ? 'text-red-400' :
                          ds.domain === 'Economics' ? 'text-blue-400' :
                          'text-green-400',
                        )} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{ds.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-full bg-secondary">{ds.domain}</span>
                          <span>{ds.rows.length} rows · {ds.columns.length} features</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      {ds.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => selectAndAnalyze(ds)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {analyzing && selectedId === ds.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <BarChart3 className="w-4 h-4" />
                      )}
                      Analyze
                    </button>
                    <button
                      onClick={() => setExpandedDataset(isExpanded ? null : ds.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors justify-center"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded section */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-4 bg-secondary/30 animate-fade-in space-y-4">
                  {/* Why fairness matters */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-warning mb-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Why this matters for fairness
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {ds.whyFairness}
                    </p>
                  </div>

                  {/* Problem statement */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1.5">
                      <Brain className="w-3.5 h-3.5" />
                      Problem Statement
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {ds.problemStatement}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                      Target: <span className="font-semibold text-foreground">{ds.targetColumn}</span>
                    </span>
                    {ds.sensitiveAttributes.map((attr) => (
                      <span key={attr} className="text-xs px-2 py-1 rounded-full bg-warning/15 text-warning">
                        Sensitive: {attr}
                      </span>
                    ))}
                    <a
                      href={ds.kaggleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded-full bg-secondary text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Kaggle
                    </a>
                  </div>

                  {/* Data preview */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Sample rows</p>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-secondary">
                            {ds.columns.slice(0, 7).map((col) => (
                              <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                            {ds.columns.length > 7 && (
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">...</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {ds.rows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t border-border hover:bg-secondary/50">
                              {ds.columns.slice(0, 7).map((col) => (
                                <td key={col} className="px-3 py-2 font-mono whitespace-nowrap">
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                              {ds.columns.length > 7 && (
                                <td className="px-3 py-2 text-muted-foreground">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload your own section */}
      <div className="border-t border-border pt-8">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <Upload className="w-4 h-4" />
          Upload your own dataset
          {showUpload ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showUpload && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'rounded-xl border-2 border-dashed p-8 text-center transition-all animate-fade-in',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              isProcessing && 'pointer-events-none opacity-60',
            )}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Processing your dataset...</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-sm mb-1">Drop your CSV or JSON file here</p>
                <p className="text-xs text-muted-foreground mb-3">
                  We&apos;ll automatically detect columns, sensitive attributes, and potential biases
                </p>
                <label className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors">
                  <FileText className="w-4 h-4" />
                  Choose File
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
