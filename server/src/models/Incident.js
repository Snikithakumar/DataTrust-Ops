const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM',
    required: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'INVESTIGATING', 'RESOLVED'],
    default: 'OPEN',
    required: true
  },
  sourceType: {
    type: String,
    enum: ['PIPELINE_EXECUTION', 'MANUAL_SCAN', 'QUALITY_CHECK'],
    required: true
  },
  sourcePipeline: {
    type: String,
    default: null
  },
  datasetName: {
    type: String,
    default: null
  },
  summary: {
    type: String,
    required: true
  },
  details: {
    qualityScore: { type: Number },
    missingPercentage: { type: Number },
    duplicatesCount: { type: Number },
    failedStage: { type: String },
    errorLog: { type: String }
  },
  aiExplanation: {
    generatedAt: { type: Date, default: null },
    provider: { type: String, enum: ['GEMINI_API', 'OPENAI_API', 'DETERMINISTIC_FALLBACK', 'NONE'], default: 'NONE' },
    rootCause: { type: String, default: null },
    impactSummary: { type: String, default: null },
    affectedDownstream: [{ type: String }],
    recommendedFixes: [{ type: String }],
    verifiedFindings: { type: Object, default: {} }
  },
  resolutionNotes: {
    type: String,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  simulated: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);
