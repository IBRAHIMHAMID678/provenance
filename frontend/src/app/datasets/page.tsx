'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
              Gold Standard Repository · Zero Data Leakage
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Datasets & Ground-Truth Partitions
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Manage training, validation, and held-out test partitions with verified Gold Standard field annotations and zero cross-partition leakage.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => handleGenerate(6)}
          loading={generating}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Synthesize 6-Doc Benchmark Partition</span>
        </Button>
      </div>

      {/* Partition Telemetry Banner */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>Strict Partition Integrity Active</span>
              <Badge variant="success">
                Train ∩ Test = ∅
              </Badge>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Evaluations run strictly on the 30% held-out test partition. Zero test documents leak into training prompts or few-shot context.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300">
            Train: <span className="text-white font-semibold">60%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300">
            Val: <span className="text-white font-semibold">10%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300">
            Held-Out Test: <span className="text-sky-400 font-semibold">30%</span>
          </div>
        </div>
      </Card>

      {/* Datasets Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <Card className="col-span-2 p-16 text-center text-xs text-slate-400 font-mono">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Querying dataset registry on D: drive...</span>
            </div>
          </Card>
        ) : datasets.length === 0 ? (
          <Card className="col-span-2 p-16 text-center text-xs text-slate-400 font-mono">
            No datasets found. Click &quot;Synthesize 6-Doc Benchmark Partition&quot; above to initialize the Gold Standard set.
          </Card>
        ) : (
          datasets.map((ds) => (
            <Card key={ds.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-semibold text-white">
                      {ds.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {ds.description || 'Deterministic insurance ground-truth benchmark suite.'}
                  </p>
                </div>
                <Badge variant="neutral">
                  v{ds.version || 1}.0
                </Badge>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.06] text-xs font-mono">
                <div className="space-y-0.5">
                  <span className="text-slate-500 text-[10px] uppercase">Documents</span>
                  <div className="font-semibold text-white text-base tabular-nums">{ds.document_count}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 text-[10px] uppercase">Class</span>
                  <div className="font-medium text-sky-300 capitalize text-xs mt-1">{ds.source_type || 'Synthetic'}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 text-[10px] uppercase">Annotation</span>
                  <div className="text-emerald-400 font-medium text-xs mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>100% Gold</span>
                  </div>
                </div>
              </div>

              {/* Partition distribution bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Partition Allocation</span>
                  <span>Train (60%) · Val (10%) · Test (30%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] flex overflow-hidden">
                  <div className="h-full bg-slate-500" style={{ width: '60%' }} title="Train (60%)" />
                  <div className="h-full bg-amber-400/60" style={{ width: '10%' }} title="Validation (10%)" />
                  <div className="h-full bg-sky-400" style={{ width: '30%' }} title="Held-Out Test (30%)" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 font-mono text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  <span>{new Date(ds.created_at).toLocaleDateString()}</span>
                </span>
                <span className="text-sky-400/80">
                  Target: /api/experiments
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
