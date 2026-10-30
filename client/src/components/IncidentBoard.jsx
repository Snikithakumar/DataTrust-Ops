import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  CheckCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  Copy,
  ExternalLink
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
    <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-6 shadow-xl shadow-navy-950/40 space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 font-mono flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Reliability Incidents &amp; Triage ({filteredIncidents.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-created incidents from pipeline failures and degraded quality scans with AI root-cause analysis.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-lg border border-slate-800 text-xs">
            {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded font-mono text-[11px] transition ${
                  filterStatus === st
                    ? 'bg-slate-800 text-teal-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-navy-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-400"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-navy-950/40">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
          <h4 className="text-sm font-semibold text-slate-200">No Incidents Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            All data pipelines and datasets within this filter criteria are operating within SLA tolerances.
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
                className="bg-navy-950/90 border border-slate-800 rounded-xl p-5 hover:border-slate-700/80 transition shadow-md shadow-navy-950/60 space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {getSeverityBadge(incident.severity)}
                    {getStatusBadge(incident.status)}
                    <h3 className="text-sm font-semibold text-slate-100 font-mono">
                      {incident.title}
                    </h3>
                  </div>

                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(incident.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {incident.summary}
                </p>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                  {incident.sourcePipeline && (
                    <span>Pipeline: <strong className="text-slate-300">{incident.sourcePipeline}</strong></span>
                  )}
                  {incident.datasetName && (
                    <span>Dataset: <strong className="text-slate-300">{incident.datasetName}</strong></span>
                  )}
                  {incident.details?.qualityScore && (
                    <span>Score: <strong className="text-rose-400">{incident.details.qualityScore}%</strong></span>
                  )}
                  {incident.resolvedAt && (
                    <span className="text-emerald-400">Resolved at {new Date(incident.resolvedAt).toLocaleTimeString()}</span>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {/* Status Toggle Dropdown */}
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Update Status:</span>
                    <select
                      value={incident.status}
                      onChange={(e) => onUpdateStatus(id, { status: e.target.value })}
                      className="bg-navy-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-400"
                    >
                      <option value="OPEN">Open</option>
                      <option value="INVESTIGATING">Investigating</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  {/* AI Explain Button */}
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
                    {isExplaining ? 'Analyzing Root Cause...' : hasExistingAI ? 'View AI Root Cause' : 'Analyze with AI'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Root Cause Explanation Modal */}
      {activeExplainModal && (
        <Modal
          isOpen={Boolean(activeExplainModal)}
          onClose={() => setActiveExplainModal(null)}
          title={`Root Cause Analysis: ${activeExplainModal.incident.title}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-xs font-sans text-slate-300">
            {/* Engine Provider Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Badge
                  variant={activeExplainModal.explanation.provider === 'GEMINI_API' ? 'primary' : 'success'}
                  size="sm"
                >
                  <Sparkles className="w-3 h-3" />
                  Engine: {activeExplainModal.explanation.provider}
                </Badge>
                <span className="text-[11px] text-slate-400 font-mono">
                  Guaranteed Zero-Hallucination Sandbox
                </span>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {new Date(activeExplainModal.explanation.generatedAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>

            {/* Root Cause Card */}
            <div className="bg-navy-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Root Cause Synthesis
              </h4>
              <p className="text-slate-200 leading-relaxed font-mono text-xs">
                {activeExplainModal.explanation.rootCause}
              </p>
            </div>

            {/* Impact Assessment */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Business &amp; Pipeline Impact
              </h4>
              <p className="text-slate-300 leading-relaxed">
                {activeExplainModal.explanation.impactSummary}
              </p>
            </div>

            {/* Affected Downstream Consumers */}
            {activeExplainModal.explanation.affectedDownstream && activeExplainModal.explanation.affectedDownstream.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Affected Downstream Systems
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeExplainModal.explanation.affectedDownstream.map((sys, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-teal-300 font-mono text-xs"
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Fixes */}
            {activeExplainModal.explanation.recommendedFixes && activeExplainModal.explanation.recommendedFixes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Recommended Engineering Remediation
                </h4>
                <div className="space-y-2">
                  {activeExplainModal.explanation.recommendedFixes.map((fix, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-navy-950 border border-slate-800 text-xs font-mono text-slate-300"
                    >
                      <span className="flex-1 pr-4">{fix}</span>
                      <button
                        onClick={() => copyFix(fix, idx)}
                        className="p-1 rounded text-slate-400 hover:text-white transition shrink-0"
                        title="Copy recommendation"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Facts Table */}
            {activeExplainModal.explanation.verifiedFindings && (
              <div className="bg-navy-950/60 p-3 rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="font-bold text-slate-300 uppercase">Verified Telemetry Facts (Ground Truth)</div>
                <div>Dataset: {activeExplainModal.explanation.verifiedFindings.dataset}</div>
                <div>Duplicate Rows: {activeExplainModal.explanation.verifiedFindings.duplicateRowsCount}</div>
                <div>Anomalies: {activeExplainModal.explanation.verifiedFindings.anomaliesCount}</div>
                <div>Missing Columns: {activeExplainModal.explanation.verifiedFindings.missingColumns?.join(', ') || 'None'}</div>
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
