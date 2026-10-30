import React, { useState } from 'react';
import { Play, CheckCircle, AlertTriangle, XCircle, Clock, Terminal, Activity, Layers } from 'lucide-react';
import Badge from './UI/Badge';
import Button from './UI/Button';
import Modal from './UI/Modal';

export default function PipelineManager({ pipelines = [], onRunPipeline, isRunningId = null }) {
  const [injectFailure, setInjectFailure] = useState(false);
  const [activeLogPipeline, setActiveLogPipeline] = useState(null);

  const getStatusBadge = (status, isRunning) => {
    if (isRunning) {
      return (
        <Badge variant="info">
          <span className="w-2 h-2 rounded-full bg-[#167D80] animate-ping" /> Running
        </Badge>
      );
    }

    switch (status) {
      case 'HEALTHY':
      case 'SUCCESS':
        return <Badge variant="healthy"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'DEGRADED':
        return <Badge variant="warning"><AlertTriangle className="w-3 h-3" /> Degraded</Badge>;
      case 'FAILED':
        return <Badge variant="critical"><XCircle className="w-3 h-3" /> Failed</Badge>;
      case 'IDLE':
      default:
        return <Badge variant="neutral"><Clock className="w-3 h-3" /> Ready</Badge>;
    }
  };

  const handleRun = (pipeline) => {
    onRunPipeline({
      pipelineId: pipeline._id,
      name: pipeline.name,
      simulateFailure: injectFailure
    });
  };

  return (
    <div className="bg-[#F7F4ED] border border-[#D8D2C7] rounded-xl p-6 shadow-card space-y-6">
      {/* Header with Demo Failure Simulation Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#D8D2C7]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#167D80]" />
            <h2 className="text-base font-semibold text-[#17263F]">
              Pipeline Management ({pipelines.length})
            </h2>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#E9E5DC] text-[#667085] border border-[#D8D2C7]">
              Demo Environment
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Simulate data ingestion, schema validation gates, and automated issue creation.
          </p>
        </div>

        {/* Demo Toggle: Simulate Failure */}
        <div className="flex items-center gap-3 bg-[#FBF9F5] px-3.5 py-2 rounded-lg border border-[#D8D2C7] text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={injectFailure}
              onChange={(e) => setInjectFailure(e.target.checked)}
              className="rounded border-[#D8D2C7] text-[#B94A48] focus:ring-[#B94A48]/30 accent-[#B94A48]"
            />
            <span className={injectFailure ? 'text-[#B94A48] font-semibold' : 'text-[#667085] font-medium'}>
              Simulate Pipeline Failure (Demo)
            </span>
          </label>
        </div>
      </div>

      {/* Pipelines Table */}
      <div className="overflow-x-auto rounded-lg border border-[#D8D2C7] bg-[#FBF9F5]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#D8D2C7] text-[#667085] bg-[#E9E5DC]/60 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 font-semibold">Pipeline Name</th>
              <th className="py-3 px-3 font-semibold">Category</th>
              <th className="py-3 px-3 font-semibold">Status</th>
              <th className="py-3 px-3 font-semibold">Schedule</th>
              <th className="py-3 px-3 font-semibold">Last Execution</th>
              <th className="py-3 px-3 font-semibold">Duration</th>
              <th className="py-3 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8D2C7]/70 bg-[#F7F4ED]">
            {pipelines.map((pipeline) => {
              const isRunning = isRunningId === pipeline._id || isRunningId === pipeline.name;
              const lastRun = pipeline.lastRunAt
                ? new Date(pipeline.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Never';

              return (
                <tr key={pipeline._id || pipeline.name} className="hover:bg-[#FBF9F5] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#17263F]">
                      {pipeline.name}
                    </div>
                    <div className="text-[11px] text-[#667085] truncate max-w-xs mt-0.5">
                      {pipeline.description}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <Badge variant="primary" size="xs">
                      {pipeline.category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-3">
                    {getStatusBadge(pipeline.status, isRunning)}
                  </td>
                  <td className="py-3.5 px-3 text-[#667085] font-mono text-[11px]">
                    {pipeline.schedule}
                  </td>
                  <td className="py-3.5 px-3 text-[#253248] font-mono text-[11px]">
                    {lastRun}
                  </td>
                  <td className="py-3.5 px-3 text-[#667085] font-mono text-[11px]">
                    {pipeline.lastDurationMs ? `${pipeline.lastDurationMs}ms` : '--'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActiveLogPipeline(pipeline)}
                        icon={Terminal}
                        title="View Execution Logs & History"
                      >
                        Logs
                      </Button>
                      <Button
                        size="sm"
                        variant={injectFailure ? 'danger' : 'primary'}
                        onClick={() => handleRun(pipeline)}
                        loading={isRunning}
                        icon={Play}
                      >
                        {isRunning ? 'Running...' : 'Run Pipeline'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Execution Logs Modal */}
      {activeLogPipeline && (
        <Modal
          isOpen={Boolean(activeLogPipeline)}
          onClose={() => setActiveLogPipeline(null)}
          title={`Execution History & Logs: ${activeLogPipeline.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#667085] pb-2 border-b border-[#D8D2C7]">
              <span><strong>Source:</strong> {activeLogPipeline.sourceDataset}</span>
              <span><strong>Target:</strong> {activeLogPipeline.targetDestination}</span>
            </div>

            {/* Terminal Window with Deep Midnight Navy */}
            <div className="bg-[#101B30] p-4 rounded-xl font-mono text-xs text-[#E9E5DC] space-y-2 max-h-96 overflow-y-auto border border-[#17263F] shadow-inner">
              {activeLogPipeline.executionHistory && activeLogPipeline.executionHistory.length > 0 ? (
                activeLogPipeline.executionHistory.map((run, runIdx) => (
                  <div key={runIdx} className="border-b border-[#17263F] pb-3 mb-3 last:border-0 last:mb-0">
                    <div className="flex items-center justify-between text-[#8FD2C4] font-semibold mb-1.5">
                      <span>[{run.runId}] Status: {run.status} | Quality: {run.qualityScore || 'N/A'}%</span>
                      <span className="text-[#8A94A6] text-[11px] font-normal">{new Date(run.triggeredAt).toLocaleString()}</span>
                    </div>
                    {run.logs && run.logs.length > 0 ? (
                      run.logs.map((log, lIdx) => (
                        <div
                          key={lIdx}
                          className={`text-[11px] leading-relaxed ${
                            log.includes('[ERROR]') || log.includes('[FATAL]')
                              ? 'text-[#B94A48]'
                              : log.includes('[WARN]')
                              ? 'text-[#B77936]'
                              : 'text-[#D8D2C7]'
                          }`}
                        >
                          {log}
                        </div>
                      ))
                    ) : (
                      <div className="text-[#8A94A6] italic text-xs">No logs recorded for this run.</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[#8A94A6] italic text-xs py-4 text-center">
                  No execution history recorded yet. Click "Run Pipeline" to trigger a run.
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-[#667085]">
                Simulated logs generated by DataTrust Ops validation engine.
              </span>
              <Button variant="secondary" onClick={() => setActiveLogPipeline(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
