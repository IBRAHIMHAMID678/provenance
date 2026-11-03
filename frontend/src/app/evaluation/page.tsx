'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileCheck
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-graphite">Scientific Evaluation & Ground Truth</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Empirical benchmarking measuring Exact Match, Normalized Accuracy, Hallucination Rate, and Cost per Correct Field.
          </p>
        </div>
        <a
          href="http://localhost:8000/api/export/evaluation/csv"
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-1.5 rounded-md border border-borderLight bg-surface text-graphite hover:bg-surfaceSecondary text-xs font-medium flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Metrics CSV</span>
        </a>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-mutedText">Loading evaluation benchmark telemetry...</div>
      ) : summary.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-borderLight rounded-lg text-xs text-mutedText">
          No evaluation runs found. Navigate to Experiments and click &quot;Run Experiment&quot; over a dataset.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Comparative Metric Table */}
          <div className="rounded-lg bg-surface border border-borderLight overflow-hidden shadow-sm">
            <div className="p-3.5 border-b border-borderLight font-semibold text-xs text-graphite bg-surfaceSecondary">
              Cross-Engine Benchmark Comparison (Identical Held-Out Partition)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-surfaceSecondary/50 text-mutedText border-b border-borderLight">
                <tr>
                  <th className="py-3 px-4 font-medium">Method</th>
                  <th className="py-3 px-3 font-medium">Exact Acc</th>
                  <th className="py-3 px-3 font-medium">Normalized Acc</th>
                  <th className="py-3 px-3 font-medium">Critical Acc</th>
                  <th className="py-3 px-3 font-medium">Doc-Level Acc</th>
                  <th className="py-3 px-3 font-medium">Hallucination</th>
                  <th className="py-3 px-3 font-medium">P50 Latency</th>
                  <th className="py-3 px-4 font-medium text-right">Cost / Correct Field</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight font-mono">
                {summary.map((row) => (
                  <tr key={row.method_id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 font-sans font-semibold text-graphite capitalize">
                      {row.method_id.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 text-graphite">
                      {(row.exact_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-emerald-700 font-bold">
                      {(row.normalized_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-graphite">
                      {(row.critical_field_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-graphite">
                      {(row.document_level_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-red-600">
                      {(row.hallucination_rate * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-mutedText">
                      {row.p50_latency_ms} ms
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-graphite">
                      ${row.cost_per_correct_field.toFixed(5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Drilldown Cards: Method Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            {summary.map((row) => (
              <div key={row.method_id} className="p-4 rounded-lg bg-surface border border-borderLight space-y-3">
                <div className="flex items-center justify-between border-b border-borderLight pb-2">
                  <h3 className="text-xs font-bold text-graphite uppercase tracking-wide">
                    {row.method_id} Field Drilldown
                  </h3>
                  <span className="font-mono text-[11px] text-emerald-700">
                    ${row.cost_per_correct_field.toFixed(4)} / correct field
                  </span>
                </div>

                <div className="space-y-1.5">
                  {Object.entries(row.field_breakdown || {}).map(([fname, fstats]: [string, any]) => (
                    <div key={fname} className="flex items-center justify-between text-[11px] py-1 border-b border-borderLight/40">
                      <span className="font-mono text-mutedText">{fname}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-graphite font-medium">{(fstats.norm_acc * 100).toFixed(0)}% acc</span>
                        {fstats.missing > 0 && (
                          <span className="text-red-500 text-[10px]">({fstats.missing} missed)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

