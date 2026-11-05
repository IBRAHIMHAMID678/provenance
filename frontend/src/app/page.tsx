'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  AlertTriangle, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Database,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  ChevronRight,
  Cpu
} from 'lucide-react';
import { api } from '@/lib/api';

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [costSummary, setCostSummary] = useState<any>(null);
  const [evalSummary, setEvalSummary] = useState<any[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, costRes, evalRes, reviewRes, statusRes] = await Promise.all([
        api.getDocuments({ limit: 8 }),
        api.getCostSummary().catch(() => null),
        api.getEvaluationSummary().catch(() => ({ summary: [] })),
        api.getReviewQueue('pending').catch(() => ({ total: 0 })),
        api.getSystemStatus().catch(() => null)
      ]);
      setDocs(docsRes.items || []);
      setCostSummary(costRes);
      setEvalSummary(evalRes.summary || []);
      setReviewCount(reviewRes.total || 0);
      setSystemStatus(statusRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateSampleData = async () => {
    try {
      setGenerating(true);
      await api.generateSyntheticDataset(6);
      await fetchData();
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const totalDocs = docs.length;
  const reviewRequired = docs.filter(d => d.status === 'review_required').length;
  const completedDocs = docs.filter(d => d.status === 'completed').length;
  const failedDocs = docs.filter(d => d.status === 'failed').length;

  return (
    <div className="space-y-8">
      {/* Top HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Antigravity Spatial Engine
            </span>
            <span className="text-textMuted text-xs">·</span>
            <span className="text-xs text-textSecondary font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Pipeline Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Operations & Extraction Hub
          </h1>
          <p className="text-xs text-textSecondary mt-1 max-w-2xl">
            Real-time verification, evidence spatial localization, cost-per-correct-field telemetry, and ground-truth benchmark analytics.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-textSecondary hover:text-white hover:bg-white/[0.08] text-xs font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>
          
          <button
            onClick={handleGenerateSampleData}
            disabled={generating}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all duration-200 shadow-glow-cyan disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>{generating ? 'Seeding Benchmark...' : 'Seed Sample Partition'}</span>
          </button>
        </div>
      </div>

      {/* Primary Floating KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Processed Documents */}
        <div className="glass-card p-5 rounded-xl border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors"></div>
          <div className="flex items-center justify-between text-textSecondary text-xs font-medium">
            <span>Documents Ingested</span>
            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 font-mono tracking-tight">{totalDocs}</div>
          <div className="text-[11px] text-textMuted mt-2 flex items-center gap-2 font-mono">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {completedDocs} ready
            </span>
            <span>·</span>
            <span className="text-slate-400">{failedDocs} failed</span>
          </div>
        </div>

        {/* Card 2: Human Review Station */}
        <div className="glass-card p-5 rounded-xl border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex items-center justify-between text-textSecondary text-xs font-medium">
            <span>Human Review Queue</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <UserCheck className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-3 font-mono tracking-tight">{reviewCount}</div>
          <div className="text-[11px] text-textMuted mt-2 font-mono flex items-center justify-between">
            <span className="text-amber-300/80">
              {totalDocs > 0 ? `${Math.round((reviewRequired / Math.max(totalDocs, 1)) * 100)}% escalation rate` : 'Queue optimal'}
            </span>
            <Link href="/review" className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5">
              <span>Open Station</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Cost per Correct Field */}
        <div className="glass-card p-5 rounded-xl border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center justify-between text-textSecondary text-xs font-medium">
            <span>Cost per Correct Field ($/CF)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 font-mono tracking-tight">
            {evalSummary.length > 0 && evalSummary[0].cost_per_correct_field !== undefined
              ? `$${evalSummary[0].cost_per_correct_field.toFixed(5)}`
              : '$0.00000'}
          </div>
          <div className="text-[11px] text-textMuted mt-2 font-mono truncate">
            {evalSummary.length > 0 ? (
              <span className="text-cyan-400">{evalSummary[0].method_id} benchmark</span>
            ) : (
              <span className="text-slate-400">Zero machine token waste</span>
            )}
          </div>
        </div>

        {/* Card 4: Fully Loaded Spend */}
        <div className="glass-card p-5 rounded-xl border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex items-center justify-between text-textSecondary text-xs font-medium">
            <span>Total Loaded Spend</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 font-mono tracking-tight">
            ${costSummary ? costSummary.total_fully_loaded_cost_usd.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-textMuted mt-2 font-mono truncate">
            <span className="text-slate-300">${costSummary ? costSummary.total_machine_cost_usd.toFixed(4) : '0.00'}</span> mach · <span className="text-amber-300">${costSummary ? costSummary.total_human_review_cost_usd.toFixed(2) : '0.00'}</span> rev
          </div>
        </div>
      </div>

      {/* Main Workbench Grid: Activity & Engine Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Ingested Documents Table */}
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden border border-white/[0.08]">
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Recent Processing Activity</h2>
            </div>
            <Link 
              href="/documents" 
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>View Ingestion Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-textSecondary border-b border-white/[0.06] font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-medium">Document ID / File</th>
                  <th className="py-3 px-3 font-medium">Class</th>
                  <th className="py-3 px-3 font-medium">Quality Profile</th>
                  <th className="py-3 px-3 font-medium">State</th>
                  <th className="py-3 px-4 font-medium text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {docs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-textMuted">
                      No documents ingested yet. Click &quot;Seed Sample Partition&quot; above to initialize.
                    </td>
                  </tr>
                ) : (
                  docs.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-3 px-4 font-medium text-white flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                        <span className="truncate max-w-[210px] text-xs font-mono">{d.filename}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-cyan-300">
                          {d.document_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-400">
                        {d.quality_category}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                          d.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : d.status === 'review_required'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/15 text-red-300 border border-red-500/30'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${d.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/documents/${d.id}`}
                          className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 text-[11px] font-medium transition-colors"
                        >
                          Stage View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 Col): Engine Head-to-Head Telemetry */}
        <div className="space-y-6">
          {/* Active Engines Card */}
          <div className="glass-panel p-5 rounded-xl border border-white/[0.08]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Engine Readiness</h3>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                3 Active
              </span>
            </div>

            <div className="space-y-3">
              {/* Native PyMuPDF */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white">PyMuPDF Native</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">20–45 ms · $0.00</span>
                </div>
                <p className="text-[11px] text-textMuted">Vector text stream parser with microsecond coordinate extraction.</p>
              </div>

              {/* PaddleOCR DL */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white">PaddleOCR (PP-OCRv4)</span>
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold">ONNX · Scanned Specialist</span>
                </div>
                <p className="text-[11px] text-textMuted">Deep learning polygon OCR for pure raster scans and degraded forms.</p>
              </div>

              {/* Adaptive Hybrid Router */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,254,0.08)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-cyan-300">Adaptive Hybrid Router</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">90.4% Accuracy</span>
                </div>
                <p className="text-[11px] text-slate-300/80">Quality-based routing delivering minimal total cost per correct field.</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <Link href="/lab" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
                <span>Open Extraction Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/security" className="text-xs text-textMuted hover:text-textSecondary flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Security Suite</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
