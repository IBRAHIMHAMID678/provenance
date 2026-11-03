'use client';

import { useState, useEffect } from 'react';
import { 
  CircleDollarSign, 
  Calculator, 
  TrendingUp, 
  Users, 
  Cpu, 
  FileText,
  Sliders
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-graphite">Cost Accounting & Unit Economics</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Granular financial visibility tracking machine token costs, local OCR compute, and human review labor.
          </p>
        </div>
      </div>

      {/* High-Level Expenditure Strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-surface border border-borderLight">
          <div className="flex items-center justify-between text-mutedText text-xs font-medium">
            <span>Machine API Spend</span>
            <Cpu className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-graphite mt-2">
            ${costData ? costData.total_machine_cost_usd.toFixed(4) : '0.00'}
          </div>
          <div className="text-xs text-mutedText mt-1">Direct token & inference cost</div>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-borderLight">
          <div className="flex items-center justify-between text-mutedText text-xs font-medium">
            <span>Human Review Labor</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            ${costData ? costData.total_human_review_cost_usd.toFixed(2) : '0.00'}
          </div>
          <div className="text-xs text-mutedText mt-1">
            {costData ? costData.total_human_review_hours : 0} hrs @ ${costData ? costData.hourly_reviewer_rate : 35}/hr
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-borderLight">
          <div className="flex items-center justify-between text-mutedText text-xs font-medium">
            <span>Fully Loaded Spend</span>
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-graphite mt-2">
            ${costData ? costData.total_fully_loaded_cost_usd.toFixed(2) : '0.00'}
          </div>
          <div className="text-xs text-mutedText mt-1">Machine + Human total TCO</div>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-borderLight">
          <div className="flex items-center justify-between text-mutedText text-xs font-medium">
            <span>Operations Scale</span>
            <FileText className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-graphite mt-2">
            {costData ? costData.total_extraction_runs : 0}
          </div>
          <div className="text-xs text-mutedText mt-1">Total extraction runs logged</div>
        </div>
      </div>

      {/* Financial Simulator (Business Impact Calculator) */}
      <div className="p-6 rounded-lg bg-surface border border-borderLight space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-borderLight pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-semibold text-graphite">Enterprise TCO Scaling Simulator</h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-surfaceSecondary border border-borderLight text-mutedText font-mono">
            Interactive Financial Projection
          </span>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span>Monthly Document Volume</span>
                <span className="font-mono font-bold text-graphite">{volume.toLocaleString()} docs</span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-charcoal cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span>Review Escalation Rate (%)</span>
                <span className="font-mono font-bold text-amber-600">{Math.round(reviewRate * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.50"
                step="0.01"
                value={reviewRate}
                onChange={(e) => setReviewRate(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-mutedText mt-1">
                Percentage of documents flagged for human operator verification.
              </p>
            </div>
          </div>

          {/* Projected Outcomes */}
          {projections && (
            <div className="p-5 rounded-lg bg-surfaceSecondary/60 border border-borderLight space-y-3">
              <h3 className="text-xs font-bold text-graphite uppercase tracking-wide">Projected Monthly Outcomes</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-borderLight/60">
                  <span className="text-mutedText">Projected Machine Cost:</span>
                  <span className="font-mono font-bold text-graphite">${projections.projected_monthly_machine_cost}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-borderLight/60">
                  <span className="text-mutedText">Projected Review Labor:</span>
                  <span className="font-mono font-bold text-amber-600">${projections.projected_monthly_human_cost}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-borderLight/60">
                  <span className="text-mutedText">Total Monthly TCO:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">${projections.projected_total_monthly_spend.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-mutedText">Fully Loaded Cost per Doc:</span>
                  <span className="font-mono font-bold text-graphite">${projections.projected_fully_loaded_cost_per_document}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

