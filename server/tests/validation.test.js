const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ValidationEngine = require('../src/services/validationEngine');

test('ValidationEngine - Empty and blank content handling', () => {
  const emptyResult = ValidationEngine.validate('');
  assert.equal(emptyResult.isEmpty, true);
  assert.equal(emptyResult.totalRows, 0);
  assert.equal(emptyResult.anomalies[0].type, 'EMPTY_FILE');

  const whitespaceResult = ValidationEngine.validate('   \n  \r\n ');
  assert.equal(whitespaceResult.isEmpty, true);
});

test('ValidationEngine - Header only CSV without data rows', () => {
  const headerOnly = 'id,name,email\n';
  const result = ValidationEngine.validate(headerOnly);
  assert.equal(result.isEmpty, true);
  assert.equal(result.totalRows, 0);
  assert.equal(result.anomalies[0].type, 'NO_DATA_ROWS');
});

test('ValidationEngine - Clean CSV dataset validation', () => {
  const cleanCSV = `id,name,score,timestamp
1,Alpha,95,2026-10-28T12:00:00Z
2,Beta,88,2026-10-28T12:15:00Z
3,Gamma,92,2026-10-28T12:30:00Z`;

  const result = ValidationEngine.validate(cleanCSV);
  assert.equal(result.isEmpty, false);
  assert.equal(result.totalRows, 3);
  assert.equal(result.totalColumns, 4);
  assert.equal(result.missingValuesTotal, 0);
  assert.equal(result.duplicateRowsCount, 0);
  assert.equal(result.anomaliesCount, 0);
  assert.equal(result.latestTimestamp, '2026-10-28T12:30:00.000Z');
});

test('ValidationEngine - Missing values detection', () => {
  const csvWithNulls = `order_id,customer_id,amount
ORD-1,CUST-1,100
ORD-2,,250
ORD-3,CUST-3,null
ORD-4,CUST-4,
ORD-5,CUST-5,NaN`;

  const result = ValidationEngine.validate(csvWithNulls);
  assert.equal(result.totalRows, 5);
  // Row 2 has missing customer_id; Row 3 has 'null'; Row 4 has ''; Row 5 has 'NaN'
  assert.ok(result.missingValuesTotal >= 4);
  assert.equal(result.missingByColumn.customer_id.count, 1);
  assert.ok(result.missingByColumn.amount.count >= 3);
});

test('ValidationEngine - Duplicate rows detection', () => {
  const csvWithDupes = `sku,warehouse,quantity
SKU-A,WH-1,50
SKU-B,WH-1,20
SKU-A,WH-1,50
SKU-C,WH-2,90
SKU-B,WH-1,20`;

  const result = ValidationEngine.validate(csvWithDupes);
  assert.equal(result.totalRows, 5);
  assert.equal(result.duplicateRowsCount, 2);
  assert.deepEqual(result.duplicateRowIndices, [3, 5]);
});

test('ValidationEngine - Negative value anomaly check', () => {
  const csvWithNegative = `item,price,latency_ms
Sensor-1,45.0,20
Sensor-2,-15.5,35
Sensor-3,90.0,-8`;

  const result = ValidationEngine.validate(csvWithNegative);
  assert.equal(result.anomaliesCount, 2);
  const types = result.anomalies.map(a => a.type);
  assert.ok(types.includes('NEGATIVE_VALUE_VIOLATION'));
});

// =========================================================================
// REGRESSION TESTS: Schema-Aware Validation & clean_customers_metrics Bug Fix
// =========================================================================

test('ValidationEngine - clean_customers_metrics.csv regression: lifetime_value not treated as date', () => {
  const samplePath = path.resolve(__dirname, '../../sample_data/clean_customers_metrics.csv');
  const csvContent = fs.readFileSync(samplePath, 'utf8');

  const result = ValidationEngine.validate(csvContent);

  // Must have 10 rows and 7 columns
  assert.equal(result.totalRows, 10);
  assert.equal(result.totalColumns, 7);
  assert.deepEqual(result.columns, [
    'customer_id',
    'full_name',
    'email',
    'signup_date',
    'country',
    'lifetime_value',
    'status'
  ]);

  // Zero missing values, zero duplicates
  assert.equal(result.missingValuesTotal, 0);
  assert.equal(result.duplicateRowsCount, 0);

  // Must NOT produce INVALID_DATE_FORMAT for lifetime_value!
  const dateAnomalies = result.anomalies.filter(a => a.type === 'INVALID_DATE_FORMAT');
  assert.equal(dateAnomalies.length, 0, 'No date format anomalies should exist for clean customer metrics');

  // Must produce ZERO anomalies overall
  assert.equal(result.anomaliesCount, 0, 'Clean dataset should have 0 anomalies');

  // signup_date should be classified as business date
  assert.equal(result.columnProfiles.signup_date.type, 'date');
  assert.equal(result.columnProfiles.signup_date.role, 'business_date');

  // lifetime_value should be classified as numeric metric
  assert.equal(result.columnProfiles.lifetime_value.type, 'numeric');
  assert.equal(result.columnProfiles.lifetime_value.role, 'metric');
  assert.equal(result.columnProfiles.lifetime_value.isNonNegative, true);

  // country should be classified as string dimension (not numeric)
  assert.equal(result.columnProfiles.country.type, 'string');
});

test('ValidationEngine - Genuinely invalid date formats in date columns produce descriptive anomalies', () => {
  const csvWithBadDate = `order_id,signup_date,order_amount
ORD-101,2026-10-25,150.00
ORD-102,not_a_valid_date,220.50
ORD-103,1420.50,89.00`;

  const result = ValidationEngine.validate(csvWithBadDate);

  // Rows 2 and 3 have invalid date formats in signup_date
  const badDateAnomalies = result.anomalies.filter(a => a.type === 'INVALID_DATE_FORMAT');
  assert.equal(badDateAnomalies.length, 2);

  // Check that anomaly message explicitly identifies affected column and row number
  assert.equal(badDateAnomalies[0].column, 'signup_date');
  assert.equal(badDateAnomalies[0].row, 2);
  assert.equal(badDateAnomalies[0].value, 'not_a_valid_date');
  assert.ok(badDateAnomalies[0].reason.includes("Invalid date format in column 'signup_date' at row 2"));

  // Pure float in a date column is also caught
  assert.equal(badDateAnomalies[1].column, 'signup_date');
  assert.equal(badDateAnomalies[1].row, 3);
  assert.equal(badDateAnomalies[1].value, '1420.50');
});

test('ValidationEngine - Non-numeric strings in numeric columns produce INVALID_NUMERIC_FORMAT', () => {
  const csvWithBadNumber = `order_id,customer_id,lifetime_value
CUST-1,Alice,1420.50
CUST-2,Bob,corrupted_value
CUST-3,Charlie,890.00`;

  const result = ValidationEngine.validate(csvWithBadNumber);
  const numAnomalies = result.anomalies.filter(a => a.type === 'INVALID_NUMERIC_FORMAT');
  assert.equal(numAnomalies.length, 1);
  assert.equal(numAnomalies[0].column, 'lifetime_value');
  assert.equal(numAnomalies[0].row, 2);
  assert.equal(numAnomalies[0].value, 'corrupted_value');
  assert.ok(numAnomalies[0].reason.includes("Column 'lifetime_value' at row 2 expects a numeric value"));
});

test('ValidationEngine - Test all sample data files produce expected findings', () => {
  const sampleDir = path.resolve(__dirname, '../../sample_data');

  // 1. orders_missing_values.csv
  const orders = fs.readFileSync(path.join(sampleDir, 'orders_missing_values.csv'), 'utf8');
  const ordersResult = ValidationEngine.validate(orders);
  assert.ok(ordersResult.missingValuesTotal >= 6, 'Orders should detect missing values');
  assert.equal(ordersResult.operationalTimestampColumn, 'order_timestamp');

  // 2. inventory_duplicates.csv
  const inventory = fs.readFileSync(path.join(sampleDir, 'inventory_duplicates.csv'), 'utf8');
  const invResult = ValidationEngine.validate(inventory);
  assert.ok(invResult.duplicateRowsCount >= 4, 'Inventory should detect duplicate rows');

  // 3. empty_transactions.csv
  const empty = fs.readFileSync(path.join(sampleDir, 'empty_transactions.csv'), 'utf8');
  const emptyResult = ValidationEngine.validate(empty);
  assert.equal(emptyResult.isEmpty, true, 'Empty transactions file should be detected as empty');

  // 4. telemetry_anomalies.csv
  const telemetry = fs.readFileSync(path.join(sampleDir, 'telemetry_anomalies.csv'), 'utf8');
  const telemResult = ValidationEngine.validate(telemetry);
  const negAnomalies = telemResult.anomalies.filter(a => a.type === 'NEGATIVE_VALUE_VIOLATION');
  assert.equal(negAnomalies.length, 2, 'Telemetry should detect 2 negative latencies');
  assert.equal(negAnomalies[0].column, 'latency_ms');
  assert.equal(negAnomalies[0].row, 2);
  assert.equal(negAnomalies[1].column, 'latency_ms');
  assert.equal(negAnomalies[1].row, 6);
});
