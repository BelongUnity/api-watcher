const mongoose = require('mongoose');

const AnalyticsAggregateSchema = new mongoose.Schema({
  api: {
    type: mongoose.Schema.ObjectId,
    ref: 'Api',
    required: true
  },
  // Time period this aggregate represents
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    required: true
  },
  // Start of the time period
  startTime: {
    type: Date,
    required: true
  },
  // End of the time period
  endTime: {
    type: Date,
    required: true
  },
  // Performance metrics
  metrics: {
    // Uptime percentage during this period
    uptime: {
      type: Number,
      default: 100 // percentage
    },
    // Average response time in milliseconds
    avgResponseTime: {
      type: Number,
      default: 0
    },
    // Minimum response time in milliseconds
    minResponseTime: {
      type: Number,
      default: 0
    },
    // Maximum response time in milliseconds
    maxResponseTime: {
      type: Number,
      default: 0
    },
    // 95th percentile response time
    p95ResponseTime: {
      type: Number,
      default: 0
    },
    // Standard deviation of response time
    stdDevResponseTime: {
      type: Number,
      default: 0
    },
    // Total number of requests
    requestCount: {
      type: Number,
      default: 0
    },
    // Number of successful requests
    successCount: {
      type: Number,
      default: 0
    },
    // Number of failed requests
    failureCount: {
      type: Number,
      default: 0
    },
    // Error counts by type
    errorCounts: {
      timeout: { type: Number, default: 0 },
      connection: { type: Number, default: 0 },
      server: { type: Number, default: 0 },
      client: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 }
    },
    // Average request size in bytes
    avgRequestSize: {
      type: Number,
      default: 0
    },
    // Average response size in bytes
    avgResponseSize: {
      type: Number,
      default: 0
    }
  },
  // Reliability score (0-100)
  reliabilityScore: {
    type: Number,
    default: 100
  },
  // Performance score (0-100)
  performanceScore: {
    type: Number,
    default: 100
  },
  // Overall health score (0-100)
  healthScore: {
    type: Number,
    default: 100
  },
  // When this aggregate was last updated
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster queries
AnalyticsAggregateSchema.index({ api: 1, period: 1, startTime: -1 });
AnalyticsAggregateSchema.index({ api: 1, period: 1, healthScore: 1 });
AnalyticsAggregateSchema.index({ startTime: -1, period: 1 }); // For global analytics

module.exports = mongoose.model('AnalyticsAggregate', AnalyticsAggregateSchema); 