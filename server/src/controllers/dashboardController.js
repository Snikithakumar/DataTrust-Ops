const Pipeline = require('../models/Pipeline');
const Incident = require('../models/Incident');
const QualityScan = require('../models/QualityScan');
const { isDBConnected } = require('../config/db');
const { inMemoryStore } = require('../services/seedService');

/**
 * GET /api/dashboard
 */
const getDashboardOverview = async (req, res, next) => {
  try {
    const dbActive = isDBConnected();

    let pipelines = [];
    let incidents = [];
    let scans = [];

    if (dbActive) {
      pipelines = await Pipeline.find().sort({ updatedAt: -1 }).limit(10);
      incidents = await Incident.find().sort({ createdAt: -1 }).limit(10);
      scans = await QualityScan.find().sort({ createdAt: -1 }).limit(10);
    } else {
      pipelines = inMemoryStore.pipelines;
      incidents = inMemoryStore.incidents;
      scans = inMemoryStore.scans;
    }

    // 1. Calculate Active and Critical Incidents
    const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
    const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED');

    // 2. Calculate Pipeline Health Stats
    const totalPipelines = pipelines.length;
    const healthyPipelines = pipelines.filter(p => p.status === 'HEALTHY').length;
    const degradedPipelines = pipelines.filter(p => p.status === 'DEGRADED').length;
    const failedPipelines = pipelines.filter(p => p.status === 'FAILED').length;

    // 3. Compute Aggregated Reliability Score
    // Blend latest scan scores and pipeline quality scores
    const qualityScores = [];
    scans.forEach(s => {
      if (typeof s.score === 'number') qualityScores.push(s.score);
    });
    pipelines.forEach(p => {
      (p.executionHistory || []).forEach(run => {
        if (typeof run.qualityScore === 'number') qualityScores.push(run.qualityScore);
      });
    });

    const overallHealthScore = qualityScores.length > 0
      ? parseFloat((qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1))
      : 89.4;

    let completenessSum = 0;
    let uniquenessSum = 0;
    let validitySum = 0;
    let breakdownCount = 0;
    scans.forEach(s => {
      if (s.breakdown) {
        completenessSum += s.breakdown.completeness || 0;
        uniquenessSum += s.breakdown.uniqueness || 0;
        validitySum += s.breakdown.validity || 0;
        breakdownCount++;
      }
    });

    const qualityBreakdown = breakdownCount > 0
      ? {
          completeness: parseFloat((completenessSum / breakdownCount).toFixed(1)),
          uniqueness: parseFloat((uniquenessSum / breakdownCount).toFixed(1)),
          validity: parseFloat((validitySum / breakdownCount).toFixed(1))
        }
      : {
          completeness: 94.0,
          uniqueness: 96.5,
          validity: 92.0
        };

    // 4. Calculate Freshness Metric (Independent)
    let latestDatasetTime = null;
    let newestDateObj = null;

    // Find newest timestamp from scans
    scans.forEach(s => {
      if (s.freshness && s.freshness.latestTimestamp) {
        const d = new Date(s.freshness.latestTimestamp);
        if (!isNaN(d.getTime()) && (!newestDateObj || d > newestDateObj)) {
          newestDateObj = d;
          latestDatasetTime = s.freshness.latestTimestamp;
        }
      }
    });

    // Default to recent simulated pipeline run if no scans uploaded
    if (!newestDateObj) {
      newestDateObj = new Date(Date.now() - 18 * 60 * 1000); // 18 mins ago
      latestDatasetTime = newestDateObj.toISOString();
    }

    const lagMinutes = Math.floor(Math.max(0, Date.now() - newestDateObj.getTime()) / (1000 * 60));
    const freshnessScore = Math.max(0, Math.min(100, parseFloat((100 - (lagMinutes / 1440) * 100).toFixed(1))));

    let freshnessStatus = 'PRISTINE';
    if (lagMinutes > 1440) freshnessStatus = 'STALE';
    else if (lagMinutes > 120) freshnessStatus = 'DEGRADED';
    else if (lagMinutes > 15) freshnessStatus = 'ACCEPTABLE';

    // 5. Build Quality History for Charts
    const qualityHistory = [
      { timestamp: '08:00', score: 94.5, completeness: 97.0, uniqueness: 98.0, validity: 86.5 },
      { timestamp: '10:00', score: 91.2, completeness: 93.0, uniqueness: 97.0, validity: 81.6 },
      { timestamp: '12:00', score: 78.4, completeness: 80.0, uniqueness: 88.0, validity: 62.4 },
      { timestamp: '14:00', score: 85.0, completeness: 88.0, uniqueness: 92.0, validity: 72.0 },
      { timestamp: '16:00', score: 68.3, completeness: 71.4, uniqueness: 100.0, validity: 80.0 },
      { timestamp: '18:00', score: overallHealthScore, completeness: 91.0, uniqueness: 95.0, validity: 84.0 }
    ];

    // Pipeline duration trend
    const pipelinePerformance = pipelines.map(p => ({
      name: p.name.length > 18 ? p.name.substring(0, 16) + '...' : p.name,
      durationMs: p.lastDurationMs || 1200,
      status: p.status,
      runs: p.totalRuns || 1
    }));

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          overallHealthScore,
          qualityBreakdown,
          dataFreshness: {
            score: freshnessScore,
            latestTimestamp: latestDatasetTime,
            lagMinutes,
            status: freshnessStatus,
            lagFormatted: lagMinutes < 60 ? `${lagMinutes} min ago` : `${(lagMinutes / 60).toFixed(1)} hrs ago`
          },
          activeIncidents: activeIncidents.length,
          criticalIncidents: criticalIncidents.length,
          pipelineCounts: {
            total: totalPipelines,
            healthy: healthyPipelines,
            degraded: degradedPipelines,
            failed: failedPipelines
          }
        },
        qualityHistory,
        pipelinePerformance,
        recentIncidents: incidents.slice(0, 5),
        recentPipelines: pipelines.slice(0, 5),
        recentScans: scans.slice(0, 5)
      },
      persistedToDB: dbActive,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardOverview
};
