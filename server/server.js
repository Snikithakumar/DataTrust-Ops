require('dotenv').config();
const http = require('http');
const { configureDNS, connectDB } = require('./src/config/db');

// Ensure DNS resolution is configured prior to any other network operation
configureDNS();

const app = require('./src/app');
const { seedDatabaseIfEmpty } = require('./src/services/seedService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('[DataTrust Ops] Initializing server...');
  const dbConnected = await connectDB();

  if (dbConnected) {
    console.log('[DataTrust Ops] Database persistence active.');
    await seedDatabaseIfEmpty();
  } else {
    console.warn('[DataTrust Ops] Running with resilient in-memory simulated store.');
    console.warn('[DataTrust Ops] To enable persistence, set MONGODB_URI in server/.env with your MongoDB Atlas connection string.');
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 DataTrust Ops Server running on port ${PORT}`);
    console.log(`📊 Health Endpoint:    http://localhost:${PORT}/api/health`);
    console.log(`📈 Dashboard API:      http://localhost:${PORT}/api/dashboard`);
    console.log(`🔍 Quality Scan API:   http://localhost:${PORT}/api/quality/scan`);
    console.log(`⚙️  Pipelines API:      http://localhost:${PORT}/api/pipelines`);
    console.log(`🚨 Incidents API:      http://localhost:${PORT}/api/incidents`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n[DataTrust Ops] Gracefully shutting down...');
    server.close(() => {
      console.log('[DataTrust Ops] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer, app };
