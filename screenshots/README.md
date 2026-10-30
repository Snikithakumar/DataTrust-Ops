# DataTrust Ops: Visual Walkthrough & Screenshots

This directory serves as the artifact repository for dashboard screenshots, architectural flowcharts, and incident resolution previews.

---

## 1. Enterprise Operations Dashboard
- **Color Palette**: Dark Slate Navy (`#0f172a`), Deep Indigo Card Canvas (`#1e293b`), Electric Teal Accents (`#14b8a6`, `#06b6d4`).
- **Header**: Live backend heartbeat indicator, environment badge (`[SIMULATED DATA ENVIRONMENT]`), and quick action buttons.
- **KPI Summary Cards**:
  1. *Overall Data Reliability Score* (0–100%)
  2. *Data Freshness SLA* (calculated separately in minutes/hours lag)
  3. *Active Incidents & Unresolved Severities*
  4. *Simulated Pipelines Health & Success Rate*

---

## 2. Simulated Pipeline Engine
- Real-time job table containing:
  - `Customer Master Ingestion`
  - `Warehouse Orders Aggregator`
  - `Real-time Telemetry Stream`
  - `Financial Ledger Consolidation`
- Interactive **"Run Pipeline"** simulation trigger with instant log streaming and incident creation when quality falls below tolerance.

---

## 3. CSV Quality Scanner & Drag-and-Drop
- Drag-and-drop file upload with 5MB client-side and server-side safety checks.
- One-click sample dataset buttons (`clean_customers_metrics.csv`, `orders_missing_values.csv`, `inventory_duplicates.csv`, `empty_transactions.csv`).
- Comprehensive quality breakdown showing:
  - Missing percentage per column
  - Duplicate row count & index references
  - Format anomalies & negative values
  - Independent Freshness score

---

## 4. AI-Assisted Incident Command Center
- Status triage: `OPEN` -> `INVESTIGATING` -> `RESOLVED`.
- One-click **"Analyze with AI"** modal:
  - Displays verifiable root cause based directly on parsed metrics and logs.
  - Zero hallucination guarantee: utilizes deterministic fallback if external LLM API is unavailable.
  - Suggests concrete SQL/pipeline remediation actions.
