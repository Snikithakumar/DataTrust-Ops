const mongoose = require('mongoose');

const pipelineRunSchema = new mongoose.Schema({
  runId: { type: String, required: true },
  triggeredAt: { type: Date, default: Date.now },
  durationMs: { type: Number, required: true },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'WARNING', 'RUNNING'],
    required: true
  },
  recordsProcessed: { type: Number, default: 0 },
  qualityScore: { type: Number, min: 0, max: 100 },
  errorMessage: { type: String, default: null },
  logs: [{ type: String }]
}, { _id: false });

const pipelineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pipeline name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['INGESTION', 'TRANSFORMATION', 'ANALYTICS', 'REPORTING'],
    default: 'INGESTION'
  },
  sourceDataset: {
    type: String,
    required: true
  },
  targetDestination: {
    type: String,
    required: true
  },
  schedule: {
    type: String,
    default: 'Every 1 hour'
  },
  status: {
    type: String,
    enum: ['HEALTHY', 'DEGRADED', 'FAILED', 'IDLE', 'RUNNING'],
    default: 'IDLE'
  },
  lastRunAt: {
    type: Date,
    default: null
  },
  lastDurationMs: {
    type: Number,
    default: 0
  },
  totalRuns: {
    type: Number,
    default: 0
  },
  failedRuns: {
    type: Number,
    default: 0
  },
  simulated: {
    type: Boolean,
    default: true
  },
  executionHistory: [pipelineRunSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Pipeline', pipelineSchema);
