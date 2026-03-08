'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  CheckCircle2,
  Target,
  Crosshair,
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
import { AutoMLResult, CommunityRecommendation, DatasetDecision, ObjectiveWeights } from '@/lib/types';

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

// Analysis pipeline steps for the loader
const ANALYSIS_STEPS = [
  { label: 'Parsing data schema & columns', icon: Database },
  { label: 'Detecting sensitive attributes', icon: Shield },
  { label: 'Analyzing structural asymmetries', icon: Brain },
  { label: 'Generating fairness scenarios', icon: Crosshair },
  { label: 'Running AutoML model selection', icon: BarChart3 },
  { label: 'Seeding community votes', icon: Target },
  { label: 'Computing community recommendation', icon: Sparkles },
];

export default function DatasetsPage() {
  const router = useRouter();
  const {
    setDatasetAnalysis,
    setStructuralAsymmetries,
    setScenarios,
    setScenarioAutoMLResults,
    setValueQuestions,
    addResponse,
    setRecommendation,
    reset,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null);

  // Decision picker state
  const [pendingDataset, setPendingDataset] = useState<SampleDataset | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DatasetDecision | null>(null);

  // Step-by-step loader state
  const [currentStep, setCurrentStep] = useState(0);
  const stepRef = useRef(0);

  const advanceStep = () => {
    stepRef.current = Math.min(stepRef.current + 1, ANALYSIS_STEPS.length);
    setCurrentStep(stepRef.current);
  };

  const selectAndAnalyze = useCallback(
    async (dataset: SampleDataset, decision: DatasetDecision | null) => {
      setError('');
      setSelectedId(dataset.id);
      setAnalyzing(true);
      stepRef.current = 0;
      setCurrentStep(0);

      try {
        // Reset previous data
        reset();

        // Step 1: Analyze dataset
        advanceStep();
        const analysis = await analyzeDataset(dataset.fileName, dataset.rows, decision);
        setDatasetAnalysis(analysis);

        // Step 2: Detect structural asymmetries
        advanceStep();
        let asymmetries = detectStructuralAsymmetries(analysis, dataset.rows);
        asymmetries = enrichWithDatasetContext(asymmetries, analysis.fileName);
        setStructuralAsymmetries(asymmetries);

        // Step 3: Generate scenarios + value questions in parallel
        advanceStep();
        const [generated, questions] = await Promise.all([
          generateScenarios(analysis),
          generateValueQuestions(analysis, asymmetries),
        ]);
        setScenarios(generated);
        setValueQuestions(questions);

        // Step 4: Run AutoML for each scenario
        advanceStep();
        const hint = detectDatasetHint(analysis.fileName);
        const results: Record<string, AutoMLResult> = {};
        for (const s of generated) {
          results[s.id] = await runAutoML(s.weights, s.id, hint);
        }
        setScenarioAutoMLResults(results);

        // Step 5: Seed sample community votes so dashboard has data
        advanceStep();
        const sampleVotes = generateSampleVotes(15);
        sampleVotes.forEach((sv) => addResponse(sv));

        // Step 6: Compute community recommendation
        advanceStep();
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

        // All done
        advanceStep();
        await new Promise((r) => setTimeout(r, 400));

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze dataset.');
      } finally {
        setAnalyzing(false);
        setSelectedId(null);
        setPendingDataset(null);
        setSelectedDecision(null);
      }
    },
    [reset, setDatasetAnalysis, setStructuralAsymmetries, setScenarios, setValueQuestions, setScenarioAutoMLResults, addResponse, setRecommendation, router],
  );

  const processFile = useCallback(
    async (file: File) => {
      setError('');
      setLoading(true);
      stepRef.current = 0;
      setCurrentStep(0);
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
        advanceStep();
        const analysis = await analyzeDataset(file.name, rows);
        setDatasetAnalysis(analysis);

        advanceStep();
        let asymmetries = detectStructuralAsymmetries(analysis, rows);
        asymmetries = enrichWithDatasetContext(asymmetries, analysis.fileName);
        setStructuralAsymmetries(asymmetries);

        advanceStep();
        const [generated, questions] = await Promise.all([
          generateScenarios(analysis),
          generateValueQuestions(analysis, asymmetries),
        ]);
        setScenarios(generated);
        setValueQuestions(questions);

        advanceStep();
        const sampleVotes = generateSampleVotes(15);
        sampleVotes.forEach((sv) => addResponse(sv));

        advanceStep();
        await new Promise((r) => setTimeout(r, 300));
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

      {/* ── Step-by-Step Analysis Overlay ── */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center">
          <div className="max-w-md w-full mx-4 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-1">Analyzing Dataset</h2>
              <p className="text-sm text-muted-foreground">
                {pendingDataset?.name || 'Your file'}{selectedDecision ? ` — ${selectedDecision.name}` : ''}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-border rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / ANALYSIS_STEPS.length) * 100}%` }}
              />
            </div>

            {/* Step list */}
            <div className="space-y-3">
              {ANALYSIS_STEPS.map((step, i) => {
                const isActive = i === currentStep - 1;
                const isDone = i < currentStep - 1;
                const isPending = i >= currentStep;
                const StepIcon = step.icon;

                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300',
                      isActive && 'bg-primary/10 border border-primary/30',
                      isDone && 'opacity-60',
                      isPending && 'opacity-30',
                    )}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <StepIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      isActive && 'text-primary',
                      isDone && 'text-green-400',
                      isPending && 'text-muted-foreground',
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Current step indicator */}
            <div className="mt-6 text-center">
              <span className="text-xs text-muted-foreground font-mono">
                Step {Math.min(currentStep, ANALYSIS_STEPS.length)} of {ANALYSIS_STEPS.length}
              </span>
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

      {/* ── Decision Picker Modal ── */}
      {pendingDataset && !isProcessing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-card border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-border bg-secondary/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Choose a Decision Lens</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground">{pendingDataset.name}</span> — What question should the AI answer?
                  </p>
                </div>
                <button
                  onClick={() => { setPendingDataset(null); setSelectedDecision(null); }}
                  className="text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Decision options */}
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {pendingDataset.decisions.map((dec) => (
                <button
                  key={dec.id}
                  onClick={() => setSelectedDecision(dec)}
                  className={cn(
                    'w-full text-left rounded-xl border p-4 transition-all',
                    selectedDecision?.id === dec.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40 hover:bg-card/80',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      selectedDecision?.id === dec.id ? 'bg-primary/20' : 'bg-secondary',
                    )}>
                      <Crosshair className={cn(
                        'w-4 h-4',
                        selectedDecision?.id === dec.id ? 'text-primary' : 'text-muted-foreground',
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{dec.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{dec.description}</p>
                      {/* Objectives */}
                      <div className="flex flex-wrap gap-1.5">
                        {dec.objectives.map((obj, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-border bg-secondary/20 flex items-center justify-end gap-3">
              <button
                onClick={() => { setPendingDataset(null); setSelectedDecision(null); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingDataset) {
                    selectAndAnalyze(pendingDataset, selectedDecision);
                  }
                }}
                disabled={!selectedDecision}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all',
                  selectedDecision
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary text-muted-foreground cursor-not-allowed',
                )}
              >
                Analyze with this lens
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
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
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {ds.decisions.length} decisions
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      {ds.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setPendingDataset(ds); setSelectedDecision(null); }}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      <BarChart3 className="w-4 h-4" />
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
                  {/* Decisions preview */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
                      <Crosshair className="w-3.5 h-3.5" />
                      Available Decision Lenses
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {ds.decisions.map((dec) => (
                        <div key={dec.id} className="rounded-lg border border-border bg-card/50 p-3">
                          <h4 className="text-xs font-semibold mb-1">{dec.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{dec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

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
