import React from 'react';

const variants = {
  primary: 'bg-[#167D80] hover:bg-[#12676A] text-white font-medium shadow-sm active:scale-[0.98]',
  secondary: 'bg-[#F7F4ED] hover:bg-[#E9E5DC] text-[#253248] border border-[#D8D2C7] shadow-sm active:scale-[0.98]',
  outline: 'bg-transparent border border-[#167D80] text-[#167D80] hover:bg-[#167D80]/10 active:scale-[0.98]',
  danger: 'bg-[#B94A48] hover:bg-[#A13B39] text-white font-medium shadow-sm active:scale-[0.98]',
  ghost: 'bg-transparent hover:bg-[#E9E5DC] text-[#253248] active:scale-[0.98]',
  midnight: 'bg-[#17263F] hover:bg-[#101B30] text-white font-medium shadow-sm active:scale-[0.98]'
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#167D80]/40 disabled:opacity-50 disabled:cursor-not-allowed ${chosenSize} ${chosenVariant} ${className}`}
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
