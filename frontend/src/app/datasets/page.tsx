'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Sparkles, 
  Plus, 
  Layers, 
  Calendar, 
  ShieldCheck,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const res = await api.getDatasets();
      setDatasets(res.datasets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleGenerate = async (count = 6) => {
    try {
      setGenerating(true);
      await api.generateSyntheticDataset(count);
      await loadDatasets();
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-graphite">Datasets & Ground Truth</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Manage training, validation, and held-out test partitions with verified Gold Standard field annotations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleGenerate(6)}
            disabled={generating}
            className="px-4 py-2 rounded-md bg-charcoal text-white hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{generating ? 'Synthesizing...' : 'Generate Synthetic Partition'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {datasets.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-surface border border-borderLight rounded-lg text-xs text-mutedText">
            No datasets found. Click &quot;Generate Synthetic Partition&quot; to initialize a gold benchmark set.
          </div>
        ) : (
          datasets.map((ds) => (
            <div key={ds.id} className="p-5 rounded-lg bg-surface border border-borderLight space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-graphite">{ds.name}</h3>
                  <p className="text-xs text-mutedText mt-0.5">{ds.description}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-surfaceSecondary text-[10px] font-mono border border-borderLight text-graphite">
                  v{ds.version}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-borderLight/60 text-xs">
                <div>
                  <span className="text-mutedText text-[11px] block">Document Count</span>
                  <span className="font-bold text-graphite font-mono">{ds.document_count}</span>
                </div>
                <div>
                  <span className="text-mutedText text-[11px] block">Source Category</span>
                  <span className="font-bold text-graphite capitalize">{ds.source_type}</span>
                </div>
                <div>
                  <span className="text-mutedText text-[11px] block">Gold Standard</span>
                  <span className="text-emerald-700 font-bold">100% Annotated</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-mutedText pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(ds.created_at).toLocaleDateString()}</span>
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  Partition: 30% Held-Out Test
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

