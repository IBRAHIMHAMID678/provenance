import * as React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`h-9 w-full rounded-lg bg-[#07090E] border border-white/[0.1] px-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all font-mono ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

