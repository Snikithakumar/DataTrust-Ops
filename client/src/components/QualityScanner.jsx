import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileX,
  Play,
  RotateCcw,
  Clock
} from 'lucide-react';
import Button from './UI/Button';
import Badge from './UI/Badge';

export default function QualityScanner({ onScanFile, onScanRaw, isScanning, lastScanResult = null }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeSample, setActiveSample] = useState(null);

  const sampleDatasets = [
    {
      id: 'clean',
      name: 'Clean Customers',
      file: 'clean_customers_metrics.csv',
      desc: '100% complete, zero nulls, pristine freshness',
      expectedScore: '100% (Grade A)',
      csv: `customer_id,full_name,email,signup_date,country,lifetime_value,status\nCUST-1001,Alice Johnson,alice.j@example.com,2026-10-20,US,1420.50,ACTIVE\nCUST-1002,Bob Martinez,bob.m@example.com,2026-10-21,CA,890.00,ACTIVE\nCUST-1003,Charlie Zhao,czhao@example.com,2026-10-22,SG,2340.25,ACTIVE\nCUST-1004,Devi Patel,devi.p@example.com,2026-10-23,IN,3100.00,ACTIVE\nCUST-1005,Elena Rostova,elena.r@example.com,2026-10-24,DE,1750.80,ACTIVE\nCUST-1006,Farhan Al-Mansoor,farhan@example.com,2026-10-25,AE,940.10,ACTIVE\nCUST-1007,Grace Hopper,grace@example.com,2026-10-26,US,4500.00,ACTIVE\nCUST-1008,Hassan El-Sayed,hassan@example.com,2026-10-27,EG,620.40,ACTIVE\nCUST-1009,Isla MacLeod,isla@example.com,2026-10-28,UK,1880.00,ACTIVE\nCUST-1010,Javier Gomez,jgomez@example.com,2026-10-28,MX,1120.90,ACTIVE`
    },
    {
      id: 'missing',
      name: 'Orders Null Spike',
      file: 'orders_missing_values.csv',
      desc: '30% missing customer_id and order_amount',
      expectedScore: '94.7% (8 nulls)',
      csv: `order_id,customer_id,product_sku,order_amount,order_timestamp,fulfillment_status\nORD-5001,CUST-1001,SKU-ALPHA-99,120.00,2026-10-27T10:14:00Z,DELIVERED\nORD-5002,,SKU-BETA-42,,2026-10-27T11:20:00Z,SHIPPED\nORD-5003,CUST-1003,SKU-GAMMA-12,450.50,,PENDING\nORD-5004,CUST-1004,,89.99,2026-10-27T12:05:00Z,DELIVERED\nORD-5005,CUST-1005,SKU-EPSILON-88,,2026-10-27T12:45:00Z,CANCELLED\nORD-5006,,SKU-ZETA-01,230.00,2026-10-27T13:10:00Z,SHIPPED\nORD-5007,CUST-1007,SKU-ETA-77,999.00,2026-10-27T14:00:00Z,DELIVERED\nORD-5008,CUST-1008,SKU-THETA-33,,2026-10-27T14:30:00Z,PENDING\nORD-5009,,SKU-IOTA-11,54.20,2026-10-27T15:00:00Z,DELIVERED\nORD-5010,CUST-1010,SKU-KAPPA-22,610.00,2026-10-27T15:45:00Z,DELIVERED`
    },
    {
      id: 'duplicates',
      name: 'Inventory Duplicates',
      file: 'inventory_duplicates.csv',
      desc: 'Repeated primary keys & identical warehouse rows',
      expectedScore: '86% (Grade B)',
      csv: `warehouse_id,sku,item_name,unit_price,quantity_on_hand,last_audit_date\nWH-EAST-1,SKU-A101,Industrial Sensor A,45.00,120,2026-10-25\nWH-EAST-1,SKU-B202,Edge Gateway Hub,299.50,45,2026-10-25\nWH-EAST-1,SKU-A101,Industrial Sensor A,45.00,120,2026-10-25\nWH-EAST-1,SKU-C303,Thermal Controller,85.20,80,2026-10-26\nWH-EAST-1,SKU-B202,Edge Gateway Hub,299.50,45,2026-10-25\nWH-WEST-2,SKU-D404,Optic Fibre Transceiver,110.00,210,2026-10-26\nWH-WEST-2,SKU-D404,Optic Fibre Transceiver,110.00,210,2026-10-26\nWH-WEST-2,SKU-E505,Power Inverter 500W,175.00,32,2026-10-27\nWH-WEST-2,SKU-E505,Power Inverter 500W,175.00,32,2026-10-27\nWH-CENTRAL-3,SKU-F606,Diagnostic Probe,64.00,95,2026-10-27`
    },
    {
      id: 'empty',
      name: 'Empty Transactions',
      file: 'empty_transactions.csv',
      desc: '0-byte payload / zero record circuit breaker',
      expectedScore: '0% (F)',
      csv: ``
    },
    {
      id: 'anomalies',
      name: 'Telemetry Anomalies',
      file: 'telemetry_anomalies.csv',
      desc: 'Negative latencies & socket timeout logs',
      expectedScore: '94.2% (2 anomalies)',
      csv: `event_id,pipeline_stage,latency_ms,error_code,payload_size_kb,recorded_at\nEVT-901,INGESTION,45,NONE,12.4,2026-10-28T09:00:00Z\nEVT-902,TRANSFORMATION,-120,ERR_NEGATIVE_LATENCY,45.1,2026-10-28T09:05:00Z\nEVT-903,VALIDATION,85,NONE,22.0,2026-10-28T09:10:00Z\nEVT-904,WAREHOUSE_LOAD,99999,ERR_SOCKET_TIMEOUT,5500.0,2026-10-28T09:15:00Z\nEVT-905,METRICS_EXPORT,32,NONE,8.9,2026-10-28T09:20:00Z\nEVT-906,INGESTION,-5,ERR_CLOCK_DRIFT,11.2,2026-10-28T09:25:00Z\nEVT-907,TRANSFORMATION,210,NONE,48.2,2026-10-28T09:30:00Z\nEVT-908,WAREHOUSE_LOAD,120000,ERR_DEADLOCK_DETECTED,7800.0,2026-10-28T09:35:00Z`
    }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setActiveSample(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setActiveSample(null);
    }
  };

  const handleRunScan = () => {
    if (selectedFile) {
      onScanFile(selectedFile, selectedFile.name);
    } else if (activeSample) {
      onScanRaw(activeSample.csv, activeSample.file);
    }
  };

  const loadSample = (sample) => {
    setActiveSample(sample);
    setSelectedFile(null);
    onScanRaw(sample.csv, sample.file);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Control Box */}
      <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-6 shadow-xl shadow-navy-950/40 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-100 font-mono flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-400" />
            CSV Data Quality Gate & Integrity Scanner
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload CSV datasets to inspect missing values, duplicate primary keys, empty files, and format anomalies before pipeline consumption.
          </p>
        </div>

        {/* 1-Click Sample Dataset Buttons */}
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
            One-Click Sample Datasets (Repeatable Demo)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {sampleDatasets.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => loadSample(sample)}
                className={`text-left p-3 rounded-lg border text-xs transition duration-150 ${
                  activeSample?.id === sample.id
                    ? 'bg-teal-500/20 border-teal-500/60 text-white shadow-md shadow-teal-500/10'
                    : 'bg-navy-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="font-semibold truncate">{sample.name}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{sample.desc}</div>
                <div className="text-[10px] font-mono text-teal-400 mt-1.5 font-bold">
                  Target: {sample.expectedScore}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition duration-200 cursor-pointer ${
            dragActive
              ? 'border-teal-400 bg-teal-500/10'
              : 'border-slate-800 bg-navy-950/70 hover:border-slate-700'
          }`}
          onClick={() => document.getElementById('csvFileInput').click()}
        >
          <input
            id="csvFileInput"
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-navy-900 rounded-full border border-slate-800 text-teal-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium text-slate-200">
              {selectedFile ? (
                <span className="text-teal-300 font-mono">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              ) : activeSample ? (
                <span className="text-teal-300 font-mono">Loaded sample: {activeSample.name}</span>
              ) : (
                'Drop CSV file here or click to browse'
              )}
            </div>
            <p className="text-xs text-slate-400">
              Strictly sanitized with Papa Parse. Safe memory buffer execution. Max 5MB.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400 font-mono">
            {selectedFile || activeSample ? 'Ready for deterministic inspection' : 'Select a sample or upload a file'}
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={handleRunScan}
            disabled={!selectedFile && !activeSample}
            loading={isScanning}
            icon={Play}
          >
            {isScanning ? 'Inspecting Dataset...' : 'Run Quality Scan'}
          </Button>
        </div>
      </div>

      {/* Live Scan Results Display */}
      {lastScanResult && (
        <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-6 shadow-xl shadow-navy-950/40 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-slate-100 font-mono">
                  Scan Report: {lastScanResult.datasetName}
                </h3>
                <Badge
                  variant={lastScanResult.grade === 'A' ? 'healthy' : lastScanResult.grade === 'B' ? 'info' : lastScanResult.grade === 'C' ? 'warning' : 'critical'}
                  size="xs"
                >
                  Grade {lastScanResult.grade || 'C'} ({lastScanResult.score}%)
                </Badge>
                <Badge
                  variant={lastScanResult.status === 'HEALTHY' ? 'healthy' : lastScanResult.status === 'WARNING' ? 'warning' : 'critical'}
                  size="xs"
                >
                  Status: {lastScanResult.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Rows: {lastScanResult.totalRows} | Columns: {lastScanResult.totalColumns} | Quality: {lastScanResult.qualityStatus || lastScanResult.status} | Freshness: {lastScanResult.freshness?.status || 'N/A'}
              </p>
            </div>

            {/* Incident Alert if created */}
            {lastScanResult.incidentCreated && (
              <Badge variant="critical" size="sm">
                <AlertOctagon className="w-3.5 h-3.5" /> Incident Created &amp; Triaged
              </Badge>
            )}
          </div>

          {/* Operational Circuit-Breakers Callout */}
          {lastScanResult.statusReasons && lastScanResult.statusReasons.length > 0 && lastScanResult.status !== 'HEALTHY' && (
            <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-lg text-xs font-mono text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                Operational Circuit-Breakers Triggered:
              </div>
              {lastScanResult.statusReasons.map((reason, idx) => (
                <div key={idx} className="pl-5 text-slate-300">
                  &bull; {reason}
                </div>
              ))}
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-navy-950 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Completeness</span>
              <span className="text-xl font-bold font-mono text-teal-400">
                {lastScanResult.breakdown?.completeness ?? 0}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                Nulls: {lastScanResult.findings?.missingValuesTotal || 0}
              </span>
            </div>

            <div className="bg-navy-950 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Uniqueness</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {lastScanResult.breakdown?.uniqueness ?? 0}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                Duplicates: {lastScanResult.findings?.duplicateRowsCount || 0}
              </span>
            </div>

            <div className="bg-navy-950 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Validity</span>
              <span className="text-xl font-bold font-mono text-indigo-400">
                {lastScanResult.breakdown?.validity ?? 0}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                Anomalies: {lastScanResult.findings?.anomaliesCount || 0}
              </span>
            </div>

            <div className="bg-navy-950 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Freshness SLA</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {lastScanResult.freshness?.score != null ? `${lastScanResult.freshness.score}%` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono truncate">
                {lastScanResult.freshness?.lagFormatted || lastScanResult.freshness?.status || 'UNKNOWN'}
              </span>
            </div>
          </div>

          {/* Freshness Policy Note */}
          {lastScanResult.freshness?.message && (
            <div className="p-3 bg-navy-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-start gap-2">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{lastScanResult.freshness.message}</span>
            </div>
          )}

          {/* Missing Values Breakdown by Column */}
          {lastScanResult.findings?.missingByColumn && Object.keys(lastScanResult.findings.missingByColumn).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-slate-400">
                Missing Values Analysis by Column
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(lastScanResult.findings.missingByColumn).map(([col, data]) => (
                  <div
                    key={col}
                    className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                      data.count > 0 ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-navy-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="truncate">{col}</span>
                    <span className="font-bold">
                      {data.count} null ({data.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Rows Details */}
          {lastScanResult.findings?.duplicateRowsCount > 0 && (
            <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg text-xs font-mono text-rose-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Duplicate Injections Detected: {lastScanResult.findings.duplicateRowsCount} rows
              </div>
              <p className="text-slate-400 text-[11px]">
                Row indices flagged as duplicates: {lastScanResult.findings.duplicateRowIndices?.join(', ')}
              </p>
            </div>
          )}

          {/* Value Anomalies */}
          {lastScanResult.findings?.anomalies && lastScanResult.findings.anomalies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-slate-400">
                Integrity Anomalies Detected ({lastScanResult.findings.anomalies.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {lastScanResult.findings.anomalies.map((anom, i) => (
                  <div key={i} className="p-2 bg-navy-950 border border-slate-800 rounded text-xs font-mono flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">[{anom.type}]</span>
                    <span className="text-slate-300">{anom.reason}</span>
                    {anom.row > 0 && <span className="text-slate-400 ml-auto shrink-0">Row #{anom.row}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Preview Table */}
          {lastScanResult.previewRows && lastScanResult.previewRows.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-slate-400">
                Data Preview (Top {lastScanResult.previewRows.length} Rows)
              </h4>
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-navy-950 border-b border-slate-800 text-slate-400">
                    <tr>
                      {Object.keys(lastScanResult.previewRows[0]).map((col) => (
                        <th key={col} className="p-2.5 whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-navy-900/60">
                    {lastScanResult.previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        {Object.values(row).map((val, cellIdx) => (
                          <td
                            key={cellIdx}
                            className={`p-2.5 whitespace-nowrap ${
                              val === null || val === undefined || val === ''
                                ? 'text-rose-400 bg-rose-950/20 italic'
                                : 'text-slate-300'
                            }`}
                          >
                            {val === null || val === undefined || val === '' ? '<NULL>' : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
