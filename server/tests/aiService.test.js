const test = require('node:test');
const assert = require('node:assert/strict');
const AIService = require('../src/services/aiService');

test('AIService - Deterministic fallback generates factual root cause without hallucination', async () => {
  const incident = {
    title: 'Data Quality Alert: orders.csv',
    datasetName: 'orders.csv',
    details: {
      qualityScore: 62.5,
      failedStage: 'TRANSFORMATION',
      errorLog: 'Validation check failed'
    }
  };

  const findings = {
    datasetName: 'orders.csv',
    totalRows: 100,
    missingByColumn: {
      customer_id: { count: 25, percentage: 25.0 },
      amount: { count: 10, percentage: 10.0 }
    },
    duplicateRowsCount: 5,
    anomaliesCount: 2
  };

  const explanation = await AIService.explainIncident(incident, findings);

  assert.equal(explanation.provider, 'DETERMINISTIC_FALLBACK');
  assert.ok(explanation.rootCause.includes('customer_id'));
  assert.ok(explanation.rootCause.includes('25%'));
  assert.ok(explanation.rootCause.includes('5 duplicate records'));
  assert.ok(explanation.rootCause.includes('Validation check failed'));

  assert.ok(Array.isArray(explanation.affectedDownstream));
  assert.ok(explanation.affectedDownstream.length > 0);

  assert.ok(Array.isArray(explanation.recommendedFixes));
  assert.ok(explanation.recommendedFixes.some(fix => fix.includes('validation gate') || fix.includes('DLQ')));

  // Ensure verified findings map exactly to inputs
  assert.equal(explanation.verifiedFindings.dataset, 'orders.csv');
  assert.equal(explanation.verifiedFindings.duplicateRowsCount, 5);
  assert.equal(explanation.verifiedFindings.anomaliesCount, 2);
});
