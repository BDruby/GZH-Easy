import React from 'react';
import { cn } from '../../lib/utils';

export function ShimmerButton({
  children,
  onClick,
  disabled = false,
  className = '',
  shimmerColor = '#10b981',
  background = 'rgba(15, 23, 42, 0.9)',
  size = 'medium',
}) {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base font-semibold',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-emerald-500/30 font-medium text-white shadow-lg transition-all duration-300 hover:border-emerald-400 hover:shadow-emerald-500/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50',
        sizeClasses[size] || sizeClasses.medium,
        className
      )}
      style={{ background }}
    >
      {/* Animated shimmer beam border */}
      <span className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="absolute -inset-[100%] z-0 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#10b981_50%,#0000_100%)] opacity-30 group-hover:opacity-70 transition-opacity" />

      {/* Button content backdrop */}
      <span className="absolute inset-[1px] z-10 rounded-[11px] bg-slate-900/90 transition-colors group-hover:bg-slate-900/80" />

      {/* Inner text content */}
      <span className="relative z-20 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
}
