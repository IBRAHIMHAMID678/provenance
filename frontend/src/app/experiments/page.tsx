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
  Sparkles
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-graphite">Experiment Management</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Configure reproducible benchmark runs comparing extraction engines over standardized gold datasets.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-md bg-charcoal text-white hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Experiment</span>
        </button>
      </div>

      {/* Experiment List */}
      <div className="grid grid-cols-2 gap-4">
        {experiments.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-surface border border-borderLight rounded-lg text-xs text-mutedText">
            No experiments created yet. Click &quot;New Experiment&quot; to configure your first benchmark test.
          </div>
        ) : (
          experiments.map((exp) => (
            <div key={exp.id} className="p-5 rounded-lg bg-surface border border-borderLight space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-graphite">{exp.name}</h3>
                  <p className="text-xs text-mutedText mt-0.5">{exp.description}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                  exp.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-700'
                }`}>
                  {exp.status}
                </span>
              </div>

              {/* Methods badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {exp.configuration?.methods?.map((m: string) => (
                  <span key={m} className="px-2 py-0.5 rounded bg-surfaceSecondary border border-borderLight text-[11px] font-mono text-graphite">
                    {m}
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-borderLight flex items-center justify-between text-xs">
                <span className="text-mutedText flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(exp.created_at).toLocaleDateString()}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRun(exp.id)}
                    disabled={runningId === exp.id}
                    className="px-3 py-1 rounded bg-charcoal text-white hover:bg-neutral-800 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40"
                  >
                    <Play className={`w-3 h-3 ${runningId === exp.id ? 'animate-spin' : ''}`} />
                    <span>{runningId === exp.id ? 'Running...' : 'Run Experiment'}</span>
                  </button>
                  <Link
                    href="/evaluation"
                    className="px-2.5 py-1 rounded border border-borderLight text-xs font-medium text-graphite hover:bg-surfaceSecondary"
                  >
                    View Results
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-6 max-w-md w-full border border-borderLight shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-graphite">Create Benchmark Experiment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-graphite block mb-1">Experiment Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hybrid vs LLM Claim Benchmark V1"
                  className="w-full p-2 rounded-md border border-borderLight text-xs text-graphite focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-graphite block mb-1">Engines to Compare</label>
                <div className="space-y-1.5 text-xs text-graphite">
                  {['native_pymupdf', 'hybrid', 'llm', 'multimodal', 'tesseract'].map((m) => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMethods.includes(m)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMethods([...selectedMethods, m]);
                          else setSelectedMethods(selectedMethods.filter(x => x !== m));
                        }}
                      />
                      <span className="font-mono text-[11px]">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded border border-borderLight text-xs text-mutedText hover:text-graphite"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-charcoal text-white hover:bg-neutral-800 text-xs font-medium"
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

