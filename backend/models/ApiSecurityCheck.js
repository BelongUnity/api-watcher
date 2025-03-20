const mongoose = require('mongoose');

/**
 * ApiSecurityCheck Schema
 * Stores the overall security check results for an API
 */
const apiSecurityCheckSchema = new mongoose.Schema({
  api: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Api',
    required: true
  },
  checkDate: {
    type: Date,
    default: Date.now
  },
  overallSecurityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  overallSecurityStatus: {
    type: String,
    enum: ['Pass', 'Warning', 'Fail'],
    default: 'Fail'
  },
  details: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

// Create a compound index on api and checkDate to ensure uniqueness
apiSecurityCheckSchema.index({ api: 1, checkDate: 1 }, { unique: true });

const ApiSecurityCheck = mongoose.model('ApiSecurityCheck', apiSecurityCheckSchema);

module.exports = ApiSecurityCheck; 