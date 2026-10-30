import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import Navbar from './components/Navbar';
import MongoAlertBanner from './components/MongoAlertBanner';
import MetricCard from './components/MetricCard';
import QualityScoreCard from './components/QualityScoreCard';
import ReliabilityCharts from './components/ReliabilityCharts';
import PipelineManager from './components/PipelineManager';
import QualityScanner from './components/QualityScanner';
import IncidentBoard from './components/IncidentBoard';
import Modal from './components/UI/Modal';
import Button from './components/UI/Button';
import Spinner from './components/UI/Spinner';

import {
  HealthAPI,
  DashboardAPI,
  PipelinesAPI,
  QualityAPI,
  IncidentsAPI
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [pipelines, setPipelines] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [lastScanResult, setLastScanResult] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [runningPipelineId, setRunningPipelineId] = useState(null);
  const [explainingIncidentId, setExplainingIncidentId] = useState(null);

  const [isAtlasModalOpen, setIsAtlasModalOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Master fetch function to pull fresh state from backend
  const fetchData = useCallback(async () => {
    try {
      const [healthRes, dashRes, pipeRes, incRes] = await Promise.allSettled([
        HealthAPI.checkHealth(),
        DashboardAPI.getOverview(),
        PipelinesAPI.getPipelines(),
        IncidentsAPI.getIncidents()
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value?.data) {
        setHealth(healthRes.value.data);
      }
      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setDashboardData(dashRes.value.data);
      }
      if (pipeRes.status === 'fulfilled' && pipeRes.value?.data) {
        setPipelines(pipeRes.value.data);
      }
      if (incRes.status === 'fulfilled' && incRes.value?.data) {
        setIncidents(incRes.value.data);
      }
    } catch (err) {
      console.error('DataTrust Ops Fetch Error:', err);
      showToast('Error syncing with backend', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle pipeline execution
  const handleRunPipeline = async (payload) => {
    const targetKey = payload.pipelineId || payload.name;
    setRunningPipelineId(targetKey);
    try {
      const res = await PipelinesAPI.runPipeline(payload);
      showToast(res.message || 'Pipeline executed successfully', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Pipeline execution failed', 'error');
    } finally {
      setRunningPipelineId(null);
    }
  };

  // Handle file scan
  const handleScanFile = async (file, datasetName) => {
    setIsScanning(true);
    try {
      const res = await QualityAPI.scanFile(file, datasetName);
      setLastScanResult(res.data);
      showToast(res.message || 'Quality scan complete', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Scan failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle raw CSV scan (sample datasets)
  const handleScanRaw = async (csvData, datasetName) => {
    setIsScanning(true);
    try {
      const res = await QualityAPI.scanRaw(csvData, datasetName);
      setLastScanResult(res.data);
      showToast(res.message || 'Quality scan complete', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Scan failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle incident status update
  const handleUpdateIncidentStatus = async (id, payload) => {
    try {
      const res = await IncidentsAPI.updateIncident(id, payload);
      showToast(res.message || 'Incident status updated', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to update incident', 'error');
    }
  };

  // Handle AI explanation trigger
  const handleExplainIncident = async (id) => {
    setExplainingIncidentId(id);
    try {
      const res = await IncidentsAPI.explainIncident(id);
      showToast('AI Root-cause analysis generated', 'success');
      await fetchData();
      return res.data;
    } catch (err) {
      showToast(err.message || 'AI analysis failed', 'error');
      return null;
    } finally {
      setExplainingIncidentId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center space-y-4">
        <Spinner size="xl" />
        <p className="text-sm font-mono text-teal-400 animate-pulse">
          Connecting to DataTrust Ops Engine...
        </p>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {
    overallHealthScore: 88.5,
    dataFreshness: { score: 92.0, lagFormatted: '18 min ago (Batch SLA)', status: 'ACCEPTABLE' },
    activeIncidents: incidents.filter(i => i.status !== 'RESOLVED').length,
    criticalIncidents: incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length,
    pipelineCounts: { total: pipelines.length, healthy: pipelines.filter(p => p.status === 'HEALTHY').length }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-300">
      {/* MongoDB Disconnected Warning Banner */}
      <MongoAlertBanner
        isConnected={Boolean(health?.database?.connected)}
        isModalOpen={isAtlasModalOpen}
        setIsModalOpen={setIsAtlasModalOpen}
      />

      {/* Global Navbar */}
      <Navbar
        health={health}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => {
          setIsRefreshing(true);
          fetchData();
        }}
        isRefreshing={isRefreshing}
        onOpenAtlasGuide={() => setIsAtlasModalOpen(true)}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl border text-xs font-mono shadow-2xl flex items-center gap-2 ${
            notification.type === 'error'
              ? 'bg-rose-950 border-rose-500 text-rose-200'
              : notification.type === 'success'
              ? 'bg-teal-950 border-teal-500 text-teal-200'
              : 'bg-navy-900 border-slate-700 text-slate-200'
          }`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Overall Reliability Score"
                value={`${metrics.overallHealthScore}%`}
                subtext="Deterministic weighted SLA"
                badgeText={metrics.overallHealthScore >= 75 ? 'PASSING' : 'FLAGGED'}
                badgeVariant={metrics.overallHealthScore >= 75 ? 'healthy' : 'critical'}
                icon={Activity}
                colorClass="text-teal-400"
                trend="+2.1% 24h"
              />

              <MetricCard
                title="Data Freshness (Decoupled)"
                value={`${metrics.dataFreshness.score}%`}
                subtext={metrics.dataFreshness.lagFormatted}
                badgeText={metrics.dataFreshness.status}
                badgeVariant={metrics.dataFreshness.status === 'PRISTINE' ? 'healthy' : 'info'}
                icon={RefreshCw}
                colorClass="text-cyan-400"
              />

              <MetricCard
                title="Active Incidents"
                value={metrics.activeIncidents}
                subtext={`${metrics.criticalIncidents || 0} critical incidents`}
                badgeText={metrics.activeIncidents > 0 ? 'ATTENTION' : 'NOMINAL'}
                badgeVariant={metrics.activeIncidents > 0 ? 'danger' : 'healthy'}
                icon={AlertTriangle}
                colorClass={metrics.activeIncidents > 0 ? 'text-amber-400' : 'text-emerald-400'}
              />

              <MetricCard
                title="Pipeline Health"
                value={`${metrics.pipelineCounts?.healthy || 0}/${metrics.pipelineCounts?.total || pipelines.length}`}
                subtext="Simulated jobs operational"
                badgeText="SIMULATED"
                badgeVariant="neutral"
                icon={Layers}
                colorClass="text-teal-300"
              />
            </div>

            {/* Quality Score Gauge & Component Breakdown */}
            <QualityScoreCard
              score={lastScanResult ? lastScanResult.score : metrics.overallHealthScore}
              grade={lastScanResult?.grade}
              status={lastScanResult?.status}
              qualityStatus={lastScanResult?.qualityStatus}
              statusReasons={lastScanResult?.statusReasons}
              breakdown={lastScanResult?.breakdown || metrics?.qualityBreakdown}
              freshness={lastScanResult ? lastScanResult.freshness : metrics.dataFreshness}
              onOpenFormulaDoc={() => setIsFormulaModalOpen(true)}
            />

            {/* Charts: Quality Trend & Execution Latencies */}
            <ReliabilityCharts
              qualityHistory={dashboardData?.qualityHistory}
              pipelinePerformance={dashboardData?.pipelinePerformance}
            />

            {/* Quick Actions & Recent Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pipeline Quick List */}
              <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-5 shadow-lg shadow-navy-950/40">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-100 font-mono flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-400" />
                    Active Pipeline Jobs
                  </h3>
                  <button
                    onClick={() => setActiveTab('pipelines')}
                    className="text-xs text-teal-400 hover:text-teal-300 font-mono hover:underline"
                  >
                    Manage All &rarr;
                  </button>
                </div>
                <div className="space-y-3">
                  {pipelines.slice(0, 4).map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-3 bg-navy-950 rounded-lg border border-slate-800/80 text-xs font-mono">
                      <div>
                        <span className="font-semibold text-slate-200">{p.name}</span>
                        <div className="text-[10px] text-slate-400">{p.schedule}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        p.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
                        p.status === 'DEGRADED' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incidents Quick List */}
              <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-5 shadow-lg shadow-navy-950/40">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-100 font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Recent Open Incidents
                  </h3>
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className="text-xs text-teal-400 hover:text-teal-300 font-mono hover:underline"
                  >
                    View All &rarr;
                  </button>
                </div>
                <div className="space-y-3">
                  {incidents.slice(0, 3).map((inc) => (
                    <div key={inc._id || inc.title} className="p-3 bg-navy-950 rounded-lg border border-slate-800/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate pr-2">{inc.title}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          inc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                          inc.severity === 'HIGH' ? 'bg-red-500/20 text-red-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {inc.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{inc.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PIPELINES */}
        {activeTab === 'pipelines' && (
          <PipelineManager
            pipelines={pipelines}
            onRunPipeline={handleRunPipeline}
            isRunningId={runningPipelineId}
          />
        )}

        {/* TAB 3: QUALITY SCANNER */}
        {activeTab === 'scanner' && (
          <QualityScanner
            onScanFile={handleScanFile}
            onScanRaw={handleScanRaw}
            isScanning={isScanning}
            lastScanResult={lastScanResult}
          />
        )}

        {/* TAB 4: INCIDENTS */}
        {activeTab === 'incidents' && (
          <IncidentBoard
            incidents={incidents}
            onUpdateStatus={handleUpdateIncidentStatus}
            onExplainIncident={handleExplainIncident}
            isExplainingId={explainingIncidentId}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-navy-900/60 py-4 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono">
            <span>DataTrust Ops &copy; 2026</span>
            <span>&bull;</span>
            <span className="text-teal-400">Simulated Data Reliability Platform</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <button
              onClick={() => setIsFormulaModalOpen(true)}
              className="hover:text-slate-200 transition"
            >
              Scoring Formula
            </button>
            <button
              onClick={() => setIsAtlasModalOpen(true)}
              className="hover:text-slate-200 transition"
            >
              MongoDB Atlas Setup
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-200 transition"
            >
              MIT License
            </a>
          </div>
        </div>
      </footer>

      {/* Formula Documentation Modal */}
      <Modal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        title="Data Reliability Scoring & Decoupled Freshness"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs font-mono text-slate-300">
          <div className="p-3 bg-navy-950 border border-slate-800 rounded-lg">
            <h4 className="text-teal-400 font-bold mb-1">Overall Quality Formula (0 - 100%)</h4>
            <p className="text-slate-300">
              Score = (0.40 &times; Completeness) + (0.35 &times; Uniqueness) + (0.25 &times; Validity)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-navy-950 border border-slate-800 rounded-lg">
              <span className="text-teal-300 font-bold block mb-1">Completeness (40%)</span>
              <p className="text-slate-400">
                Measures ratio of valid, non-null cells relative to total cells. An entire missing required column incurs an extra 15% penalty.
              </p>
            </div>

            <div className="p-3 bg-navy-950 border border-slate-800 rounded-lg">
              <span className="text-cyan-300 font-bold block mb-1">Uniqueness (35%)</span>
              <p className="text-slate-400">
                Measures ratio of distinct rows to detect duplicate pipeline injections or retry loops.
              </p>
            </div>

            <div className="p-3 bg-navy-950 border border-slate-800 rounded-lg">
              <span className="text-indigo-300 font-bold block mb-1">Validity (25%)</span>
              <p className="text-slate-400">
                Enforces domain rules: non-negative prices/latencies, valid timestamp formats, and zero ragged rows.
              </p>
            </div>
          </div>

          <div className="p-3 bg-navy-950 border border-slate-800 rounded-lg">
            <h4 className="text-cyan-300 font-bold mb-1">Decoupled Freshness Metric</h4>
            <p className="text-slate-400">
              Freshness is calculated from dataset timestamps: <em>Freshness = max(0, 100 - (lagMinutes / 1440) &times; 100)</em>. Freshness is strictly decoupled from quality to prevent masking corrupted recent data.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsFormulaModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
