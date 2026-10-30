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
  let scoreColor = 'text-[#167D80]';
  let badgeVariant = 'healthy';
  let computedGrade = 'A';

  if (score < 25) {
    scoreColor = 'text-[#B94A48]';
    badgeVariant = 'critical';
    computedGrade = 'F';
  } else if (score < 50) {
    scoreColor = 'text-[#B94A48]';
    badgeVariant = 'danger';
    computedGrade = 'D';
  } else if (score < 75) {
    scoreColor = 'text-[#B77936]';
    badgeVariant = 'warning';
    computedGrade = 'C';
  } else if (score < 90) {
    scoreColor = 'text-[#167D80]';
    badgeVariant = 'info';
    computedGrade = 'B';
  }

  const grade = propGrade || computedGrade;
  const status = propStatus || (score >= 75 ? 'HEALTHY' : 'DEGRADED');

  const statusVariantMap = {
    HEALTHY: 'healthy',
    WARNING: 'warning',
    DEGRADED: 'warning',
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
    <div className="bg-[#F7F4ED] border border-[#D8D2C7] rounded-xl p-6 shadow-card space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#167D80]" />
          <h2 className="text-base font-semibold text-[#17263F] tracking-tight">
            Data Quality Score Breakdown
          </h2>
        </div>
        <button
          onClick={onOpenFormulaDoc}
          className="text-xs text-[#167D80] hover:text-[#12676A] flex items-center gap-1 font-medium hover:underline"
        >
          <Info className="w-3.5 h-3.5" /> Scoring Formula
        </button>
      </div>

      {/* Main Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: Overall Quality Score Gauge */}
        <div className="flex items-center gap-5 p-4 bg-[#FBF9F5] rounded-xl border border-[#D8D2C7]">
          <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#E9E5DC]"
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
              <span className="text-[10px] text-[#667085] font-semibold">GRADE {grade}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#17263F]">Quality Score</span>
              <Badge variant={statusVariantMap[status] || badgeVariant} size="xs">
                {status}
              </Badge>
            </div>
            <p className="text-xs text-[#667085] leading-snug">
              Weighted formula: Completeness (40%), Uniqueness (35%), Validity (25%).
              {propGrade && propGrade !== computedGrade && (
                <span className="block text-[11px] text-[#B77936] font-medium mt-1">
                  *Grade capped at {propGrade} by circuit-breaker rule.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Decoupled Freshness SLA Card */}
        <div className="p-4 bg-[#FBF9F5] rounded-xl border border-[#D8D2C7] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">
              <Clock className="w-4 h-4 text-[#167D80]" />
              <span>Data Freshness Status</span>
            </div>
            <Badge variant={freshnessVariantMap[freshnessStatus] || 'neutral'} size="xs">
              {freshnessStatus}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-mono text-[#17263F]">
              {freshnessScore}
            </span>
            <span className="text-xs text-[#667085]">
              {freshnessLag}
            </span>
          </div>

          <p className="text-xs text-[#667085] border-t border-[#D8D2C7] pt-2">
            Freshness is evaluated independently from data quality. Stream pipelines track event latency; static tables track batch ingestion sync time.
          </p>
        </div>
      </div>

      {/* Operational Gating Reasons Callout if present */}
      {statusReasons && statusReasons.length > 0 && status !== 'HEALTHY' && (
        <div className="p-3 bg-[#FDF8F3] border border-[#B77936]/30 rounded-lg text-xs text-[#253248] space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-[#B77936]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B77936]" />
            Data Quality Circuit-Breaker Findings:
          </div>
          {statusReasons.map((reason, idx) => (
            <div key={idx} className="pl-4 text-[#667085] text-xs">
              &bull; {reason}
            </div>
          ))}
        </div>
      )}

      {/* Component Weights Breakdown Progress Bars */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
          Pillar Breakdown
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Completeness */}
          <div className="p-3 bg-[#FBF9F5] rounded-lg border border-[#D8D2C7] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#17263F] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#167D80]" /> Completeness
              </span>
              <span className="text-[#167D80] font-bold font-mono">{completeness}%</span>
            </div>
            <div className="w-full bg-[#E9E5DC] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#167D80] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, completeness)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#667085] flex justify-between">
              <span>Weight: 40%</span>
              <span>Missing value ratio</span>
            </div>
          </div>

          {/* Uniqueness */}
          <div className="p-3 bg-[#FBF9F5] rounded-lg border border-[#D8D2C7] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#17263F] font-medium flex items-center gap-1">
                <CopyCheck className="w-3.5 h-3.5 text-[#8FD2C4]" /> Uniqueness
              </span>
              <span className="text-[#17263F] font-bold font-mono">{uniqueness}%</span>
            </div>
            <div className="w-full bg-[#E9E5DC] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#8FD2C4] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, uniqueness)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#667085] flex justify-between">
              <span>Weight: 35%</span>
              <span>Duplicate row ratio</span>
            </div>
          </div>

          {/* Validity */}
          <div className="p-3 bg-[#FBF9F5] rounded-lg border border-[#D8D2C7] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#17263F] font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-[#B77936]" /> Validity
              </span>
              <span className="text-[#17263F] font-bold font-mono">{validity}%</span>
            </div>
            <div className="w-full bg-[#E9E5DC] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#17263F] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, validity)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#667085] flex justify-between">
              <span>Weight: 25%</span>
              <span>Format & range bounds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
