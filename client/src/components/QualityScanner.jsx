import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  CheckCircle,
  FileX,
  FileText,
  Lightbulb
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
      desc: '30% missing customer_id foreign keys',
      expectedScore: '94.7% (Grade C)',
      csv: `order_id,customer_id,product_sku,order_amount,order_timestamp,fulfillment_status\nORD-5001,CUST-1001,SKU-ALPHA-99,120.00,2026-10-27T10:14:00Z,DELIVERED\nORD-5002,,SKU-BETA-42,,2026-10-27T11:20:00Z,SHIPPED\nORD-5003,CUST-1003,SKU-GAMMA-12,450.50,,PENDING\nORD-5004,CUST-1004,,89.99,2026-10-27T12:05:00Z,DELIVERED\nORD-5005,CUST-1005,SKU-EPSILON-88,,2026-10-27T12:45:00Z,CANCELLED\nORD-5006,,SKU-ZETA-01,230.00,2026-10-27T13:10:00Z,SHIPPED\nORD-5007,CUST-1007,SKU-ETA-77,999.00,2026-10-27T14:00:00Z,DELIVERED\nORD-5008,CUST-1008,SKU-THETA-33,,2026-10-27T14:30:00Z,PENDING\nORD-5009,,SKU-IOTA-11,54.20,2026-10-27T15:00:00Z,DELIVERED\nORD-5010,CUST-1010,SKU-KAPPA-22,610.00,2026-10-27T15:45:00Z,DELIVERED`
    },
    {
      id: 'duplicates',
      name: 'Inventory Duplicates',
      file: 'inventory_duplicates.csv',
      desc: 'Repeated primary keys & identical warehouse rows',
      expectedScore: '86% (Grade C)',
      csv: `warehouse_id,sku,item_name,unit_price,quantity_on_hand,last_audit_date\nWH-EAST-1,SKU-A101,Industrial Sensor A,45.00,120,2026-10-25\nWH-EAST-1,SKU-B202,Edge Gateway Hub,299.50,45,2026-10-25\nWH-EAST-1,SKU-A101,Industrial Sensor A,45.00,120,2026-10-25\nWH-EAST-1,SKU-C303,Thermal Controller,85.20,80,2026-10-26\nWH-EAST-1,SKU-B202,Edge Gateway Hub,299.50,45,2026-10-25\nWH-WEST-2,SKU-D404,Optic Fibre Transceiver,110.00,210,2026-10-26\nWH-WEST-2,SKU-D404,Optic Fibre Transceiver,110.00,210,2026-10-26\nWH-WEST-2,SKU-E505,Power Inverter 500W,175.00,32,2026-10-27\nWH-WEST-2,SKU-E505,Power Inverter 500W,175.00,32,2026-10-27\nWH-CENTRAL-3,SKU-F606,Diagnostic Probe,64.00,95,2026-10-27`
    },
    {
      id: 'empty',
      name: 'Empty Transactions',
      file: 'empty_transactions.csv',
      desc: '0-byte payload / zero record circuit breaker',
      expectedScore: '0% (Grade F)',
      csv: ``
    },
    {
      id: 'anomalies',
      name: 'Telemetry Anomalies',
      file: 'telemetry_anomalies.csv',
      desc: 'Negative latencies & socket timeout logs',
      expectedScore: '97.5% (Grade A)',
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

  // Generate actionable recommended fixes from findings
  const getRecommendedFixes = (scan) => {
    if (!scan) return [];
    const fixes = [];
    if (scan.findings?.missingValuesTotal > 0) {
      fixes.push({
        title: 'Reject Null Primary/Foreign Keys at Ingestion Gate',
        desc: 'Add a schema gate rejecting records where required ID columns are null, and route invalid rows to a Dead Letter Queue (DLQ).'
      });
    }
    if (scan.findings?.duplicateRowsCount > 0) {
      fixes.push({
        title: 'Apply Idempotent Deduplication',
        desc: 'Implement ROW_NUMBER() OVER (PARTITION BY primary_key ORDER BY updated_at DESC) in staging to drop duplicate ingestions.'
      });
    }
    if (scan.findings?.anomaliesCount > 0) {
      fixes.push({
        title: 'Enforce Range & Format Check Constraints',
        desc: 'Enforce domain bounds (e.g. latency >= 0, valid ISO timestamps) to prevent negative latency anomalies and corrupted dashboards.'
      });
    }
    if (scan.status === 'CRITICAL' || scan.score === 0) {
      fixes.push({
        title: 'Zero-Byte Payload Protection',
        desc: 'Check file size > 0 before starting pipeline transformations to prevent empty-file pipeline execution.'
      });
    }
    if (fixes.length === 0) {
      fixes.push({
        title: 'No Corrective Action Needed',
        desc: 'All quality checks passed successfully. Dataset is clean and ready for downstream analytics.'
      });
    }
    return fixes;
  };

  return (
    <div className="space-y-6">
      {/* Scanner Control Box */}
      <div className="bg-[#F7F4ED] border border-[#D8D2C7] rounded-xl p-6 shadow-card space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#167D80]" />
            <h2 className="text-base font-semibold text-[#17263F]">
              Quality Scanner
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Upload CSV datasets to inspect missing values, duplicate rows, empty files, and format anomalies.
          </p>
        </div>

        {/* 1-Click Sample Dataset Buttons */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#667085] block mb-2">
            Quick Load Sample Datasets
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {sampleDatasets.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => loadSample(sample)}
                className={`text-left p-3 rounded-lg border text-xs transition duration-150 ${
                  activeSample?.id === sample.id
                    ? 'bg-[#167D80]/15 border-[#167D80] text-[#17263F] shadow-sm font-medium'
                    : 'bg-[#FBF9F5] border-[#D8D2C7] text-[#253248] hover:border-[#167D80] hover:bg-[#E9E5DC]'
                }`}
              >
                <div className="font-semibold text-[#17263F] truncate">{sample.name}</div>
                <div className="text-[11px] text-[#667085] truncate mt-0.5">{sample.desc}</div>
                <div className="text-[11px] font-mono text-[#167D80] mt-1.5 font-bold">
                  {sample.expectedScore}
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
              ? 'border-[#167D80] bg-[#167D80]/10'
              : 'border-[#D8D2C7] bg-[#FBF9F5] hover:border-[#167D80]'
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
            <div className="p-3 bg-[#E9E5DC] rounded-full border border-[#D8D2C7] text-[#167D80]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium text-[#17263F]">
              {selectedFile ? (
                <span className="text-[#167D80] font-mono font-semibold">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              ) : activeSample ? (
                <span className="text-[#167D80] font-mono font-semibold">Loaded sample: {activeSample.name}</span>
              ) : (
                'Drop CSV file here or click to browse'
              )}
            </div>
            <p className="text-xs text-[#667085]">
              CSV files only. Safe memory buffer execution. Max 5MB file limit.
            </p>
          </div>
        </div>

        {/* Action Button & File Info */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-[#667085] font-mono">
            {selectedFile ? `Ready: ${selectedFile.name}` : activeSample ? `Sample: ${activeSample.file}` : 'Select a sample or upload a file'}
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={handleRunScan}
            disabled={!selectedFile && !activeSample}
            loading={isScanning}
            icon={Play}
          >
            {isScanning ? 'Scanning Dataset...' : 'Scan Dataset'}
          </Button>
        </div>
      </div>

      {/* Live Scan Results Display */}
      {lastScanResult && (
        <div className="bg-[#F7F4ED] border border-[#D8D2C7] rounded-xl p-6 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#D8D2C7]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-[#17263F]">
                  Quality Report: {lastScanResult.datasetName}
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
              <p className="text-xs text-[#667085] mt-1 font-mono">
                Rows: {lastScanResult.totalRows} | Columns: {lastScanResult.totalColumns} | Quality: {lastScanResult.qualityStatus || lastScanResult.status} | Freshness: {lastScanResult.freshness?.status || 'N/A'}
              </p>
            </div>

            {/* Issue Alert if created */}
            {lastScanResult.incidentCreated && (
              <Badge variant="critical" size="sm">
                <AlertOctagon className="w-3.5 h-3.5" /> Issue Logged Automatically
              </Badge>
            )}
          </div>

          {/* Operational Circuit-Breakers Callout */}
          {lastScanResult.statusReasons && lastScanResult.statusReasons.length > 0 && lastScanResult.status !== 'HEALTHY' && (
            <div className="p-3.5 bg-[#FDF8F3] border border-[#B77936]/30 rounded-lg text-xs text-[#253248] space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-[#B77936]">
                <AlertTriangle className="w-4 h-4 text-[#B77936] shrink-0" />
                Operational Circuit-Breakers Triggered:
              </div>
              {lastScanResult.statusReasons.map((reason, idx) => (
                <div key={idx} className="pl-5 text-[#667085]">
                  &bull; {reason}
                </div>
              ))}
            </div>
          )}

          {/* 6-Card Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#FBF9F5] p-3 rounded-lg border border-[#D8D2C7]">
              <span className="text-[10px] uppercase font-semibold text-[#667085] block">Completeness</span>
              <span className="text-xl font-bold font-mono text-[#167D80]">
                {lastScanResult.breakdown?.completeness ?? 0}%
              </span>
              <span className="text-[10px] text-[#667085] block mt-0.5">
                Weight: 40%
              </span>
            </div>

            <div className="bg-[#FBF9F5] p-3 rounded-lg border border-[#D8D2C7]">
              <span className="text-[10px] uppercase font-semibold text-[#667085] block">Uniqueness</span>
              <span className="text-xl font-bold font-mono text-[#17263F]">
                {lastScanResult.breakdown?.uniqueness ?? 0}%
              </span>
              <span className="text-[10px] text-[#667085] block mt-0.5">
                Weight: 35%
              </span>
            </div>

            <div className="bg-[#FBF9F5] p-3 rounded-lg border border-[#D8D2C7]">
              <span className="text-[10px] uppercase font-semibold text-[#667085] block">Validity</span>
              <span className="text-xl font-bold font-mono text-[#17263F]">
                {lastScanResult.breakdown?.validity ?? 0}%
              </span>
              <span className="text-[10px] text-[#667085] block mt-0.5">
                Weight: 25%
              </span>
            </div>

            <div className="bg-[#FBF9F5] p-3 rounded-lg border border-[#D8D2C7]">
              <span className="text-[10px] uppercase font-semibold text-[#667085] block">Missing Values</span>
              <span className={`text-xl font-bold font-mono ${lastScanResult.findings?.missingValuesTotal > 0 ? 'text-[#B77936]' : 'text-[#167D80]'}`}>
                {lastScanResult.findings?.missingValuesTotal || 0}
              </span>
              <span className="text-[10px] text-[#667085] block mt-0.5">
                Null cells detected
              </span>
            </div>

            <div className="bg-[#FBF9F5] p-3 rounded-lg border border-[#D8D2C7]">
              <span className="text-[10px] uppercase font-semibold text-[#667085] block">Duplicate Rows</span>
              <span className={`text-xl font-bold font-mono ${lastScanResult.findings?.duplicateRowsCount > 0 ? 'text-[#B94A48]' : 'text-[#167D80]'}`}>
                {lastScanResult.findings?.duplicateRowsCount || 0}
              </span>
              <span className="text-[10px] text-[#667085] block mt-0.5">
                Duplicate rows
              </span>
            </div>

            <div className="bg-[#FBF9F5] p-3 rounded-lg border border-[#D8D2C7]">
              <span className="text-[10px] uppercase font-semibold text-[#667085] block">Freshness Status</span>
              <span className="text-base font-bold font-mono text-[#167D80]">
                {lastScanResult.freshness?.status || 'N/A'}
              </span>
              <span className="text-[10px] text-[#667085] block mt-0.5 truncate">
                {lastScanResult.freshness?.score != null ? `${lastScanResult.freshness.score}%` : 'Decoupled'}
              </span>
            </div>
          </div>

          {/* Missing Values Breakdown by Column */}
          {lastScanResult.findings?.missingByColumn && Object.keys(lastScanResult.findings.missingByColumn).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
                Missing Values Breakdown by Column
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(lastScanResult.findings.missingByColumn).map(([col, data]) => (
                  <div
                    key={col}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      data.count > 0 ? 'bg-[#FDF8F3] border-[#B77936]/40 text-[#253248]' : 'bg-[#FBF9F5] border-[#D8D2C7] text-[#667085]'
                    }`}
                  >
                    <span className="truncate font-mono">{col}</span>
                    <span className={`font-mono font-bold ${data.count > 0 ? 'text-[#B77936]' : 'text-[#167D80]'}`}>
                      {data.count} nulls ({data.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Rows Details */}
          {lastScanResult.findings?.duplicateRowsCount > 0 && (
            <div className="p-3.5 bg-[#FDF3F3] border border-[#B94A48]/30 rounded-lg text-xs text-[#253248]">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-[#B94A48]">
                <AlertTriangle className="w-4 h-4 text-[#B94A48]" /> Duplicate Injections Detected: {lastScanResult.findings.duplicateRowsCount} rows
              </div>
              <p className="text-[#667085] text-xs">
                Row indices flagged as duplicates: {lastScanResult.findings.duplicateRowIndices?.join(', ')}
              </p>
            </div>
          )}

          {/* Value Anomalies */}
          {lastScanResult.findings?.anomalies && lastScanResult.findings.anomalies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
                Detected Data Problems ({lastScanResult.findings.anomalies.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {lastScanResult.findings.anomalies.map((anom, i) => (
                  <div key={i} className="p-2.5 bg-[#FBF9F5] border border-[#D8D2C7] rounded text-xs flex items-start gap-2">
                    <span className="text-[#B94A48] font-bold font-mono shrink-0">[{anom.type}]</span>
                    <span className="text-[#253248]">{anom.reason}</span>
                    {anom.row > 0 && <span className="text-[#667085] ml-auto shrink-0 font-mono text-[11px]">Row #{anom.row}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Fixes Section */}
          <div className="space-y-2.5 pt-2 border-t border-[#D8D2C7]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[#167D80]" />
              Recommended Fixes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getRecommendedFixes(lastScanResult).map((fix, idx) => (
                <div key={idx} className="p-3 bg-[#FBF9F5] border border-[#D8D2C7] rounded-lg space-y-1">
                  <div className="text-xs font-semibold text-[#17263F] flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#167D80] shrink-0" />
                    {fix.title}
                  </div>
                  <p className="text-[11px] text-[#667085] leading-relaxed">
                    {fix.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview Table */}
          {lastScanResult.previewRows && lastScanResult.previewRows.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#D8D2C7]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
                Data Preview (Top {lastScanResult.previewRows.length} Rows)
              </h4>
              <div className="overflow-x-auto border border-[#D8D2C7] rounded-lg bg-[#FBF9F5]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#E9E5DC]/70 border-b border-[#D8D2C7] text-[#667085]">
                    <tr>
                      {Object.keys(lastScanResult.previewRows[0]).map((col) => (
                        <th key={col} className="p-2.5 whitespace-nowrap font-semibold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8D2C7]/70 bg-[#F7F4ED]">
                    {lastScanResult.previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#FBF9F5]">
                        {Object.values(row).map((val, cellIdx) => (
                          <td
                            key={cellIdx}
                            className={`p-2.5 whitespace-nowrap ${
                              val === null || val === undefined || val === ''
                                ? 'text-[#B94A48] bg-[#FDF3F3] italic font-semibold'
                                : 'text-[#253248]'
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
