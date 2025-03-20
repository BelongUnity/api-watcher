const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema({
  api: {
    type: mongoose.Schema.ObjectId,
    ref: 'Api',
    required: true
  },
  status: {
    type: String,
    enum: ['up', 'down'],
    required: true
  },
  responseTime: {
    type: Number,
    required: true
  },
  statusCode: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // New fields for advanced analytics
  requestSize: {
    type: Number,
    default: 0
  },
  responseSize: {
    type: Number,
    default: 0
  },
  errorType: {
    type: String,
    enum: ['none', 'timeout', 'connection', 'server', 'client', 'unknown'],
    default: 'none'
  },
  endpoint: {
    type: String,
    default: '/'
  },
  region: {
    type: String,
    default: 'unknown'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Create index for faster queries
StatusHistorySchema.index({ api: 1, timestamp: -1 });
// Additional indexes for analytics queries
StatusHistorySchema.index({ api: 1, status: 1, timestamp: -1 });
StatusHistorySchema.index({ api: 1, errorType: 1, timestamp: -1 });
StatusHistorySchema.index({ timestamp: -1 }); // For global analytics

module.exports = mongoose.model('StatusHistory', StatusHistorySchema); 