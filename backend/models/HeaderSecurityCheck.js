const mongoose = require('mongoose');

/**
 * HeaderSecurityCheck Schema
 * Stores the HTTP header security analysis results for an API security check
 */
const headerSecurityCheckSchema = new mongoose.Schema({
  securityCheck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiSecurityCheck',
    required: true
  },
  headers: {
    type: Map,
    of: String,
    default: {}
  },
  securityHeaders: {
    type: Object,
    default: {
      'Content-Security-Policy': {
        present: Boolean,
        value: String
      },
      'X-Content-Type-Options': {
        present: Boolean,
        value: String
      },
      'X-Frame-Options': {
        present: Boolean,
        value: String
      },
      'X-XSS-Protection': {
        present: Boolean,
        value: String
      },
      'Strict-Transport-Security': {
        present: Boolean,
        value: String
      }
    }
  },
  missingHeaders: {
    type: [String],
    default: []
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { timestamps: true });

module.exports = mongoose.model('HeaderSecurityCheck', headerSecurityCheckSchema); 