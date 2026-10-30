import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy-950 border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs font-mono space-y-1">
        <p className="text-slate-300 font-bold border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
            <span className="capitalize">{entry.name}:</span>
            <span className="font-bold">{entry.value}{entry.unit || '%'}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReliabilityCharts({ qualityHistory = [], pipelinePerformance = [] }) {
  const chartData = qualityHistory.length > 0 ? qualityHistory : [
    { timestamp: '08:00', score: 94.5, completeness: 97.0, uniqueness: 98.0, validity: 86.5 },
    { timestamp: '10:00', score: 91.2, completeness: 93.0, uniqueness: 97.0, validity: 81.6 },
    { timestamp: '12:00', score: 78.4, completeness: 80.0, uniqueness: 88.0, validity: 62.4 },
    { timestamp: '14:00', score: 85.0, completeness: 88.0, uniqueness: 92.0, validity: 72.0 },
    { timestamp: '16:00', score: 68.3, completeness: 71.4, uniqueness: 100.0, validity: 80.0 },
    { timestamp: '18:00', score: 88.5, completeness: 91.0, uniqueness: 95.0, validity: 84.0 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quality Score Trend Over Time */}
      <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-5 shadow-lg shadow-navy-950/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-100 font-mono">
              Reliability Score Trend (24h)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Target SLA: &ge; 75%</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[40, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                name="Quality Score"
                stroke="#14b8a6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#scoreGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pipeline Execution Duration Performance */}
      <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-5 shadow-lg shadow-navy-950/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100 font-mono">
              Pipeline Execution Durations (ms)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Latency Benchmarks</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelinePerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="durationMs" name="Duration" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
