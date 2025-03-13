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
  }
});

// Create index for faster queries
StatusHistorySchema.index({ api: 1, timestamp: -1 });

module.exports = mongoose.model('StatusHistory', StatusHistorySchema); 