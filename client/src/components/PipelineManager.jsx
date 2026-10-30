import React, { useState } from 'react';
import { Play, CheckCircle, AlertTriangle, XCircle, Clock, Terminal, ShieldAlert } from 'lucide-react';
import Badge from './UI/Badge';
import Button from './UI/Button';
import Modal from './UI/Modal';

export default function PipelineManager({ pipelines = [], onRunPipeline, isRunningId = null }) {
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [injectFailure, setInjectFailure] = useState(false);
  const [activeLogPipeline, setActiveLogPipeline] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'HEALTHY':
        return <Badge variant="healthy"><CheckCircle className="w-3 h-3" /> Healthy</Badge>;
      case 'DEGRADED':
        return <Badge variant="warning"><AlertTriangle className="w-3 h-3" /> Degraded</Badge>;
      case 'FAILED':
        return <Badge variant="critical"><XCircle className="w-3 h-3" /> Failed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
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
    <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-6 shadow-xl shadow-navy-950/40 space-y-6">
      {/* Header with Failure Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 font-mono flex items-center gap-2">
            Simulated Data Pipelines ({pipelines.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Trigger automated extraction, schema gating, and validation runs in the simulated environment.
          </p>
        </div>

        {/* Demo Toggle: Simulate Failure */}
        <div className="flex items-center gap-3 bg-navy-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={injectFailure}
              onChange={(e) => setInjectFailure(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500/30"
            />
            <span className={injectFailure ? 'text-rose-400 font-medium' : 'text-slate-400'}>
              Force Quality Breach (Demo)
            </span>
          </label>
        </div>
      </div>

      {/* Pipelines Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">Pipeline Name</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Schedule</th>
              <th className="py-3 px-3">Last Run</th>
              <th className="py-3 px-3">Duration</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {pipelines.map((pipeline) => {
              const isRunning = isRunningId === pipeline._id || isRunningId === pipeline.name;
              const lastRun = pipeline.lastRunAt
                ? new Date(pipeline.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Never';

              return (
                <tr key={pipeline._id || pipeline.name} className="hover:bg-navy-950/40 transition">
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-200">
                      {pipeline.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs font-sans">
                      {pipeline.description}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <Badge variant="primary" size="xs">
                      {pipeline.category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-3">
                    {getStatusBadge(pipeline.status)}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">
                    {pipeline.schedule}
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">
                    {lastRun}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">
                    {pipeline.lastDurationMs ? `${pipeline.lastDurationMs}ms` : '--'}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActiveLogPipeline(pipeline)}
                        icon={Terminal}
                        title="View Execution Logs"
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
                        {isRunning ? 'Running...' : 'Run'}
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
          title={`Execution Logs: ${activeLogPipeline.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
              <span>Source: {activeLogPipeline.sourceDataset}</span>
              <span>Destination: {activeLogPipeline.targetDestination}</span>
            </div>

            {/* Terminal Window */}
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 space-y-1.5 max-h-96 overflow-y-auto border border-slate-800 shadow-inner">
              {activeLogPipeline.executionHistory && activeLogPipeline.executionHistory.length > 0 ? (
                activeLogPipeline.executionHistory.map((run, runIdx) => (
                  <div key={runIdx} className="border-b border-slate-800/80 pb-3 mb-3 last:border-0">
                    <div className="flex items-center justify-between text-teal-400 mb-1">
                      <span>[{run.runId}] Status: {run.status} | Quality: {run.qualityScore || 'N/A'}%</span>
                      <span className="text-slate-400">{new Date(run.triggeredAt).toLocaleString()}</span>
                    </div>
                    {run.logs && run.logs.length > 0 ? (
                      run.logs.map((log, lIdx) => (
                        <div
                          key={lIdx}
                          className={`${
                            log.includes('[ERROR]') || log.includes('[FATAL]')
                              ? 'text-rose-400'
                              : log.includes('[WARN]')
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {log}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 italic">No logs recorded for this run.</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic">No execution history recorded yet. Click "Run" to trigger a run.</div>
              )}
            </div>

            <div className="flex justify-end">
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
