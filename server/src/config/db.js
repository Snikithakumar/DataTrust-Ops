const mongoose = require('mongoose');

let isConnected = false;
let lastConnectionError = null;

const connectDB = async (uriOverride = null) => {
  const uri = uriOverride || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/datatrustops';

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });

    isConnected = true;
    lastConnectionError = null;
    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    lastConnectionError = error.message;
    console.warn(`[MongoDB Warning] Database connection failed: ${error.message}`);
    console.warn(`[MongoDB Guidance] To enable MongoDB persistence, ensure MongoDB is running or configure MongoDB Atlas in server/.env (see docs/MONGODB_ATLAS_GUIDE.md).`);
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
  return {
    state: states[state] || 'unknown',
    connected: state === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    lastError: lastConnectionError,
    guidance: state === 1 ? 'Operational' : 'Configure MONGODB_URI in .env with MongoDB Atlas connection string (see docs/MONGODB_ATLAS_GUIDE.md)'
  };
};

module.exports = {
  connectDB,
  getDBStatus,
  isDBConnected: () => mongoose.connection.readyState === 1
};
