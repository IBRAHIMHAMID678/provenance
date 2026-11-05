import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`h-9 w-full rounded-lg bg-[#07090E] border border-white/[0.1] px-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all ${
            icon ? 'pl-9' : ''
          } ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

