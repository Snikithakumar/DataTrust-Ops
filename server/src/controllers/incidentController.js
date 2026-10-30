const Incident = require('../models/Incident');
const AIService = require('../services/aiService');
const { isDBConnected } = require('../config/db');
const { inMemoryStore } = require('../services/seedService');

/**
 * GET /api/incidents
 */
const getIncidents = async (req, res, next) => {
  try {
    const { status, severity } = req.query;
    const filter = {};
    if (status) filter.status = status.toUpperCase();
    if (severity) filter.severity = severity.toUpperCase();

    if (isDBConnected()) {
      const incidents = await Incident.find(filter).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        data: incidents,
        persistedToDB: true,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    let list = inMemoryStore.incidents;
    if (status) list = list.filter(i => i.status === status.toUpperCase());
    if (severity) list = list.filter(i => i.severity === severity.toUpperCase());

    return res.status(200).json({
      success: true,
      data: list,
      persistedToDB: false,
      notice: 'Operating in simulated in-memory state. Connect MongoDB to persist updates.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/incidents/:id
 * Body: { status, resolutionNotes }
 */
const updateIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    const allowedStatuses = ['OPEN', 'INVESTIGATING', 'RESOLVED'];
    if (status && !allowedStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Invalid status '${status}'. Must be one of: ${allowedStatuses.join(', ')}`
        },
        timestamp: new Date().toISOString()
      });
    }

    const dbActive = isDBConnected();

    if (dbActive) {
      const incident = await Incident.findById(id);
      if (!incident) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'INCIDENT_NOT_FOUND',
            message: `Incident with ID '${id}' not found.`
          },
          timestamp: new Date().toISOString()
        });
      }

      if (status) {
        incident.status = status.toUpperCase();
        if (incident.status === 'RESOLVED') {
          incident.resolvedAt = new Date();
        } else {
          incident.resolvedAt = null;
        }
      }

      if (resolutionNotes !== undefined) {
        incident.resolutionNotes = resolutionNotes;
      }

      await incident.save();

      return res.status(200).json({
        success: true,
        message: `Incident '${incident.title}' updated to ${incident.status}`,
        data: incident,
        persistedToDB: true,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const incident = inMemoryStore.incidents.find(i =>
      (i._id && i._id.toString() === id) || i.title === id
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INCIDENT_NOT_FOUND',
          message: `Incident with ID '${id}' not found in in-memory store.`
        },
        timestamp: new Date().toISOString()
      });
    }

    if (status) {
      incident.status = status.toUpperCase();
      incident.resolvedAt = incident.status === 'RESOLVED' ? new Date() : null;
    }

    if (resolutionNotes !== undefined) {
      incident.resolutionNotes = resolutionNotes;
    }
    incident.updatedAt = new Date();

    return res.status(200).json({
      success: true,
      message: `Incident updated to ${incident.status} (in-memory mode)`,
      data: incident,
      persistedToDB: false,
      notice: 'Operating in simulated in-memory state. Connect MongoDB to persist updates.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/incidents/:id/explain
 * Generates AI or deterministic root cause explanation
 */
const explainIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dbActive = isDBConnected();

    let incident = null;
    if (dbActive) {
      incident = await Incident.findById(id);
    } else {
      incident = inMemoryStore.incidents.find(i =>
        (i._id && i._id.toString() === id) || i.title === id
      );
    }

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INCIDENT_NOT_FOUND',
          message: `Incident '${id}' not found.`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Prepare findings context from incident details
    const findingsContext = {
      datasetName: incident.datasetName,
      totalRows: incident.details?.totalRows || 10,
      missingByColumn: incident.details?.missingPercentage
        ? { primary_keys: { count: Math.ceil(incident.details.missingPercentage / 10), percentage: incident.details.missingPercentage } }
        : {},
      duplicateRowsCount: incident.details?.duplicatesCount || 0,
      anomaliesCount: 0
    };

    // Invoke AI service with guaranteed fallback
    const explanation = await AIService.explainIncident(incident, findingsContext);

    // Save explanation to incident
    incident.aiExplanation = explanation;

    if (dbActive) {
      await incident.save();
    } else {
      incident.updatedAt = new Date();
    }

    return res.status(200).json({
      success: true,
      message: `Root-cause analysis generated via ${explanation.provider}`,
      data: {
        incidentId: incident._id,
        title: incident.title,
        severity: incident.severity,
        explanation
      },
      persistedToDB: dbActive,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getIncidents,
  updateIncident,
  explainIncident
};
