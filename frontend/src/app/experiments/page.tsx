'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GitFork, 
  Play, 
  Plus, 
  CheckCircle2, 
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Cpu,
  FlaskConical,
  X
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);

  // New Experiment Form
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['native_pymupdf', 'hybrid', 'llm']);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, dsRes] = await Promise.all([
        api.getExperiments(),
        api.getDatasets()
      ]);
      setExperiments(expRes.experiments || []);
      setDatasets(dsRes.datasets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExperiment(name, selectedMethods);
      setShowModal(false);
      setName('');
      await loadData();
    } catch (err: any) {
      alert(`Create failed: ${err.message}`);
    }
  };

  const handleRun = async (expId: string) => {
    try {
      setRunningId(expId);
      const dsId = datasets.length > 0 ? datasets[0].id : undefined;
      await api.runExperiment(expId, dsId);
      alert('Experiment execution completed! Metrics saved to Evaluation engine.');
      await loadData();
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Benchmarking Engine · Reproducible A/B
            </span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Experiment Matrix & Evaluation Runs
          </h1>
          <p className="text-xs text-white/50 max-w-2xl mt-1">
            Configure reproducible benchmark runs comparing extraction engines over standardized gold datasets.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Experiment</span>
        </button>
      </div>

      {/* Experiment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-16 text-center glass-card rounded-xl border border-white/10 text-xs text-white/40 font-mono">
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Loading benchmark experiment matrix...</span>
            </div>
          </div>
        ) : experiments.length === 0 ? (
          <div className="col-span-2 p-16 text-center glass-card rounded-xl border border-white/10 text-xs text-white/40 font-mono">
            No experiments created yet. Click &quot;New Experiment&quot; to configure your first benchmark test.
          </div>
        ) : (
          experiments.map((exp) => (
            <div 
              key={exp.id} 
              className="glass-card p-5 rounded-xl border border-white/10 hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 space-y-4 shadow-xl group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {exp.name}
                    </h3>
                  </div>
                  <p className="text-xs text-white/50 mt-1 max-w-md">
                    {exp.description || 'Deterministic benchmark trial against held-out insurance ground-truth dataset.'}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  exp.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-white/5 text-white/60 border-white/10'
                }`}>
                  {exp.status}
                </span>
              </div>

              {/* Methods badges */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                  Engines in Trial
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {exp.configuration?.methods?.map((m: string) => (
                    <span 
                      key={m} 
                      className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-cyan-300"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-white/40 font-mono text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-white/30" />
                  <span>{new Date(exp.created_at).toLocaleDateString()}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRun(exp.id)}
                    disabled={runningId === exp.id}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,242,254,0.25)] transition-all disabled:opacity-40"
                  >
                    <Play className={`w-3 h-3 ${runningId === exp.id ? 'animate-spin' : ''}`} />
                    <span>{runningId === exp.id ? 'Evaluating...' : 'Run Experiment'}</span>
                  </button>
                  <Link
                    href="/evaluation"
                    className="px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-all flex items-center gap-1"
                  >
                    <span>View Telemetry</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Spatial Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full border border-cyan-500/30 shadow-[0_0_50px_rgba(0,242,254,0.15)] space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Create Benchmark Experiment</h2>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-white/50 block mb-1.5">
                  Experiment Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hybrid Router vs PyMuPDF Baseline v1"
                  className="w-full p-2.5 rounded-lg bg-[#07080B] border border-white/15 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-white/50 block mb-2">
                  Engines in Trial Matrix
                </label>
                <div className="space-y-2 text-xs">
                  {[
                    { id: 'native_pymupdf', label: 'native_pymupdf (Zero-Cost Vector PDF)' },
                    { id: 'hybrid', label: 'hybrid (Quality Router + RapidOCR PP-OCRv4)' },
                    { id: 'llm', label: 'llm (Few-Shot Prompted JSON Extraction)' },
                    { id: 'multimodal', label: 'multimodal (Vision LLM / Fallback)' },
                    { id: 'tesseract', label: 'tesseract (Host CLI Engine)' }
                  ].map((engine) => (
                    <label 
                      key={engine.id} 
                      className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                        selectedMethods.includes(engine.id)
                          ? 'border-cyan-500/40 bg-cyan-500/10 text-white'
                          : 'border-white/5 bg-white/[0.02] text-white/50 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMethods.includes(engine.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMethods([...selectedMethods, engine.id]);
                          else setSelectedMethods(selectedMethods.filter(x => x !== engine.id));
                        }}
                        className="rounded border-white/20 text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-[#07080B]"
                      />
                      <span className="font-mono text-[11px]">{engine.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-xs shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
