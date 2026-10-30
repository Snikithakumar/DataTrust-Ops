import React from 'react';
import Badge from './UI/Badge';

export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  colorClass = 'text-teal-400',
  trend = null
}) {
  return (
    <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-5 shadow-lg shadow-navy-950/40 relative overflow-hidden group hover:border-slate-700/80 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
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
          <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-slate-300 group-hover:border-teal-500/30 group-hover:text-teal-400 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2.5">
        <span>{subtext}</span>
        {trend && (
          <span className="font-mono text-emerald-400 flex items-center gap-0.5">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
