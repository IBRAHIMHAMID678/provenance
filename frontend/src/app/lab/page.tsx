'use client';

import { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Play, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Cpu,
  Layers,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ExtractionLabPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('hybrid');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      api.getDocuments({ limit: 50 }),
      api.getExtractionMethods()
    ]).then(([docsRes, methodsRes]) => {
      setDocuments(docsRes.items || []);
      if (docsRes.items && docsRes.items.length > 0) {
        setSelectedDocId(docsRes.items[0].id);
      }
      setMethods(methodsRes.methods || []);
    }).catch(console.error);
  }, []);

  const handleRun = async () => {
    if (!selectedDocId || !selectedMethodId) return;
    try {
      setLoading(true);
      setResult(null);
      const res = await api.runExtraction(selectedDocId, selectedMethodId);
      setResult(res);
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const activeMethodObj = methods.find(m => m.method_id === selectedMethodId);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              Extraction Adapter Workbench
            </span>
            <span className="text-textMuted text-xs">·</span>
            <span className="text-xs text-textSecondary font-mono">
              Live Token & Latency Profiler
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Extraction Lab
          </h1>
          <p className="text-xs text-textSecondary mt-1 max-w-2xl">
            Test, inspect, and benchmark individual extraction adapters side-by-side with full token, latency, and cost visibility.
          </p>
        </div>
      </div>

      {/* Control Configuration Console */}
      <div className="p-6 rounded-2xl glass-panel border border-white/[0.08] shadow-float space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          {/* Document Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-mono text-textSecondary uppercase tracking-wider block">
              1. Target Ingested Document
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#07090E] border border-white/[0.12] text-xs font-mono text-white focus:outline-none focus:border-cyan-400 focus:shadow-glow-cyan transition-all"
            >
              {documents.length === 0 ? (
                <option value="">No documents available</option>
              ) : (
                documents.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.filename} ({d.document_type} - {d.quality_category})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Engine Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-mono text-textSecondary uppercase tracking-wider block">
              2. Extraction Engine Adapter
            </label>
            <select
              value={selectedMethodId}
              onChange={(e) => setSelectedMethodId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#07090E] border border-white/[0.12] text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 focus:shadow-glow-cyan transition-all"
            >
              {methods.map(m => (
                <option key={m.method_id} value={m.method_id}>
                  {m.display_name} {!m.is_available ? '(Offline / Missing Dependency)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Execute Button */}
          <div className="md:col-span-2">
            <button
              onClick={handleRun}
              disabled={loading || !selectedDocId || (activeMethodObj && !activeMethodObj.is_available)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-glow-cyan disabled:opacity-40"
            >
              <Play className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Running...' : 'Execute Run'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Status Bar */}
        {activeMethodObj && (
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-textMuted flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeMethodObj.is_available ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-red-400'}`}></span>
              <span>Diagnostic: {activeMethodObj.status_message}</span>
            </span>
            <span className="text-cyan-400 text-[11px] font-semibold">{activeMethodObj.method_id}</span>
          </div>
        )}
      </div>

      {/* Execution Results Stage */}
      {result && (
        <div className="space-y-6">
          {/* Telemetry Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-white/[0.08]">
              <div className="flex items-center justify-between text-textSecondary text-xs">
                <span>Inference Duration</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2 font-mono">
                {result.duration_ms} <span className="text-sm font-normal text-textMuted">ms</span>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-white/[0.08]">
              <div className="flex items-center justify-between text-textSecondary text-xs">
                <span>Machine Cost</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
                ${result.calculated_cost_usd?.toFixed(6) || '0.000000'}
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-white/[0.08]">
              <div className="flex items-center justify-between text-textSecondary text-xs">
                <span>Fields Extracted</span>
                <Target className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2 font-mono">
                {result.fields?.filter((f: any) => f.raw_value).length || 0}
                <span className="text-sm font-normal text-textMuted"> / {result.fields?.length || 0}</span>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-white/[0.08]">
              <div className="flex items-center justify-between text-textSecondary text-xs">
                <span>Execution Status</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-cyan-300 mt-2 font-mono uppercase">
                {result.status}
              </div>
            </div>
          </div>

          {/* Extracted Fields Table */}
          <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden shadow-float">
            <div className="p-4 border-b border-white/[0.07] flex items-center justify-between bg-white/[0.02]">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Extracted Structured Attributes
              </h2>
              <span className="text-[11px] font-mono text-cyan-400">
                Method: {result.method_id}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] text-textSecondary border-b border-white/[0.06] font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Field Identifier</th>
                    <th className="py-3 px-4 font-medium">Extracted Value</th>
                    <th className="py-3 px-3 font-medium">Confidence</th>
                    <th className="py-3 px-3 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">Spatial Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {result.fields?.map((f: any, idx: number) => {
                    const ev = result.evidence?.find((e: any) => e.field_name === f.field_name);
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-cyan-300 font-medium">
                          {f.field_name}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {f.raw_value ? f.raw_value : <span className="text-textMuted italic font-normal">[Missing]</span>}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            f.confidence >= 0.90
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : f.confidence > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-white/[0.06] text-slate-400'
                          }`}>
                            {Math.round(f.confidence * 100)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-textMuted font-mono text-[11px]">
                          {f.data_type}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px] truncate max-w-[280px]">
                          {ev ? `p.${ev.page_number}: "${ev.evidence_text}"` : 'None'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
