import React from 'react';

const variantClasses = {
  healthy: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  success: 'bg-teal-500/10 text-teal-300 border border-teal-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  critical: 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/30',
  info: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
  neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
  primary: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
};

export default function Badge({ children, variant = 'neutral', size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium'
  };

  const chosenVariant = variantClasses[variant.toLowerCase()] || variantClasses.neutral;
  const chosenSize = sizeClasses[size] || sizeClasses.sm;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-mono uppercase tracking-wider ${chosenSize} ${chosenVariant} ${className}`}>
      {children}
    </span>
  );
}
