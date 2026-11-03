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
  Layers
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-graphite">Extraction Lab</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Test, inspect, and benchmark individual extraction adapters side-by-side with full token & latency observability.
          </p>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="p-4 rounded-lg bg-surface border border-borderLight grid grid-cols-12 gap-4 items-center">
        <div className="col-span-5">
          <label className="text-xs font-medium text-graphite block mb-1">Target Document</label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full p-2 rounded-md border border-borderLight bg-background text-xs text-graphite focus:outline-none"
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

        <div className="col-span-5">
          <label className="text-xs font-medium text-graphite block mb-1">Extraction Engine Adapter</label>
          <select
            value={selectedMethodId}
            onChange={(e) => setSelectedMethodId(e.target.value)}
            className="w-full p-2 rounded-md border border-borderLight bg-background text-xs text-graphite focus:outline-none"
          >
            {methods.map(m => (
              <option key={m.method_id} value={m.method_id}>
                {m.display_name} {!m.is_available ? '(Unavailable)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 flex items-end h-full">
          <button
            onClick={handleRun}
            disabled={loading || !selectedDocId}
            className="w-full py-2 px-4 rounded-md bg-charcoal text-white hover:bg-neutral-800 text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40 shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Running...' : 'Execute'}</span>
          </button>
        </div>
      </div>

      {/* Engine Status Diagnostic Card */}
      {activeMethodObj && (
        <div className={`p-3 rounded-md text-xs flex items-center justify-between border ${
          activeMethodObj.is_available 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">{activeMethodObj.display_name}:</span>
            <span>{activeMethodObj.status_message}</span>
          </div>
          <span className="font-mono text-[11px] uppercase font-bold">
            {activeMethodObj.is_available ? 'Ready' : 'Offline'}
          </span>
        </div>
      )}

      {/* Result View */}
      {result && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-surface border border-borderLight">
              <span className="text-[11px] text-mutedText block">Latency</span>
              <span className="text-lg font-bold font-mono text-graphite">{result.duration_ms} ms</span>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-borderLight">
              <span className="text-[11px] text-mutedText block">Cost (USD)</span>
              <span className="text-lg font-bold font-mono text-graphite">${result.calculated_cost_usd?.toFixed(6) || '0.000000'}</span>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-borderLight">
              <span className="text-[11px] text-mutedText block">Token Footprint</span>
              <span className="text-lg font-bold font-mono text-graphite">{result.input_tokens + result.output_tokens} tok</span>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-borderLight">
              <span className="text-[11px] text-mutedText block">Extraction Status</span>
              <span className="text-lg font-bold uppercase text-emerald-700">{result.status}</span>
            </div>
          </div>

          {/* Warnings or Errors */}
          {result.warnings?.length > 0 && (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Adapter Diagnostic Warnings:</span>
              </div>
              {result.warnings.map((w: string, i: number) => (
                <div key={i} className="pl-5 font-mono text-[11px]">• {w}</div>
              ))}
            </div>
          )}

          {result.errors?.length > 0 && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Adapter Errors:</span>
              </div>
              {result.errors.map((err: string, i: number) => (
                <div key={i} className="pl-5 font-mono text-[11px]">• {err}</div>
              ))}
            </div>
          )}

          {/* Extracted Fields Table */}
          <div className="rounded-lg bg-surface border border-borderLight overflow-hidden">
            <div className="p-3 border-b border-borderLight font-semibold text-xs text-graphite bg-surfaceSecondary">
              Extracted Structured Fields & Evidence Coordinates
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-surfaceSecondary/50 text-mutedText border-b border-borderLight">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Field Name</th>
                  <th className="py-2.5 px-3 font-medium">Raw Value</th>
                  <th className="py-2.5 px-3 font-medium">Normalized</th>
                  <th className="py-2.5 px-3 font-medium">Confidence</th>
                  <th className="py-2.5 px-4 font-medium">Evidence Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight font-mono">
                {result.fields?.map((f: any, idx: number) => {
                  const ev = result.evidence?.find((e: any) => e.field_name === f.field_name);
                  return (
                    <tr key={idx} className="hover:bg-stone-50/70">
                      <td className="py-2.5 px-4 font-sans font-medium text-graphite">
                        {f.field_name}
                      </td>
                      <td className="py-2.5 px-3 text-graphite font-bold">
                        {f.raw_value || <span className="text-neutral-400 font-normal italic">[Null]</span>}
                      </td>
                      <td className="py-2.5 px-3 text-mutedText">
                        {f.normalized_value || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
                          f.confidence >= 0.9 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {(f.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-mutedText text-[11px] truncate max-w-xs">
                        {ev ? ev.evidence_text : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

