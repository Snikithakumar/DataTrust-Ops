import React from 'react';
import { Clock, ShieldCheck, CheckCircle2, CopyCheck, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import Badge from './UI/Badge';

export default function QualityScoreCard({
  score = 88.5,
  grade: propGrade,
  status: propStatus,
  qualityStatus: propQualityStatus,
  statusReasons = [],
  breakdown = {},
  freshness = {},
  onOpenFormulaDoc
}) {
  const completeness = breakdown?.completeness ?? 91.2;
  const uniqueness = breakdown?.uniqueness ?? 95.0;
  const validity = breakdown?.validity ?? 84.0;

  // Grade color
  let scoreColor = 'text-emerald-400';
  let badgeVariant = 'healthy';
  let computedGrade = 'A';

  if (score < 25) {
    scoreColor = 'text-rose-400';
    badgeVariant = 'critical';
    computedGrade = 'F';
  } else if (score < 50) {
    scoreColor = 'text-red-400';
    badgeVariant = 'danger';
    computedGrade = 'D';
  } else if (score < 75) {
    scoreColor = 'text-amber-400';
    badgeVariant = 'warning';
    computedGrade = 'C';
  } else if (score < 90) {
    scoreColor = 'text-teal-300';
    badgeVariant = 'info';
    computedGrade = 'B';
  }

  const grade = propGrade || computedGrade;
  const status = propStatus || (score >= 75 ? 'HEALTHY' : 'DEGRADED');

  const statusVariantMap = {
    HEALTHY: 'healthy',
    WARNING: 'warning',
    DEGRADED: 'danger',
    CRITICAL: 'critical',
    HIGH_RISK: 'critical'
  };

  const freshnessScore = freshness?.score != null ? `${freshness.score}%` : 'N/A';
  const freshnessLag = freshness?.lagFormatted ?? '18 min ago (Batch SLA)';
  const freshnessStatus = freshness?.status ?? 'ACCEPTABLE';

  const freshnessVariantMap = {
    PRISTINE: 'healthy',
    ACCEPTABLE: 'info',
    DEGRADED: 'warning',
    STALE: 'critical',
    NOT_APPLICABLE: 'neutral',
    UNKNOWN: 'neutral'
  };

  return (
    <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-6 shadow-xl shadow-navy-950/40 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-semibold text-slate-100 font-mono tracking-tight">
            Data Reliability Index
          </h2>
        </div>
        <button
          onClick={onOpenFormulaDoc}
          className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-mono hover:underline"
        >
          <Info className="w-3.5 h-3.5" /> Formula Docs
        </button>
      </div>

      {/* Main Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: Overall Quality Score Gauge */}
        <div className="flex items-center gap-5 p-4 bg-navy-950 rounded-xl border border-slate-800/90">
          <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={scoreColor}
                strokeDasharray={`${score}, 100`}
                strokeLinecap="round"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-2xl font-bold font-mono ${scoreColor}`}>
                {score}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">GRADE {grade}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Quality Score</span>
              <Badge variant={statusVariantMap[status] || badgeVariant} size="xs">
                {status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              Weighted formula: Completeness (40%), Uniqueness (35%), Validity (25%).
              {propGrade && propGrade !== computedGrade && (
                <span className="block text-[11px] text-amber-400 mt-1">
                  *Grade capped at {propGrade} by operational circuit-breaker ceiling.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Decoupled Freshness SLA Card */}
        <div className="p-4 bg-navy-950 rounded-xl border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Data Freshness (Decoupled SLA)</span>
            </div>
            <Badge variant={freshnessVariantMap[freshnessStatus] || 'neutral'} size="xs">
              {freshnessStatus}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {freshnessScore}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {freshnessLag}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            Freshness is evaluated independently from data quality. Stream pipelines track event latency; static dimension tables track batch ingestion sync time.
          </p>
        </div>
      </div>

      {/* Operational Gating Reasons Callout if present */}
      {statusReasons && statusReasons.length > 0 && status !== 'HEALTHY' && (
        <div className="p-3 bg-amber-950/25 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-200 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Operational Findings &amp; Circuit-Breakers:
          </div>
          {statusReasons.map((reason, idx) => (
            <div key={idx} className="pl-4 text-slate-300 text-[11px]">
              &bull; {reason}
            </div>
          ))}
        </div>
      )}

      {/* Component Weights Breakdown Progress Bars */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Deterministic Dimension Breakdown
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Completeness */}
          <div className="p-3 bg-navy-950/70 rounded-lg border border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Completeness
              </span>
              <span className="text-teal-300 font-bold">{completeness}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-teal-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, completeness)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between font-mono">
              <span>Weight: 40%</span>
              <span>Missing cell ratio</span>
            </div>
          </div>

          {/* Uniqueness */}
          <div className="p-3 bg-navy-950/70 rounded-lg border border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1">
                <CopyCheck className="w-3.5 h-3.5 text-cyan-400" /> Uniqueness
              </span>
              <span className="text-cyan-300 font-bold">{uniqueness}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, uniqueness)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between font-mono">
              <span>Weight: 35%</span>
              <span>Duplicate row ratio</span>
            </div>
          </div>

          {/* Validity */}
          <div className="p-3 bg-navy-950/70 rounded-lg border border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-400" /> Validity
              </span>
              <span className="text-indigo-300 font-bold">{validity}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, validity)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between font-mono">
              <span>Weight: 25%</span>
              <span>Range & schema bounds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
