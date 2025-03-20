const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

// @route   GET /api/analytics/apis
// @desc    Get all APIs for analytics
// @access  Private
router.get('/apis', protect, analyticsController.getApis);

// @route   GET /api/analytics/data
// @desc    Get historical data for an API
// @access  Private
router.get('/data', protect, analyticsController.getHistoricalData);

// @route   GET /api/analytics/reliability
// @desc    Get reliability metrics for an API
// @access  Private
router.get('/reliability', protect, analyticsController.getReliabilityMetrics);

// @route   GET /api/analytics/trend
// @desc    Get trend analysis for an API
// @access  Private
router.get('/trend', protect, analyticsController.getTrendAnalysis);

// @route   POST /api/analytics/report
// @desc    Generate a report for an API
// @access  Private
router.post('/report', protect, analyticsController.generateReport);

module.exports = router; 