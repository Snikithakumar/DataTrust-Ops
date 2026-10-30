require('dotenv').config();
const { connectDB, isDBConnected } = require('../config/db');
const Pipeline = require('../models/Pipeline');
const Incident = require('../models/Incident');
const QualityScan = require('../models/QualityScan');
const { initialPipelines, initialIncidents } = require('../services/seedService');

const runSeed = async () => {
  console.log('[Seed] Connecting to MongoDB...');
  const connected = await connectDB();

  if (!connected) {
    console.error('[Seed Error] Could not connect to MongoDB. Check MONGODB_URI in server/.env.');
    console.error('[Seed Guidance] See docs/MONGODB_ATLAS_GUIDE.md to configure a free MongoDB Atlas cluster.');
    process.exit(1);
  }

  try {
    console.log('[Seed] Clearing existing collections...');
    await Pipeline.deleteMany({});
    await Incident.deleteMany({});
    await QualityScan.deleteMany({});

    console.log('[Seed] Inserting initial simulated pipelines...');
    await Pipeline.insertMany(initialPipelines);

    console.log('[Seed] Inserting initial simulated incidents...');
    await Incident.insertMany(initialIncidents);

    console.log('✅ [Seed Completed Successfully] Initial simulated data populated in MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err.message);
    process.exit(1);
  }
};

runSeed();
