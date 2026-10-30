const ValidationEngine = require('../services/validationEngine');
const ScoringEngine = require('../services/scoringEngine');
const AIService = require('../services/aiService');
const QualityScan = require('../models/QualityScan');
const Incident = require('../models/Incident');
const { isDBConnected } = require('../config/db');
const { inMemoryStore } = require('../services/seedService');

/**
 * POST /api/quality/scan
 * Accepts multipart file or JSON { csvData, datasetName }
 */
const scanQuality = async (req, res, next) => {
  try {
    let csvContent = null;
    let datasetName = 'manual_scan.csv';
    let fileSize = 0;

    if (req.file) {
      csvContent = req.file.buffer;
      datasetName = req.file.originalname || 'uploaded_dataset.csv';
      fileSize = req.file.size;
    } else if (req.body && req.body.csvData) {
      csvContent = req.body.csvData;
      datasetName = req.body.datasetName || 'sample_data.csv';
      fileSize = Buffer.byteLength(csvContent, 'utf-8');
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_DATA_PROVIDED',
          message: 'Please upload a CSV file or provide csvData string in the request body.'
        },
        timestamp: new Date().toISOString()
      });
    }

    const options = {
      datasetName,
      schema: req.body && typeof req.body === 'object' ? req.body.schema : undefined,
      freshnessPolicy: req.body && typeof req.body === 'object' ? req.body.freshnessPolicy : undefined,
      ingestionTimestamp: (req.body && req.body.ingestionTimestamp) || new Date().toISOString()
    };

    // 1. Run schema-aware deterministic validation engine
    const validationResult = ValidationEngine.validate(csvContent, options);

    // 2. Compute deterministic quality scores and decoupled freshness
    const scoreReport = ScoringEngine.calculate(validationResult, options);

    const dbActive = isDBConnected();
    let createdIncident = null;

    // 3. Operational Incident Triggering Rules:
    // Triggers when overallScore < 75, or empty file, OR when circuit breakers detect:
    // - Significant column-level missing rate (>= 20%)
    // - Duplication rate >= 20%
    // - Critical freshness failure (STALE on operational event stream)
    // - Overall operational status is DEGRADED or CRITICAL
    const isDegradedOrCritical = scoreReport.status === 'DEGRADED' || scoreReport.status === 'CRITICAL';
    const isColumnMissingBreached = scoreReport.maxColumnMissingPercentage >= 20;
    const isFreshnessStale = scoreReport.freshness?.status === 'STALE' && scoreReport.freshness?.policy === 'EVENT_TIMESTAMP';
    const isDuplicationBreached = scoreReport.duplicationRate >= 20;

    const shouldTriggerIncident = validationResult.isEmpty ||
      scoreReport.overallScore < 75 ||
      isDegradedOrCritical ||
      isColumnMissingBreached ||
      isFreshnessStale ||
      isDuplicationBreached;

    if (shouldTriggerIncident) {
      let severity = 'MEDIUM';
      if (validationResult.isEmpty || scoreReport.overallScore < 25 || (isDegradedOrCritical && isFreshnessStale)) {
        severity = 'CRITICAL';
      } else if (scoreReport.overallScore < 50 || isColumnMissingBreached || isFreshnessStale || isDuplicationBreached) {
        severity = 'HIGH';
      }

      let incidentTitle = `Data Quality Alert (${scoreReport.overallScore}%): ${datasetName}`;
      if (validationResult.isEmpty) {
        incidentTitle = `Zero-Byte/Empty File Detected: ${datasetName}`;
      } else if (isColumnMissingBreached && isFreshnessStale) {
        incidentTitle = `Data Reliability Alert: High Null Rate & Stale Stream in ${datasetName}`;
      } else if (isColumnMissingBreached) {
        incidentTitle = `Data Quality Alert: High Missing Rate (${scoreReport.maxColumnMissingPercentage}%) in '${scoreReport.worstMissingColumn}' - ${datasetName}`;
      } else if (isFreshnessStale) {
        incidentTitle = `Freshness SLA Breach: Event Stream is STALE in ${datasetName}`;
      } else if (isDuplicationBreached) {
        incidentTitle = `Uniqueness Alert: High Duplicate Rows (${scoreReport.duplicationRate}%) in ${datasetName}`;
      }

      const reasonsText = scoreReport.statusReasons?.length > 0 ? scoreReport.statusReasons.join(' ') : '';
      const incidentSummary = validationResult.isEmpty
        ? `Ingestion validation halted: Dataset '${datasetName}' contains 0 readable data records.`
        : `Dataset status '${scoreReport.status}' (Score: ${scoreReport.overallScore}%, Grade ${scoreReport.grade}). Missing: ${validationResult.missingValuesTotal} cells, Duplicates: ${validationResult.duplicateRowsCount} rows, Anomalies: ${validationResult.anomaliesCount}. ${reasonsText}`;

      // Build preliminary AI explanation
      const preliminaryFindings = {
        datasetName,
        totalRows: validationResult.totalRows,
        missingByColumn: validationResult.missingByColumn,
        duplicateRowsCount: validationResult.duplicateRowsCount,
        anomaliesCount: validationResult.anomaliesCount
      };

      const explanation = await AIService.explainIncident(
        { title: incidentTitle, datasetName, details: { qualityScore: scoreReport.overallScore, failedStage: 'QUALITY_GATE' } },
        preliminaryFindings
      );

      const incidentRecord = {
        title: incidentTitle,
        severity,
        status: 'OPEN',
        sourceType: 'QUALITY_CHECK',
        datasetName,
        summary: incidentSummary,
        details: {
          qualityScore: scoreReport.overallScore,
          missingPercentage: parseFloat((100 - scoreReport.breakdown.completeness).toFixed(1)),
          duplicatesCount: validationResult.duplicateRowsCount,
          failedStage: 'QUALITY_GATE',
          errorLog: `Validation rule breaches: ${validationResult.anomalies.map(a => a.reason).join('; ') || 'Threshold breach'}`
        },
        aiExplanation: explanation,
        simulated: true
      };

      if (dbActive) {
        createdIncident = await Incident.create(incidentRecord);
      } else {
        incidentRecord._id = `inc_${Date.now()}`;
        incidentRecord.createdAt = new Date();
        incidentRecord.updatedAt = new Date();
        inMemoryStore.incidents.unshift(incidentRecord);
        createdIncident = incidentRecord;
      }
    }

    // 4. Save scan record
    const scanData = {
      datasetName,
      fileSize,
      totalRows: validationResult.totalRows,
      totalColumns: validationResult.totalColumns,
      columns: validationResult.columns,
      score: scoreReport.overallScore,
      grade: scoreReport.grade,
      status: scoreReport.status,
      qualityStatus: scoreReport.qualityStatus,
      statusReasons: scoreReport.statusReasons,
      breakdown: scoreReport.breakdown,
      freshness: scoreReport.freshness,
      findings: {
        emptyFile: validationResult.isEmpty,
        missingValuesTotal: validationResult.missingValuesTotal,
        missingByColumn: validationResult.missingByColumn,
        duplicateRowsCount: validationResult.duplicateRowsCount,
        duplicateRowIndices: validationResult.duplicateRowIndices,
        anomaliesCount: validationResult.anomaliesCount,
        anomalies: validationResult.anomalies
      },
      incidentId: createdIncident ? createdIncident._id : null,
      simulated: true
    };

    let persistedScan = null;
    if (dbActive) {
      persistedScan = await QualityScan.create(scanData);
    } else {
      scanData._id = `scan_${Date.now()}`;
      scanData.createdAt = new Date();
      inMemoryStore.scans.unshift(scanData);
      persistedScan = scanData;
    }

    return res.status(200).json({
      success: true,
      message: `Quality scan for '${datasetName}' completed with score ${scoreReport.overallScore}%`,
      data: {
        scanId: persistedScan._id,
        datasetName,
        fileSize,
        totalRows: validationResult.totalRows,
        totalColumns: validationResult.totalColumns,
        columns: validationResult.columns,
        score: scoreReport.overallScore,
        grade: scoreReport.grade,
        status: scoreReport.status,
        qualityStatus: scoreReport.qualityStatus,
        overallStatus: scoreReport.overallStatus,
        statusReasons: scoreReport.statusReasons,
        breakdown: scoreReport.breakdown,
        freshness: scoreReport.freshness,
        findings: {
          emptyFile: validationResult.isEmpty,
          missingValuesTotal: validationResult.missingValuesTotal,
          missingByColumn: validationResult.missingByColumn,
          duplicateRowsCount: validationResult.duplicateRowsCount,
          duplicateRowIndices: validationResult.duplicateRowIndices,
          anomaliesCount: validationResult.anomaliesCount,
          anomalies: validationResult.anomalies
        },
        previewRows: validationResult.rows ? validationResult.rows.slice(0, 10) : [],
        incidentCreated: Boolean(createdIncident),
        incident: createdIncident
      },
      persistedToDB: dbActive,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  scanQuality
};
