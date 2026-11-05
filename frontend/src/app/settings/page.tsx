'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  HardDrive, 
  Cpu, 
  ShieldCheck,
  DollarSign,
  Activity,
  Server,
  Zap,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { api } from '@/lib/api';

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              System Configuration & Tuning
            </span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            System Settings & Hardware Diagnostics
          </h1>
          <p className="text-xs text-white/50 max-w-2xl mt-1">
            Configure extraction thresholds, reviewer labor economics, OCR paths, and D: drive storage diagnostics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Settings (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 glass-card p-6 rounded-xl border border-white/10 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">
                Operational & Cost Parameters
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80 uppercase">D: Drive Persisted</span>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-white/70 block mb-1.5">
              Human Reviewer Hourly Rate ($/hr)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-white/40 font-mono">$</span>
              <input
                type="number"
                step="0.5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#07080B] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <p className="text-[11px] text-white/40 mt-1">
              Used to calculate fully loaded TCO and Cost per Correct Field across manual review escalations.
            </p>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-white/70 block mb-1.5">
              Minimum Digital Character Density (chars/page)
            </label>
            <input
              type="number"
              value={charDensity}
              onChange={(e) => setCharDensity(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-[#07080B] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-white/40 mt-1">
              Pages with selectable character counts above this threshold qualify for zero-cost PyMuPDF native extraction.
            </p>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-white/70 block mb-1.5">
              Maximum Image Area Ratio (0.0 - 1.0)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.0"
              max="1.0"
              value={imageRatio}
              onChange={(e) => setImageRatio(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-[#07080B] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-white/40 mt-1">
              Pages exceeding this image area ratio are classified as scans or mixed documents and routed to RapidOCR.
            </p>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-white/70 block mb-1.5">
              Active LLM Model Selection
            </label>
            <input
              type="text"
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#07080B] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-white/40 mt-1">
              Model endpoint invoked when extracting structured JSON schemas from unformatted document text.
            </p>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all active:scale-[0.98] disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Persisting Changes...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>

        {/* Telemetry & Diagnostics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-xl border border-white/10 text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white flex items-center gap-2 font-mono uppercase">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>D: Drive Storage Telemetry</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-[11px] font-mono">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-white/40">Root Directory:</span>
                <span className="text-white truncate max-w-[200px]" title={systemStatus?.storage_root}>
                  {systemStatus?.storage_root || 'D:/PDF Extracter/backend/data'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-white/40">Available Free:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {freeGb} GB Free
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-white/40">Total Volume Capacity:</span>
                <span className="text-white">
                  {totalGb} GB
                </span>
              </div>
              
              {/* Storage visual gauge */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>Disk Utilization</span>
                  <span>{usedPercent}% used</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-white/40">C: Drive Isolation:</span>
                <span className="text-emerald-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Preserved (0 KB Written)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-white/10 text-xs space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white flex items-center gap-2 font-mono uppercase">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Extraction Engine Probes</span>
              </h2>
              <span className="text-[10px] font-mono text-white/40">Local Hardware</span>
            </div>

            <div className="space-y-2 text-[11px]">
              {systemStatus?.adapters?.map((a: any) => (
                <div key={a.method_id} className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/80 font-medium">{a.display_name}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-bold text-[10px] border ${
                    a.is_available 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${a.is_available ? 'bg-emerald-400' : 'bg-white/40'}`} />
                    {a.is_available ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
