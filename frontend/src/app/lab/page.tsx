'use client';

import { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Play, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu,
  Target,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

export default function ExtractionLabPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('hybrid');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      api.getDocuments({ limit: 100 }),
      api.getExtractionMethods()
    ]).then(([docsRes, methodsRes]) => {
      // Deduplicate documents by ID
      const rawDocs = docsRes.items || [];
      const uniqueDocsMap = new Map();
      rawDocs.forEach((d: any) => {
        if (!uniqueDocsMap.has(d.id)) {
          uniqueDocsMap.set(d.id, d);
        }
      });
      const uniqueDocs = Array.from(uniqueDocsMap.values());
      setDocuments(uniqueDocs);

      if (uniqueDocs.length > 0) {
        setSelectedDocId(uniqueDocs[0].id);
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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
              Extraction Adapter Workbench
            </span>
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-xs text-slate-400 font-mono">
              Live Token & Latency Profiler
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Extraction Lab
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Test, inspect, and benchmark individual extraction adapters side-by-side with full token, latency, and cost visibility.
          </p>
        </div>
      </div>

      {/* Control Configuration Console */}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Document Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              1. Target Ingested Document
            </label>
            <Select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
            >
              {documents.length === 0 ? (
                <option value="">No documents available</option>
              ) : (
                documents.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.filename} [ID: {d.id.substring(0, 6)}] — {d.document_type || 'Document'} ({d.quality_category || 'general'})
                  </option>
                ))
              )}
            </Select>
          </div>

          {/* Engine Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              2. Extraction Engine Adapter
            </label>
            <Select
              value={selectedMethodId}
              onChange={(e) => setSelectedMethodId(e.target.value)}
            >
              {methods.map(m => (
                <option key={m.method_id} value={m.method_id}>
                  {m.display_name} {!m.is_available ? '(Offline / Missing Dependency)' : ''}
                </option>
              ))}
            </Select>
          </div>

          {/* Execute Button */}
          <div className="md:col-span-2">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleRun}
              loading={loading}
              disabled={!selectedDocId || (activeMethodObj && !activeMethodObj.is_available)}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Execute Run</span>
            </Button>
          </div>
        </div>

        {/* Diagnostic Status Bar */}
        {activeMethodObj && (
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeMethodObj.is_available ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>Diagnostic: {activeMethodObj.status_message}</span>
            </span>
            <Badge variant="info">
              {activeMethodObj.method_id}
            </Badge>
          </div>
        )}
      </Card>

      {/* Execution Results Stage */}
      {result && (
        <div className="space-y-6">
          {/* Telemetry Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Inference Duration</span>
                <Clock className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2 font-mono tabular-nums">
                {result.duration_ms} <span className="text-sm font-normal text-slate-400">ms</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Machine Cost</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono tabular-nums">
                ${result.calculated_cost_usd?.toFixed(6) || '0.000000'}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Fields Extracted</span>
                <Target className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2 font-mono tabular-nums">
                {result.fields?.filter((f: any) => f.raw_value).length || 0}
                <span className="text-sm font-normal text-slate-400"> / {result.fields?.length || 0}</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Execution Status</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-slate-100 mt-2 font-mono uppercase">
                {result.status}
              </div>
            </Card>
          </div>

          {/* Extracted Fields Table */}
          <Card>
            <CardHeader>
              <CardTitle>Extracted Structured Attributes</CardTitle>
              <Badge variant="info">
                Adapter: {result.method_id}
              </Badge>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06] font-mono text-[11px]">
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
                        <td className="py-3 px-4 font-mono text-sky-300 font-medium">
                          {f.field_name}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-white">
                          {f.raw_value ? f.raw_value : <span className="text-slate-500 italic font-normal">[Missing]</span>}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            dot
                            variant={
                              f.confidence >= 0.90
                                ? 'success'
                                : f.confidence > 0
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {Math.round(f.confidence * 100)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
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
          </Card>
        </div>
      )}
    </div>
  );
}
