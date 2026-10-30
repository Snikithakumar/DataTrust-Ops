/**
 * DataTrust Ops Deterministic Scoring Engine
 *
 * Overall Quality Score:
 * Q = (0.40 * Completeness) + (0.35 * Uniqueness) + (0.25 * Validity)
 *
 * Freshness is computed and reported strictly separately, distinguishing
 * operational stream timestamps from historical business event dates.
 */
class ScoringEngine {
  /**
   * Compute comprehensive score breakdown from validation result
   * @param {Object} validationResult
   * @param {Object} options
   * @returns {Object} scoreReport
   */
  static calculate(validationResult, options = {}) {
    // 1. Handle empty file edge case
    if (validationResult.isEmpty || validationResult.totalRows === 0) {
      return {
        overallScore: 0,
        breakdown: {
          completeness: 0,
          uniqueness: 0,
          validity: 0
        },
        freshness: {
          score: 0,
          policy: 'EMPTY_DATASET',
          anchorColumn: null,
          latestTimestamp: null,
          lagMinutes: null,
          lagFormatted: 'Empty dataset',
          status: 'STALE',
          message: 'Empty dataset: No freshness data available.'
        },
        grade: 'F',
        status: 'CRITICAL',
        weights: {
          completeness: 0.40,
          uniqueness: 0.35,
          validity: 0.25
        }
      };
    }

    const totalCells = validationResult.totalRows * validationResult.totalColumns;
    const missingCount = validationResult.missingValuesTotal || 0;
    const totalRows = validationResult.totalRows;
    const duplicateCount = validationResult.duplicateRowsCount || 0;
    const anomaliesCount = validationResult.anomaliesCount || 0;

    // 2. Completeness Score (0 - 100)
    // Percentage of cells with valid non-null content
    let completeness = totalCells > 0
      ? Math.max(0, 100 - (missingCount / totalCells) * 100)
      : 0;

    // Check if any entire column is 100% missing (extra penalty)
    const missingByCol = validationResult.missingByColumn || {};
    let completelyBlankColumns = 0;
    Object.values(missingByCol).forEach(c => {
      if (c.percentage === 100) completelyBlankColumns++;
    });
    if (completelyBlankColumns > 0) {
      completeness = Math.max(0, completeness - (completelyBlankColumns * 15));
    }
    completeness = parseFloat(completeness.toFixed(1));

    // 3. Uniqueness Score (0 - 100)
    // Proportion of rows that are not duplicates
    let uniqueness = totalRows > 0
      ? Math.max(0, 100 - (duplicateCount / totalRows) * 100)
      : 0;
    uniqueness = parseFloat(uniqueness.toFixed(1));

    // 4. Validity Score (0 - 100)
    // Starts at 100, reduced by anomalies (5 points per anomaly, capped at 100)
    let validityPenalty = anomaliesCount * 5;
    let validity = Math.max(0, 100 - validityPenalty);
    validity = parseFloat(validity.toFixed(1));

    // 5. Deterministic Overall Quality Score (40/35/25 weighted formula)
    const weightedScore = (0.40 * completeness) + (0.35 * uniqueness) + (0.25 * validity);
    const overallScore = parseFloat(Math.min(100, Math.max(0, weightedScore)).toFixed(1));

    // Analyze Column-Level Defects & Vulnerabilities
    let maxColMissingPct = 0;
    let worstMissingCol = null;

    for (const [col, info] of Object.entries(missingByCol)) {
      if (info && typeof info.percentage === 'number' && info.percentage > maxColMissingPct) {
        maxColMissingPct = info.percentage;
        worstMissingCol = col;
      }
    }

    const duplicationRate = totalRows > 0 ? parseFloat(((duplicateCount / totalRows) * 100).toFixed(1)) : 0;
    const statusReasons = [];

    // Baseline Grade & Quality Status from Mathematical Weighted Score
    let grade = 'A';
    let qualityStatus = 'HEALTHY';

    if (overallScore >= 90) {
      grade = 'A';
      qualityStatus = 'HEALTHY';
    } else if (overallScore >= 75) {
      grade = 'B';
      qualityStatus = 'WARNING';
    } else if (overallScore >= 50) {
      grade = 'C';
      qualityStatus = 'DEGRADED';
    } else if (overallScore >= 25) {
      grade = 'D';
      qualityStatus = 'HIGH_RISK';
    } else {
      grade = 'F';
      qualityStatus = 'CRITICAL';
    }

    // OPERATIONAL CIRCUIT-BREAKER CEILINGS (Floor Rules):
    // Prevents significant single-column corruption or duplicate injection from being masked
    // by 100% scores in other orthogonal dimensions.

    // Rule A: Column-Level Missing Rate Thresholds
    // >= 25% missing in any single column (e.g. 30% null customer_id or order_amount)
    if (maxColMissingPct >= 25) {
      if (grade === 'A' || grade === 'B') {
        grade = 'C';
      }
      qualityStatus = 'DEGRADED';
      statusReasons.push(`Column '${worstMissingCol}' has a severe ${maxColMissingPct}% missing rate (threshold: >=25%).`);
    } else if (maxColMissingPct >= 15) {
      if (grade === 'A') {
        grade = 'B';
      }
      if (qualityStatus === 'HEALTHY') {
        qualityStatus = 'WARNING';
      }
      statusReasons.push(`Column '${worstMissingCol}' has an elevated ${maxColMissingPct}% missing rate (threshold: >=15%).`);
    }

    // Rule B: Duplicate Row Injection Thresholds
    if (duplicationRate >= 20) {
      if (grade === 'A' || grade === 'B') {
        grade = 'C';
      }
      qualityStatus = 'DEGRADED';
      statusReasons.push(`High duplication rate detected (${duplicationRate}% duplicate rows, threshold: >=20%).`);
    } else if (duplicationRate >= 10) {
      if (grade === 'A') {
        grade = 'B';
      }
      if (qualityStatus === 'HEALTHY') {
        qualityStatus = 'WARNING';
      }
      statusReasons.push(`Elevated duplication rate detected (${duplicationRate}% duplicate rows).`);
    }

    // Rule C: Integrity / Range Anomalies
    if (anomaliesCount >= 5 && (grade === 'A' || grade === 'B')) {
      grade = 'C';
      qualityStatus = 'DEGRADED';
      statusReasons.push(`Detected ${anomaliesCount} schema/range anomalies.`);
    }

    // 6. Separate Freshness Calculation with schema & policy awareness
    const freshness = this.calculateFreshness(validationResult, options);

    // 7. Overall Operational Health Status:
    // Combines Data Quality AND Freshness SLA so neither can hide the other!
    let overallStatus = qualityStatus;

    if (freshness.status === 'STALE' && freshness.policy === 'EVENT_TIMESTAMP') {
      // Event stream is critically stale (breached 24h SLA)
      if (overallStatus === 'HEALTHY' || overallStatus === 'WARNING') {
        overallStatus = 'DEGRADED';
      }
      statusReasons.push(`Operational event stream is STALE (${freshness.lagFormatted}, breaching 24h SLA).`);
    } else if (freshness.status === 'DEGRADED' && freshness.policy === 'EVENT_TIMESTAMP') {
      if (overallStatus === 'HEALTHY') {
        overallStatus = 'WARNING';
      }
      statusReasons.push(`Operational event stream is DEGRADED (${freshness.lagFormatted}).`);
    }

    if (statusReasons.length === 0) {
      statusReasons.push('All dimensions and SLA policies are operating within nominal thresholds.');
    }

    return {
      overallScore,
      breakdown: {
        completeness,
        uniqueness,
        validity
      },
      freshness,
      grade,
      status: overallStatus,
      qualityStatus,
      overallStatus,
      statusReasons,
      maxColumnMissingPercentage: maxColMissingPct,
      worstMissingColumn: worstMissingCol,
      duplicationRate,
      weights: {
        completeness: 0.40,
        uniqueness: 0.35,
        validity: 0.25
      }
    };
  }

  /**
   * Compute independent data freshness metrics
   * Distinguishes operational pipeline timestamps from business event dates
   * @param {Object|string|null} validationOrTimestamp
   * @param {Object} options
   * @returns {Object} freshnessMetric
   */
  static calculateFreshness(validationOrTimestamp, options = {}) {
    const maxAcceptableLagMinutes = options.maxAcceptableLagMinutes || (24 * 60); // 24 hours default
    const now = options.referenceTime ? new Date(options.referenceTime).getTime() : Date.now();

    // Backward compatibility: If called directly with a string or null
    if (typeof validationOrTimestamp === 'string' || validationOrTimestamp === null || validationOrTimestamp === undefined) {
      const timestampStr = validationOrTimestamp;
      if (!timestampStr) {
        return {
          score: null,
          policy: 'NOT_APPLICABLE',
          anchorColumn: null,
          latestTimestamp: null,
          lagMinutes: null,
          lagFormatted: 'No timestamp column found',
          status: 'UNKNOWN',
          message: 'Dataset does not contain a recognizable datetime column.'
        };
      }

      const dataTime = new Date(timestampStr).getTime();
      if (isNaN(dataTime)) {
        return {
          score: null,
          policy: 'INVALID_TIMESTAMP',
          anchorColumn: null,
          latestTimestamp: timestampStr,
          lagMinutes: null,
          lagFormatted: 'Invalid date format',
          status: 'UNKNOWN',
          message: 'Could not parse timestamp value.'
        };
      }

      return this.evaluateTimeLag(dataTime, now, maxAcceptableLagMinutes, 'EVENT_TIMESTAMP', 'timestamp', timestampStr);
    }

    const validation = validationOrTimestamp;

    // Handle empty dataset
    if (validation.isEmpty || validation.totalRows === 0) {
      return {
        score: 0,
        policy: 'EMPTY_DATASET',
        anchorColumn: null,
        latestTimestamp: null,
        lagMinutes: null,
        lagFormatted: 'No records',
        status: 'STALE',
        message: 'Empty dataset: No freshness data available.'
      };
    }

    // Case 1: Dataset contains an operational ingestion/event timestamp (e.g. recorded_at, order_timestamp)
    if (validation.operationalTimestamp) {
      const dataTime = new Date(validation.operationalTimestamp).getTime();
      return this.evaluateTimeLag(
        dataTime,
        now,
        maxAcceptableLagMinutes,
        'EVENT_TIMESTAMP',
        validation.operationalTimestampColumn || 'operational_timestamp',
        validation.operationalTimestamp
      );
    }

    // Case 2: Dataset is a batch snapshot or dimension table containing only business event dates (e.g. signup_date)
    // Pipeline freshness is governed by the ingestion/sync timestamp of the batch run if available
    const ingestionTimestamp = options.ingestionTimestamp !== undefined
      ? options.ingestionTimestamp
      : (options.scanTime || new Date(now).toISOString());

    if (ingestionTimestamp) {
      const ingestTime = new Date(ingestionTimestamp).getTime();
      const excludedBusinessCols = validation.businessDateColumns || [];
      const note = excludedBusinessCols.length > 0
        ? ` Business attribute dates (${excludedBusinessCols.join(', ')}) are excluded from pipeline freshness SLA.`
        : '';

      const report = this.evaluateTimeLag(
        ingestTime,
        now,
        maxAcceptableLagMinutes,
        'BATCH_INGESTION_METADATA',
        'ingestionTimestamp (batch sync)',
        ingestionTimestamp
      );

      report.message = `Freshness evaluated from pipeline batch ingestion sync. Lag: ${report.lagFormatted}. Freshness score: ${report.score}%.${note}`;
      return report;
    }

    // Case 3: Missing timestamps explicitly handled
    return {
      score: null,
      policy: 'NOT_APPLICABLE',
      anchorColumn: null,
      latestTimestamp: null,
      lagMinutes: null,
      lagFormatted: 'No timestamp available',
      status: 'NOT_APPLICABLE',
      message: 'Dataset contains no operational timestamp column or ingestion metadata. Freshness SLA is not applicable.'
    };
  }

  /**
   * Helper to compute lag and status from timestamp
   */
  static evaluateTimeLag(dataTime, now, maxAcceptableLagMinutes, policy, anchorColumn, latestTimestamp) {
    const diffMs = Math.max(0, now - dataTime);
    const lagMinutes = Math.floor(diffMs / (1000 * 60));
    const lagHours = parseFloat((lagMinutes / 60).toFixed(1));

    const scoreRaw = Math.max(0, 100 - (lagMinutes / maxAcceptableLagMinutes) * 100);
    const score = parseFloat(Math.min(100, scoreRaw).toFixed(1));

    let status = 'PRISTINE';
    let lagFormatted = `${lagMinutes} min ago`;

    if (lagMinutes < 15) {
      status = 'PRISTINE';
      lagFormatted = `${lagMinutes} min ago (Realtime)`;
    } else if (lagMinutes <= 120) {
      status = 'ACCEPTABLE';
      lagFormatted = `${lagMinutes} min ago (Batch SLA)`;
    } else if (lagHours <= 24) {
      status = 'DEGRADED';
      lagFormatted = `${lagHours} hours ago`;
    } else {
      const days = parseFloat((lagHours / 24).toFixed(1));
      status = 'STALE';
      lagFormatted = `${days} days ago`;
    }

    return {
      score,
      policy,
      anchorColumn,
      latestTimestamp,
      lagMinutes,
      lagFormatted,
      status,
      message: `Data is ${lagFormatted}. Freshness score: ${score}% (Policy: ${policy})`
    };
  }
}

module.exports = ScoringEngine;
