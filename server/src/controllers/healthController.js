const { getDBStatus } = require('../config/db');

const getHealth = (req, res) => {
  const dbStatus = getDBStatus();
  const uptimeSeconds = parseFloat(process.uptime().toFixed(1));
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

  const status = {
    status: dbStatus.connected ? 'HEALTHY' : 'DEGRADED',
    message: dbStatus.connected
      ? 'All systems operational with MongoDB persistence.'
      : 'API operational with in-memory fallback. MongoDB disconnected — see docs/MONGODB_ATLAS_GUIDE.md to enable persistence.',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    nodeVersion: process.version,
    database: dbStatus,
    aiEngine: {
      provider: hasGeminiKey ? 'GEMINI_API' : 'DETERMINISTIC_FALLBACK',
      model: hasGeminiKey ? (process.env.LLM_MODEL || 'gemini-1.5-flash') : 'None (Strict Rule Engine)',
      hasApiKey: hasGeminiKey
    },
    version: '1.0.0'
  };

  return res.status(200).json({
    success: true,
    data: status,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealth
};
