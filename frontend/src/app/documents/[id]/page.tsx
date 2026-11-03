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
  UserCheck
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

  if (loading) {
    return (
      <div className="py-24 text-center text-mutedText text-xs">
        Loading document inspection and evidence...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-24 text-center text-mutedText text-xs">
        Document not found. <Link href="/documents" className="text-graphite underline">Back to library</Link>
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
    <div className="space-y-4">
      {/* Top Header Breadcrumb */}
      <div className="flex items-center justify-between border-b border-borderLight pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/documents"
            className="p-1.5 rounded-md border border-borderLight hover:bg-surfaceSecondary text-mutedText hover:text-graphite transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-graphite tracking-tight">{doc.original_filename}</h1>
              <span className="px-2 py-0.5 rounded bg-surfaceSecondary text-[11px] font-mono border border-borderLight">
                {doc.document_type}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                doc.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : doc.status === 'review_required'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-stone-100 text-stone-700 border border-stone-200'
              }`}>
                {doc.status}
              </span>
            </div>
            <p className="text-xs text-mutedText mt-0.5">
              Checksum: <span className="font-mono">{doc.checksum?.substring(0, 16)}...</span> · {doc.page_count} pages · {doc.quality_category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`http://localhost:8000/api/export/document/${doc.id}/json`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded border border-borderLight bg-surface hover:bg-surfaceSecondary text-xs font-medium text-graphite flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </a>
          <a
            href={`http://localhost:8000/api/export/document/${doc.id}/csv`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded border border-borderLight bg-surface hover:bg-surfaceSecondary text-xs font-medium text-graphite flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Split Pane: Left Viewer, Right Extractions */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Pane: PDF Canvas & Bounding Box Overlays (7 cols) */}
        <div className="col-span-7 space-y-3">
          {/* Viewer Controls */}
          <div className="p-2.5 rounded-lg bg-surface border border-borderLight flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPage(Math.max(1, selectedPage - 1))}
                disabled={selectedPage <= 1}
                className="p-1 rounded border border-borderLight hover:bg-surfaceSecondary disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-mutedText">
                Page {selectedPage} of {doc.page_count}
              </span>
              <button
                onClick={() => setSelectedPage(Math.min(doc.page_count, selectedPage + 1))}
                disabled={selectedPage >= doc.page_count}
                className="p-1 rounded border border-borderLight hover:bg-surfaceSecondary disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.15))}
                className="p-1 rounded border border-borderLight hover:bg-surfaceSecondary text-mutedText hover:text-graphite"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-mutedText">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(1.6, zoomLevel + 0.15))}
                className="p-1 rounded border border-borderLight hover:bg-surfaceSecondary text-mutedText hover:text-graphite"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Container with SVG Bounding Box Layer */}
          <div className="rounded-lg bg-stone-100 border border-borderLight overflow-auto max-h-[750px] p-4 flex justify-center">
            {activePageObj ? (
              <div 
                className="relative bg-white shadow-md border border-neutral-300"
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
                          fill={isHigh ? 'rgba(217, 119, 6, 0.25)' : 'rgba(45, 106, 79, 0.15)'}
                          stroke={isHigh ? '#D97706' : '#2D6A4F'}
                          strokeWidth={isHigh ? 3 : 1.5}
                          strokeDasharray={isHigh ? 'none' : '4 2'}
                          className="cursor-pointer transition-all hover:fill-amber-200/40"
                          onClick={() => setHighlightedField(ev.fieldName)}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="py-24 text-mutedText text-xs">Page preview not available.</div>
            )}
          </div>
        </div>

        {/* Right Pane: Fields, Validations & Evidence (5 cols) */}
        <div className="col-span-5 space-y-4">
          {/* Tab Selector */}
          <div className="flex border-b border-borderLight">
            <button
              onClick={() => setActiveTab('fields')}
              className={`py-2 px-4 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'fields'
                  ? 'border-charcoal text-graphite'
                  : 'border-transparent text-mutedText hover:text-graphite'
              }`}
            >
              Extracted Fields ({doc.fields?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('validations')}
              className={`py-2 px-4 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'validations'
                  ? 'border-charcoal text-graphite'
                  : 'border-transparent text-mutedText hover:text-graphite'
              }`}
            >
              Validations ({doc.validations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`py-2 px-4 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'json'
                  ? 'border-charcoal text-graphite'
                  : 'border-transparent text-mutedText hover:text-graphite'
              }`}
            >
              Trace & JSON
            </button>
          </div>

          {/* TAB 1: Fields Card List */}
          {activeTab === 'fields' && (
            <div className="space-y-3 overflow-y-auto max-h-[720px] pr-1">
              {(!doc.fields || doc.fields.length === 0) ? (
                <div className="p-8 text-center text-xs text-mutedText bg-surface border border-borderLight rounded-lg">
                  No fields extracted yet. Click &quot;Rerun Extraction&quot; to execute the pipeline.
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
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isHighlighted
                          ? 'border-amber-500 bg-amber-50/20 shadow-sm'
                          : 'border-borderLight bg-surface hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-mutedText font-medium text-[11px]">
                          {f.field_name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {f.is_critical && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 text-red-800 font-medium">
                              Critical
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            f.confidence_score >= 0.90
                              ? 'bg-emerald-100 text-emerald-800'
                              : f.confidence_score > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {Math.round(f.confidence_score * 100)}% conf
                          </span>
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-graphite">
                        {f.raw_value ? f.raw_value : <span className="text-neutral-400 italic font-normal">[Missing]</span>}
                      </div>

                      {f.normalized_value && f.normalized_value !== f.raw_value && (
                        <div className="text-[11px] text-mutedText font-mono mt-0.5">
                          Normalized: {f.normalized_value}
                        </div>
                      )}

                      {/* Evidence Snippet */}
                      {f.evidence && (
                        <div className="mt-2 pt-2 border-t border-borderLight/60 text-[11px] text-mutedText flex items-center justify-between">
                          <span className="truncate max-w-[240px]">
                            Snippet: &ldquo;{f.evidence.evidence_text}&rdquo;
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
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
                <div className="p-8 text-center text-xs text-mutedText bg-surface border border-borderLight rounded-lg">
                  Zero validation failures or checks recorded.
                </div>
              ) : (
                doc.validations.map((v: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border text-xs ${
                      v.passed
                        ? 'border-emerald-200 bg-emerald-50/30 text-emerald-900'
                        : v.severity === 'critical'
                        ? 'border-red-200 bg-red-50/40 text-red-900'
                        : 'border-amber-200 bg-amber-50/30 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <div className="flex items-center gap-1.5">
                        {v.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                        <span>{v.rule_id}</span>
                      </div>
                      <span className="uppercase text-[10px] font-mono font-medium">{v.severity}</span>
                    </div>
                    <p className="text-[11px] mt-1 text-graphite/90">{v.explanation}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: JSON Raw Trace */}
          {activeTab === 'json' && (
            <div className="p-3 rounded-lg bg-[#121316] text-neutral-300 font-mono text-[11px] overflow-auto max-h-[700px]">
              <pre>{JSON.stringify(doc, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

