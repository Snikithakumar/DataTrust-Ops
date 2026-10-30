# DataTrust Ops: Architecture & Reliability System Design

```
+------------------------------------------------------------------------------------+
|                                CLIENT LAYER (React + Vite)                         |
|   +-------------------+  +--------------------+  +-------------------------------+ |
|   | Dashboard Metrics |  |  Pipeline Manager  |  | CSV Upload & Quality Scanner  | |
|   +-------------------+  +--------------------+  +-------------------------------+ |
|   +-------------------+  +--------------------+  +-------------------------------+ |
|   | Reliability Charts|  |  Incident Triage   |  |   AI Root-Cause Modal         | |
|   +-------------------+  +--------------------+  +-------------------------------+ |
+------------------------------------------------------------------------------------+
                                           |  HTTP / JSON Standard API
                                           v
+------------------------------------------------------------------------------------+
|                                BACKEND LAYER (Node.js + Express)                   |
|                                                                                    |
|  [Security & Upload Middleware]                                                    |
|  - Multer CSV MIME filter, 5MB file limit, sanitization & header checks            |
|                                                                                    |
|  [Core Services]                                                                   |
|  +-------------------------+  +-------------------------+  +---------------------+ |
|  | Validation Engine       |  | Scoring Engine          |  | AI Explanation Svc  | |
|  | - Papa Parse streaming  |  | - Completeness (40%)    |  | - Gemini / LLM API  | |
|  | - Missing values check  |  | - Uniqueness (35%)      |  | - Deterministic Safe| |
|  | - Duplicate rows check  |  | - Validity (25%)        |  |   Rule Fallback     | |
|  | - Configurable bounds   |  | - Freshness calculation |  |   (Zero Halluc.)    | |
|  +-------------------------+  +-------------------------+  +---------------------+ |
|                                                                                    |
|  [Pipeline Orchestration Simulation]                                              |
|  - Ingestion -> Transformation -> Validation Gate -> Warehouse Load / Quarantine   |
|  - Execution history tracking, state transitions (PENDING, RUNNING, SUCCESS, FAIL)|
+------------------------------------------------------------------------------------+
                                           |  Mongoose ODM
                                           v
+------------------------------------------------------------------------------------+
|                            DATABASE LAYER (MongoDB / Atlas)                        |
|   +--------------------+  +----------------------+  +----------------------------+ |
|   | Pipelines Collec.  |  | QualityScans Collec. |  |   Incidents Collection     | |
|   +--------------------+  +----------------------+  +----------------------------+ |
|   * Resilient Connection Manager: Returns 503 + Atlas Guide when offline           |
+------------------------------------------------------------------------------------+
```

## System Workflow & Reliability Loop

1. **Ingestion & Validation**:
   - The user triggers a simulated pipeline job or uploads a CSV file through the UI or API.
   - The file is streamed through `Papa Parse`, sanitizing delimiters, quotes, and encodings.
   - The validation engine scans for empty files, column missing ratios, duplicate rows, and schema anomalies.

2. **Deterministic Evaluation**:
   - The scoring engine calculates an objective 0–100 quality score.
   - Freshness is computed as minutes elapsed since the newest recorded data timestamp.
   - If quality degrades below 75% or a critical pipeline error occurs, an Incident is automatically generated and persisted.

3. **AI Root-Cause Analysis with Guaranteed Fallback**:
   - When an incident is flagged, the user can request an AI Root Cause explanation.
   - If `GEMINI_API_KEY` is configured in `.env`, the prompt receives strictly bounded telemetry and validation findings: column names, missing percentages, duplicate row indices, and log traces.
   - If no API key is supplied or the service is offline, the **Deterministic JavaScript Fallback** generates structured root-cause insights, impact assessments, and remediation code directly derived from the verified findings. Hallucinated causes are strictly prevented.

4. **Database Resiliency**:
   - If MongoDB is unreachable, the system exposes clear diagnostics via `GET /api/health` and displays the `MongoAlertBanner` in the UI with copyable instructions for MongoDB Atlas setup, while maintaining graceful degradation.
