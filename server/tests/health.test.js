const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('Health API - GET /api/health returns 200 with standard response', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.status);
  assert.ok(res.body.data.database);
  assert.ok(res.body.data.aiEngine);
  assert.ok(res.body.timestamp);
});

test('Dashboard API - GET /api/dashboard returns metrics and charts dataset', async () => {
  const res = await request(app).get('/api/dashboard');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(typeof res.body.data.metrics.overallHealthScore === 'number');
  assert.ok(typeof res.body.data.metrics.dataFreshness.score === 'number');
  assert.ok(Array.isArray(res.body.data.qualityHistory));
  assert.ok(Array.isArray(res.body.data.pipelinePerformance));
});

test('Pipeline API - POST /api/pipelines/run validates input and runs simulation', async () => {
  // Test missing params
  const missingRes = await request(app).post('/api/pipelines/run').send({});
  assert.equal(missingRes.status, 400);
  assert.equal(missingRes.body.success, false);

  // Test valid run
  const runRes = await request(app)
    .post('/api/pipelines/run')
    .send({ name: 'Customer Master Ingestion' });

  assert.equal(runRes.status, 200);
  assert.equal(runRes.body.success, true);
  assert.ok(runRes.body.data.run.runId);
  assert.ok(runRes.body.data.run.status);
});

test('Quality Scan API - POST /api/quality/scan with raw CSV payload', async () => {
  const sampleCSV = 'product_id,price,stock\nPROD-1,19.99,100\nPROD-2,,50\n';
  const scanRes = await request(app)
    .post('/api/quality/scan')
    .send({ csvData: sampleCSV, datasetName: 'test_products.csv' });

  assert.equal(scanRes.status, 200);
  assert.equal(scanRes.body.success, true);
  assert.equal(scanRes.body.data.totalRows, 2);
  assert.equal(scanRes.body.data.totalColumns, 3);
  assert.ok(scanRes.body.data.findings.missingValuesTotal >= 1);
  assert.ok(typeof scanRes.body.data.score === 'number');
});

test('Health API - Redacts exact MongoDB Atlas shard hostnames in public response', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  const db = res.body.data.database;
  if (db && db.host) {
    // Shard hostnames like ac-euqcwml-shard-00-00.lisb0kp.mongodb.net must never be exposed
    assert.equal(/shard-\d+/i.test(db.host), false);
    assert.equal(/mongodb\.net/i.test(db.host), false);
  }
});

test('Quality Scan API - Accepts legitimate multipart CSV file upload', async () => {
  const csvBuffer = Buffer.from('id,name,value\n1,Alpha,100\n2,Beta,200\n');
  const res = await request(app)
    .post('/api/quality/scan')
    .attach('file', csvBuffer, { filename: 'valid_data.csv', contentType: 'text/csv' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.totalRows, 2);
});

test('Quality Scan API - Rejects dangerous executable extension even if MIME is text/csv', async () => {
  const scriptBuffer = Buffer.from('console.log("malicious");');
  const res = await request(app)
    .post('/api/quality/scan')
    .attach('file', scriptBuffer, { filename: 'malicious_script.exe', contentType: 'text/csv' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'INVALID_FILE_TYPE');
});

test('Quality Scan API - Rejects invalid MIME type despite .csv extension', async () => {
  const payloadBuffer = Buffer.from('%PDF-1.4 dummy content');
  const res = await request(app)
    .post('/api/quality/scan')
    .attach('file', payloadBuffer, { filename: 'fake_invoice.csv', contentType: 'application/pdf' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'INVALID_FILE_TYPE');
});

test('Quality Scan API - Rejects executable binary payload (PE header MZ) in CSV upload', async () => {
  const peBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  const res = await request(app)
    .post('/api/quality/scan')
    .attach('file', peBuffer, { filename: 'trojan.csv', contentType: 'text/csv' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'INVALID_FILE_TYPE');
});
