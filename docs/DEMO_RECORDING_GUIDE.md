# DataTrust Ops — 3-Minute Product Demonstration Video Guide

> **Platform:** DataTrust Ops (AI-Assisted Data Reliability & Observability Platform)
> **Target Video Duration:** Exactly 3 Minutes (180 seconds)
> **Target Audience:** ExaThon Hackathon Judges, Data Platform Engineers, Operations Leads
> **Environment Status:** Active & Live on `http://localhost:5173` (Backend: `http://localhost:5000`)
> **Persistence Mode:** Local MongoDB Connected (`127.0.0.1/datatrustops`) with graceful in-memory fallback
> **Environment Notice:** Clearly labels all pipeline orchestration and telemetry as a safe, simulated enterprise environment without claiming unverified third-party vendor integrations.

---

## 🎬 Pre-Recording Checklist & Environment Setup

Before starting your screen capture software (OBS Studio, Loom, Clipchamp, or Windows Game Bar `Win + Alt + R`):

- [ ] **Display Setup**: Set monitor resolution to 1920×1080 (1080p). Set browser zoom to 100%.
- [ ] **Browser Window**: Open Google Chrome or Microsoft Edge at `http://localhost:5173`. Close extraneous tabs and disable browser extension popups.
- [ ] **Backend & Client Verification**:
  - Backend API: `http://localhost:5000/api/health` returns `200 OK` with `"status": "HEALTHY"`.
  - Frontend Client: `http://localhost:5173` loads without console errors.
  - In the top navigation bar, ensure the green indicator pill displays **`MongoDB: CONNECTED`**.
- [ ] **Sample Datasets Ready**: The 5 verified sample files are located in `sample_data/`:
  1. `clean_customers_metrics.csv` (10 rows, 100% score, pristine freshness)
  2. `orders_missing_values.csv` (10 rows, 30% null foreign keys, triggers Grade C circuit breaker)
  3. `inventory_duplicates.csv` (10 rows, 4 duplicate rows, triggers Grade C circuit breaker)
  4. `empty_transactions.csv` (0 rows, triggers Grade F circuit breaker)
  5. `telemetry_anomalies.csv` (8 rows, negative latency anomalies)
- [ ] **Audio Check**: Test microphone levels; aim for a clear, confident, conversational delivery at ~140 words per minute.

---

## ⏱️ Master 3-Minute Video Timeline & Narration Script

```
0:00 ─── Hook & Overview Dashboard ────────────────────────────── 0:40 (40s)
0:40 ─── Pipeline Execution & Real-Time Quarantine ────────────── 1:15 (35s)
1:15 ─── CSV Quality Scanner & Circuit-Breaker Gates ──────────── 2:05 (50s)
2:05 ─── Incident Triage & Zero-Hallucination AI Root Cause ───── 2:45 (40s)
2:45 ─── Architecture Summary & ExaThon Wrap-Up ───────────────── 3:00 (15s)
```

---

### Segment 1: Hook & Executive Dashboard Overview (0:00 – 0:40 | 40s)

#### Exact Browser Actions
1. **0:00 – 0:10**: Start recording on `http://localhost:5173` on the **Overview** tab.
2. **0:10 – 0:20**: Hover over the **`[SIMULATED DATA ENVIRONMENT]`** badge in the navbar and point out the live **`MongoDB: CONNECTED`** heartbeat pill.
3. **0:20 – 0:30**: Move cursor smoothly across the 4 top KPI cards:
   - **Overall Reliability Score** (Deterministic weighted score)
   - **Data Freshness** (Highlighted as an independent, decoupled SLA)
   - **Active Incidents** (Live count of open/investigating issues)
   - **Pipeline Health** (Simulated pipeline success rate)
4. **0:30 – 0:40**: Scroll slightly down to showcase the **24-Hour Reliability Trend** and **Pipeline Latency Benchmarks** Recharts visualizations. Click the **"Scoring Formula"** button in the navbar for 3 seconds to reveal the modal ($Q = 0.40C + 0.35U + 0.25V$), then close it.

#### Verbatim Narration Script (92 words)
> *"Every day, silent data failures—missing foreign keys, duplicate records, and upstream schema drift—corrupt executive dashboards long before engineers notice. Welcome to DataTrust Ops, an AI-assisted data reliability and observability platform built for the ExaThon hackathon.*
>
> *Here on our live Operations Dashboard, we continuously monitor simulated enterprise pipelines. Notice our Deterministic Reliability Score alongside a decoupled Freshness SLA—ensuring stale static tables are never conflated with corrupted data.*
>
> *Our scoring formula objectively balances Completeness, Uniqueness, and Validity, backed by persistent MongoDB storage and automated circuit-breaker protections."*

---

### Segment 2: Simulated Pipeline Execution & Quarantine (0:40 – 1:15 | 35s)

#### Exact Browser Actions
1. **0:40 – 0:45**: Click the **Pipelines** tab in the navbar.
2. **0:45 – 0:55**: Locate `Customer Master Ingestion`. Click the teal **"Run Pipeline"** button.
   - Observe the live spinner and status transition from `IDLE` $\rightarrow$ `RUNNING` $\rightarrow$ `HEALTHY`.
   - Click **"View Logs"** to display the 4-stage execution drawer (`EXTRACT` $\rightarrow$ `TRANSFORM` $\rightarrow$ `QUALITY_GATE` $\rightarrow$ `LOAD`).
3. **0:55 – 1:15**: Toggle the **"Force Quality Breach (Demo)"** switch at the top right.
   - Click **"Run Pipeline"** on `Orders Financial Reconciliation`.
   - Watch the pipeline transition into `FAILED` with a red status badge.
   - Open its execution logs: point to the terminal showing the validation gate rejection and quarantine event that auto-created an incident.

#### Verbatim Narration Script (84 words)
> *"Let's switch to the Pipelines view. DataTrust Ops manages end-to-end simulated data workflows. When we trigger the Customer Master Ingestion pipeline, our orchestration engine extracts, transforms, and validates the batch in real time, writing a clean audit trail to the execution log.*
>
> *Now, let's simulate what happens during an unexpected upstream schema failure. With our Demo Breach switch enabled, the validation gate immediately halts execution, quarantines the dirty payload, and automatically logs a high-severity incident to protect downstream warehouse consumers."*

---

### Segment 3: CSV Quality Scanner & Circuit-Breakers (1:15 – 2:05 | 50s)

#### Exact Browser Actions
1. **1:15 – 1:25**: Click the **Quality Scanner** tab.
2. **1:25 – 1:35**: Click the **"Clean Customers"** quick-load sample button, then click **"Run Quality Scan"**.
   - Show the instant result: **100% Quality Score (Grade A)**, 0 nulls, 0 duplicates, and pristine freshness.
   - Mention that numeric `lifetime_value` and dates are validated with strict schema awareness.
3. **1:35 – 1:50**: Click the **"Orders Null Spike"** quick-load button, then click **"Run Quality Scan"**.
   - Point out the result: **94.7% mathematical score**, but the operational grade is capped at **Grade C (DEGRADED)**.
   - Scroll to the column breakdown table: highlight that `customer_id` has an unacceptable 30% missing rate, triggering our circuit breaker.
4. **1:50 – 2:05**: Click the **"Empty File"** sample button, then click **"Run Quality Scan"**.
   - Show the immediate **0% (Grade F / CRITICAL)** response.

#### Verbatim Narration Script (118 words)
> *"Next is our CSV Quality Scanner—a drag-and-drop ingestion gate powered by Papa Parse and server-side stream validation.*
>
> *When scanning our Clean Customers dataset, it scores a perfect 100% Grade A. Our engine is schema-aware: numeric lifetime values are validated numerically, while signup timestamps are parsed strictly as ISO dates.*
>
> *Now, let's test a realistic dirty dataset: Orders Null Spike. Under raw weighted averages, this dataset might pass at 94.7%. But DataTrust Ops employs intelligent Circuit Breakers: because mandatory customer foreign keys spike to 30% missing, the engine automatically caps the grade at C and flags the operational status as Degraded.*
>
> *Zero-byte payloads like Empty Transactions are stopped instantly with a Grade F."*

---

### Segment 4: Incident Triage & Zero-Hallucination AI Root Cause (2:05 – 2:45 | 40s)

#### Exact Browser Actions
1. **2:05 – 2:15**: Click the **Incidents** tab in the navbar.
2. **2:15 – 2:25**: Select the newly created incident: *"Freshness SLA Breach"* or *"High Null Rate in Mandatory Customer Foreign Key"*.
   - Point to the status dropdown and switch it from `OPEN` $\rightarrow$ `INVESTIGATING`.
3. **2:25 – 2:40**: Click the teal **"Analyze with AI"** button (Sparkles icon).
   - The AI Root Cause modal opens.
   - Point out the badge: **`Engine: DETERMINISTIC_FALLBACK`** (or `GEMINI_API` if API key provided) with *"Guaranteed Zero-Hallucination Sandbox"*.
   - Read the **Root Cause Synthesis**: it directly cites the exact column `customer_id` (3 nulls, 30%) and the pipeline log trace.
   - Point to the **Affected Downstream Systems** pills and the copyable SQL remediation rule under **Recommended Engineering Remediation**.
4. **2:40 – 2:45**: Close the modal, update status to **`RESOLVED`**, and notice the live timestamp update.

#### Verbatim Narration Script (96 words)
> *"When a failure occurs, it flows directly into our Incident Command Center. Here, data engineers triage issues across severity tiers.*
>
> *By clicking 'Analyze with AI', DataTrust Ops synthesizes a verified root-cause analysis. Unlike generic chatbots that hallucinate, our engine feeds strictly verified findings and pipeline log traces into the LLM, backed by a deterministic rule-based fallback.*
>
> *It identifies the exact missing column, summarizes the business impact on executive cohort analytics, and provides copy-ready SQL remediation logic. We can mark the incident Resolved and return our cluster to healthy standing."*

---

### Segment 5: Architecture Summary & ExaThon Wrap-Up (2:45 – 3:00 | 15s)

#### Exact Browser Actions
1. **2:45 – 2:55**: Click back to the **Overview** tab.
   - Show the updated reliability score, resolved incidents, and live charts.
2. **2:55 – 3:00**: Move cursor to center screen, showing the modern dark slate navy & electric teal enterprise design. Fade to black or stop recording.

#### Verbatim Narration Script (38 words)
> *"Built with React, Vite, Tailwind, Express, and MongoDB, DataTrust Ops delivers deterministic, explainable, and production-ready data observability. Thank you to the ExaThon team, and we look forward to your questions!"*

---

## 📊 Summary of Timed Script & Transitions

| Segment | Video Time | Duration | Screen / Tab | Key Action | Word Count |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **1. Hook & Overview** | 0:00 – 0:40 | 40s | Overview Tab | KPI Cards, Recharts, Scoring Modal | 92 words |
| **2. Pipelines** | 0:40 – 1:15 | 35s | Pipelines Tab | Run Pipeline, Demo Breach Toggle, Logs | 84 words |
| **3. CSV Quality Scanner** | 1:15 – 2:05 | 50s | Scanner Tab | Clean CSV $\rightarrow$ Orders Null Spike $\rightarrow$ Empty CSV | 118 words |
| **4. Incident Command** | 2:05 – 2:45 | 40s | Incidents Tab | Status Triage, AI Modal, Ground Truth Fix | 96 words |
| **5. Architecture & Wrap** | 2:45 – 3:00 | 15s | Overview Tab | Updated KPIs, Stack Summary, Closing | 38 words |
| **TOTAL** | **0:00 – 3:00** | **180s** | — | — | **428 words** |

*Average cadence: ~142 words/minute (standard presentation tempo).*

---

## 🛠️ Screen Recording Software Options (Windows)

Since automated CLI video capture (such as `ffmpeg`) is not pre-installed on this machine, use one of the following built-in or free tools:

### Option A: Windows Game Bar (Built-in, No Install Required)
1. Open Google Chrome with `http://localhost:5173`.
2. Press **`Win + G`** (or **`Win + Alt + R`** directly to start recording immediately).
3. Ensure microphone is unmuted in the capture overlay.
4. Walk through the 5 segments following the checklist above.
5. Press **`Win + Alt + R`** to finish. The `.mp4` file will be saved in `Videos\Captures`.

### Option B: Loom / OBS Studio
1. Launch OBS Studio or the Loom desktop application.
2. Select **Display Capture** or **Window Capture (Chrome - DataTrust Ops)**.
3. Configure audio input to your primary microphone.
4. Hit **Start Recording**, follow the script, and stop at 3:00.

---

## 🔍 Verification & Quality Assurance After Recording

Before submitting the video file to ExaThon:
- [ ] **Duration Check**: Total video length is between **2:50 and 3:05**.
- [ ] **Audio Clarity**: Narration is crisp, audible, and synchronized with cursor clicks.
- [ ] **Visual Clarity**: Text on charts and tables is sharp and readable at 1080p.
- [ ] **Feature Completeness**: All 5 core capabilities (Overview, Pipelines, Quality Scanner, Scoring Circuit Breakers, AI Incidents) were demonstrated.
- [ ] **Honesty & Transparency**: Pipeline and telemetry simulations are clearly labeled, highlighting real engineering architecture without claiming unverified third-party enterprise integrations.
