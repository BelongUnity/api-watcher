const mongoose = require('mongoose');

/**
 * SslCertificateCheck Schema
 * Stores the SSL certificate validation results for an API security check
 */
const sslCertificateCheckSchema = new mongoose.Schema({
  securityCheck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiSecurityCheck',
    required: true
  },
  valid: {
    type: Boolean,
    required: true
  },
  issuer: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  daysUntilExpiration: {
    type: Number,
    required: true
  },
  protocol: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { timestamps: true });

module.exports = mongoose.model('SslCertificateCheck', sslCertificateCheckSchema); 