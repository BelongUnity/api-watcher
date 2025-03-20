const mongoose = require('mongoose');

const alertSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    api: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Api'
    },
    alertType: {
      type: String,
      required: true,
      enum: ['Downtime', 'HighLatency', 'ErrorRate', 'SSLIssue', 'Other']
    },
    severity: {
      type: String,
      required: true,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Info']
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    details: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for faster queries
alertSchema.index({ user: 1 });
alertSchema.index({ api: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ alertType: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ resolved: 1 });
alertSchema.index({ read: 1 });

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert; 