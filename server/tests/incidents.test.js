const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('Incidents API - GET /api/incidents returns array and standard schema', async () => {
  const res = await request(app).get('/api/incidents');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length > 0);
  assert.ok(res.body.timestamp);
});

test('Incidents API - PATCH /api/incidents/:id validates status input', async () => {
  // Query first incident to test patch
  const listRes = await request(app).get('/api/incidents');
  const incidentId = listRes.body.data[0]._id || listRes.body.data[0].title;

  // Invalid status test
  const invalidRes = await request(app)
    .patch(`/api/incidents/${incidentId}`)
    .send({ status: 'INVALID_STATUS' });

  assert.equal(invalidRes.status, 400);
  assert.equal(invalidRes.body.success, false);
  assert.equal(invalidRes.body.error.code, 'INVALID_STATUS');

  // Valid status update test
  const validRes = await request(app)
    .patch(`/api/incidents/${incidentId}`)
    .send({ status: 'RESOLVED', resolutionNotes: 'Resolved during automated test' });

  assert.equal(validRes.status, 200);
  assert.equal(validRes.body.success, true);
  assert.equal(validRes.body.data.status, 'RESOLVED');
  assert.ok(validRes.body.data.resolvedAt);
});

test('Incidents API - PATCH /api/incidents/:id returns 404 for non-existent incident', async () => {
  const notFoundRes = await request(app)
    .patch('/api/incidents/non_existent_id_9999999')
    .send({ status: 'INVESTIGATING' });

  assert.equal(notFoundRes.status, 404);
  assert.equal(notFoundRes.body.success, false);
  assert.equal(notFoundRes.body.error.code, 'INCIDENT_NOT_FOUND');
});

test('Incidents API - POST /api/incidents/:id/explain triggers root cause generation', async () => {
  const listRes = await request(app).get('/api/incidents');
  const incidentId = listRes.body.data[0]._id || listRes.body.data[0].title;

  const explainRes = await request(app).post(`/api/incidents/${incidentId}/explain`);
  assert.equal(explainRes.status, 200);
  assert.equal(explainRes.body.success, true);
  assert.ok(explainRes.body.data.explanation);
  assert.ok(explainRes.body.data.explanation.rootCause);
  assert.ok(explainRes.body.data.explanation.recommendedFixes.length > 0);
});
