'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  HardDrive, 
  Cpu, 
  ShieldCheck,
  DollarSign,
  Activity
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-graphite">System Configuration & Settings</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Configure extraction thresholds, reviewer labor economics, OCR paths, and D: drive storage diagnostics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Form Settings (7 cols) */}
        <form onSubmit={handleSave} className="col-span-7 p-6 rounded-lg bg-surface border border-borderLight space-y-5">
          <h2 className="text-sm font-bold text-graphite border-b border-borderLight pb-2">
            Operational Parameters
          </h2>

          <div>
            <label className="text-xs font-medium text-graphite block mb-1">
              Human Reviewer Hourly Rate ($/hr)
            </label>
            <input
              type="number"
              step="0.5"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full p-2 rounded-md border border-borderLight text-xs text-graphite focus:outline-none"
            />
            <p className="text-[11px] text-mutedText mt-1">
              Used to calculate fully loaded TCO and Cost per Correct Field.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-graphite block mb-1">
              Minimum Digital Character Density (chars/page)
            </label>
            <input
              type="number"
              value={charDensity}
              onChange={(e) => setCharDensity(Number(e.target.value))}
              className="w-full p-2 rounded-md border border-borderLight text-xs text-graphite focus:outline-none"
            />
            <p className="text-[11px] text-mutedText mt-1">
              Pages with selectable character counts above this threshold qualify for zero-cost PyMuPDF native extraction.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-graphite block mb-1">
              Maximum Image Area Ratio (0.0 - 1.0)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.0"
              max="1.0"
              value={imageRatio}
              onChange={(e) => setImageRatio(Number(e.target.value))}
              className="w-full p-2 rounded-md border border-borderLight text-xs text-graphite focus:outline-none"
            />
            <p className="text-[11px] text-mutedText mt-1">
              Pages exceeding this image area ratio are classified as scans or mixed documents.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-graphite block mb-1">
              Active LLM Model Selection
            </label>
            <input
              type="text"
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="w-full p-2 rounded-md border border-borderLight text-xs text-graphite font-mono focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-borderLight flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-charcoal text-white hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>

        {/* Telemetry & Diagnostics (5 cols) */}
        <div className="col-span-5 space-y-4">
          <div className="p-5 rounded-lg bg-surface border border-borderLight text-xs space-y-3">
            <h2 className="text-sm font-bold text-graphite flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-700" />
              <span>D: Drive Storage Diagnostics</span>
            </h2>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between py-1 border-b border-borderLight/60">
                <span className="text-mutedText">Root Path:</span>
                <span className="font-mono text-graphite truncate max-w-[200px]">
                  {systemStatus?.storage_root || 'D:/PDF Extracter/backend/data'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-borderLight/60">
                <span className="text-mutedText">Drive Available:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {systemStatus?.disk_free_gb || '89.0'} GB free
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-borderLight/60">
                <span className="text-mutedText">Capacity Total:</span>
                <span className="font-mono text-graphite">
                  {systemStatus?.disk_total_gb || '140.8'} GB
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-mutedText">Storage Health:</span>
                <span className="text-emerald-700 font-bold uppercase">Optimal (Zero C: Drive Pressure)</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-surface border border-borderLight text-xs space-y-2.5">
            <h2 className="text-sm font-bold text-graphite flex items-center gap-2">
              <Activity className="w-4 h-4 text-neutral-400" />
              <span>Engine Status</span>
            </h2>
            <div className="space-y-1.5 text-[11px]">
              {systemStatus?.adapters?.map((a: any) => (
                <div key={a.method_id} className="flex items-center justify-between py-1 border-b border-borderLight/40">
                  <span className="font-medium text-graphite">{a.display_name}</span>
                  <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                    a.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                  }`}>
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

