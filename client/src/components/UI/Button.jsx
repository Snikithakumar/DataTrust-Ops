import React from 'react';

const variants = {
  primary: 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold shadow-lg shadow-teal-500/20 active:scale-[0.98]',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-[0.98]',
  outline: 'bg-transparent border border-teal-500/40 hover:bg-teal-500/10 text-teal-300 active:scale-[0.98]',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-600/20 active:scale-[0.98]',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 active:scale-[0.98]'
};

const sizes = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-1.5 text-sm',
  lg: 'px-5 py-2.5 text-base'
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon: Icon = null,
  ...props
}) {
  const chosenVariant = variants[variant] || variants.primary;
  const chosenSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-400/50 disabled:opacity-50 disabled:cursor-not-allowed ${chosenSize} ${chosenVariant} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
