import React from 'react';
import { ShieldCheck, Clock, Zap, Search, Lightbulb } from 'lucide-react';

export default function ProjectCapabilities() {
  const capabilities = [
    {
      icon: ShieldCheck,
      title: 'Explainable Quality Scoring',
      desc: 'Transparent, mathematical scoring based on Completeness (40%), Uniqueness (35%), and Validity (25%).'
    },
    {
      icon: Clock,
      title: 'Independent Freshness Monitoring',
      desc: 'Decoupled freshness SLA evaluates ingestion recency separately from data quality.'
    },
    {
      icon: Zap,
      title: 'Quality Circuit Breakers',
      desc: 'Automated ceiling caps prevent dirty datasets with high null foreign keys from receiving high grades.'
    },
    {
      icon: Search,
      title: 'Automatic Problem Detection',
      desc: 'Stream validation detects null spikes, duplicate rows, zero-byte payloads, and negative values.'
    },
    {
      icon: Lightbulb,
      title: 'Actionable Issue Explanations',
      desc: 'Synthesizes verified root causes and copy-ready SQL remediation rules without hallucinations.'
    }
  ];

  return (
    <div className="bg-[#F7F4ED] border border-[#D8D2C7] rounded-xl p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#17263F] flex items-center gap-2">
            Distinctive Platform Capabilities
          </h3>
          <p className="text-xs text-[#667085] mt-0.5">
            Key reliability principles powering DataTrust Ops.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
        {capabilities.map((cap, idx) => {
          const Icon = cap.icon;
          return (
            <div
              key={idx}
              className="p-3.5 bg-[#FBF9F5] border border-[#D8D2C7] rounded-xl space-y-2 hover:border-[#167D80] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E9E5DC] flex items-center justify-center text-[#167D80]">
                <Icon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-[#17263F]">
                {cap.title}
              </h4>
              <p className="text-[11px] text-[#667085] leading-relaxed">
                {cap.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
