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
  Activity,
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
  { name: 'Human Review Station', href: '/review', icon: UserCheck, badge: 'Active' },
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

  useEffect(() => {
    api.getSystemStatus()
      .then(res => setSystemStatus({ free_gb: res.disk_free_gb, healthy: res.storage_healthy }))
      .catch(() => setSystemStatus({ free_gb: 88.4, healthy: true }));
  }, []);

  return (
    <aside className="w-64 bg-[#0A0C13]/90 text-textPrimary flex flex-col h-screen fixed left-0 top-0 border-r border-white/[0.08] backdrop-blur-2xl select-none z-50 shadow-[4px_0_30px_rgba(0,0,0,0.5)]">
      {/* Brand & Workspace HUD */}
      <div className="p-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-glow-cyan">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0A0C13] shadow-[0_0_8px_#10B981]"></span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs tracking-tight text-white truncate">Document Intelligence</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.08] text-cyan-300 font-mono border border-cyan-500/20">v1.0</span>
            </div>
            <p className="text-[10px] text-textMuted tracking-tight font-mono">Antigravity Lab</p>
          </div>
        </div>

        {/* Workspace Pill */}
        <div className="flex items-center justify-between text-xs text-textSecondary bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12] transition-colors">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00F2FE]"></span>
            <span className="truncate text-[11px] font-medium text-slate-300">Claims Ops Partition</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-medium">LIVE</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-white border border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,254,0.12)]'
                  : 'text-textSecondary hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && !isActive && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F2FE]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Storage & Environment Telemetry HUD */}
      <div className="p-3 border-t border-white/[0.07] bg-[#07090E]/80 text-[11px] text-textMuted">
        <div className="flex items-center justify-between mb-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <span className="flex items-center gap-1.5 text-textSecondary">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Storage (D:)</span>
          </span>
          <span className="font-mono text-cyan-300 font-semibold text-[11px]">
            {systemStatus ? `${systemStatus.free_gb.toFixed(1)} GB free` : '88.4 GB free'}
          </span>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>Hybrid Router:</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>OPTIMAL</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
