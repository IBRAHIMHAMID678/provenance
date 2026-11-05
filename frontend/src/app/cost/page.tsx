'use client';

import { useState, useEffect } from 'react';
import { 
  CircleDollarSign, 
  Calculator, 
  TrendingUp, 
  Users, 
  Cpu, 
  FileText,
  Sliders,
  DollarSign,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CostAnalysisPage() {
  const [costData, setCostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Financial Calculator Sliders
  const [volume, setVolume] = useState<number>(10000);
  const [reviewRate, setReviewRate] = useState<number>(0.12);
  const [minutesPerReview, setMinutesPerReview] = useState<number>(2.5);
  const [hourlyRate, setHourlyRate] = useState<number>(35.0);
  const [projections, setProjections] = useState<any>(null);

  useEffect(() => {
    api.getCostSummary()
      .then(res => setCostData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.getUnitEconomics(volume, reviewRate)
      .then(res => setProjections(res))
      .catch(console.error);
  }, [volume, reviewRate]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Unit Economics & TCO Ledger
            </span>
            <span className="text-textMuted text-xs">·</span>
            <span className="text-xs text-textSecondary font-mono">
              Central Metric: $/Correct Field
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Financial Operations & Cost Telemetry
          </h1>
          <p className="text-xs text-textSecondary mt-1 max-w-2xl">
            Granular visibility uniting machine token consumption, local CPU OCR compute, and fully loaded human review labor.
          </p>
        </div>
      </div>

      {/* High-Level Expenditure Floating Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Direct Machine Spend */}
        <div className="glass-card p-5 rounded-xl border border-white/[0.08] relative overflow-hidden group">
          <div className="flex items-center justify-between text-textSecondary text-xs font-medium">
            <span>Direct Machine Spend</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 font-mono tracking-tight">
            ${costData ? costData.total_machine_cost_usd.toFixed(4) : '0.0000'}
          </div>
          <div className="text-[11px] text-textMuted mt-2 font-mono">
            Zero token waste · Native + Local OCR
          </div>
        </div>

        {/* Human Review Labor */}
        <div className="glass-card p-5 rounded-xl border border-white/[0.08] relative overflow-hidden group">
          <div className="flex items-center justify-between text-textSecondary text-xs font-medium">
            <span>Human Review Labor</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Users className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-3 font-mono tracking-tight">
            ${costData ? costData.total_human_review_cost_usd.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-textMuted mt-2 font-mono">
            {costData ? costData.total_human_review_hours : 0} hrs @ ${costData ? costData.hourly_reviewer_rate : 35}/hr
          </div>
        </div>

        {/* Fully Loaded Spend */}
        <div className="glass-card p-5 rounded-xl border border-white/[0.08] relative overflow-hidden group">
          <div className="flex items-center justify-between text-textSecondary text-xs font-medium">
            <span>Total Loaded Spend (TCO)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CircleDollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 font-mono tracking-tight">
            ${costData ? costData.total_fully_loaded_cost_usd.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-textMuted mt-2 font-mono">
            Direct Machine + Operator labor
          </div>
        </div>

        {/* Operations Volume */}
        <div className="glass-card p-5 rounded-xl border border-white/[0.08] relative overflow-hidden group">
          <div className="flex items-center justify-between text-textSecondary text-xs font-medium">
            <span>Extraction Operations</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 font-mono tracking-tight">
            {costData ? costData.total_extraction_runs : 0}
          </div>
          <div className="text-[11px] text-textMuted mt-2 font-mono">
            Extraction runs logged to ledger
          </div>
        </div>
      </div>

      {/* Financial Simulator & Unit Economics Projections */}
      <div className="p-6 rounded-2xl glass-panel border border-white/[0.08] space-y-6 shadow-float">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Production Unit Economics Simulator
              </h2>
              <p className="text-xs text-textMuted mt-0.5">
                Simulate monthly enterprise claims operational costs comparing pure LLM vs our Adaptive Hybrid Architecture.
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
            Interactive Model
          </span>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          {/* Slider 1: Monthly Document Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-textSecondary">Monthly Claims:</span>
              <span className="text-cyan-300 font-bold">{volume.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-textMuted font-mono">
              <span>1k</span>
              <span>100k</span>
            </div>
          </div>

          {/* Slider 2: Human Escalation Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-textSecondary">Review Escalation:</span>
              <span className="text-amber-300 font-bold">{Math.round(reviewRate * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.40"
              step="0.01"
              value={reviewRate}
              onChange={(e) => setReviewRate(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-textMuted font-mono">
              <span>2%</span>
              <span>40%</span>
            </div>
          </div>

          {/* Slider 3: Minutes Per Review */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-textSecondary">Review Minutes/Doc:</span>
              <span className="text-slate-300 font-bold">{minutesPerReview} min</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="6.0"
              step="0.5"
              value={minutesPerReview}
              onChange={(e) => setMinutesPerReview(Number(e.target.value))}
              className="w-full accent-blue-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-textMuted font-mono">
              <span>1 min</span>
              <span>6 min</span>
            </div>
          </div>

          {/* Slider 4: Hourly Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-textSecondary">Reviewer Hourly:</span>
              <span className="text-emerald-300 font-bold">${hourlyRate}/hr</span>
            </div>
            <input
              type="range"
              min="20"
              max="65"
              step="5"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-textMuted font-mono">
              <span>$20</span>
              <span>$65</span>
            </div>
          </div>
        </div>

        {/* Projection Comparison Table */}
        {projections && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Standard LLM Pipeline */}
            <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono uppercase text-slate-400">Baseline Pure LLM Pipeline</span>
                <span className="text-xs font-mono text-red-400">Unoptimized</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-textMuted">
                  <span>Machine API Token Spend:</span>
                  <span className="text-white">${projections.baseline_pure_llm?.machine_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-textMuted">
                  <span>Human Verification Labor:</span>
                  <span className="text-white">${projections.baseline_pure_llm?.human_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/[0.06] text-sm font-bold text-white">
                  <span>Total Monthly TCO:</span>
                  <span className="text-red-400">${projections.baseline_pure_llm?.total_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>

            {/* Our Hybrid Architecture */}
            <div className="p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-blue-950/20 shadow-glow-cyan">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono uppercase text-cyan-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Adaptive Hybrid Router</span>
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {projections.savings_percentage ? `${projections.savings_percentage.toFixed(1)}% Cost Reduction` : 'Optimal'}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-textMuted">
                  <span>Machine Inference Spend:</span>
                  <span className="text-cyan-300 font-semibold">${projections.hybrid_router?.machine_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-textMuted">
                  <span>Human Verification Labor:</span>
                  <span className="text-slate-300">${projections.hybrid_router?.human_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/[0.06] text-sm font-bold text-white">
                  <span>Total Monthly TCO:</span>
                  <span className="text-emerald-400">${projections.hybrid_router?.total_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
