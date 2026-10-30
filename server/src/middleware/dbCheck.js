const { isDBConnected, getDBStatus } = require('../config/db');

/**
 * Middleware ensuring MongoDB is available for persistent write operations.
 * If unavailable, returns 503 with exact instructions for MongoDB Atlas rather than faking persistence.
 */
const requireDB = (req, res, next) => {
  if (isDBConnected()) {
    return next();
  }

  const status = getDBStatus();
  return res.status(503).json({
    success: false,
    error: {
      code: 'DATABASE_UNAVAILABLE',
      message: 'MongoDB database is not currently connected. To enable persistence, configure MongoDB Atlas or start a local MongoDB instance.',
      guidance: {
        reason: status.lastError || 'No active connection to MongoDB server',
        setupSteps: [
          '1. Create a free cluster on https://cloud.mongodb.com',
          '2. Add a database user with password in Database Access',
          '3. Whitelist your IP (or 0.0.0.0/0) in Network Access',
          '4. Set MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/datatrustops in server/.env',
          '5. Restart the server and run: npm --prefix server run seed'
        ],
        documentation: 'See docs/MONGODB_ATLAS_GUIDE.md for step-by-step instructions'
      }
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  requireDB
};
