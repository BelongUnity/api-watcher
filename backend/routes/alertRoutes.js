const express = require('express');
const router = express.Router();
const { 
  getUserAlerts, 
  getAlertById, 
  markAsRead,
  resolveAlert, 
  getAlertCounts,
  getUnreadCount,
  markAllAsRead,
  clearAllAlerts
} = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const apiMonitor = require('../services/apiMonitor');

// All routes are protected
router.use(protect);

// Get all alerts for the user and alert counts
router.get('/', getUserAlerts);
router.get('/counts', getAlertCounts);
router.get('/unread/count', getUnreadCount);

// Mark all alerts as read
router.put('/mark-all-read', markAllAsRead);

// Clear all alerts
router.delete('/clear-all', clearAllAlerts);

// Get a specific alert by ID
router.get('/:id', getAlertById);

// Mark an alert as read or resolved
router.put('/:id/read', markAsRead);
router.put('/:id/resolve', resolveAlert);

// @route   POST /api/alerts/test
// @desc    Create a test alert (for debugging only)
// @access  Private
router.post('/test', async (req, res) => {
  try {
    // Get the alert service from the request
    const alertService = req.app.get('alertService');
    
    if (!alertService) {
      return res.status(500).json({ message: 'Alert service not available' });
    }
    
    // Create a test alert
    await apiMonitor.createTestAlert(alertService);
    
    res.json({ message: 'Test alert created successfully' });
  } catch (error) {
    console.error('Error creating test alert:', error);
    res.status(500).json({ message: 'Error creating test alert' });
  }
});

module.exports = router; 