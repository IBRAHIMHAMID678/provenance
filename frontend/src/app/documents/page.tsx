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
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
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

  const handleTriggerProcess = async (docId: string) => {
    try {
      await api.triggerProcess(docId, 'hybrid');
      await loadDocuments();
    } catch (err: any) {
      alert(`Process trigger error: ${err.message}`);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document from D: drive storage?')) return;
    try {
      await api.deleteDocument(docId);
      await loadDocuments();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Upload Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-graphite">Document Library</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Ingest, classify, and inspect insurance claims, declarations, invoices, and certificates.
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
            className="px-4 py-2 rounded-md bg-charcoal text-white hover:bg-neutral-800 text-xs font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Ingesting PDF...' : 'Upload PDF Document'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-surface border border-borderLight">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-mutedText" />
          <input
            type="text"
            placeholder="Search by filename or identifier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-borderLight bg-background text-xs text-graphite placeholder:text-mutedText focus:outline-none focus:ring-1 focus:ring-charcoal"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-mutedText">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2 rounded border border-borderLight bg-background text-xs text-graphite focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="review_required">Review Required</option>
              <option value="queued">Queued</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-mutedText">
            <span>Category:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1 px-2 rounded border border-borderLight bg-background text-xs text-graphite focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="claim_form">Claim Form</option>
              <option value="policy_schedule">Policy Schedule</option>
              <option value="insurance_invoice">Insurance Invoice</option>
              <option value="medical_expense_bill">Medical Bill</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Table */}
      <div className="rounded-lg bg-surface border border-borderLight overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-surfaceSecondary text-mutedText border-b border-borderLight">
            <tr>
              <th className="py-3 px-4 font-medium">Filename</th>
              <th className="py-3 px-3 font-medium">Document Type</th>
              <th className="py-3 px-3 font-medium">Pages</th>
              <th className="py-3 px-3 font-medium">Quality Profile</th>
              <th className="py-3 px-3 font-medium">Status</th>
              <th className="py-3 px-3 font-medium">Uploaded</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderLight">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-mutedText">
                  Loading documents...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-mutedText">
                  No matching documents found in library. Upload a PDF or adjust filters.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-graphite flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <div>
                      <Link href={`/documents/${doc.id}`} className="hover:underline truncate max-w-xs block">
                        {doc.filename}
                      </Link>
                      {doc.is_duplicate && (
                        <span className="text-[10px] text-amber-600 font-mono">Duplicate hash</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-surfaceSecondary border border-borderLight text-[11px] text-graphite">
                      {doc.document_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-mutedText font-mono">
                    {doc.page_count}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-mutedText">
                    {doc.quality_category}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      doc.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : doc.status === 'review_required'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : doc.status === 'failed'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-mutedText">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTriggerProcess(doc.id)}
                        title="Rerun Extraction"
                        className="p-1.5 rounded hover:bg-surfaceSecondary text-neutral-500 hover:text-graphite transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        title="Delete Document"
                        className="p-1.5 rounded hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="px-2.5 py-1 rounded border border-borderLight bg-surface hover:bg-surfaceSecondary text-xs font-medium text-graphite"
                      >
                        Detail
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

