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
  FileText,
  Activity,
  Cpu,
  Layers,
  ArrowUpRight,
  HardDrive,
  Zap
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

  const runningCount = jobs.filter(j => j.status === 'running').length;
  const pendingCount = jobs.filter(j => j.status === 'pending').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Worker Telemetry · Port 8000
            </span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Processing Queue & Job Coordinator
          </h1>
          <p className="text-xs text-white/50 max-w-2xl mt-1">
            Durable background asynchronous job coordinator with real-time state machine tracking, worker status, and task retries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-white/10 bg-[#07080B] text-xs text-white/80 focus:outline-none focus:border-cyan-500 font-mono"
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
            className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-white/60 hover:text-cyan-400 transition-colors"
            title="Refresh Queue Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Telemetry KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all duration-300">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
            <span>Running Pipeline</span>
            <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          </div>
          <div className="text-2xl font-mono font-bold text-blue-400 mt-1.5 flex items-baseline gap-2">
            <span>{runningCount}</span>
            <span className="text-[10px] text-white/40 font-normal">Active Threads</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 hover:border-amber-500/30 transition-all duration-300">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
            <span>Pending Backlog</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1.5 flex items-baseline gap-2">
            <span>{pendingCount}</span>
            <span className="text-[10px] text-white/40 font-normal">Awaiting Slot</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-300">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
            <span>Completed Jobs</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1.5 flex items-baseline gap-2">
            <span>{completedCount}</span>
            <span className="text-[10px] text-white/40 font-normal">Done</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10 hover:border-rose-500/30 transition-all duration-300">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
            <span>Failed / Aborted</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-rose-400 mt-1.5 flex items-baseline gap-2">
            <span>{failedCount}</span>
            <span className="text-[10px] text-white/40 font-normal">Errors</span>
          </div>
        </div>
      </div>

      {/* Cybernetic Queue Table */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0D1117] text-white/50 border-b border-white/10 font-mono text-[11px]">
            <tr>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Job Identifier</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Document Target</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Pipeline Engine</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Status</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Elapsed</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Submitted</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Operation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-white/40 font-mono text-xs">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>Reading queue task list...</span>
                    </div>
                  ) : (
                    'Queue is currently idle. No tasks pending execution.'
                  )}
                </td>
              </tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id} className="hover:bg-cyan-500/[0.03] transition-colors group">
                  <td className="py-3.5 px-4 font-mono text-white/80 font-bold">
                    <span className="text-cyan-400">#</span>{j.id.substring(0, 8)}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-white flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                    <span className="truncate max-w-[240px] text-xs">{j.document_filename || j.document_id}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">
                      {j.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                      j.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : j.status === 'running'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse'
                        : j.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-white/5 text-white/60 border-white/10'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        j.status === 'completed' ? 'bg-emerald-400' :
                        j.status === 'running' ? 'bg-blue-400' :
                        j.status === 'failed' ? 'bg-rose-400' : 'bg-white/40'
                      }`} />
                      {j.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-white/60 font-mono text-xs">
                    {j.duration_seconds ? `${j.duration_seconds}s` : '—'}
                  </td>
                  <td className="py-3.5 px-3 text-white/40 font-mono text-[11px]">
                    {new Date(j.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {j.status === 'running' || j.status === 'pending' ? (
                      <button
                        onClick={() => handleCancel(j.id)}
                        className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono transition-colors"
                      >
                        Abort Task
                      </button>
                    ) : (
                      <Link
                        href={`/documents/${j.document_id}`}
                        className="px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-300 text-xs font-medium text-white transition-all inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3 h-3" />
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
