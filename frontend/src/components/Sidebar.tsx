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
  HardDrive
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: Files },
  { name: 'Processing Queue', href: '/queue', icon: ListOrdered },
  { name: 'Human Review', href: '/review', icon: UserCheck },
  { name: 'Extraction Lab', href: '/lab', icon: FlaskConical },
  { name: 'Experiments', href: '/experiments', icon: GitFork },
  { name: 'Evaluation', href: '/evaluation', icon: BarChart3 },
  { name: 'Cost Analysis', href: '/cost', icon: CircleDollarSign },
  { name: 'Datasets', href: '/datasets', icon: Database },
  { name: 'Security Tests', href: '/security', icon: ShieldCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [systemStatus, setSystemStatus] = useState<{ free_gb: number; healthy: boolean } | null>(null);

  useEffect(() => {
    api.getSystemStatus()
      .then(res => setSystemStatus({ free_gb: res.disk_free_gb, healthy: res.storage_healthy }))
      .catch(() => setSystemStatus(null));
  }, []);

  return (
    <aside className="w-64 bg-charcoal text-white flex flex-col h-screen fixed left-0 top-0 border-r border-[#26282E] select-none z-50">
      {/* Brand & Workspace */}
      <div className="p-4 border-b border-[#26282E]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded bg-accentOlive flex items-center justify-center font-bold text-xs text-white">
            IL
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">Insurance Lab</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#26282E] text-neutral-400 font-mono">v1.0</span>
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-400 bg-[#1A1C22] px-2.5 py-1.5 rounded border border-[#26282E]">
          <span className="truncate">Default Claims Ops</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#22242B] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-[#1A1C22]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Storage & Environment Telemetry */}
      <div className="p-3 border-t border-[#26282E] bg-[#16181E] text-[11px] text-neutral-400">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
            <span>Target Drive (D:)</span>
          </span>
          <span className="font-mono text-neutral-300">
            {systemStatus ? `${systemStatus.free_gb} GB free` : 'Checking...'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Engine Pipeline</span>
          </span>
          <span className="text-emerald-400 font-medium">Ready</span>
        </div>
      </div>
    </aside>
  );
}

