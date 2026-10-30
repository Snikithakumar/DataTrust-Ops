import React from 'react';

const variantClasses = {
  healthy: 'bg-[#8FD2C4]/25 text-[#167D80] border border-[#8FD2C4]',
  success: 'bg-[#8FD2C4]/25 text-[#167D80] border border-[#8FD2C4]',
  warning: 'bg-[#B77936]/15 text-[#B77936] border border-[#B77936]/40',
  critical: 'bg-[#B94A48]/15 text-[#B94A48] border border-[#B94A48]/40 font-semibold',
  danger: 'bg-[#B94A48]/15 text-[#B94A48] border border-[#B94A48]/40',
  info: 'bg-[#167D80]/15 text-[#167D80] border border-[#167D80]/30',
  neutral: 'bg-[#E9E5DC] text-[#253248] border border-[#D8D2C7]',
  primary: 'bg-[#17263F]/10 text-[#17263F] border border-[#17263F]/25'
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
