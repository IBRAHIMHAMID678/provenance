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
  XCircle, 
  Clock,
  Sparkles,
  ArrowUpRight,
  HardDrive,
  Cpu,
  Layers,
  FileCheck
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Telemetry computation
  const totalDocs = documents.length;
  const completedDocs = documents.filter(d => d.status === 'completed').length;
  const reviewRequiredDocs = documents.filter(d => d.status === 'review_required').length;
  const digitalDocs = documents.filter(d => d.quality_category === 'clean_digital').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Vault Storage · D:\PDF Extracter
            </span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Document Ingestion & Vault
          </h1>
          <p className="text-xs text-white/50 max-w-2xl mt-1">
            Dual-layer ingestion pipeline with cryptographic SHA-256 deduplication, zero-cost PyMuPDF classification, and RapidOCR PP-OCRv4 failover.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative group px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Upload className={`w-3.5 h-3.5 ${uploading ? 'animate-bounce' : ''}`} />
            <span>{uploading ? 'Ingesting to D: Drive...' : 'Ingest PDF Document'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
            <span>Total Vault Docs</span>
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-1.5">
            {totalDocs}
          </div>
          <div className="text-[10px] text-white/50 mt-1 flex items-center gap-1 font-mono">
            <span>D: Storage Managed</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-300">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
            <span>Zero-Cost Digital</span>
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1.5">
            {digitalDocs}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1 font-mono">
            <span>PyMuPDF Native Bypass</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 hover:border-amber-500/30 transition-all duration-300">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
            <span>Review Escalations</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1.5">
            {reviewRequiredDocs}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1 font-mono">
            <span>Conf &lt; 0.85 Threshold</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all duration-300">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
            <span>Fully Extracted</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-blue-400 mt-1.5">
            {completedDocs}
          </div>
          <div className="text-[10px] text-blue-400/80 mt-1 flex items-center gap-1 font-mono">
            <span>Evidence Preserved</span>
          </div>
        </div>
      </div>

      {/* Spatial Drag-and-Drop Reticle Zone */}
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 backdrop-blur-md ${
          isDragging 
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01] shadow-[0_0_30px_rgba(0,242,254,0.2)]' 
            : 'border-white/15 bg-[#12161F]/40 hover:border-cyan-500/50 hover:bg-[#12161F]/70'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(0,242,254,0.4)] transition-all">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-white">
            {uploading ? 'Processing File Ingestion...' : 'Drag & Drop Insurance PDFs here, or click to browse'}
          </div>
          <div className="text-xs text-white/40 font-mono">
            Supports Claim Forms, Declarations, Loss Adjuster Invoices, Medical Bills up to 50MB
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] font-mono text-cyan-400/70">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" /> Storage: D:\PDF Extracter\backend\storage\documents
            </span>
            <span>·</span>
            <span>Deterministic SHA-256</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
          <input
            type="text"
            placeholder="Search by filename or SHA-256 hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#07080B]/80 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-white/10 bg-[#07080B] text-xs text-white/80 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="review_required">Review Required</option>
              <option value="queued">Queued</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <span className="font-mono text-[11px]">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-white/10 bg-[#07080B] text-xs text-white/80 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">All Types</option>
              <option value="claim_form">Claim Form</option>
              <option value="policy_schedule">Policy Schedule</option>
              <option value="insurance_invoice">Insurance Invoice</option>
              <option value="medical_expense_bill">Medical Bill</option>
            </select>
          </div>

          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}
            className="px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/20 text-[11px] font-mono text-white/40 hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Cybernetic Document Table */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0D1117] text-white/50 border-b border-white/10 font-mono text-[11px]">
            <tr>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Document Entity</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Type</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Pages</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Quality Profile</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Status</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Uploaded</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-white/40 font-mono text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Querying D: drive vault index...</span>
                  </div>
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-white/40 font-mono text-xs">
                  No matching insurance documents found. Upload a PDF above or adjust search parameters.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-cyan-500/[0.03] transition-colors group">
                  <td className="py-3.5 px-4 font-medium text-white">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyan-400 flex-shrink-0 group-hover:border-cyan-500/40 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <Link 
                          href={`/documents/${doc.id}`} 
                          className="font-semibold text-white/90 hover:text-cyan-400 transition-colors truncate max-w-sm block text-xs"
                        >
                          {doc.filename}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-white/40">
                          <span>ID: {doc.id.substring(0, 8)}</span>
                          {doc.is_duplicate && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                              DUPLICATE HASH
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/70">
                      {doc.document_type || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-white/70 font-mono text-xs">
                    {doc.page_count}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                      doc.quality_category === 'clean_digital'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : doc.quality_category === 'pure_scan'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-white/5 text-white/60 border-white/10'
                    }`}>
                      {doc.quality_category || 'pending'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                      doc.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : doc.status === 'review_required'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : doc.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        doc.status === 'completed' ? 'bg-emerald-400' :
                        doc.status === 'review_required' ? 'bg-amber-400' :
                        doc.status === 'failed' ? 'bg-rose-400' : 'bg-blue-400 animate-pulse'
                      }`} />
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-white/40 font-mono text-[11px]">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleTriggerProcess(doc.id)}
                        disabled={processingId === doc.id}
                        title="Re-run Extraction Pipeline"
                        className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-white/60 hover:text-cyan-400 transition-colors disabled:opacity-40"
                      >
                        <Play className={`w-3.5 h-3.5 ${processingId === doc.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        title="Delete from Storage"
                        className="p-1.5 rounded-lg border border-white/10 hover:border-rose-500/50 hover:bg-rose-500/10 text-white/60 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-300 text-xs font-medium text-white transition-all flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
