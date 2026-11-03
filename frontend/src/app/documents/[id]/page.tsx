'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Layers,
  ShieldAlert,
  UserCheck,
  Cpu,
  Target,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params?.id as string;

  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'fields' | 'validations' | 'json'>('fields');
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [reextracting, setReextracting] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.getDocumentDetail(docId);
      setDoc(res);
      if (res.pages && res.pages.length > 0) {
        setSelectedPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) fetchDetail();
  }, [docId]);

  const handleRerunExtraction = async (method = 'hybrid') => {
    try {
      setReextracting(true);
      await api.runExtraction(docId, method);
      await fetchDetail();
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setReextracting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-textMuted text-xs flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
        <p className="font-mono">Loading spatial document stage & evidence telemetry...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-24 text-center text-textMuted text-xs">
        Document not found. <Link href="/documents" className="text-cyan-400 underline">Back to Ingestion Library</Link>
      </div>
    );
  }

  const activePageObj = doc.pages?.find((p: any) => p.page_number === selectedPage);

  // Filter evidence items on current page
  const pageEvidence = (doc.fields || [])
    .filter((f: any) => f.evidence && f.evidence.page_number === selectedPage && f.evidence.bbox)
    .map((f: any) => ({
      fieldName: f.field_name,
      bbox: f.evidence.bbox, // [x0, y0, x1, y1] normalized to 1000
      isHighlighted: highlightedField === f.field_name,
    }));

  return (
    <div className="space-y-6">
      {/* Top Header Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            href="/documents"
            className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-textSecondary hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-tight font-mono">{doc.original_filename}</h1>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[11px] font-mono text-cyan-300 border border-white/[0.08]">
                {doc.document_type}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                doc.status === 'completed'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : doc.status === 'review_required'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-red-500/15 text-red-300 border border-red-500/30'
              }`}>
                {doc.status}
              </span>
            </div>
            <p className="text-xs text-textMuted mt-1 font-mono">
              SHA: <span className="text-slate-300">{doc.checksum?.substring(0, 16)}...</span> · {doc.page_count} page(s) · Grade: <span className="text-cyan-400">{doc.quality_category}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleRerunExtraction('hybrid')}
            disabled={reextracting}
            className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-cyan-500/20 text-xs font-medium text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${reextracting ? 'animate-spin' : ''}`} />
            <span>{reextracting ? 'Extracting...' : 'Re-run Hybrid Router'}</span>
          </button>
          
          <a
            href={`http://localhost:8000/api/export/document/${doc.id}/json`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-textSecondary hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </a>

          <a
            href={`http://localhost:8000/api/export/document/${doc.id}/csv`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-textSecondary hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Split Pane: Left Viewer, Right Extractions */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Pane: Spatial Document Stage with SVG Evidence Reticle (7 cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-3">
          {/* Viewer HUD Bar */}
          <div className="p-3 rounded-xl glass-panel border border-white/[0.08] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPage(Math.max(1, selectedPage - 1))}
                disabled={selectedPage <= 1}
                className="p-1.5 rounded-md border border-white/[0.08] hover:bg-white/[0.08] text-slate-300 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-textSecondary text-[11px]">
                Page <span className="text-white font-semibold">{selectedPage}</span> of {doc.page_count}
              </span>
              <button
                onClick={() => setSelectedPage(Math.min(doc.page_count, selectedPage + 1))}
                disabled={selectedPage >= doc.page_count}
                className="p-1.5 rounded-md border border-white/[0.08] hover:bg-white/[0.08] text-slate-300 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.15))}
                className="p-1.5 rounded-md border border-white/[0.08] hover:bg-white/[0.08] text-textSecondary hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-cyan-300 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(1.6, zoomLevel + 0.15))}
                className="p-1.5 rounded-md border border-white/[0.08] hover:bg-white/[0.08] text-textSecondary hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Spatial Canvas Container with SVG Bounding Box Layer */}
          <div className="rounded-xl glass-panel border border-white/[0.08] overflow-auto max-h-[750px] p-6 flex justify-center bg-[#07090E]/90 relative shadow-inner">
            {activePageObj ? (
              <div 
                className="relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-neutral-700 rounded-sm overflow-hidden"
                style={{
                  width: `${activePageObj.width * zoomLevel}px`,
                  height: `${activePageObj.height * zoomLevel}px`,
                }}
              >
                {/* Rendered Document Page */}
                <img
                  src={`http://localhost:8000/api/documents/${doc.id}/rendered-page/${selectedPage}`}
                  alt={`Page ${selectedPage}`}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

                {/* SVG Bounding Boxes Overlay (Normalized 0-1000) */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                >
                  {pageEvidence.map((ev: any) => {
                    const [x0, y0, x1, y1] = ev.bbox;
                    const w = Math.max(10, x1 - x0);
                    const h = Math.max(10, y1 - y0);
                    const isHigh = ev.isHighlighted;

                    return (
                      <g key={ev.fieldName}>
                        <rect
                          x={x0}
                          y={y0}
                          width={w}
                          height={h}
                          fill={isHigh ? 'rgba(0, 242, 254, 0.28)' : 'rgba(16, 185, 129, 0.16)'}
                          stroke={isHigh ? '#00F2FE' : '#10B981'}
                          strokeWidth={isHigh ? 3 : 1.5}
                          strokeDasharray={isHigh ? 'none' : '4 2'}
                          className="cursor-pointer transition-all hover:fill-cyan-400/40"
                          onClick={() => setHighlightedField(ev.fieldName)}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="py-24 text-textMuted text-xs font-mono">Page preview not available.</div>
            )}
          </div>
        </div>

        {/* Right Pane: Fields, Validations & Trace (5 cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* Tab Selector */}
          <div className="flex border-b border-white/[0.08] gap-1">
            <button
              onClick={() => setActiveTab('fields')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'fields'
                  ? 'border-cyan-400 text-cyan-300 font-semibold'
                  : 'border-transparent text-textSecondary hover:text-white'
              }`}
            >
              Extracted Fields ({doc.fields?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('validations')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'validations'
                  ? 'border-cyan-400 text-cyan-300 font-semibold'
                  : 'border-transparent text-textSecondary hover:text-white'
              }`}
            >
              Validations ({doc.validations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'json'
                  ? 'border-cyan-400 text-cyan-300 font-semibold'
                  : 'border-transparent text-textSecondary hover:text-white'
              }`}
            >
              Trace JSON
            </button>
          </div>

          {/* TAB 1: Fields Card List */}
          {activeTab === 'fields' && (
            <div className="space-y-2.5 overflow-y-auto max-h-[720px] pr-1">
              {(!doc.fields || doc.fields.length === 0) ? (
                <div className="p-8 text-center text-xs text-textMuted glass-card rounded-xl border border-white/[0.08]">
                  No fields extracted yet. Click &quot;Re-run Hybrid Router&quot; to execute.
                </div>
              ) : (
                doc.fields.map((f: any) => {
                  const isHighlighted = highlightedField === f.field_name;
                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setHighlightedField(f.field_name);
                        if (f.evidence?.page_number) setSelectedPage(f.evidence.page_number);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isHighlighted
                          ? 'border-cyan-400 bg-cyan-950/30 shadow-glow-cyan'
                          : 'border-white/[0.08] glass-card hover:border-white/[0.18]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono text-cyan-300 font-medium text-[11px] flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-cyan-400" />
                          <span>{f.field_name}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {f.is_critical && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-mono border border-red-500/30">
                              Critical
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            f.confidence_score >= 0.90
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : f.confidence_score > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-white/[0.08] text-slate-400'
                          }`}>
                            {Math.round(f.confidence_score * 100)}% conf
                          </span>
                        </div>
                      </div>

                      <div className="text-sm font-bold text-white font-mono tracking-tight">
                        {f.raw_value ? f.raw_value : <span className="text-textMuted italic font-normal">[Missing]</span>}
                      </div>

                      {f.normalized_value && f.normalized_value !== f.raw_value && (
                        <div className="text-[11px] text-textMuted font-mono mt-1">
                          Normalized: <span className="text-slate-300">{f.normalized_value}</span>
                        </div>
                      )}

                      {/* Evidence Context Snippet */}
                      {f.evidence && (
                        <div className="mt-2 pt-2 border-t border-white/[0.06] text-[11px] text-textMuted flex items-center justify-between font-mono">
                          <span className="truncate max-w-[240px] text-slate-400">
                            &ldquo;{f.evidence.evidence_text}&rdquo;
                          </span>
                          <span className="text-[10px] text-cyan-400 font-semibold">
                            p.{f.evidence.page_number}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Validations */}
          {activeTab === 'validations' && (
            <div className="space-y-3 overflow-y-auto max-h-[720px]">
              {(!doc.validations || doc.validations.length === 0) ? (
                <div className="p-8 text-center text-xs text-textMuted glass-card rounded-xl border border-white/[0.08]">
                  Zero validation failures recorded for this document.
                </div>
              ) : (
                doc.validations.map((v: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-white/[0.08] glass-card">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-cyan-300 font-medium">{v.rule_id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        v.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {v.passed ? 'PASSED' : v.severity}
                      </span>
                    </div>
                    <p className="text-xs text-textSecondary mt-1">{v.explanation}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: JSON Trace */}
          {activeTab === 'json' && (
            <div className="p-4 rounded-xl glass-card border border-white/[0.08] overflow-x-auto max-h-[720px]">
              <pre className="text-[11px] font-mono text-cyan-300/90 leading-relaxed">
                {JSON.stringify(doc, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
