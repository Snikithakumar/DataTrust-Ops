# DataTrust Ops: Deterministic Scoring Formula & Freshness Metrics

DataTrust Ops provides an objective, repeatable, and explainable data quality score strictly decoupled from data freshness. This prevents false confidences where fresh data with severe schema degradation appears healthy, or where pristine static reference tables are penalized purely for infrequent writes.

---

## 1. Quality Score Breakdown (0–100%)

The **Overall Quality Score ($Q_{total}$)** is computed as a weighted aggregate of three orthogonal dimensions:

$$Q_{total} = w_c \cdot C + w_u \cdot U + w_v \cdot V$$

Where default weights are:
- **Completeness ($C$)**: $w_c = 0.40$ (40%)
- **Uniqueness ($U$)**: $w_u = 0.35$ (35%)
- **Validity / Integrity ($V$)**: $w_v = 0.25$ (25%)

$$\sum w_i = 1.0$$

### 1.1 Completeness ($C \in [0, 100]$)
Measures the ratio of non-null, non-empty cells relative to the total possible cell count across all columns:

$$C = \left( 1 - \frac{\sum_{i=1}^{R} \sum_{j=1}^{C_{cols}} \mathbb{I}(\text{cell}_{i,j} \text{ is null, blank, or 'NaN'})}{R \times C_{cols}} \right) \times 100$$

- If an entire required primary key column is missing, an additional hard penalty of $15\%$ is applied to $C$.
- If the dataset has $0$ rows (empty file), $C = 0\%$.

### 1.2 Uniqueness ($U \in [0, 100]$)
Measures the proportion of unique data records to detect duplicate pipeline injections:

$$U = \left( 1 - \frac{N_{duplicate\_rows}}{R} \right) \times 100$$

- An exact duplicate row occurs when all column values in row $A$ equal all values in row $B$.
- When a primary key (e.g., `id`, `order_id`, `sku`) is configured, key collision rates are factored into $U$.
- If $R = 0$, $U = 0\%$.

### 1.3 Validity & Structural Integrity ($V \in [0, 100]$)
Evaluates conformance against expected formats, negative bounds, and parse structure:

$$V = \max\left(0, 100 - \left( 15 \times \text{SchemaAnomalies} + 10 \times \text{FormatViolations} + 5 \times \text{ValueRangeViolations} \right)\right)$$

- Detects negative values in non-negative columns (e.g., latency, quantity, price).
- Identifies malformed date-time formats or invalid categorical values.
- Penalizes empty column headers or ragged row widths.

---

## 2. Separate Freshness Metric ($F$) & SLA Policies

Freshness is **NOT** bundled into the quality score; it is presented as an independent SLA metric so data reliability engineers can diagnose pipeline sync delays without confusing them with data corruption.

### 2.1 Operational Pipeline Timestamps vs. Business Event Dates
A core principle of DataTrust Ops is the strict distinction between **operational data pipeline timestamps** and **business domain attribute dates**:
- **Operational Event / Ingestion Timestamps** (`recorded_at`, `order_timestamp`, `timestamp`, `updated_at`, `created_at`, `ingested_at`):
  Represent when records were emitted, streamed, or ingested into the data pipeline. These timestamps are valid anchors for stream/event freshness SLA calculations.
- **Business Attribute Dates** (`signup_date`, `birth_date`, `last_audit_date`, `hire_date`):
  Represent real-world historical attributes of entities (e.g. when a customer registered an account). Historical entities registered days or months ago do NOT indicate that the dataset is stale. Business attribute dates are **strictly excluded** from data pipeline freshness lag calculations.

### 2.2 Configured Freshness Policies
1. **Event Stream Policy (`EVENT_TIMESTAMP`)**:
   Applied when a dataset contains an operational timestamp column (e.g., `recorded_at` in telemetry streams or `order_timestamp` in transactional feeds).
   $$\Delta T_{minutes} = \frac{T_{now} - T_{event\_latest}}{60 \text{ seconds}}$$
   $$\text{Freshness Score} = \max\left(0, \min\left(100, 100 - \left(\frac{\Delta T_{minutes}}{\text{MaxAcceptableLagMinutes}}\right) \times 100\right)\right)$$
   *(Default $\text{MaxAcceptableLagMinutes} = 1440$ minutes / 24 hours).*

2. **Batch Ingestion Snapshot Policy (`BATCH_INGESTION_METADATA`)**:
   Applied to dimensional master tables (e.g., `clean_customers_metrics.csv` or `inventory_duplicates.csv`) that contain business attribute dates (`signup_date`) rather than streaming event timestamps.
   Freshness is evaluated against the dataset's ingestion/sync timestamp $T_{ingestion}$ (when the batch was extracted/uploaded):
   $$\Delta T_{minutes} = \frac{T_{now} - T_{ingestion}}{60 \text{ seconds}}$$
   A newly ingested batch has $\Delta T = 0$ minutes, yielding $100\%$ (`PRISTINE`) freshness, while explicitly reporting that business dates are excluded.

3. **Explicit Missing Timestamp Handling (`NOT_APPLICABLE`)**:
   If a dataset contains no operational timestamp column and no batch ingestion metadata is provided, the platform explicitly assigns:
   - `status`: `NOT_APPLICABLE`
   - `score`: `null`
   - `message`: *"Dataset contains no operational timestamp column or ingestion metadata. Freshness SLA is not applicable."*
   The system never arbitrarily defaults to 100% or misinterprets business dates.

### 2.3 Freshness Status Thresholds
| Status | Time Lag ($\Delta T$) | SLA Interpretation |
| :--- | :--- | :--- |
| **Realtime / Pristine** | $< 15\text{ mins}$ | Within real-time streaming SLA |
| **Acceptable** | $15\text{ mins} - 2\text{ hours}$ | Within typical batch pipeline SLA |
| **Degraded** | $2\text{ hours} - 24\text{ hours}$ | Batch delays detected; requires attention |
| **Stale (Critical)** | $> 24\text{ hours}$ | Pipeline execution blocked or upstream source inactive |
| **Not Applicable** | N/A | Static or reference table without timestamp anchor |

---

## 3. Operational Circuit-Breakers & Health Status Gating

### 3.1 The Risk of Solely Relying on Mathematical Weighted Averages
Under the standard $40/35/25$ weighted formula ($Q = 0.40 \cdot C + 0.35 \cdot U + 0.25 \cdot V$), a dataset with $100\%$ uniqueness and $100\%$ validity contributes $60\%$ to the score before considering completeness.
For example, in a $10$-row dataset where $3$ rows ($30\%$) have null primary keys (`customer_id`) and null financial amounts (`order_amount`):
- Overall Completeness is $86.7\%$, so $Q = (0.40 \times 86.7) + 35 + 25 = 94.7\%$.
- While $94.7\%$ is mathematically correct for total cell count, **classifying this dataset as Grade A (HEALTHY) severely understates operational risk**. In production, an ingestion where $30\%$ of orders have missing foreign keys cannot be joined or attributed to customers.

To resolve this without arbitrarily altering the mathematical formula, DataTrust Ops introduces **Operational Circuit-Breakers (Grade Ceiling & Floor Rules)**.

### 3.2 Grade Ceiling & Quality Status Thresholds
| Dimension Trigger | Operational Condition | Grade Ceiling | Quality Status | Operational Action |
| :--- | :--- | :--- | :--- | :--- |
| **Severe Column Missing Spike** | Any single column has $\ge 25\%$ missing values | **Grade C** | `DEGRADED` | Auto-incident triggered (HIGH severity) |
| **Elevated Column Missing Spike**| Any single column has $15\% - 25\%$ missing values | **Grade B** | `WARNING` | Warning logged; triage recommended |
| **Severe Duplicate Row Injection** | Duplication rate $\ge 20\%$ of total records | **Grade C** | `DEGRADED` | Auto-incident triggered (HIGH severity) |
| **Elevated Duplicate Injections** | Duplication rate $10\% - 20\%$ of total records | **Grade B** | `WARNING` | Warning logged |
| **Critical Anomaly Cluster** | $\ge 5$ schema / range anomalies detected | **Grade C** | `DEGRADED` | Auto-incident triggered |
| **Complete Column Null** | Entire required column is $100\%$ null | **Grade D** | `HIGH_RISK` | Downstream export halted; hard $-15\%$ penalty |
| **Nominal Baseline** | All columns $< 15\%$ missing, $< 10\%$ dupes, $< 5$ anoms | Baseline | Baseline | Passes according to weighted score $Q$ |

---

## 4. Overall Operational Health Matrix (Quality + Freshness Decoupled)

Data quality and freshness are evaluated as independent operational pillars. The **Overall Health Status** integrates both pillars so that a pristine quality score cannot hide a stale feed, and a fresh feed cannot hide corrupted data:

| Quality Status | Freshness SLA Status | Overall Operational Health | Triage Status |
| :--- | :--- | :--- | :--- |
| **HEALTHY** (Grade A) | **PRISTINE** / **ACCEPTABLE** / **N/A** | **HEALTHY** | Nominal pipeline operation |
| **HEALTHY** (Grade A) | **DEGRADED** ($2\text{h} - 24\text{h}$) | **WARNING** | Pipeline stream delay; investigate ETL worker |
| **HEALTHY** (Grade A) | **STALE** ($> 24\text{h}$ operational stream) | **DEGRADED** | Auto-incident (Freshness SLA breach) |
| **WARNING** (Grade B) | **PRISTINE** / **ACCEPTABLE** | **WARNING** | Mild data quality drift; monitor batch |
| **DEGRADED** (Grade C / defect) | Any Status | **DEGRADED** | Auto-incident (Schema / Key defect) |
| **CRITICAL** (Grade F / empty) | Any Status | **CRITICAL** | Pipeline halted; circuit breaker opened |

---

## 5. Incident Triggering & Severity Rules

An Incident is automatically created and triaged whenever an operational scan breaches any of the following SLA thresholds:

1. **Empty File / Zero-Byte Payload**: Severity `CRITICAL`.
2. **Quality Score $< 50\%$**: Severity `CRITICAL`.
3. **Quality Score $< 75\%$**: Severity `HIGH`.
4. **Column Missing Rate Breach ($\ge 20\%$)**: Severity `HIGH`. Automatically isolates the affected column (e.g., `customer_id`).
5. **Freshness SLA Breach (`STALE` on event stream)**: Severity `HIGH`. Triggers SLA notification for blocked upstream feeds.
6. **Duplicate Injection Breach ($\ge 20\%$)**: Severity `HIGH`. Triggers idempotency and deduplication alerts.
