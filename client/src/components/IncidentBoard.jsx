import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  CheckCircle,
  Clock,
  ShieldAlert,
  Check,
  Copy,
  Info,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import Badge from './UI/Badge';
import Button from './UI/Button';
import Modal from './UI/Modal';

export default function IncidentBoard({
  incidents = [],
  onUpdateStatus,
  onExplainIncident,
  isExplainingId = null
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [activeExplainModal, setActiveExplainModal] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="critical">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge variant="danger">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">MEDIUM</Badge>;
      case 'LOW':
        return <Badge variant="info">LOW</Badge>;
      default:
        return <Badge variant="neutral">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="danger">OPEN</Badge>;
      case 'INVESTIGATING':
        return <Badge variant="warning">INVESTIGATING</Badge>;
      case 'RESOLVED':
        return <Badge variant="healthy">RESOLVED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchStatus = filterStatus === 'ALL' || incident.status === filterStatus;
    const matchSeverity = filterSeverity === 'ALL' || incident.severity === filterSeverity;
    return matchStatus && matchSeverity;
  });

  const handleExplain = async (incident) => {
    const result = await onExplainIncident(incident._id || incident.title);
    if (result && result.explanation) {
      setActiveExplainModal({
        incident,
        explanation: result.explanation
      });
    }
  };

  const copyFix = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-[#F7F4ED] border border-[#D8D2C7] rounded-xl p-6 shadow-card space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#D8D2C7]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#B77936]" />
            <h2 className="text-base font-semibold text-[#17263F]">
              Issues Management ({filteredIncidents.length})
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Data quality breaches, pipeline validation halts, and explainable root-cause insights.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#FBF9F5] p-1 rounded-lg border border-[#D8D2C7] text-xs">
            {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                  filterStatus === st
                    ? 'bg-[#17263F] text-white shadow-xs'
                    : 'text-[#667085] hover:text-[#17263F] hover:bg-[#E9E5DC]'
                }`}
              >
                {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Severity Filter Dropdown */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#FBF9F5] border border-[#D8D2C7] rounded-lg px-2.5 py-1.5 text-xs text-[#253248] focus:outline-none focus:ring-1 focus:ring-[#167D80]"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Incidents / Issues List */}
      {filteredIncidents.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#D8D2C7] rounded-xl bg-[#FBF9F5]">
          <CheckCircle className="w-10 h-10 text-[#167D80] mx-auto mb-2 opacity-80" />
          <h4 className="text-sm font-semibold text-[#17263F]">No Issues Found</h4>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            All data pipelines and datasets within this filter criteria are operating within expected SLA tolerances.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => {
            const id = incident._id || incident.title;
            const isExplaining = isExplainingId === id;
            const hasExistingAI = Boolean(incident.aiExplanation && incident.aiExplanation.rootCause);

            return (
              <div
                key={id}
                className="bg-[#FBF9F5] border border-[#D8D2C7] rounded-xl p-5 hover:border-[#167D80]/60 transition-all shadow-xs space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {getSeverityBadge(incident.severity)}
                    {getStatusBadge(incident.status)}
                    <h3 className="text-sm font-semibold text-[#17263F]">
                      {incident.title}
                    </h3>
                  </div>

                  <span className="text-xs font-mono text-[#667085] flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(incident.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-[#253248] leading-relaxed">
                  {incident.summary}
                </p>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#667085] pt-2 border-t border-[#D8D2C7]">
                  {incident.sourcePipeline && (
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#167D80]" />
                      Pipeline: <strong className="text-[#17263F]">{incident.sourcePipeline}</strong>
                    </span>
                  )}
                  {incident.datasetName && (
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#167D80]" />
                      Dataset: <strong className="text-[#17263F]">{incident.datasetName}</strong>
                    </span>
                  )}
                  {incident.details?.qualityScore && (
                    <span>
                      Score: <strong className="text-[#B94A48]">{incident.details.qualityScore}%</strong>
                    </span>
                  )}
                  {incident.resolvedAt && (
                    <span className="text-[#167D80] font-medium">
                      Resolved at {new Date(incident.resolvedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {/* Quick Status Action Buttons */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#667085] font-medium">Status:</span>
                    <button
                      onClick={() => onUpdateStatus(id, { status: 'INVESTIGATING' })}
                      className={`px-2.5 py-1 rounded text-xs transition border ${
                        incident.status === 'INVESTIGATING'
                          ? 'bg-[#B77936] text-white border-[#B77936] font-medium'
                          : 'bg-[#F7F4ED] text-[#253248] border-[#D8D2C7] hover:bg-[#E9E5DC]'
                      }`}
                    >
                      Investigate
                    </button>
                    <button
                      onClick={() => onUpdateStatus(id, { status: 'RESOLVED' })}
                      className={`px-2.5 py-1 rounded text-xs transition border ${
                        incident.status === 'RESOLVED'
                          ? 'bg-[#167D80] text-white border-[#167D80] font-medium'
                          : 'bg-[#F7F4ED] text-[#253248] border-[#D8D2C7] hover:bg-[#E9E5DC]'
                      }`}
                    >
                      Mark Resolved
                    </button>
                  </div>

                  {/* Explain Issue Button */}
                  <Button
                    size="sm"
                    variant={hasExistingAI ? 'outline' : 'primary'}
                    onClick={() => {
                      if (hasExistingAI) {
                        setActiveExplainModal({
                          incident,
                          explanation: incident.aiExplanation
                        });
                      } else {
                        handleExplain(incident);
                      }
                    }}
                    loading={isExplaining}
                    icon={Sparkles}
                  >
                    {isExplaining ? 'Analyzing Root Cause...' : hasExistingAI ? 'View Explanation' : 'Explain Issue'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Structured Explanation Panel Modal */}
      {activeExplainModal && (
        <Modal
          isOpen={Boolean(activeExplainModal)}
          onClose={() => setActiveExplainModal(null)}
          title={`Issue Analysis: ${activeExplainModal.incident.title}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-xs text-[#253248]">
            {/* Engine Provider Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-[#D8D2C7]">
              <div className="flex items-center gap-2">
                <Badge
                  variant={activeExplainModal.explanation.provider === 'GEMINI_API' ? 'primary' : 'success'}
                  size="sm"
                >
                  <Sparkles className="w-3 h-3" />
                  Engine: {activeExplainModal.explanation.provider}
                </Badge>
                <span className="text-[11px] text-[#667085]">
                  {activeExplainModal.explanation.provider === 'GEMINI_API'
                    ? 'Verified Gemini LLM Analysis'
                    : 'Factual Deterministic Rule-Based Fallback'}
                </span>
              </div>

              <span className="text-[11px] text-[#667085] font-mono">
                {new Date(activeExplainModal.explanation.generatedAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>

            {/* 1. What Happened? */}
            <div className="bg-[#FBF9F5] p-4 rounded-xl border border-[#D8D2C7] space-y-1.5">
              <h4 className="text-xs uppercase tracking-wider text-[#167D80] font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#167D80]" />
                What Happened?
              </h4>
              <p className="text-[#253248] leading-relaxed">
                {activeExplainModal.incident.summary}
              </p>
            </div>

            {/* 2. Why Did It Happen? (Root Cause Synthesis) */}
            <div className="bg-[#FDF8F3] p-4 rounded-xl border border-[#B77936]/30 space-y-1.5">
              <h4 className="text-xs uppercase tracking-wider text-[#B77936] font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#B77936]" />
                Why Did It Happen? (Root Cause)
              </h4>
              <p className="text-[#253248] leading-relaxed font-mono text-[11px]">
                {activeExplainModal.explanation.rootCause}
              </p>
            </div>

            {/* 3. What Is The Impact? */}
            <div className="space-y-1.5">
              <h4 className="text-xs uppercase tracking-wider text-[#667085] font-semibold">
                What Is The Impact?
              </h4>
              <p className="text-[#253248] leading-relaxed">
                {activeExplainModal.explanation.impactSummary}
              </p>
              {activeExplainModal.explanation.affectedDownstream && activeExplainModal.explanation.affectedDownstream.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeExplainModal.explanation.affectedDownstream.map((sys, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded bg-[#E9E5DC] text-[#17263F] border border-[#D8D2C7] font-medium text-[11px]"
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 4. What Should Be Fixed? (Recommended Fixes) */}
            {activeExplainModal.explanation.recommendedFixes && activeExplainModal.explanation.recommendedFixes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#D8D2C7]">
                <h4 className="text-xs uppercase tracking-wider text-[#667085] font-semibold">
                  What Should Be Fixed?
                </h4>
                <div className="space-y-2">
                  {activeExplainModal.explanation.recommendedFixes.map((fix, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#FBF9F5] border border-[#D8D2C7] rounded-lg text-xs flex items-start justify-between gap-3"
                    >
                      <span className="text-[#253248] font-mono text-[11px] leading-relaxed">
                        {fix}
                      </span>
                      <button
                        onClick={() => copyFix(fix, idx)}
                        className="p-1 rounded text-[#667085] hover:text-[#17263F] hover:bg-[#E9E5DC] transition shrink-0"
                        title="Copy fix recommendation"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-4 h-4 text-[#167D80]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setActiveExplainModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
