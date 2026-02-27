'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Loader2, ArrowRight, AlertCircle, Database, ExternalLink, Shield } from 'lucide-react';
import { analyzeDataset } from '@/lib/mockAgents/datasetAgent';
import { useAppStore } from '@/store/useAppStore';
import { DatasetSummaryCard } from '@/components/DatasetSummaryCard';
import { SAMPLE_DATASETS, SampleDataset } from '@/lib/sampleDatasets';
import { cn } from '@/lib/utils';

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

export default function UploadPage() {
  const router = useRouter();
  const { datasetAnalysis, setDatasetAnalysis, reset } = useAppStore();

  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewRows, setPreviewRows] = useState<Record<string, string | number | boolean>[]>([]);

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

        if (rows.length === 0) {
          throw new Error('No data rows found in file.');
        }

        setPreviewRows(rows.slice(0, 5));

        const analysis = await analyzeDataset(file.name, rows);
        setDatasetAnalysis(analysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file.');
      } finally {
        setLoading(false);
      }
    },
    [setDatasetAnalysis],
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

  const loadSampleDataset = useCallback(async (dataset: SampleDataset) => {
    setError('');
    setLoading(true);
    try {
      setPreviewRows(dataset.rows.slice(0, 5));
      const analysis = await analyzeDataset(dataset.fileName, dataset.rows);
      setDatasetAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample.');
    } finally {
      setLoading(false);
    }
  }, [setDatasetAnalysis]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Dataset</h1>
        <p className="text-muted-foreground">
          Upload a CSV or JSON file. Our AI Dataset Agent will analyze it for task type,
          sensitive attributes, and risk factors.
        </p>
      </div>

      {/* Upload zone */}
      {!datasetAnalysis && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'relative rounded-xl border-2 border-dashed p-12 text-center transition-all',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              loading && 'pointer-events-none opacity-60',
            )}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">
                  AI Dataset Agent is analyzing your data...
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium mb-1">Drop your dataset here</p>
                <p className="text-sm text-muted-foreground mb-4">CSV or JSON format</p>
                <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors">
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

          {/* Sample Kaggle Datasets */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Or choose a Kaggle fairness dataset</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAMPLE_DATASETS.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => loadSampleDataset(ds)}
                  disabled={loading}
                  className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {ds.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {ds.description}
                  </p>
                  <div className="rounded-lg bg-secondary/80 p-2.5 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-warning mb-1">
                      <AlertCircle className="w-3 h-3" />
                      Why this matters for fairness
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {ds.whyFairness}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{ds.rows.length} rows</span>
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {ds.source}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-danger/10 border border-danger/30 flex items-center gap-3 text-sm text-danger">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Preview rows */}
      {previewRows.length > 0 && !loading && (
        <div className="mt-8 animate-fade-in">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Data Preview (first 5 rows)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary">
                  {Object.keys(previewRows[0]).map((key) => (
                    <th key={key} className="px-3 py-2 text-left font-medium text-muted-foreground">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-t border-border hover:bg-secondary/50">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2 font-mono">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analysis result */}
      {datasetAnalysis && (
        <div className="mt-8 space-y-6">
          <DatasetSummaryCard analysis={datasetAnalysis} />

          <div className="flex justify-between">
            <button
              onClick={() => {
                reset();
                setPreviewRows([]);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Change Dataset
            </button>
            <button
              onClick={() => router.push('/scenarios')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
            >
              Generate Scenarios
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
