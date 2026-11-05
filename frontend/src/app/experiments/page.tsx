'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Play, 
  Calendar, 
  FlaskConical, 
  ArrowUpRight, 
  X 
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
              Benchmarking Engine · Reproducible A/B
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Experiment Matrix & Evaluation Runs
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Configure reproducible benchmark runs comparing extraction engines over standardized gold datasets.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Experiment</span>
        </Button>
      </div>

      {/* Experiment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <Card className="col-span-2 p-16 text-center text-xs text-slate-400 font-mono">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Loading benchmark experiment matrix...</span>
            </div>
          </Card>
        ) : experiments.length === 0 ? (
          <Card className="col-span-2 p-16 text-center text-xs text-slate-400 font-mono">
            No experiments created yet. Click &quot;New Experiment&quot; to configure your first benchmark test.
          </Card>
        ) : (
          experiments.map((exp) => (
            <Card key={exp.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-semibold text-white">
                      {exp.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    {exp.description || 'Deterministic benchmark trial against held-out insurance ground-truth dataset.'}
                  </p>
                </div>
                <Badge variant={exp.status === 'completed' ? 'success' : 'neutral'}>
                  {exp.status}
                </Badge>
              </div>

              {/* Methods badges */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Engines in Trial
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {exp.configuration?.methods?.map((m: string) => (
                    <Badge key={m} variant="neutral">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(exp.created_at).toLocaleDateString()}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRun(exp.id)}
                    loading={runningId === exp.id}
                  >
                    <Play className="w-3 h-3" />
                    <span>Run Experiment</span>
                  </Button>
                  <Link href="/evaluation">
                    <Button variant="secondary" size="sm">
                      <span>View Telemetry</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-400" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">Create Benchmark Experiment</h2>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
                  Experiment Name
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hybrid Router vs PyMuPDF Baseline"
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
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
                          ? 'border-sky-500/40 bg-sky-500/10 text-white'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMethods.includes(engine.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMethods([...selectedMethods, engine.id]);
                          else setSelectedMethods(selectedMethods.filter(x => x !== engine.id));
                        }}
                        className="rounded border-white/20 text-sky-500 focus:ring-0 focus:ring-offset-0 bg-[#07090E]"
                      />
                      <span className="font-mono text-[11px]">{engine.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save Configuration
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
