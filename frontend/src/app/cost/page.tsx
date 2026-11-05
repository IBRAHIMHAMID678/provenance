'use client';

import { useState, useEffect } from 'react';
import { 
  CircleDollarSign, 
  Calculator, 
  TrendingUp, 
  Users, 
  Cpu, 
  FileText,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';

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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Unit Economics & TCO Ledger
            </span>
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-xs text-slate-400 font-mono">
              Central Metric: $/Correct Field
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Financial Operations & Cost Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Granular visibility uniting machine token consumption, local CPU OCR compute, and fully loaded human review labor.
          </p>
        </div>
      </div>

      {/* High-Level Expenditure Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Direct Machine Spend"
          value={`$${costData ? costData.total_machine_cost_usd.toFixed(4) : '0.0000'}`}
          icon={<Cpu className="w-4 h-4 text-sky-400" />}
          subtitle={<span className="font-mono text-slate-400">Zero Token Waste · Native + Local</span>}
        />

        <StatCard
          title="Human Review Labor"
          value={`$${costData ? costData.total_human_review_cost_usd.toFixed(2) : '0.00'}`}
          icon={<Users className="w-4 h-4 text-amber-400" />}
          subtitle={<span className="font-mono text-slate-400">{costData ? costData.total_human_review_hours : 0} hrs @ ${costData ? costData.hourly_reviewer_rate : 35}/hr</span>}
        />

        <StatCard
          title="Total Loaded Spend (TCO)"
          value={`$${costData ? costData.total_fully_loaded_cost_usd.toFixed(2) : '0.00'}`}
          icon={<CircleDollarSign className="w-4 h-4 text-emerald-400" />}
          subtitle={<span className="font-mono text-slate-400">Direct Machine + Operator Labor</span>}
        />

        <StatCard
          title="Extraction Operations"
          value={costData ? costData.total_extraction_runs : 0}
          icon={<FileText className="w-4 h-4 text-sky-400" />}
          subtitle={<span className="font-mono text-slate-400">Ledger Invocations</span>}
        />
      </div>

      {/* Financial Simulator & Unit Economics Projections */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Production Unit Economics Simulator
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate monthly enterprise claims operational costs comparing pure LLM vs our Adaptive Hybrid Architecture.
              </p>
            </div>
          </div>
          <Badge variant="info">
            Interactive Model
          </Badge>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          {/* Slider 1: Monthly Document Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Monthly Claims:</span>
              <span className="text-sky-300 font-semibold tabular-nums">{volume.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1k</span>
              <span>100k</span>
            </div>
          </div>

          {/* Slider 2: Human Escalation Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Review Escalation:</span>
              <span className="text-amber-300 font-semibold tabular-nums">{Math.round(reviewRate * 100)}%</span>
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
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>2%</span>
              <span>40%</span>
            </div>
          </div>

          {/* Slider 3: Minutes Per Review */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Review Minutes/Doc:</span>
              <span className="text-slate-200 font-semibold tabular-nums">{minutesPerReview} min</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="6.0"
              step="0.5"
              value={minutesPerReview}
              onChange={(e) => setMinutesPerReview(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 min</span>
              <span>6 min</span>
            </div>
          </div>

          {/* Slider 4: Hourly Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Reviewer Hourly:</span>
              <span className="text-emerald-300 font-semibold tabular-nums">${hourlyRate}/hr</span>
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
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
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
                <Badge variant="danger">Unoptimized</Badge>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Machine API Token Spend:</span>
                  <span className="text-white tabular-nums">${projections.baseline_pure_llm?.machine_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Human Verification Labor:</span>
                  <span className="text-white tabular-nums">${projections.baseline_pure_llm?.human_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/[0.06] text-sm font-bold text-white">
                  <span>Total Monthly TCO:</span>
                  <span className="text-rose-400 tabular-nums">${projections.baseline_pure_llm?.total_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>

            {/* Our Hybrid Architecture */}
            <div className="p-5 rounded-xl border border-sky-500/25 bg-sky-500/[0.04]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono uppercase text-sky-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Adaptive Hybrid Router</span>
                </span>
                <Badge variant="success">
                  {projections.savings_percentage ? `${projections.savings_percentage.toFixed(1)}% Cost Reduction` : 'Optimal'}
                </Badge>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Machine Inference Spend:</span>
                  <span className="text-sky-300 font-semibold tabular-nums">${projections.hybrid_router?.machine_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Human Verification Labor:</span>
                  <span className="text-slate-200 tabular-nums">${projections.hybrid_router?.human_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/[0.06] text-sm font-bold text-white">
                  <span>Total Monthly TCO:</span>
                  <span className="text-emerald-400 tabular-nums">${projections.hybrid_router?.total_cost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
