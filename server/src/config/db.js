const dns = require('dns');
const mongoose = require('mongoose');

let isConnected = false;
let lastConnectionError = null;

/**
 * Configure Node.js DNS resolver to use public DNS servers (Cloudflare 1.1.1.1, 1.0.0.1)
 * This fixes the Windows c-ares ECONNREFUSED error when resolving mongodb+srv:// SRV records
 */
const configureDNS = () => {
  try {
    const servers = ['1.1.1.1', '1.0.0.1'];
    dns.setServers(servers);
    console.log(`[DNS] Node.js DNS servers configured for MongoDB SRV resolution: ${servers.join(', ')}`);
    return true;
  } catch (err) {
    console.warn(`[DNS Warning] Unable to configure custom DNS servers: ${err.message}`);
    return false;
  }
};

// Guarantee DNS configuration runs on module load before any connection
configureDNS();

/**
 * Connect to MongoDB (Atlas or Local) with resilient in-memory fallback
 */
const connectDB = async (uriOverride = null) => {
  // Re-ensure DNS is configured right before connection attempt
  configureDNS();

  const uri = uriOverride || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/datatrustops';
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');
  const targetLabel = isAtlas ? 'MongoDB Atlas' : 'Local MongoDB';

  console.log(`[MongoDB] Initiating connection to ${targetLabel}...`);

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      dbName: 'datatrustops',
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });

    isConnected = true;
    lastConnectionError = null;
    console.log(`[MongoDB] Connected successfully to ${targetLabel} (${mongoose.connection.host}/${mongoose.connection.name})`);
    return true;
  } catch (error) {
    isConnected = false;
    lastConnectionError = error.message;
    console.warn(`[MongoDB Connection Failed] Unable to connect to ${targetLabel}: ${error.message}`);
    console.warn(`[MongoDB Fallback] Engaging resilient in-memory simulated store.`);
    console.warn(`[MongoDB Guidance] To enable MongoDB persistence, ensure network access (0.0.0.0/0) in Atlas or run local MongoDB (see docs/MONGODB_ATLAS_GUIDE.md).`);
    return false;
  }
};

mongoose.connection.on('connected', () => {
  isConnected = true;
  lastConnectionError = null;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] Database disconnected.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  lastConnectionError = err.message;
  console.error('[MongoDB Error]', err.message);
});

const getDBStatus = () => {
  const state = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const connected = state === 1;
  const uri = process.env.MONGODB_URI || '';
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');
  const targetLabel = isAtlas ? 'MongoDB Atlas' : 'Local MongoDB';

  // Redact exact Atlas shard hostname in public API response to prevent info disclosure
  let hostDisplay = null;
  if (connected) {
    hostDisplay = isAtlas ? 'MongoDB Atlas Cloud' : (mongoose.connection.host || 'localhost');
  }

  // Sanitize lastError so credentials or internal URIs are never exposed
  let safeLastError = null;
  if (lastConnectionError) {
    safeLastError = String(lastConnectionError)
      .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, 'mongodb://***:***@')
      .replace(/:\/\/([^:\s]+):([^@\s]+)@/g, '://***:***@');
  }

  return {
    state: states[state] || 'unknown',
    connected,
    mode: connected ? targetLabel : 'in-memory-fallback',
    target: targetLabel,
    host: hostDisplay,
    name: connected ? mongoose.connection.name : null,
    lastError: safeLastError,
    fallbackActive: !connected,
    dnsServers: ['1.1.1.1', '1.0.0.1'],
    guidance: connected
      ? `Operational (${targetLabel} persistence active)`
      : 'Operating in simulated in-memory mode. To enable persistence, check MONGODB_URI in server/.env (see docs/MONGODB_ATLAS_GUIDE.md)'
  };
};

module.exports = {
  connectDB,
  configureDNS,
  getDBStatus,
  isDBConnected: () => mongoose.connection.readyState === 1
};
