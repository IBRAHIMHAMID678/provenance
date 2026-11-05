'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Trash2, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  HardDrive,
  Cpu,
  ArrowUpRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadSampleDocument = async () => {
    try {
      setLoadingSample(true);
      const res = await api.generateSyntheticDataset(1);
      await loadDocuments();
      if (res && res.generated_documents && res.generated_documents.length > 0) {
        window.location.href = `/documents/${res.generated_documents[0].document_id}`;
      }
    } catch (err: any) {
      alert(`Sample document generation failed: ${err.message}`);
    } finally {
      setLoadingSample(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        document_type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setDocuments(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        await api.uploadDocument(files[i], true);
      }
      await loadDocuments();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleTriggerProcess = async (docId: string) => {
    try {
      setProcessingId(docId);
      await api.triggerProcess(docId, 'hybrid');
      await loadDocuments();
    } catch (err: any) {
      alert(`Process trigger error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!confirm(`Permanently purge "${filename}" and its extracted artifacts from D: drive storage?`)) return;
    try {
      await api.deleteDocument(docId);
      await loadDocuments();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const totalDocs = documents.length;
  const completedDocs = documents.filter(d => d.status === 'completed').length;
  const reviewRequiredDocs = documents.filter(d => d.status === 'review_required').length;
  const digitalDocs = documents.filter(d => d.quality_category === 'clean_digital').length;

  return (
    <div className="space-y-6">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
              Vault Storage · D:\PDF Extracter
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Document Ingestion & Vault
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Dual-layer ingestion pipeline with cryptographic SHA-256 deduplication, zero-cost PyMuPDF classification, and RapidOCR PP-OCRv4 failover.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".pdf"
            className="hidden"
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Ingesting to D: Drive...' : 'Ingest PDF Document'}</span>
          </Button>
        </div>
      </div>

      {/* Telemetry Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Vault Total"
          value={totalDocs}
          icon={<FileText className="w-4 h-4 text-sky-400" />}
          subtitle={<span className="font-mono text-slate-400">D: Storage Index</span>}
        />

        <StatCard
          title="Zero-Cost Digital"
          value={digitalDocs}
          icon={<Cpu className="w-4 h-4 text-emerald-400" />}
          subtitle={<span className="font-mono text-slate-400">PyMuPDF Native Bypass</span>}
        />

        <StatCard
          title="Review Escalations"
          value={reviewRequiredDocs}
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          subtitle={<span className="font-mono text-slate-400">Confidence &lt; 0.90</span>}
        />

        <StatCard
          title="Fully Extracted"
          value={completedDocs}
          icon={<CheckCircle2 className="w-4 h-4 text-sky-400" />}
          subtitle={<span className="font-mono text-slate-400">Spatial Evidence OK</span>}
        />
      </div>

      {/* Compact Industrial Drag-and-Drop Zone */}
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`group cursor-pointer border border-dashed rounded-xl p-5 text-center transition-all bg-[#0A0D15]/60 hover:bg-[#0D121F]/80 ${
          isDragging 
            ? 'border-sky-400 bg-sky-500/10' 
            : 'border-white/[0.12] hover:border-sky-500/40'
        }`}
      >
        <div className="flex items-center justify-center gap-4">
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">
              {uploading ? 'Processing File Ingestion...' : 'Drop insurance PDF documents here, or click to browse'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Supports Claim Forms, Policy Schedules, Loss Adjuster Invoices & Medical Bills (Deterministic SHA-256)
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search by filename or SHA-256 hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-3.5 h-3.5" />}
              className="font-mono text-xs"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono text-[11px]">Status:</span>
              <div className="w-36">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="review_required">Review Required</option>
                  <option value="queued">Queued</option>
                  <option value="failed">Failed</option>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-mono text-[11px]">Type:</span>
              <div className="w-40">
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="claim_form">Claim Form</option>
                  <option value="policy_schedule">Policy Schedule</option>
                  <option value="insurance_invoice">Insurance Invoice</option>
                  <option value="medical_expense_bill">Medical Bill</option>
                </Select>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Document Vault Content */}
      <Card>
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-mono text-xs">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Querying D: drive vault index...</span>
            </div>
          </div>
        ) : documents.length === 0 ? (
          /* Empty State & Onboarding Card (Phase 8) */
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Document Vault is Empty</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                No insurance documents found in this workspace. Upload a PDF above or load a sample document to observe end-to-end extraction, evidence localization, and review routing.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Button
                variant="primary"
                size="sm"
                onClick={handleLoadSampleDocument}
                disabled={loadingSample}
                className="w-full sm:w-auto text-xs font-medium"
              >
                {loadingSample ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                    Generating Sample...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-sky-300" />
                    Load Sample Document
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto text-xs"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload PDF
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.08] font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-medium uppercase tracking-wider">Document Entity</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Type</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Pages</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Quality Profile</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Status</th>
                    <th className="py-3 px-3 font-medium uppercase tracking-wider">Uploaded</th>
                    <th className="py-3 px-4 font-medium uppercase tracking-wider text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 flex-shrink-0 group-hover:text-sky-400 group-hover:border-sky-500/30 transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <Link 
                              href={`/documents/${doc.id}`} 
                              className="font-medium text-slate-200 hover:text-sky-300 transition-colors truncate max-w-sm block text-xs"
                            >
                              {doc.filename}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-500">
                              <span>ID: {doc.id.substring(0, 8)}</span>
                              {doc.is_synthetic ? (
                                <Badge variant="neutral" className="text-[9px] py-0 px-1 font-semibold border-amber-500/20 text-amber-300 bg-amber-500/10">
                                  SYNTHETIC
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-[9px] py-0 px-1 font-semibold">
                                  REAL
                                </Badge>
                              )}
                              {doc.is_duplicate && (
                                <Badge variant="warning" className="text-[9px] py-0 px-1 font-semibold">
                                  DUP HASH
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge variant="neutral">
                          {doc.document_type || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 font-mono text-xs tabular-nums">
                        {doc.page_count}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] font-mono text-slate-400">
                          {doc.quality_category || 'pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
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
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px] tabular-nums">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleTriggerProcess(doc.id)}
                            disabled={processingId === doc.id}
                            title="Re-run Extraction Pipeline"
                          >
                            <Play className={`w-3.5 h-3.5 text-sky-400 ${processingId === doc.id ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(doc.id, doc.filename)}
                            title="Purge from Storage"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-400" />
                          </Button>
                          <Link href={`/documents/${doc.id}`}>
                            <Button variant="secondary" size="sm">
                              <span>Inspect</span>
                              <ArrowUpRight className="w-3 h-3 text-slate-400" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (< 768px, zero horizontal scroll at 390px) */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link 
                        href={`/documents/${doc.id}`} 
                        className="font-medium text-slate-200 hover:text-sky-300 text-xs truncate block"
                      >
                        {doc.filename}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-mono text-slate-500">
                        <span>ID: {doc.id.substring(0, 8)}</span>
                        {doc.is_synthetic ? (
                          <Badge variant="neutral" className="text-[9px] py-0 px-1 font-semibold border-amber-500/20 text-amber-300 bg-amber-500/10">
                            SYNTHETIC
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[9px] py-0 px-1 font-semibold">
                            REAL
                          </Badge>
                        )}
                        {doc.is_duplicate && (
                          <Badge variant="warning" className="text-[9px] py-0 px-1 font-semibold">
                            DUP
                          </Badge>
                        )}
                      </div>
                    </div>

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
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Type</span>
                      <span className="text-slate-300 font-medium truncate block">{doc.document_type || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Pages / Quality</span>
                      <span className="text-slate-300 font-medium">{doc.page_count} pgs · {doc.quality_category || 'pending'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTriggerProcess(doc.id)}
                        disabled={processingId === doc.id}
                        className="text-xs px-2.5 py-1 h-7 text-sky-400 hover:text-sky-300"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </Button>
                      <Link href={`/documents/${doc.id}`}>
                        <Button variant="secondary" size="sm" className="text-xs px-2.5 py-1 h-7">
                          Inspect
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        className="text-xs px-2 py-1 h-7 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
