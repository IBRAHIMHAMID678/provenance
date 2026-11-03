'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ListOrdered, 
  RefreshCw, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';

export default function QueuePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await api.getJobs(statusFilter !== 'all' ? statusFilter : undefined);
      setJobs(res.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 4000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleCancel = async (jobId: string) => {
    try {
      await api.cancelJob(jobId);
      await loadJobs();
    } catch (err: any) {
      alert(`Cancel error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-graphite">Processing Queue</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Durable background job processor, execution trace, and worker state machine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 rounded-md border border-borderLight bg-surface text-xs text-graphite focus:outline-none"
          >
            <option value="all">All Jobs</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={loadJobs}
            className="p-2 rounded-md border border-borderLight bg-surface text-mutedText hover:text-graphite text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-surface border border-borderLight overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-surfaceSecondary text-mutedText border-b border-borderLight">
            <tr>
              <th className="py-3 px-4 font-medium">Job ID</th>
              <th className="py-3 px-3 font-medium">Document</th>
              <th className="py-3 px-3 font-medium">Method</th>
              <th className="py-3 px-3 font-medium">Status</th>
              <th className="py-3 px-3 font-medium">Duration</th>
              <th className="py-3 px-3 font-medium">Submitted</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderLight">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-mutedText">
                  No active or past jobs found matching filter.
                </td>
              </tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-mutedText">
                    {j.id.substring(0, 8)}...
                  </td>
                  <td className="py-3.5 px-3 font-medium text-graphite flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="truncate max-w-[220px]">{j.document_filename}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-surfaceSecondary text-[11px] font-mono border border-borderLight">
                      {j.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      j.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : j.status === 'running'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse'
                        : j.status === 'failed'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-mutedText font-mono">
                    {j.duration_seconds ? `${j.duration_seconds}s` : '—'}
                  </td>
                  <td className="py-3.5 px-3 text-mutedText">
                    {new Date(j.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {j.status === 'running' || j.status === 'pending' ? (
                      <button
                        onClick={() => handleCancel(j.id)}
                        className="text-xs text-red-600 hover:underline font-medium"
                      >
                        Cancel
                      </button>
                    ) : (
                      <Link
                        href={`/documents/${j.document_id}`}
                        className="text-xs text-graphite hover:underline font-medium"
                      >
                        Inspect Doc →
                      </Link>
                    )}
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

