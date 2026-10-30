const Papa = require('papaparse');

/**
 * DataTrust Ops Validation Engine
 *
 * Performs deterministic, schema-aware validation against CSV content using Papa Parse.
 * Differentiates operational ingestion timestamps from business attribute dates,
 * and enforces numeric/range constraints on metrics without confusing them with dates.
 */
class ValidationEngine {
  /**
   * Classify column schema and validation rules
   * @param {string} colName
   * @param {Object} options
   * @returns {Object} columnProfile
   */
  static inferColumnProfile(colName, options = {}) {
    const col = String(colName || '').trim();
    const colLower = col.toLowerCase();
    const schema = options.schema || {};

    // 1. Explicit schema overrides from options
    if (schema.dateColumns && schema.dateColumns.includes(col)) {
      const isOp = schema.operationalTimestampColumns
        ? schema.operationalTimestampColumns.includes(col)
        : this.isOperationalTimestampName(colLower);
      return { type: 'date', role: isOp ? 'operational_timestamp' : 'business_date', isOperational: isOp };
    }

    if (schema.numericColumns && schema.numericColumns.includes(col)) {
      const isNonNeg = schema.nonNegativeColumns
        ? schema.nonNegativeColumns.includes(col)
        : this.isNonNegativeName(colLower);
      return { type: 'numeric', role: 'metric', isNonNegative: isNonNeg };
    }

    // 2. Explicit exclusions: Column names containing metric/duration tokens
    // NEVER treat columns like lifetime_value, latency_ms, duration, uptime as dates
    if (/lifetime|runtime|uptime|time_spent|duration|latency/i.test(colLower)) {
      return {
        type: 'numeric',
        role: 'metric',
        isNonNegative: this.isNonNegativeName(colLower)
      };
    }

    // 3. Operational pipeline event timestamps (e.g. order_timestamp, recorded_at, created_at, updated_at)
    if (this.isOperationalTimestampName(colLower)) {
      return {
        type: 'date',
        role: 'operational_timestamp',
        isOperational: true
      };
    }

    // 4. Business event / entity attribute dates (e.g. signup_date, last_audit_date, birth_date)
    if (this.isBusinessDateName(colLower)) {
      return {
        type: 'date',
        role: 'business_date',
        isOperational: false
      };
    }

    // 5. Numeric domain attributes (e.g. unit_price, order_amount, quantity, reading_value, stock)
    if (this.isNumericName(colLower)) {
      return {
        type: 'numeric',
        role: 'metric',
        isNonNegative: this.isNonNegativeName(colLower)
      };
    }

    // Default to general string/dimension
    return {
      type: 'string',
      role: 'dimension'
    };
  }

  static isOperationalTimestampName(c) {
    if (/order_timestamp|recorded_at|created_at|updated_at|ingested_at|loaded_at|synced_at|event_time|event_timestamp/i.test(c)) {
      return true;
    }
    return c === 'timestamp' || c === 'datetime';
  }

  static isBusinessDateName(c) {
    if (/signup_date|order_date|audit_date|last_audit_date|birth_date|hire_date|due_date|expiration_date|release_date/i.test(c)) {
      return true;
    }
    // Suffix with _date or prefix with date_ or exact word date
    return /(_date$|^date_|^date$)/i.test(c);
  }

  static isNumericName(c) {
    return /(^|_)(price|amount|cost|fee|quantity|stock|count|latency|reading|size_kb|payload_size|bytes|value|ltv|balance|score|rate)($|_)/i.test(c);
  }

  static isNonNegativeName(c) {
    return /(^|_)(price|amount|cost|fee|quantity|stock|count|latency|size|bytes|value|ltv|balance|reading)($|_)/i.test(c);
  }

  /**
   * Parse and validate raw CSV string or Buffer
   * @param {string|Buffer} csvContent
   * @param {Object} options
   * @returns {Object} validationResult
   */
  static validate(csvContent, options = {}) {
    const rawString = Buffer.isBuffer(csvContent)
      ? csvContent.toString('utf-8')
      : String(csvContent || '');

    // 1. Check for completely empty payload
    if (!rawString || rawString.trim().length === 0) {
      return {
        isEmpty: true,
        totalRows: 0,
        totalColumns: 0,
        columns: [],
        columnProfiles: {},
        missingValuesTotal: 0,
        missingByColumn: {},
        duplicateRowsCount: 0,
        duplicateRowIndices: [],
        anomaliesCount: 1,
        anomalies: [{
          type: 'EMPTY_FILE',
          column: 'ALL',
          row: 0,
          value: '',
          reason: 'Uploaded dataset is empty (0 bytes or blank content).'
        }],
        operationalTimestamp: null,
        operationalTimestampColumn: null,
        businessDateColumns: [],
        latestTimestamp: null,
        rows: []
      };
    }

    // 2. Parse CSV with Papa Parse
    const parsed = Papa.parse(rawString, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false
    });

    const columns = parsed.meta.fields || [];
    const rows = parsed.data || [];

    // Check if file only had headers or no rows
    if (columns.length === 0 || rows.length === 0) {
      return {
        isEmpty: true,
        totalRows: 0,
        totalColumns: columns.length,
        columns,
        columnProfiles: {},
        missingValuesTotal: 0,
        missingByColumn: {},
        duplicateRowsCount: 0,
        duplicateRowIndices: [],
        anomaliesCount: 1,
        anomalies: [{
          type: 'NO_DATA_ROWS',
          column: 'ALL',
          row: 0,
          value: '',
          reason: 'File contains headers but no data records were found.'
        }],
        operationalTimestamp: null,
        operationalTimestampColumn: null,
        businessDateColumns: [],
        latestTimestamp: null,
        rows: []
      };
    }

    const totalRows = rows.length;
    const totalColumns = columns.length;

    // Profile all columns in advance
    const columnProfiles = {};
    columns.forEach(col => {
      columnProfiles[col] = this.inferColumnProfile(col, options);
    });

    // 3. Missing Value Detection
    const missingByColumn = {};
    columns.forEach(col => {
      missingByColumn[col] = { count: 0, percentage: 0 };
    });

    let missingValuesTotal = 0;
    const nullIndicators = new Set(['', 'null', 'nan', 'n/a', 'undefined', 'nil', '-']);

    rows.forEach(row => {
      columns.forEach(col => {
        const val = row[col];
        const isMissing = val === null ||
          val === undefined ||
          (typeof val === 'string' && nullIndicators.has(val.trim().toLowerCase()));

        if (isMissing) {
          missingValuesTotal++;
          missingByColumn[col].count++;
        }
      });
    });

    columns.forEach(col => {
      missingByColumn[col].percentage = parseFloat(
        ((missingByColumn[col].count / totalRows) * 100).toFixed(2)
      );
    });

    // 4. Duplicate Rows Detection
    const seenRowSignatures = new Map();
    const duplicateRowIndices = [];

    rows.forEach((row, index) => {
      // Serialize normalized row values
      const sig = columns.map(col => String(row[col] ?? '').trim().toLowerCase()).join('||');
      if (seenRowSignatures.has(sig)) {
        duplicateRowIndices.push(index + 1); // 1-based index for user readability
      } else {
        seenRowSignatures.set(sig, index + 1);
      }
    });

    const duplicateRowsCount = duplicateRowIndices.length;

    // 5. Schema-Aware Value Anomalies & Structural Integrity Checks
    const anomalies = [];
    let latestOperationalDate = null;
    let operationalTimestampCol = null;
    let latestBusinessDate = null;
    const businessDateCols = [];

    // Recognized date string format pattern (e.g. YYYY-MM-DD or ISO 8601 YYYY-MM-DDTHH:mm:ssZ)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}([T\s]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
    const slashDatePattern = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}([T\s]\d{2}:\d{2}(:\d{2})?)?$/;

    rows.forEach((row, idx) => {
      const rowNum = idx + 1;

      columns.forEach(col => {
        const val = row[col];
        if (val === null || val === undefined || val === '') return;

        const profile = columnProfiles[col];
        const valStr = String(val).trim();

        // 5A. Numeric Validation (Only applied to numeric/metric columns)
        if (profile.type === 'numeric') {
          const num = Number(valStr);
          if (isNaN(num)) {
            anomalies.push({
              type: 'INVALID_NUMERIC_FORMAT',
              column: col,
              row: rowNum,
              value: valStr,
              reason: `Column '${col}' at row ${rowNum} expects a numeric value, but received '${valStr}'.`
            });
          } else if (profile.isNonNegative && num < 0) {
            anomalies.push({
              type: 'NEGATIVE_VALUE_VIOLATION',
              column: col,
              row: rowNum,
              value: valStr,
              reason: `Column '${col}' at row ${rowNum} must be non-negative, but contains negative value (${valStr}).`
            });
          }
        }

        // 5B. Date Validation (ONLY applied to columns configured/classified as dates)
        // Rule: Never infer that every numeric-looking value is a date
        if (profile.type === 'date') {
          // Explicit guard: Pure numbers with decimals or simple integers (e.g. 1420.50) are not dates
          const isPureNumber = /^-?\d+(\.\d+)?$/.test(valStr);
          const hasDateFormat = isoDatePattern.test(valStr) || slashDatePattern.test(valStr);
          const parsedTime = Date.parse(valStr);

          if (isPureNumber || !hasDateFormat || isNaN(parsedTime)) {
            anomalies.push({
              type: 'INVALID_DATE_FORMAT',
              column: col,
              row: rowNum,
              value: valStr,
              reason: `Invalid date format in column '${col}' at row ${rowNum}: '${valStr}'. Expected valid ISO-8601 date or datetime format (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ).`
            });
          } else {
            const parsedDate = new Date(parsedTime);

            if (profile.isOperational) {
              if (!latestOperationalDate || parsedDate > latestOperationalDate) {
                latestOperationalDate = parsedDate;
                operationalTimestampCol = col;
              }
            } else {
              if (!latestBusinessDate || parsedDate > latestBusinessDate) {
                latestBusinessDate = parsedDate;
              }
              if (!businessDateCols.includes(col)) {
                businessDateCols.push(col);
              }
            }
          }
        }
      });
    });

    return {
      isEmpty: false,
      totalRows,
      totalColumns,
      columns,
      columnProfiles,
      missingValuesTotal,
      missingByColumn,
      duplicateRowsCount,
      duplicateRowIndices,
      anomaliesCount: anomalies.length,
      anomalies: anomalies.slice(0, 50), // Cap at 50 to avoid bloated payloads
      operationalTimestamp: latestOperationalDate ? latestOperationalDate.toISOString() : null,
      operationalTimestampColumn: operationalTimestampCol,
      businessDateColumns: businessDateCols,
      latestBusinessDate: latestBusinessDate ? latestBusinessDate.toISOString() : null,
      latestTimestamp: latestOperationalDate ? latestOperationalDate.toISOString() : null,
      rows: rows.slice(0, 100) // Preview top 100
    };
  }
}

module.exports = ValidationEngine;
