'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ListOrdered, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';

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
    <div className="space-y-6">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
              Worker Telemetry · Port 8000
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Processing Queue & Job Coordinator
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Durable background asynchronous job coordinator with real-time state machine tracking, worker status, and task retries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Jobs</option>
              <option value="running">Running</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <Button
            variant="secondary"
            size="icon-md"
            onClick={loadJobs}
            title="Refresh Queue Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Telemetry KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Running Pipeline"
          value={runningCount}
          icon={<Zap className="w-4 h-4 text-sky-400" />}
          subtitle={<span className="font-mono text-slate-400">Active Worker Threads</span>}
        />

        <StatCard
          title="Pending Backlog"
          value={pendingCount}
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          subtitle={<span className="font-mono text-slate-400">Awaiting Slot</span>}
        />

        <StatCard
          title="Completed Jobs"
          value={completedCount}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          subtitle={<span className="font-mono text-slate-400">Successfully Processed</span>}
        />

        <StatCard
          title="Failed / Aborted"
          value={failedCount}
          icon={<AlertCircle className="w-4 h-4 text-rose-400" />}
          subtitle={<span className="font-mono text-slate-400">Processing Exceptions</span>}
        />
      </div>

      {/* Queue Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.08] font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Job Identifier</th>
                <th className="py-3 px-3 font-medium uppercase tracking-wider">Document Target</th>
                <th className="py-3 px-3 font-medium uppercase tracking-wider">Pipeline Engine</th>
                <th className="py-3 px-3 font-medium uppercase tracking-wider">Status</th>
                <th className="py-3 px-3 font-medium uppercase tracking-wider">Elapsed</th>
                <th className="py-3 px-3 font-medium uppercase tracking-wider">Submitted</th>
                <th className="py-3 px-4 font-medium uppercase tracking-wider text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-mono text-xs">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                        <span>Reading queue task list...</span>
                      </div>
                    ) : (
                      'Queue is currently idle. No tasks pending execution.'
                    )}
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-4 font-mono text-slate-200 font-medium">
                      <span className="text-sky-400">#</span>{j.id.substring(0, 8)}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-white flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate max-w-[240px] text-xs font-mono text-slate-300">{j.document_filename || j.document_id}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge variant="neutral">
                        {j.method}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge
                        dot
                        variant={
                          j.status === 'completed'
                            ? 'success'
                            : j.status === 'running'
                            ? 'info'
                            : j.status === 'failed'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {j.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 font-mono text-xs tabular-nums">
                      {j.duration_seconds ? `${j.duration_seconds}s` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px] tabular-nums">
                      {new Date(j.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {j.status === 'running' || j.status === 'pending' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(j.id)}
                        >
                          Abort Task
                        </Button>
                      ) : (
                        <Link href={`/documents/${j.document_id}`}>
                          <Button variant="secondary" size="sm">
                            <span>Inspect</span>
                            <ArrowUpRight className="w-3 h-3 text-slate-400" />
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
