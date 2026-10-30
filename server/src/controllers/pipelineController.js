const Pipeline = require('../models/Pipeline');
const Incident = require('../models/Incident');
const { isDBConnected } = require('../config/db');
const { inMemoryStore } = require('../services/seedService');

/**
 * GET /api/pipelines
 */
const getPipelines = async (req, res, next) => {
  try {
    if (isDBConnected()) {
      const pipelines = await Pipeline.find().sort({ updatedAt: -1 });
      return res.status(200).json({
        success: true,
        data: pipelines,
        persistedToDB: true,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    return res.status(200).json({
      success: true,
      data: inMemoryStore.pipelines,
      persistedToDB: false,
      notice: 'Operating in simulated in-memory state. Connect MongoDB to persist updates.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pipelines/run
 * Body: { pipelineId?: string, name?: string, simulateFailure?: boolean }
 */
const runPipeline = async (req, res, next) => {
  try {
    const { pipelineId, name, simulateFailure = false } = req.body;

    if (!pipelineId && !name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAM',
          message: 'Either pipelineId or name must be provided to run a pipeline.'
        },
        timestamp: new Date().toISOString()
      });
    }

    let pipeline = null;
    const dbActive = isDBConnected();

    if (dbActive) {
      if (pipelineId) {
        pipeline = await Pipeline.findById(pipelineId);
      } else if (name) {
        pipeline = await Pipeline.findOne({ name });
      }
    } else {
      pipeline = inMemoryStore.pipelines.find(p =>
        (p._id && p._id.toString() === pipelineId) || p.name === name
      );
    }

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Pipeline '${pipelineId || name}' was not found.`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Execute simulated run
    const durationMs = Math.floor(Math.random() * 2000) + 700;
    const runId = `RUN-${Math.floor(1000 + Math.random() * 9000)}`;
    const recordsProcessed = Math.floor(Math.random() * 8000) + 1200;

    const isFailure = simulateFailure || (pipeline.name.includes('Balances') && Math.random() > 0.4);
    const runStatus = isFailure ? 'FAILED' : 'SUCCESS';
    const qualityScore = isFailure
      ? parseFloat((Math.random() * 30 + 40).toFixed(1))
      : parseFloat((Math.random() * 10 + 90).toFixed(1));

    const logs = [
      `[${new Date().toISOString()}] Starting simulated execution of '${pipeline.name}'`,
      `[INFO] Ingestion source connection verified: ${pipeline.sourceDataset}`,
      `[INFO] Extracted ${recordsProcessed.toLocaleString()} records from batch staging`,
      isFailure
        ? `[ERROR] Data validation gate halted pipeline: Quality score (${qualityScore}%) fell below enterprise SLA threshold (75%)`
        : `[INFO] Papa Parse schema validation succeeded: 100% compliant`,
      isFailure
        ? `[FATAL] Pipeline halted: Ingestion quarantine triggered`
        : `[SUCCESS] Loaded records into destination: ${pipeline.targetDestination}`
    ];

    const runRecord = {
      runId,
      triggeredAt: new Date(),
      durationMs,
      status: runStatus,
      recordsProcessed,
      qualityScore,
      errorMessage: isFailure ? `Data quality score ${qualityScore}% breached threshold` : null,
      logs
    };

    // If failure, create an incident
    let createdIncident = null;
    if (isFailure) {
      const incidentData = {
        title: `Pipeline Execution Failure: ${pipeline.name}`,
        severity: qualityScore < 50 ? 'CRITICAL' : 'HIGH',
        status: 'OPEN',
        sourceType: 'PIPELINE_EXECUTION',
        sourcePipeline: pipeline.name,
        datasetName: pipeline.sourceDataset,
        summary: `Simulated run ${runId} failed due to data quality degradation (${qualityScore}%).`,
        details: {
          qualityScore,
          missingPercentage: parseFloat((100 - qualityScore).toFixed(1)),
          duplicatesCount: isFailure ? Math.floor(Math.random() * 5) + 1 : 0,
          failedStage: 'VALIDATION_GATE',
          errorLog: `Quality score ${qualityScore}% breached threshold during run ${runId}`
        },
        aiExplanation: {
          provider: 'DETERMINISTIC_FALLBACK',
          generatedAt: new Date(),
          rootCause: `Deterministic Findings: Quality score (${qualityScore}%) dropped below tolerance during '${pipeline.name}' batch run ${runId}. Ingestion quarantine triggered.`,
          impactSummary: `Destination '${pipeline.targetDestination}' did not receive batch update. Downstream reporting models will experience staleness until resolved.`,
          affectedDownstream: ['Warehouse Aggregators', 'Executive KPI Reports'],
          recommendedFixes: [
            'Inspect source bucket for schema modifications or missing fields',
            'Review quarantine table for failed records',
            'Trigger rerun once upstream producer verifies batch structure'
          ]
        },
        simulated: true
      };

      if (dbActive) {
        createdIncident = await Incident.create(incidentData);
      } else {
        incidentData._id = `inc_${Date.now()}`;
        incidentData.createdAt = new Date();
        incidentData.updatedAt = new Date();
        inMemoryStore.incidents.unshift(incidentData);
        createdIncident = incidentData;
      }
    }

    // Update pipeline object
    if (dbActive) {
      pipeline.lastRunAt = new Date();
      pipeline.lastDurationMs = durationMs;
      pipeline.status = isFailure ? 'FAILED' : 'HEALTHY';
      pipeline.totalRuns = (pipeline.totalRuns || 0) + 1;
      if (isFailure) pipeline.failedRuns = (pipeline.failedRuns || 0) + 1;
      pipeline.executionHistory.unshift(runRecord);
      if (pipeline.executionHistory.length > 20) pipeline.executionHistory.pop();
      await pipeline.save();
    } else {
      pipeline.lastRunAt = new Date();
      pipeline.lastDurationMs = durationMs;
      pipeline.status = isFailure ? 'FAILED' : 'HEALTHY';
      pipeline.totalRuns = (pipeline.totalRuns || 0) + 1;
      if (isFailure) pipeline.failedRuns = (pipeline.failedRuns || 0) + 1;
      pipeline.executionHistory = pipeline.executionHistory || [];
      pipeline.executionHistory.unshift(runRecord);
      if (pipeline.executionHistory.length > 20) pipeline.executionHistory.pop();
    }

    return res.status(200).json({
      success: true,
      message: `Pipeline '${pipeline.name}' execution finished with status: ${runStatus}`,
      data: {
        run: runRecord,
        pipeline: {
          id: pipeline._id,
          name: pipeline.name,
          status: pipeline.status,
          totalRuns: pipeline.totalRuns,
          failedRuns: pipeline.failedRuns
        },
        incidentCreated: isFailure,
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
  getPipelines,
  runPipeline
};
