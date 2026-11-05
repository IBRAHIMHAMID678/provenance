import * as React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    label: string;
    positive?: boolean;
  };
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  progress,
  className = '',
}: StatCardProps) {
  const percentage = progress && progress.total > 0
    ? Math.min(100, Math.round((progress.current / progress.total) * 100))
    : 0;

  return (
    <div
      className={`bg-[#0C1017]/90 border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 backdrop-blur-md shadow-sm transition-all duration-200 group flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span className="tracking-tight">{title}</span>
          {icon && (
            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 group-hover:text-sky-400 transition-colors">
              {icon}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-white mt-3 font-mono tabular-nums tracking-tight">
          {value}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.05] space-y-2">
        {progress && (
          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>{progress.label || 'Progress'}</span>
              <span className="text-slate-200 font-semibold">{percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400">
          {subtitle && <div className="text-[11px] text-slate-400 truncate">{subtitle}</div>}
          {trend && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                trend.positive
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
              }`}
            >
              {trend.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

