const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ScoringEngine = require('../src/services/scoringEngine');
const ValidationEngine = require('../src/services/validationEngine');

test('ScoringEngine - Perfect dataset yields 100% and Grade A', () => {
  const perfectValidation = {
    isEmpty: false,
    totalRows: 10,
    totalColumns: 5,
    missingValuesTotal: 0,
    missingByColumn: {},
    duplicateRowsCount: 0,
    anomaliesCount: 0,
    operationalTimestamp: new Date().toISOString()
  };

  const score = ScoringEngine.calculate(perfectValidation);
  assert.equal(score.overallScore, 100);
  assert.equal(score.breakdown.completeness, 100);
  assert.equal(score.breakdown.uniqueness, 100);
  assert.equal(score.breakdown.validity, 100);
  assert.equal(score.grade, 'A');
  assert.equal(score.status, 'HEALTHY');
  assert.equal(score.freshness.status, 'PRISTINE');
});

test('ScoringEngine - Empty file edge case yields 0 and Grade F', () => {
  const emptyValidation = {
    isEmpty: true,
    totalRows: 0,
    totalColumns: 0,
    missingValuesTotal: 0,
    duplicateRowsCount: 0,
    anomaliesCount: 1
  };

  const score = ScoringEngine.calculate(emptyValidation);
  assert.equal(score.overallScore, 0);
  assert.equal(score.grade, 'F');
  assert.equal(score.status, 'CRITICAL');
});

test('ScoringEngine - Deterministic weighted calculation', () => {
  // 10 rows, 4 columns = 40 cells
  // 4 missing cells = 36/40 = 90% completeness
  // 2 duplicate rows out of 10 = 80% uniqueness
  // 2 anomalies = 100 - (2 * 5) = 90% validity
  // Expected Q = (0.40 * 90) + (0.35 * 80) + (0.25 * 90) = 36 + 28 + 22.5 = 86.5%
  const validation = {
    isEmpty: false,
    totalRows: 10,
    totalColumns: 4,
    missingValuesTotal: 4,
    missingByColumn: {},
    duplicateRowsCount: 2,
    anomaliesCount: 2,
    operationalTimestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  };

  const score = ScoringEngine.calculate(validation);
  assert.equal(score.breakdown.completeness, 90.0);
  assert.equal(score.breakdown.uniqueness, 80.0);
  assert.equal(score.breakdown.validity, 90.0);
  assert.equal(score.overallScore, 86.5);
  // Capped at Grade C due to 20% duplicate rows (threshold: >=20%)
  assert.equal(score.grade, 'C');
  assert.equal(score.status, 'DEGRADED');
});

test('ScoringEngine - Freshness calculation decoupled from quality', () => {
  // Stale dataset from 4 days ago
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const freshness = ScoringEngine.calculateFreshness(fourDaysAgo);
  assert.equal(freshness.status, 'STALE');
  assert.equal(freshness.score, 0);

  // Fresh dataset from 5 minutes ago
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const recentFreshness = ScoringEngine.calculateFreshness(fiveMinAgo);
  assert.equal(recentFreshness.status, 'PRISTINE');
  assert.ok(recentFreshness.score >= 95);

  // Null timestamp handling
  const nullFreshness = ScoringEngine.calculateFreshness(null);
  assert.equal(nullFreshness.status, 'UNKNOWN');
});

// =========================================================================
// REGRESSION TESTS: Freshness Policies & clean_customers_metrics SLA
// =========================================================================

test('ScoringEngine - clean_customers_metrics.csv yields 100% Quality Score and Grade A', () => {
  const samplePath = path.resolve(__dirname, '../../sample_data/clean_customers_metrics.csv');
  const csvContent = fs.readFileSync(samplePath, 'utf8');

  const validation = ValidationEngine.validate(csvContent);
  const scoreReport = ScoringEngine.calculate(validation);

  assert.equal(scoreReport.overallScore, 100);
  assert.equal(scoreReport.grade, 'A');
  assert.equal(scoreReport.qualityStatus, 'HEALTHY');
  assert.equal(scoreReport.status, 'HEALTHY');
  assert.equal(scoreReport.breakdown.completeness, 100);
  assert.equal(scoreReport.breakdown.uniqueness, 100);
  assert.equal(scoreReport.breakdown.validity, 100);

  // Freshness should use BATCH_INGESTION_METADATA policy and not penalize signup_date
  assert.equal(scoreReport.freshness.policy, 'BATCH_INGESTION_METADATA');
  assert.equal(scoreReport.freshness.status, 'PRISTINE');
  assert.equal(scoreReport.freshness.score, 100);
  assert.ok(scoreReport.freshness.message.includes('signup_date'));
});

test('ScoringEngine - Freshness distinguishes operational timestamps from business dates', () => {
  // Dataset with operational event timestamp (e.g. 1 hour ago)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const eventValidation = {
    isEmpty: false,
    totalRows: 10,
    totalColumns: 3,
    operationalTimestamp: oneHourAgo,
    operationalTimestampColumn: 'recorded_at'
  };

  const eventFreshness = ScoringEngine.calculateFreshness(eventValidation);
  assert.equal(eventFreshness.policy, 'EVENT_TIMESTAMP');
  assert.equal(eventFreshness.anchorColumn, 'recorded_at');
  assert.equal(eventFreshness.status, 'ACCEPTABLE');
  assert.ok(eventFreshness.score >= 90 && eventFreshness.score <= 98);
});

test('ScoringEngine - Explicit handling of missing timestamps', () => {
  const noTimestampValidation = {
    isEmpty: false,
    totalRows: 5,
    totalColumns: 2,
    operationalTimestamp: null,
    operationalTimestampColumn: null,
    businessDateColumns: []
  };

  const missingFreshness = ScoringEngine.calculateFreshness(noTimestampValidation, { ingestionTimestamp: null });
  assert.equal(missingFreshness.status, 'NOT_APPLICABLE');
  assert.equal(missingFreshness.score, null);
  assert.ok(missingFreshness.message.includes('not applicable'));
});

// =========================================================================
// REGRESSION TESTS: Operational Circuit Breakers & orders_missing_values Triage
// =========================================================================

test('ScoringEngine - orders_missing_values.csv: mathematical score 94.7% preserved, but grade capped at C (DEGRADED)', () => {
  const samplePath = path.resolve(__dirname, '../../sample_data/orders_missing_values.csv');
  const csvContent = fs.readFileSync(samplePath, 'utf8');

  const validation = ValidationEngine.validate(csvContent);
  const scoreReport = ScoringEngine.calculate(validation);

  // 1. Formula Preservation: mathematical 40/35/25 score remains exactly 94.7%
  assert.equal(scoreReport.overallScore, 94.7);
  assert.equal(scoreReport.breakdown.completeness, 86.7);
  assert.equal(scoreReport.breakdown.uniqueness, 100);
  assert.equal(scoreReport.breakdown.validity, 100);

  // 2. Circuit-Breaker Ceiling: 30% missing customer_id caps grade at C and sets qualityStatus to DEGRADED
  assert.equal(scoreReport.grade, 'C');
  assert.equal(scoreReport.qualityStatus, 'DEGRADED');
  assert.equal(scoreReport.maxColumnMissingPercentage, 30);
  assert.equal(scoreReport.worstMissingColumn, 'customer_id');

  // 3. Operational Event Freshness: order_timestamp from 2026-10-27 is STALE (0%)
  assert.equal(scoreReport.freshness.status, 'STALE');
  assert.equal(scoreReport.freshness.policy, 'EVENT_TIMESTAMP');

  // 4. Overall Operational Health: DEGRADED (reflects both missing keys and staleness)
  assert.equal(scoreReport.status, 'DEGRADED');
  assert.ok(scoreReport.statusReasons.some(r => r.includes("Column 'customer_id' has a severe 30% missing rate")));
  assert.ok(scoreReport.statusReasons.some(r => r.includes("Operational event stream is STALE")));
});

test('ScoringEngine - Circuit breaker caps grade at B for column missing between 15% and 25%', () => {
  const validation = {
    isEmpty: false,
    totalRows: 100,
    totalColumns: 5,
    missingValuesTotal: 18,
    missingByColumn: {
      user_id: { count: 18, percentage: 18.0 }
    },
    duplicateRowsCount: 0,
    anomaliesCount: 0
  };

  const report = ScoringEngine.calculate(validation);
  // Overall score: (0.40 * 96.4) + 35 + 25 = 98.6%
  assert.ok(report.overallScore >= 95);
  // But capped at Grade B with WARNING status due to 18% missing key
  assert.equal(report.grade, 'B');
  assert.equal(report.qualityStatus, 'WARNING');
  assert.ok(report.statusReasons.some(r => r.includes("Column 'user_id' has an elevated 18% missing rate")));
});

test('ScoringEngine - Circuit breaker caps grade at C for duplicate row rate >= 20%', () => {
  const validation = {
    isEmpty: false,
    totalRows: 10,
    totalColumns: 4,
    missingValuesTotal: 0,
    missingByColumn: {},
    duplicateRowsCount: 4, // 40% duplicate rows
    anomaliesCount: 0
  };

  const report = ScoringEngine.calculate(validation);
  assert.equal(report.duplicationRate, 40);
  assert.equal(report.grade, 'C');
  assert.equal(report.qualityStatus, 'DEGRADED');
  assert.ok(report.statusReasons.some(r => r.includes("High duplication rate detected (40% duplicate rows")));
});
