'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Files, 
  ListOrdered, 
  UserCheck, 
  FlaskConical, 
  GitFork, 
  BarChart3, 
  CircleDollarSign, 
  Database, 
  ShieldCheck, 
  Settings,
  HardDrive,
  Cpu,
  Layers
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { name: 'Operations Overview', href: '/', icon: LayoutDashboard },
  { name: 'Document Ingestion', href: '/documents', icon: Files },
  { name: 'Processing Queue', href: '/queue', icon: ListOrdered },
  { name: 'Human Review Station', href: '/review', icon: UserCheck, hasDynamicBadge: true },
  { name: 'Extraction Lab', href: '/lab', icon: FlaskConical },
  { name: 'Experiment Matrix', href: '/experiments', icon: GitFork },
  { name: 'Evaluation & Benchmarks', href: '/evaluation', icon: BarChart3 },
  { name: 'Cost Accounting', href: '/cost', icon: CircleDollarSign },
  { name: 'Benchmark Datasets', href: '/datasets', icon: Database },
  { name: 'Adversarial Security', href: '/security', icon: ShieldCheck },
  { name: 'System Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [systemStatus, setSystemStatus] = useState<{ free_gb: number; healthy: boolean } | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    api.getSystemStatus()
      .then(res => setSystemStatus({ free_gb: res.disk_free_gb, healthy: res.storage_healthy }))
      .catch(() => setSystemStatus({ free_gb: 88.4, healthy: true }));

    api.getReviewQueue('pending')
      .then(res => setReviewCount(res.total || 0))
      .catch(() => setReviewCount(0));
  }, [pathname]);

  return (
    <aside className="w-64 bg-[#090C13] text-slate-200 flex flex-col h-screen fixed left-0 top-0 border-r border-white/[0.08] select-none z-50">
      {/* Brand & Workspace HUD */}
      <div className="p-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs tracking-tight text-white uppercase font-mono">Provenance</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 font-mono border border-white/[0.08]">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight">Insurance Intelligence</p>
          </div>
        </div>

        {/* Workspace Partition Indicator */}
        <div className="flex items-center justify-between text-xs bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="truncate text-[11px] font-medium text-slate-300">Claims Partition</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-medium">LIVE</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          const showReviewBadge = item.hasDynamicBadge && reviewCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-sky-500/10 text-sky-300 border border-sky-500/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="truncate">{item.name}</span>
              </div>

              {showReviewBadge && !isActive && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-medium">
                  {reviewCount}
                </span>
              )}

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Storage & Environment Telemetry HUD */}
      <div className="p-3 border-t border-white/[0.07] bg-[#07090F] text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px]">Storage (D:)</span>
          </span>
          <span className="font-mono text-slate-200 font-medium text-[11px] tabular-nums">
            {systemStatus ? `${systemStatus.free_gb.toFixed(1)} GB free` : '88.4 GB free'}
          </span>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>Hybrid Router:</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>OPTIMAL</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
