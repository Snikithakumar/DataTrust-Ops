import React from 'react';

export default function Spinner({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-[3px]',
    xl: 'w-14 h-14 border-4'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-[#167D80] border-t-transparent ${sizeMap[size] || sizeMap.md} ${className}`} />
  );
}
