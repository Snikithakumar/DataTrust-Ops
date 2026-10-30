import React from 'react';
import Badge from './UI/Badge';

export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  colorClass = 'text-[#253248]',
  trend = null
}) {
  return (
    <div className="bg-[#F7F4ED] border border-[#D8D2C7] rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className={`text-3xl font-bold font-mono tracking-tight ${colorClass}`}>
              {value}
            </span>
            {badgeText && (
              <Badge variant={badgeVariant} size="xs">
                {badgeText}
              </Badge>
            )}
          </div>
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-[#E9E5DC] border border-[#D8D2C7] text-[#167D80] group-hover:bg-[#167D80] group-hover:text-white transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[#667085] border-t border-[#D8D2C7]/60 pt-2.5">
        <span>{subtext}</span>
        {trend && (
          <span className="font-mono text-[#167D80] font-medium flex items-center gap-0.5">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
