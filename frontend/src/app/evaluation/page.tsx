'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileCheck,
  ShieldCheck,
  DollarSign,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Evaluation Engine · Zero-Leakage Testbed
            </span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Scientific Evaluation & Ground Truth
          </h1>
          <p className="text-xs text-white/50 max-w-2xl mt-1">
            Empirical benchmarking measuring Exact Match, Normalized Accuracy, Hallucination Rate, and Cost per Correct Field.
          </p>
        </div>

        <a
          href="http://localhost:8000/api/export/evaluation/csv"
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-white hover:text-cyan-300 text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Metrics CSV</span>
        </a>
      </div>

      {loading ? (
        <div className="py-24 text-center glass-card rounded-xl border border-white/10 text-xs text-white/40 font-mono">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Aggregating evaluation benchmark telemetry from D: drive...</span>
          </div>
        </div>
      ) : summary.length === 0 ? (
        <div className="p-16 text-center glass-card rounded-xl border border-white/10 text-xs text-white/40 font-mono">
          No evaluation runs found. Navigate to Experiments and click &quot;Run Experiment&quot; over a dataset.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Comparative Metric Table */}
          <div className="glass-card rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 font-semibold text-xs text-white bg-[#0D1117] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Cross-Engine Benchmark Matrix (Identical Held-Out Partition)</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/80 uppercase">
                Metric Target: Cost Per Correct Field ($/CF)
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090C10] text-white/50 border-b border-white/10 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Engine Method</th>
                  <th className="py-3 px-3 font-semibold uppercase tracking-wider">Exact Match</th>
                  <th className="py-3 px-3 font-semibold uppercase tracking-wider">Normalized Acc</th>
                  <th className="py-3 px-3 font-semibold uppercase tracking-wider">Critical Fields</th>
                  <th className="py-3 px-3 font-semibold uppercase tracking-wider">Doc-Level</th>
                  <th className="py-3 px-3 font-semibold uppercase tracking-wider">Hallucination</th>
                  <th className="py-3 px-3 font-semibold uppercase tracking-wider">P50 Latency</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Cost / Correct Field</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {summary.map((row) => (
                  <tr key={row.method_id} className="hover:bg-cyan-500/[0.03] transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-white capitalize flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      <span>{row.method_id.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3.5 px-3 text-white/80">
                      {(row.exact_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {(row.normalized_accuracy * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-white/80">
                      {(row.critical_field_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-3 text-white/70">
                      {(row.document_level_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded border ${
                        row.hallucination_rate === 0
                          ? 'text-white/40 border-white/5'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20 font-bold'
                      }`}>
                        {(row.hallucination_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-white/50">
                      {row.p50_latency_ms} ms
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-cyan-400 text-sm">
                        ${row.cost_per_correct_field.toFixed(5)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Drilldown Cards: Method Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.map((row) => (
              <div 
                key={row.method_id} 
                className="glass-card p-5 rounded-xl border border-white/10 space-y-4 hover:border-cyan-500/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      {row.method_id} Field Drilldown
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    ${row.cost_per_correct_field.toFixed(4)} / correct field
                  </span>
                </div>

                <div className="space-y-2.5">
                  {Object.entries(row.field_breakdown || {}).map(([fname, fstats]: [string, any]) => {
                    const accPercent = Math.round(fstats.norm_acc * 100);
                    return (
                      <div key={fname} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-white/70">{fname}</span>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-white font-medium">{accPercent}%</span>
                            {fstats.missing > 0 && (
                              <span className="text-rose-400 text-[10px]">({fstats.missing} missed)</span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              accPercent >= 90 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' :
                              accPercent >= 70 ? 'bg-gradient-to-r from-amber-500 to-emerald-400' :
                              'bg-rose-500'
                            }`}
                            style={{ width: `${accPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
