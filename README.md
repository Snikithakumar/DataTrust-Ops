# DataTrust Ops

> **AI-Assisted Data Reliability & Observability Platform**
> *Detect simulated pipeline failures, schema degradation, and poor-quality datasets before they compromise downstream executive analytics.*

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v24.18+-0d9488.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-06b6d4.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Navy%20%26%20Teal-0f172a.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-29%20Passing-emerald.svg)](server/tests)

---

> ⚠️ **Simulated Environment Notice**
> All pipelines, telemetry, and external warehouse connections in this platform operate in a **safe, self-contained simulated environment**. DataTrust Ops demonstrates enterprise-grade data observability patterns without claiming live proprietary enterprise integrations.

---

## 📌 Executive Summary

Modern enterprise dashboards and machine learning models are routinely corrupted by silent data failures: unexpected null spikes, duplicate row injections, or upstream schema drift.

**DataTrust Ops** solves this by establishing an automated reliability layer:
1. **Deterministic Quality Scoring (0–100%)**: An objective, mathematical rating combining Completeness (40%), Uniqueness (35%), and Validity (25%).
2. **Decoupled Freshness SLA**: Tracks time elapsed since data creation independently from quality, ensuring stale static tables aren't misdiagnosed as corrupted and fresh corrupted data isn't falsely marked healthy.
3. **Simulated Pipeline Engine**: Triggers extraction, schema gating, and validation runs with real-time log streaming and error quarantine.
4. **CSV Quality Gate**: Drag-and-drop CSV validation powered by `Papa Parse` with 5MB security boundaries, detecting empty files, null spikes, and duplicate primary keys.
5. **AI Root Cause Analysis with Zero-Hallucination Fallback**: Leverages LLM APIs (e.g. Gemini) or a strict deterministic JavaScript rule engine to synthesize root causes strictly bounded to verified findings and log traces.
6. **Graceful Database Resilience**: Connects to MongoDB/Mongoose with automatic in-memory fallback and clear setup guidance for MongoDB Atlas.

---

## 🏗️ Architecture & System Design

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
                                           |  HTTP / REST (Standard JSON Contract)
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

---

## 📐 Deterministic Quality Score Formula

The **Overall Quality Score ($Q$)** is computed mathematically:

$$Q = 0.40 \times \text{Completeness} + 0.35 \times \text{Uniqueness} + 0.25 \times \text{Validity}$$

- **Completeness ($C$)**: Ratio of non-null cells relative to total cells. A 15% penalty applies per completely blank column.
- **Uniqueness ($U$)**: Ratio of distinct rows relative to total rows to flag duplicate ingestions.
- **Validity ($V$)**: Checks for domain violations (e.g. negative quantities, negative latencies, malformed timestamps).
- **Freshness**: Measured as minutes elapsed since newest recorded timestamp:
  $$\text{Freshness} = \max\left(0, 100 - \left(\frac{\Delta T_{\text{minutes}}}{1440}\right) \times 100\right)$$
  *Freshness is reported as an independent SLA metric so stale reference tables are not confused with corrupt tables.*

Detailed mathematical derivations are documented in [docs/SCORING_FORMULA.md](docs/SCORING_FORMULA.md).

---

## 🛠️ Tech Stack

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React + Vite | 18.3.1 / 5.4.2 | High-performance SPA with fast HMR |
| **Styling** | Tailwind CSS | 3.4.10 | Navy & Teal enterprise theme |
| **Charts** | Recharts | 2.12.7 | Interactive quality trends and latency metrics |
| **Icons** | Lucide React | 0.439.0 | Enterprise UI glyphs |
| **Backend** | Node.js + Express | 24.18.0 / 4.19.2 | High-throughput REST API |
| **CSV Engine** | Papa Parse | 5.4.1 | Stream parsing and delimiter auto-detection |
| **Upload Safety** | Multer | 1.4.5-lts | In-memory buffer validation with 5MB cap |
| **Database** | MongoDB + Mongoose | 8.5.1 | Flexible document persistence |
| **AI Analysis** | Gemini API + Fallback | 1.5-flash | Ground-truth root-cause synthesis |
| **Testing** | Node.js Test Runner | Native | 29 automated unit & API tests |

---

## 🚀 Quickstart Guide (Windows PowerShell)

### 1. Prerequisites
Ensure you have **Node.js v18+** installed:
```powershell
node -v
npm -v
```

### 2. Environment Configuration
Copy `.env.example` into `server/.env`:
```powershell
Copy-Item .env.example server/.env
```

*Default environment variables in `server/.env`:*
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/datatrustops
GEMINI_API_KEY=
LLM_MODEL=gemini-1.5-flash
MAX_FILE_SIZE_MB=5
```
*(If no `GEMINI_API_KEY` is provided, the platform automatically runs its deterministic fallback engine with zero setup).*

### 3. Install Dependencies
Run the installation script from the root workspace:
```powershell
# Install root, backend, and frontend packages
npm install
npm --prefix server install
npm --prefix client install
```

### 4. Run Automated Backend Tests
Verify all 29 validation, scoring, circuit-breaker, incident, and health tests pass:
```powershell
npm test
```
*Output:*
```
✔ AIService - Deterministic fallback generates factual root cause without hallucination
✔ Health API - GET /api/health returns 200 with standard response
✔ Dashboard API - GET /api/dashboard returns metrics and charts dataset
✔ Pipeline API - POST /api/pipelines/run validates input and runs simulation
✔ Quality Scan API - POST /api/quality/scan with raw CSV payload
✔ Incidents API - GET /api/incidents returns array and standard schema
✔ Incidents API - PATCH /api/incidents/:id validates status input
✔ Incidents API - PATCH /api/incidents/:id returns 404 for non-existent incident
✔ Incidents API - POST /api/incidents/:id/explain triggers root cause generation
✔ ScoringEngine - Perfect dataset yields 100% and Grade A
✔ ScoringEngine - Empty file edge case yields 0 and Grade F
✔ ScoringEngine - Deterministic weighted calculation
✔ ScoringEngine - Freshness calculation decoupled from quality
✔ ScoringEngine - clean_customers_metrics.csv yields 100% Quality Score and Grade A
✔ ScoringEngine - Freshness distinguishes operational timestamps from business dates
✔ ScoringEngine - Explicit handling of missing timestamps
✔ ScoringEngine - orders_missing_values.csv: mathematical score 94.7% preserved, but grade capped at C (DEGRADED)
✔ ScoringEngine - Circuit breaker caps grade at B for column missing between 15% and 25%
✔ ScoringEngine - Circuit breaker caps grade at C for duplicate row rate >= 20%
✔ ValidationEngine - Empty and blank content handling
✔ ValidationEngine - Header only CSV without data rows
✔ ValidationEngine - Clean CSV dataset validation
✔ ValidationEngine - Missing values detection
✔ ValidationEngine - Duplicate rows detection
✔ ValidationEngine - Negative value anomaly check
✔ ValidationEngine - clean_customers_metrics.csv regression: lifetime_value not treated as date
✔ ValidationEngine - Genuinely invalid date formats in date columns produce descriptive anomalies
✔ ValidationEngine - Non-numeric strings in numeric columns produce INVALID_NUMERIC_FORMAT
✔ ValidationEngine - Test all sample data files produce expected findings
ℹ tests 29 | pass 29 | fail 0
```

### 5. Build Frontend Production Bundle
```powershell
npm run build
```

### 6. Run the Application
You can start both backend and frontend concurrently:
```powershell
npm run dev
```

Or run them in separate PowerShell terminals:
- **Terminal 1 (Backend Server):**
  ```powershell
  npm run dev:server
  ```
  *Server runs at: `http://localhost:5000`*
- **Terminal 2 (Frontend Client):**
  ```powershell
  npm run dev:client
  ```
  *Client runs at: `http://localhost:5173`*

Open your browser to `http://localhost:5173` to interact with DataTrust Ops!

---

## 🧪 Repeatable End-to-End Demo Walkthrough

### Step 1: Inspect Overview Dashboard
- Navigate to `http://localhost:5173`.
- Observe the **Overall Reliability Score**, **Decoupled Freshness SLA**, **Active Incidents**, and **Pipeline Health**.
- View the 24-hour reliability trend and latency benchmarks in the Recharts visualization.

### Step 2: Simulate Pipeline Execution
- Click on the **Pipelines** tab in the navigation bar.
- Find `Customer Master Ingestion` and click **Run**.
  - Notice the execution duration, status pill (`HEALTHY`), and generated log stream.
- Click the **Logs** button to review the terminal window with detailed timestamped steps.
- Toggle **Force Quality Breach (Demo)** at the top right and click **Run** on any pipeline.
  - The pipeline halts at the validation stage, triggers a quarantine event, and immediately creates a high-severity Incident.

### Step 3: Run CSV Quality Scanner
- Navigate to the **Quality Scanner** tab.
- Click any of the one-click sample dataset buttons:
  - **Clean Customers**: Achieves 100% score (Grade A), 0 nulls, pristine freshness.
  - **Orders Null Spike**: Drops to 68% score (Grade C), identifies 30% null foreign keys (`customer_id`).
  - **Inventory Duplicates**: Drops to 54% score (Grade D), flags repeated rows and primary key collisions.
  - **Empty Transactions**: Detects 0-byte file, triggers immediate Grade F circuit-breaker.
- Or drag-and-drop any custom `.csv` file.
- Inspect the column-by-column missing values breakdown, duplicate row indices, and anomaly table.

### Step 4: AI Root-Cause Analysis
- Navigate to the **Incidents** tab.
- Click **Analyze with AI** on any flagged incident.
- The modal reveals:
  - **Verified Findings**: Ground truth metrics (e.g. `customer_id (3 nulls, 30%)`).
  - **Root Cause Synthesis**: Grounded explanation citing the exact column and log trace.
  - **Business Impact**: Downstream analytical systems impacted.
  - **Engineering Fixes**: Copyable SQL / validation remediation rules.
- Change the incident status from `OPEN` &rarr; `INVESTIGATING` &rarr; `RESOLVED`.

---

## 🗄️ MongoDB Atlas Setup Guide

DataTrust Ops strictly respects data persistence. If a local MongoDB instance is not running, the application operates in a safe **simulated in-memory mode** and alerts you via the `MongoAlertBanner`.

To enable full database persistence:
1. Create a free M0 cluster on [cloud.mongodb.com](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a user (e.g. `datatrust_user`).
3. Under **Network Access**, add `0.0.0.0/0` (Allow from anywhere for dev).
4. In `server/.env`, set:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/datatrustops?retryWrites=true&w=majority
   ```
5. Seed initial data:
   ```powershell
   npm --prefix server run seed
   ```

*See [docs/MONGODB_ATLAS_GUIDE.md](docs/MONGODB_ATLAS_GUIDE.md) for detailed instructions.*

---

## 🔒 Security & Defense-in-Depth

- **File Upload Limits**: Enforces a strict 5MB maximum file size via Multer.
- **MIME & Extension Whitelisting**: Rejects non-CSV payloads before parsing.
- **In-Memory Streaming**: Uploaded files are parsed as memory buffers; arbitrary scripts or binaries are never executed or written to arbitrary disk locations.
- **Secret Isolation**: API keys and database credentials reside strictly in server environment variables and are never transmitted to the frontend.
- **CORS & HTTP Security Headers**: Configured with strict origin checks, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.

---

## 📁 Repository Structure

```
DataTrustOps/
├── .env.example                 # Global environment template
├── .gitignore                   # Git exclusion rules
├── LICENSE                      # Real MIT License
├── README.md                    # System documentation and guide
├── package.json                 # Monorepo orchestration scripts
├── sample_data/                 # Sample datasets for demo & testing
│   ├── clean_customers_metrics.csv
│   ├── orders_missing_values.csv
│   ├── inventory_duplicates.csv
│   ├── empty_transactions.csv
│   └── telemetry_anomalies.csv
├── docs/                        # Technical specifications
│   ├── ARCHITECTURE.md          # System architecture & reliability loops
│   ├── SCORING_FORMULA.md       # Deterministic formula & decoupled freshness
│   ├── API_REFERENCE.md         # API contract & endpoints
│   └── MONGODB_ATLAS_GUIDE.md   # Atlas database setup guide
├── screenshots/                 # Visual documentation
│   └── README.md
├── server/                      # Node.js + Express Backend
│   ├── server.js                # Server entry point
│   ├── package.json
│   ├── src/
│   │   ├── app.js               # Express application config
│   │   ├── config/db.js         # Mongoose resilient connection
│   │   ├── models/              # Pipeline, QualityScan, Incident models
│   │   ├── controllers/         # API controllers
│   │   ├── services/            # Validation, scoring, and AI services
│   │   ├── middleware/          # Multer upload & error handling
│   │   ├── routes/              # Express API routers
│   │   └── scripts/seed.js      # Database seed utility
│   └── tests/                   # 29 automated backend tests
└── client/                      # React + Vite Frontend
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx              # Main dashboard application
        ├── services/api.js      # Axios API client
        └── components/          # UI, Scanner, Pipelines, Incidents, Charts
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
