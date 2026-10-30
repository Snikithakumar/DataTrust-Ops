const mongoose = require('mongoose');

const qualityScanSchema = new mongoose.Schema({
  datasetName: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  totalRows: {
    type: Number,
    required: true
  },
  totalColumns: {
    type: Number,
    required: true
  },
  columns: [{ type: String }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    default: 'A'
  },
  status: {
    type: String,
    default: 'HEALTHY'
  },
  qualityStatus: {
    type: String,
    default: 'HEALTHY'
  },
  statusReasons: [{ type: String }],
  breakdown: {
    completeness: { type: Number, required: true, min: 0, max: 100 },
    uniqueness: { type: Number, required: true, min: 0, max: 100 },
    validity: { type: Number, required: true, min: 0, max: 100 }
  },
  freshness: {
    score: { type: Number, min: 0, max: 100, default: null },
    policy: { type: String, default: null },
    anchorColumn: { type: String, default: null },
    latestTimestamp: { type: String, default: null },
    lagMinutes: { type: Number, default: null },
    status: {
      type: String,
      enum: ['PRISTINE', 'ACCEPTABLE', 'DEGRADED', 'STALE', 'NOT_APPLICABLE', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    message: { type: String, default: null }
  },
  findings: {
    emptyFile: { type: Boolean, default: false },
    missingValuesTotal: { type: Number, default: 0 },
    missingByColumn: { type: Map, of: Object },
    duplicateRowsCount: { type: Number, default: 0 },
    duplicateRowIndices: [{ type: Number }],
    anomaliesCount: { type: Number, default: 0 },
    anomalies: [{
      type: { type: String },
      column: { type: String },
      row: { type: Number },
      value: { type: String },
      reason: { type: String }
    }]
  },
  incidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    default: null
  },
  simulated: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QualityScan', qualityScanSchema);
