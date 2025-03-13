const mongoose = require('mongoose');

const ApiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  url: {
    type: String,
    required: [true, 'Please add a URL'],
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    default: 'GET'
  },
  headers: {
    type: Map,
    of: String,
    default: {}
  },
  body: {
    type: String,
    default: ''
  },
  expectedStatus: {
    type: Number,
    default: 200
  },
  expectedResponseTime: {
    type: Number,
    default: 1000 // milliseconds
  },
  monitoringInterval: {
    type: Number,
    default: 5, // minutes
    min: [1, 'Monitoring interval must be at least 1 minute'],
    max: [60, 'Monitoring interval cannot be more than 60 minutes']
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['up', 'down', 'unknown'],
    default: 'unknown'
  },
  lastChecked: {
    type: Date,
    default: null
  },
  responseTime: {
    type: Number,
    default: null
  },
  uptime: {
    type: Number,
    default: 100 // percentage
  },
  notificationSettings: {
    onDown: {
      type: Boolean,
      default: true
    },
    onUp: {
      type: Boolean,
      default: true
    },
    onPerformanceIssue: {
      type: Boolean,
      default: true
    }
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
ApiSchema.index({ owner: 1, status: 1 });
ApiSchema.index({ tags: 1 });

module.exports = mongoose.model('Api', ApiSchema); 