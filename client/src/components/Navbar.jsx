import React from 'react';
import {
  ShieldAlert,
  Database,
  RefreshCw,
  Activity,
  Layers,
  FileCheck2,
  AlertTriangle,
  Info
} from 'lucide-react';
import Badge from './UI/Badge';

export default function Navbar({
  health,
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  onOpenAtlasGuide
}) {
  const dbConnected = health?.database?.connected;

  return (
    <header className="sticky top-0 z-40 bg-navy-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Simulated Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-slate-950 shadow-lg shadow-teal-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                DataTrust<span className="text-teal-400">Ops</span>
              </h1>
              <Badge variant="warning" size="xs">
                SIMULATED DATA
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              AI-Assisted Data Reliability & Observability Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-navy-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'overview'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('pipelines')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'pipelines'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Pipelines
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'scanner'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Quality Scanner
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'incidents'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Incidents
          </button>
        </nav>

        {/* Status Indicators & Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Database Connectivity Status */}
          <button
            onClick={onOpenAtlasGuide}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition border ${
              dbConnected
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title={dbConnected ? 'MongoDB Connected' : 'MongoDB Disconnected - Click for Atlas Setup Guide'}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{dbConnected ? 'MongoDB Online' : 'DB: In-Memory'}</span>
            {!dbConnected && <Info className="w-3 h-3 text-amber-400" />}
          </button>

          {/* AI Engine Status */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-navy-950 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>{health?.aiEngine?.provider === 'GEMINI_API' ? 'AI: Gemini' : 'AI: Deterministic'}</span>
          </div>

          {/* Manual Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
