'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Activity
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function EvaluationPage() {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvaluationSummary()
      .then(res => setSummary(res.summary || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
              Evaluation Engine · Zero-Leakage Testbed
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Scientific Evaluation & Ground Truth
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Empirical benchmarking measuring Exact Match, Normalized Accuracy, Hallucination Rate, and Cost per Correct Field.
          </p>
        </div>

        <a
          href="http://localhost:8000/api/export/evaluation/csv"
          target="_blank"
          rel="noreferrer"
        >
          <Button variant="secondary" size="md">
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Metrics CSV</span>
          </Button>
        </a>
      </div>

      {loading ? (
        <Card className="py-24 text-center text-xs text-slate-400 font-mono">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>Aggregating evaluation benchmark telemetry from D: drive...</span>
          </div>
        </Card>
      ) : summary.length === 0 ? (
        <Card className="p-16 text-center text-xs text-slate-400 font-mono">
          No evaluation runs found. Navigate to Experiments and click &quot;Run Experiment&quot; over a dataset.
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Main Comparative Metric Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <CardTitle>Cross-Engine Benchmark Matrix (Identical Held-Out Partition)</CardTitle>
              </div>
              <Badge variant="info">
                Central Metric: $/CF
              </Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.08] font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-medium uppercase tracking-wider">Engine Method</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Exact Match</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Normalized Acc</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Critical Fields</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Doc-Level</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Hallucination</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Mismatch</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">P50 Latency</th>
                    <th className="py-3 px-4 font-medium uppercase tracking-wider text-right">Cost / Correct Field</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono">
                  {summary.map((row) => (
                    <tr key={row.method_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-sans font-semibold text-white capitalize flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        <span>{row.method_id.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 tabular-nums">
                        {(row.exact_accuracy * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge variant="success">
                          {(row.normalized_accuracy * 100).toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 tabular-nums">
                        {(row.critical_field_accuracy * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 tabular-nums">
                        {(row.document_level_accuracy * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge variant={row.hallucination_rate === 0 ? 'neutral' : 'danger'}>
                          {(row.hallucination_rate * 100).toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge variant={(row.mismatch_rate || 0) === 0 ? 'neutral' : 'warning'}>
                          {((row.mismatch_rate || 0) * 100).toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 tabular-nums">
                        {row.p50_latency_ms} ms
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-bold text-sky-400 text-sm tabular-nums">
                            ${row.cost_per_correct_field.toFixed(5)}
                          </span>
                          <span className="text-[9px] uppercase font-mono px-1 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                            {row.cost_basis || 'modeled'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Drilldown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.map((row) => (
              <Card key={row.method_id} className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                      {row.method_id} Field Drilldown
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="success">
                      ${row.cost_per_correct_field.toFixed(4)} / correct field
                    </Badge>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                      {row.cost_basis || 'modeled'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {Object.entries(row.field_breakdown || {}).map(([fname, fstats]: [string, any]) => {
                    const accPercent = Math.round(fstats.norm_acc * 100);
                    return (
                      <div key={fname} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-300">{fname}</span>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-white font-medium tabular-nums">{accPercent}%</span>
                            {fstats.missing > 0 && (
                              <span className="text-rose-400 text-[10px]">({fstats.missing} missed)</span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              accPercent >= 90 ? 'bg-emerald-400' :
                              accPercent >= 70 ? 'bg-amber-400' :
                              'bg-rose-500'
                            }`}
                            style={{ width: `${accPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
