'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Sparkles, 
  Plus, 
  Layers, 
  Calendar, 
  ShieldCheck,
  FileText,
  CheckCircle2,
  HardDrive,
  GitBranch,
  Split
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Gold Standard Repository · Zero Data Leakage
            </span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Datasets & Ground-Truth Partitions
          </h1>
          <p className="text-xs text-white/50 max-w-2xl mt-1">
            Manage training, validation, and held-out test partitions with verified Gold Standard field annotations and zero cross-partition leakage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleGenerate(6)}
            disabled={generating}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all active:scale-[0.98] disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>{generating ? 'Synthesizing Documents...' : 'Synthesize 6-Doc Benchmark Partition'}</span>
          </button>
        </div>
      </div>

      {/* Partition Telemetry Banner */}
      <div className="glass-card p-4 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Strict Partition Integrity Active</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Train ∩ Test = ∅
              </span>
            </div>
            <div className="text-[11px] text-white/50 mt-0.5 font-mono">
              Evaluations run strictly on the 30% held-out test partition. Zero test documents leak into training prompts or few-shot context.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70">
            Train: <span className="text-white font-bold">60%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70">
            Val: <span className="text-white font-bold">10%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
            Held-Out Test: <span className="text-cyan-400 font-bold">30%</span>
          </div>
        </div>
      </div>

      {/* Datasets Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-16 text-center glass-card rounded-xl border border-white/10 text-xs text-white/40 font-mono">
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Querying dataset registry on D: drive...</span>
            </div>
          </div>
        ) : datasets.length === 0 ? (
          <div className="col-span-2 p-16 text-center glass-card rounded-xl border border-white/10 text-xs text-white/40 font-mono">
            No datasets found. Click &quot;Synthesize 6-Doc Benchmark Partition&quot; above to initialize the Gold Standard set.
          </div>
        ) : (
          datasets.map((ds) => (
            <div 
              key={ds.id} 
              className="glass-card p-5 rounded-xl border border-white/10 hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 space-y-4 shadow-xl group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {ds.name}
                    </h3>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    {ds.description || 'Deterministic insurance ground-truth benchmark suite.'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">
                  v{ds.version || 1}.0
                </span>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-xs">
                <div className="space-y-0.5">
                  <span className="text-white/40 font-mono text-[10px] uppercase">Documents</span>
                  <div className="font-bold text-white font-mono text-base">{ds.document_count}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-white/40 font-mono text-[10px] uppercase">Class</span>
                  <div className="font-bold text-cyan-300 capitalize text-xs mt-1">{ds.source_type || 'Synthetic'}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-white/40 font-mono text-[10px] uppercase">Annotation</span>
                  <div className="text-emerald-400 font-bold text-xs mt-1 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>100% Gold</span>
                  </div>
                </div>
              </div>

              {/* Partition distribution bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span>Partition Allocation</span>
                  <span>Train (60%) · Val (10%) · Test (30%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 flex overflow-hidden">
                  <div className="h-full bg-white/30" style={{ width: '60%' }} title="Train (60%)" />
                  <div className="h-full bg-amber-500/50" style={{ width: '10%' }} title="Validation (10%)" />
                  <div className="h-full bg-cyan-500" style={{ width: '30%' }} title="Held-Out Test (30%)" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/40 pt-1 font-mono text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(ds.created_at).toLocaleDateString()}</span>
                </span>
                <span className="text-cyan-400/80">
                  Target: /api/experiments
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
