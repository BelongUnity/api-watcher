const mongoose = require('mongoose');

/**
 * SecurityRecommendation Schema
 * Stores reusable security recommendations
 */
const securityRecommendationSchema = new mongoose.Schema({
  securityCheck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiSecurityCheck',
    required: true
  },
  category: {
    type: String,
    enum: ['SSL', 'Headers', 'Vulnerability', 'General'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  implementationSteps: {
    type: String,
    required: true
  },
  resources: {
    type: [String],
    default: []
  },
  implemented: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('SecurityRecommendation', securityRecommendationSchema); 