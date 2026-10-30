# DataTrust Ops: API Reference

All responses conform to the standard DataTrust Ops JSON contract:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-10-28T14:00:00.000Z"
}
```

On error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "details": "Uploaded CSV file exceeds 5MB size limit"
  },
  "timestamp": "2026-10-28T14:00:00.000Z"
}
```

---

## 1. System Health & Diagnostics
### `GET /api/health`
Returns system status, Node runtime info, database connectivity, and configured AI engine mode.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "HEALTHY",
    "uptimeSeconds": 142.5,
    "database": {
      "connected": true,
      "host": "cluster0.mongodb.net",
      "name": "datatrustops"
    },
    "aiEngine": {
      "mode": "GEMINI_API"
    },
    "version": "1.0.0"
  }
}
```

---

## 2. Dashboard Metrics
### `GET /api/dashboard`
Returns aggregated reliability metrics, latest quality scores, active incident summaries, and pipeline execution logs.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "overallHealthScore": 88.5,
      "dataFreshness": {
        "score": 92.0,
        "latestTimestamp": "2026-10-28T09:35:00Z",
        "lagMinutes": 18
      },
      "activeIncidents": 2,
      "criticalIncidents": 1,
      "healthyPipelinesCount": 3,
      "totalPipelinesCount": 4
    },
    "qualityHistory": [
      { "timestamp": "2026-10-28T08:00:00Z", "score": 94.2, "completeness": 96.0, "uniqueness": 98.0, "validity": 88.6 }
    ],
    "recentIncidents": [ ... ],
    "recentPipelineRuns": [ ... ]
  }
}
```

---

## 3. Pipeline Simulation
### `GET /api/pipelines`
Retrieves all configured simulated pipeline jobs and their historical execution states.

### `POST /api/pipelines/run`
Triggers an immediate simulated execution of a target pipeline job.

**Request Payload:**
```json
{
  "pipelineId": "65b...",
  "injectFailure": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobId": "65b...",
    "jobName": "Daily Customer Churn Aggregator",
    "status": "SUCCESS",
    "recordsProcessed": 10500,
    "durationMs": 1450,
    "executionTimestamp": "2026-10-28T14:02:10.000Z",
    "logs": [
      "[INFO] Extracting records from source bucket...",
      "[INFO] Schema validation passed: 100% compliant",
      "[INFO] Staging loaded into data warehouse"
    ]
  }
}
```

---

## 4. Data Quality Scan
### `POST /api/quality/scan`
Accepts a multipart file upload (`file`, `.csv`) or a raw JSON payload with validation parameters to inspect dataset quality.

**Request:** `multipart/form-data` with field `file` (max 5MB)
Optional fields: `datasetName`, `primaryKeyColumn`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scanId": "scan_1730123456",
    "datasetName": "orders_missing_values.csv",
    "totalRows": 10,
    "totalColumns": 6,
    "score": 68.3,
    "scoresBreakdown": {
      "completeness": 71.4,
      "uniqueness": 100.0,
      "validity": 80.0
    },
    "freshness": {
      "score": 85.0,
      "latestTimestamp": "2026-10-27T15:45:00Z",
      "lagHours": 22.5
    },
    "findings": {
      "missingValuesTotal": 7,
      "missingByColumn": {
        "customer_id": { "count": 3, "percentage": 30.0 },
        "order_amount": { "count": 3, "percentage": 30.0 },
        "order_timestamp": { "count": 1, "percentage": 10.0 }
      },
      "duplicateRows": 0,
      "anomalies": []
    },
    "incidentCreated": true,
    "incidentId": "65b..."
  }
}
```

---

## 5. Incident Management
### `GET /api/incidents`
Lists all tracked incidents with optional filters (`?status=OPEN&severity=CRITICAL`).

### `PATCH /api/incidents/:id`
Updates the operational status of an incident.

**Request Payload:**
```json
{
  "status": "INVESTIGATING",
  "resolutionNotes": "Engineering investigating upstream CDC replication lag"
}
```

### `POST /api/incidents/:id/explain`
Generates an AI-assisted or deterministic root cause explanation, impact assessment, and recommended fix for the given incident.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "incidentId": "65b...",
    "source": "DETERMINISTIC_FALLBACK",
    "summary": "High missing-value concentration detected in critical identifier 'customer_id' (30% null).",
    "rootCauseAnalysis": "Upstream service payload ingestion encountered missing foreign keys during unauthenticated guest checkout events.",
    "affectedDownstream": [
      "Customer Lifetime Value (LTV) models",
      "Executive Revenue Cohort Reporting"
    ],
    "remediationSteps": [
      "Quarantine records with null customer_id to DLQ",
      "Update API schema gateway to enforce mandatory customer_id validation",
      "Rerun backfill pipeline for batch window 2026-10-27"
    ]
  }
}
```
