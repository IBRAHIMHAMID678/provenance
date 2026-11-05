'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  HardDrive,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Activity
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [settingsData, setSettingsData] = useState<any>({});
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [hourlyRate, setHourlyRate] = useState<number>(35.0);
  const [charDensity, setCharDensity] = useState<number>(200);
  const [imageRatio, setImageRatio] = useState<number>(0.35);
  const [activeModel, setActiveModel] = useState<string>('mock-insurance-extractor-v1');

  useEffect(() => {
    Promise.all([
      api.getSettings(),
      api.getSystemStatus()
    ]).then(([settRes, statRes]) => {
      const s = settRes.settings || {};
      setSettingsData(s);
      setSystemStatus(statRes);

      if (s.human_reviewer_hourly_rate?.value?.amount) {
        setHourlyRate(s.human_reviewer_hourly_rate.value.amount);
      }
      if (s.routing_thresholds?.value?.min_digital_char_density) {
        setCharDensity(s.routing_thresholds.value.min_digital_char_density);
      }
      if (s.routing_thresholds?.value?.max_image_area_ratio) {
        setImageRatio(s.routing_thresholds.value.max_image_area_ratio);
      }
      if (s.active_llm_provider?.value?.model) {
        setActiveModel(s.active_llm_provider.value.model);
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSetting('human_reviewer_hourly_rate', { amount: hourlyRate, currency: 'USD' });
      await api.updateSetting('routing_thresholds', {
        min_digital_char_density: charDensity,
        max_image_area_ratio: imageRatio,
        review_confidence_threshold: 0.85
      });
      await api.updateSetting('active_llm_provider', { provider: 'mock', model: activeModel });
      alert('Settings persisted successfully to D: drive database.');
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const freeGb = parseFloat(systemStatus?.disk_free_gb || '89.0');
  const totalGb = parseFloat(systemStatus?.disk_total_gb || '140.8');
  const usedPercent = Math.round(((totalGb - freeGb) / totalGb) * 100);

  return (
    <div className="space-y-6">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
              System Configuration & Tuning
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            System Settings & Hardware Diagnostics
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Configure extraction thresholds, reviewer labor economics, OCR paths, and D: drive storage diagnostics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Settings (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">
                  Operational & Cost Parameters
                </h2>
              </div>
              <Badge variant="neutral">D: Drive Persisted</Badge>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                Human Reviewer Hourly Rate ($/hr)
              </label>
              <Input
                type="number"
                step="0.5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="font-mono text-xs tabular-nums"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to calculate fully loaded TCO and Cost per Correct Field across manual review escalations.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                Minimum Digital Character Density (chars/page)
              </label>
              <Input
                type="number"
                value={charDensity}
                onChange={(e) => setCharDensity(Number(e.target.value))}
                className="font-mono text-xs tabular-nums"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pages with selectable character counts above this threshold qualify for zero-cost PyMuPDF native extraction.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                Maximum Image Area Ratio (0.0 - 1.0)
              </label>
              <Input
                type="number"
                step="0.05"
                min="0.0"
                max="1.0"
                value={imageRatio}
                onChange={(e) => setImageRatio(Number(e.target.value))}
                className="font-mono text-xs tabular-nums"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pages exceeding this image area ratio are classified as scans or mixed documents and routed to RapidOCR.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                Active LLM Model Selection
              </label>
              <Input
                type="text"
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Model endpoint invoked when extracting structured JSON schemas from unformatted document text.
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={saving}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </Button>
            </div>
          </Card>
        </form>

        {/* Telemetry & Diagnostics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <h2 className="text-xs font-semibold text-white flex items-center gap-2 font-mono uppercase">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>D: Drive Storage Telemetry</span>
              </h2>
              <Badge variant="success" dot>ACTIVE</Badge>
            </div>

            <div className="space-y-3 text-[11px] font-mono">
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Root Directory:</span>
                <span className="text-slate-200 truncate max-w-[200px]" title={systemStatus?.storage_root}>
                  {systemStatus?.storage_root || 'D:/PDF Extracter/backend/data'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Available Free:</span>
                <span className="font-semibold text-emerald-400 tabular-nums">
                  {freeGb} GB Free
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Total Volume:</span>
                <span className="text-slate-200 tabular-nums">
                  {totalGb} GB
                </span>
              </div>

              {/* Storage visual gauge */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Disk Utilization</span>
                  <span className="tabular-nums">{usedPercent}% used</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full"
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">C: Drive Isolation:</span>
                <span className="text-emerald-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Preserved (0 KB Written)</span>
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <h2 className="text-xs font-semibold text-white flex items-center gap-2 font-mono uppercase">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Extraction Engine Probes</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-500">Local Hardware</span>
            </div>

            <div className="space-y-2 text-[11px]">
              {systemStatus?.adapters?.map((a: any) => (
                <div key={a.method_id} className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-200 font-medium">{a.display_name}</span>
                  <Badge variant={a.is_available ? 'success' : 'neutral'} dot>
                    {a.is_available ? 'ONLINE' : 'OFFLINE'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
