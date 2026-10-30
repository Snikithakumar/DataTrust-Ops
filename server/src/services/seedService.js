const Pipeline = require('../models/Pipeline');
const Incident = require('../models/Incident');
const { isDBConnected } = require('../config/db');

const initialPipelines = [
  {
    name: 'Customer Master Ingestion',
    description: 'Ingests daily customer profile updates, signups, and KYC metadata from S3 bucket into Snowflake staging.',
    category: 'INGESTION',
    sourceDataset: 's3://datatrust-raw/customers/daily/',
    targetDestination: 'snowflake://analytics_db/staging/customers',
    schedule: 'Every 1 hour',
    status: 'HEALTHY',
    lastRunAt: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
    lastDurationMs: 1420,
    totalRuns: 148,
    failedRuns: 2,
    simulated: true,
    executionHistory: [
      {
        runId: 'RUN-1092',
        triggeredAt: new Date(Date.now() - 25 * 60 * 1000),
        durationMs: 1420,
        status: 'SUCCESS',
        recordsProcessed: 10450,
        qualityScore: 98.5,
        logs: [
          '[INFO] Initialized S3 bucket crawler for prefix customers/daily',
          '[INFO] Extracted 10,450 records across 7 columns',
          '[INFO] Papa Parse CSV validation complete: 0 null keys detected',
          '[INFO] Successfully staged 10,450 records in Snowflake'
        ]
      },
      {
        runId: 'RUN-1091',
        triggeredAt: new Date(Date.now() - 85 * 60 * 1000),
        durationMs: 1390,
        status: 'SUCCESS',
        recordsProcessed: 10120,
        qualityScore: 99.1,
        logs: ['[INFO] Scheduled sync passed with zero warnings.']
      }
    ]
  },
  {
    name: 'Orders Financial Reconciliation',
    description: 'Extracts real-time checkout transactions, calculates GMV, and synchronizes with ledger balance.',
    category: 'TRANSFORMATION',
    sourceDataset: 'kafka://topics/checkout.events.v1',
    targetDestination: 'postgres://fin_ledger/public/reconciled_orders',
    schedule: 'Every 30 minutes',
    status: 'DEGRADED',
    lastRunAt: new Date(Date.now() - 12 * 60 * 1000),
    lastDurationMs: 2840,
    totalRuns: 312,
    failedRuns: 14,
    simulated: true,
    executionHistory: [
      {
        runId: 'RUN-2041',
        triggeredAt: new Date(Date.now() - 12 * 60 * 1000),
        durationMs: 2840,
        status: 'WARNING',
        recordsProcessed: 4890,
        qualityScore: 68.3,
        errorMessage: 'Missing required field customer_id in 30% of incoming batch payloads',
        logs: [
          '[INFO] Consuming 4,890 events from checkout.events.v1',
          '[WARN] Quality Check Warning: 30% missing customer_id values detected',
          '[WARN] Anomaly: Null values detected in mandatory foreign key customer_id',
          '[INFO] Quarantined 1,467 invalid records to Dead Letter Queue (DLQ)',
          '[INFO] Committed 3,423 valid records to financial ledger'
        ]
      }
    ]
  },
  {
    name: 'Warehouse Stock Balances',
    description: 'Consolidates multi-regional inventory counts, checks SKU uniqueness, and alerts on stockout risks.',
    category: 'ANALYTICS',
    sourceDataset: 's3://supply-chain/warehouse/snapshots/',
    targetDestination: 'bigquery://supply_ops/inventory_realtime',
    schedule: 'Every 2 hours',
    status: 'FAILED',
    lastRunAt: new Date(Date.now() - 45 * 60 * 1000),
    lastDurationMs: 3950,
    totalRuns: 98,
    failedRuns: 9,
    simulated: true,
    executionHistory: [
      {
        runId: 'RUN-3015',
        triggeredAt: new Date(Date.now() - 45 * 60 * 1000),
        durationMs: 3950,
        status: 'FAILED',
        recordsProcessed: 6200,
        qualityScore: 54.0,
        errorMessage: 'Duplicate primary key collisions detected for SKU-B202 and SKU-D404 across warehouse partitions',
        logs: [
          '[INFO] Beginning inventory snapshot ETL',
          '[ERROR] Uniqueness constraint violation: duplicate SKU entries detected',
          '[ERROR] Pipeline aborted to avoid polluting warehouse inventory counts',
          '[FATAL] Circuit breaker triggered at validation stage'
        ]
      }
    ]
  },
  {
    name: 'Edge Telemetry Ingestion',
    description: 'Streams sensor telemetry, ping latencies, and device status metrics for network observability.',
    category: 'INGESTION',
    sourceDataset: 'mqtt://iot-broker:1883/devices/telemetry',
    targetDestination: 'timescaledb://telemetry_db/measurements',
    schedule: 'Continuous Stream',
    status: 'HEALTHY',
    lastRunAt: new Date(Date.now() - 5 * 60 * 1000),
    lastDurationMs: 820,
    totalRuns: 720,
    failedRuns: 1,
    simulated: true,
    executionHistory: [
      {
        runId: 'RUN-4089',
        triggeredAt: new Date(Date.now() - 5 * 60 * 1000),
        durationMs: 820,
        status: 'SUCCESS',
        recordsProcessed: 54300,
        qualityScore: 96.2,
        logs: [
          '[INFO] Stream buffer processing healthy',
          '[INFO] Validated 54,300 data points with 99.8% schema conformance'
        ]
      }
    ]
  }
];

const initialIncidents = [
  {
    title: 'High Null Rate in Mandatory Customer Foreign Key',
    severity: 'HIGH',
    status: 'OPEN',
    sourceType: 'PIPELINE_EXECUTION',
    sourcePipeline: 'Orders Financial Reconciliation',
    datasetName: 'orders_missing_values.csv',
    summary: 'Validation gate detected 30% missing customer_id values in orders batch ORD-5001..ORD-5010.',
    details: {
      qualityScore: 68.3,
      missingPercentage: 30.0,
      duplicatesCount: 0,
      failedStage: 'TRANSFORMATION',
      errorLog: 'Missing required field customer_id in 30% of incoming batch payloads'
    },
    aiExplanation: {
      provider: 'DETERMINISTIC_FALLBACK',
      generatedAt: new Date(Date.now() - 10 * 60 * 1000),
      rootCause: 'Deterministic Findings: Critical missing values identified across key columns: customer_id (3 nulls, 30%), order_amount (3 nulls, 30%). Pipeline log trace: "Missing required field customer_id in 30% of incoming batch payloads".',
      impactSummary: 'Identified anomalies threaten data integrity in Executive Cohort Reports and Real-time Analytical Warehouses, potentially causing revenue attribution failure.',
      affectedDownstream: ['Executive Revenue Cohort Reporting', 'Customer LTV Aggregator'],
      recommendedFixes: [
        'Enforce schema validation before loading to financial ledger',
        'Direct payloads with missing customer_id to dead-letter queue (DLQ)',
        'Rerun backfill pipeline after producer patch'
      ]
    },
    simulated: true
  },
  {
    title: 'Duplicate Primary Key Injections in Warehouse Balances',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    sourceType: 'PIPELINE_EXECUTION',
    sourcePipeline: 'Warehouse Stock Balances',
    datasetName: 'inventory_duplicates.csv',
    summary: 'Duplicate rows detected for SKU-B202 and SKU-D404 in regional inventory snapshots.',
    details: {
      qualityScore: 54.0,
      missingPercentage: 0,
      duplicatesCount: 4,
      failedStage: 'VALIDATION_GATE',
      errorLog: 'Duplicate primary key collisions detected for SKU-B202 and SKU-D404'
    },
    aiExplanation: {
      provider: 'DETERMINISTIC_FALLBACK',
      generatedAt: new Date(Date.now() - 40 * 60 * 1000),
      rootCause: 'Deterministic Findings: Found 4 duplicate records (40.0% duplication rate). Pipeline log trace: "Duplicate primary key collisions detected for SKU-B202 and SKU-D404".',
      impactSummary: 'Duplicated records will artificially inflate inventory valuation by 40% and corrupt automated supplier reordering thresholds.',
      affectedDownstream: ['Supply Chain ERP', 'Warehouse Reorder Service'],
      recommendedFixes: [
        'Apply deduplication query filter using ROW_NUMBER() OVER(PARTITION BY sku ORDER BY last_audit_date DESC)',
        'Check upstream warehouse worker synchronization for retry loop bugs'
      ]
    },
    simulated: true
  }
];

// In-memory store for fallback mode when MongoDB is offline
const inMemoryStore = {
  pipelines: JSON.parse(JSON.stringify(initialPipelines)),
  incidents: JSON.parse(JSON.stringify(initialIncidents)),
  scans: []
};

// Auto-seed database if connected and empty
const seedDatabaseIfEmpty = async () => {
  if (!isDBConnected()) return false;

  try {
    const pipelineCount = await Pipeline.countDocuments();
    if (pipelineCount === 0) {
      console.log('[SeedService] Seeding initial simulated pipelines to MongoDB...');
      await Pipeline.insertMany(initialPipelines);
    }

    const incidentCount = await Incident.countDocuments();
    if (incidentCount === 0) {
      console.log('[SeedService] Seeding initial simulated incidents to MongoDB...');
      await Incident.insertMany(initialIncidents);
    }

    return true;
  } catch (err) {
    console.error('[SeedService] Failed to seed database:', err.message);
    return false;
  }
};

module.exports = {
  initialPipelines,
  initialIncidents,
  inMemoryStore,
  seedDatabaseIfEmpty
};
