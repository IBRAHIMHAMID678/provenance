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
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Target,
  Sparkles,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
      <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        <p className="font-mono">Loading spatial document stage & evidence telemetry...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        Document not found. <Link href="/documents" className="text-sky-400 underline">Back to Ingestion Library</Link>
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
          <Link href="/documents">
            <Button variant="secondary" size="icon-md" title="Back to Documents">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-tight font-mono">{doc.original_filename}</h1>
              <Badge variant="neutral">
                {doc.document_type || 'Unknown'}
              </Badge>
              <Badge
                dot
                variant={
                  doc.status === 'completed'
                    ? 'success'
                    : doc.status === 'review_required'
                    ? 'warning'
                    : 'danger'
                }
              >
                {doc.status}
              </Badge>
              {doc.latest_extraction?.is_mock && (
                <Badge variant="warning" className="border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-[10px]">
                  <AlertTriangle className="w-3 h-3 text-amber-400 mr-1 inline" />
                  MOCK ENGINE
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              SHA: <span className="text-slate-300">{doc.checksum?.substring(0, 16)}...</span> · {doc.page_count} page(s) · Grade: <span className="text-sky-400">{doc.quality_category}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRerunExtraction('hybrid')}
            loading={reextracting}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Re-run Hybrid Router</span>
          </Button>
          
          <a
            href={`http://localhost:8000/api/export/document/${doc.id}/json`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary" size="sm">
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export JSON</span>
            </Button>
          </a>

          <a
            href={`http://localhost:8000/api/export/document/${doc.id}/csv`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary" size="sm">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Split Pane: Left Viewer, Right Extractions */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Pane: Spatial Document Stage with SVG Evidence Reticle (7 cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-3">
          {/* Viewer HUD Bar */}
          <Card className="p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedPage(Math.max(1, selectedPage - 1))}
                disabled={selectedPage <= 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="font-mono text-slate-400 text-[11px]">
                Page <span className="text-white font-semibold tabular-nums">{selectedPage}</span> of {doc.page_count || 1}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedPage(Math.min(doc.page_count || 1, selectedPage + 1))}
                disabled={selectedPage >= (doc.page_count || 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.15))}
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="font-mono text-[11px] text-sky-300 w-12 text-center tabular-nums">{Math.round(zoomLevel * 100)}%</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setZoomLevel(Math.min(1.6, zoomLevel + 0.15))}
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>

          {/* Spatial Canvas Container */}
          <div className="rounded-xl bg-[#090C13] border border-white/[0.08] overflow-auto max-h-[750px] p-6 flex justify-center shadow-inner min-h-[500px]">
            {activePageObj && activePageObj.width ? (
              <div 
                className="relative bg-white shadow-2xl border border-neutral-700 rounded-sm overflow-hidden"
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
                    const isHigh = ev.isHighlighted;
                    if (ev.quads && Array.isArray(ev.quads) && ev.quads.length >= 4) {
                      const pointsStr = ev.quads.map((pt: any) => `${pt[0]},${pt[1]}`).join(' ');
                      return (
                        <g key={ev.fieldName}>
                          <polygon
                            points={pointsStr}
                            fill={isHigh ? 'rgba(56, 189, 248, 0.35)' : 'rgba(16, 185, 129, 0.18)'}
                            stroke={isHigh ? '#38BDF8' : '#10B981'}
                            strokeWidth={isHigh ? 3 : 1.5}
                            className="cursor-pointer transition-all hover:fill-sky-400/40"
                            onClick={() => setHighlightedField(ev.fieldName)}
                          />
                        </g>
                      );
                    }
                    if (!ev.bbox) return null;
                    const [x0, y0, x1, y1] = ev.bbox;
                    const w = Math.max(10, x1 - x0);
                    const h = Math.max(10, y1 - y0);

                    return (
                      <g key={ev.fieldName}>
                        <rect
                          x={x0}
                          y={y0}
                          width={w}
                          height={h}
                          fill={isHigh ? 'rgba(56, 189, 248, 0.28)' : 'rgba(16, 185, 129, 0.16)'}
                          stroke={isHigh ? '#38BDF8' : '#10B981'}
                          strokeWidth={isHigh ? 3 : 1.5}
                          strokeDasharray={isHigh ? 'none' : '4 2'}
                          className="cursor-pointer transition-all hover:fill-sky-400/40"
                          onClick={() => setHighlightedField(ev.fieldName)}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              /* Fallback Direct PDF Embedded Stage */
              <div className="w-full h-[650px] flex flex-col items-center justify-center">
                <iframe
                  src={`http://localhost:8000/api/documents/${doc.id}/file#toolbar=0`}
                  title="PDF Preview"
                  className="w-full h-full rounded-lg border border-white/[0.08]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Extracted Fields, Rules, Telemetry (5 cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-lg">
            <button
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'fields'
                  ? 'bg-sky-500/10 text-sky-300 border border-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fields ({doc.fields?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('validations')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'validations'
                  ? 'bg-sky-500/10 text-sky-300 border border-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Validations ({doc.validations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'json'
                  ? 'bg-sky-500/10 text-sky-300 border border-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Telemetry JSON
            </button>
          </div>

          {/* Fields Tab */}
          {activeTab === 'fields' && (
            <Card className="max-h-[700px] overflow-y-auto">
              <CardHeader>
                <CardTitle>Extracted Entities</CardTitle>
                <span className="text-[11px] font-mono text-slate-400">
                  {doc.fields?.filter((f: any) => f.raw_value).length || 0} extracted
                </span>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {doc.fields?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center font-mono">No extracted fields recorded.</p>
                ) : (
                  doc.fields?.map((f: any) => {
                    const isSelected = highlightedField === f.field_name;
                    return (
                      <div
                        key={f.field_name}
                        onClick={() => setHighlightedField(f.field_name)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-sky-400 bg-sky-500/10'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono text-sky-300 font-semibold text-[11px] flex items-center gap-1.5">
                            <Target className="w-3 h-3 text-sky-400" />
                            <span>{f.field_name}</span>
                          </span>
                          <Badge
                            dot
                            variant={
                              f.confidence_score >= 0.90
                                ? 'success'
                                : f.confidence_score > 0
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {Math.round(f.confidence_score * 100)}%
                          </Badge>
                        </div>
                        <div className="text-sm font-semibold text-white font-mono truncate">
                          {f.raw_value ? f.raw_value : <span className="text-slate-500 italic font-normal">[Missing]</span>}
                        </div>
                        {f.evidence_located === false ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono mt-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>No source span located in document text layer</span>
                          </div>
                        ) : f.evidence ? (
                          <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                            p.{f.evidence.page_number}: &quot;{f.evidence.evidence_text}&quot;
                          </div>
                        ) : null}
                        {f.confidence_signals && Object.keys(f.confidence_signals).length > 0 && (
                          <div className="text-[10px] text-slate-500 font-mono mt-1 flex flex-wrap gap-1">
                            {Object.entries(f.confidence_signals).map(([k, v]) => (
                              <span key={k} className="px-1 py-0.2 rounded bg-white/[0.04] text-slate-400">
                                {k}: <strong className="text-slate-300">{String(v)}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {/* Validations Tab */}
          {activeTab === 'validations' && (
            <Card className="max-h-[700px] overflow-y-auto">
              <CardHeader>
                <CardTitle>Cross-Field Business Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {doc.validations?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center font-mono">No validation rules triggered.</p>
                ) : (
                  doc.validations?.map((v: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        v.passed
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-amber-500/20 bg-amber-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-semibold text-white">{v.rule_id}</span>
                        <Badge variant={v.passed ? 'success' : 'warning'}>
                          {v.passed ? 'PASSED' : 'FLAGGED'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300">{v.explanation}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* JSON Tab */}
          {activeTab === 'json' && (
            <Card className="max-h-[700px] overflow-auto">
              <pre className="p-4 text-[11px] font-mono text-slate-300">
                {JSON.stringify(doc, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
