const asyncHandler = require('express-async-handler');
const Alert = require('../models/Alert');
const socketUtils = require('../utils/socketUtils');

// @desc    Get user alerts
// @route   GET /api/alerts
// @access  Private
const getUserAlerts = asyncHandler(async (req, res) => {
  const filters = {
    resolved: req.query.resolved === 'true',
    severity: req.query.severity,
    alertType: req.query.alertType,
    api: req.query.api,
    limit: parseInt(req.query.limit) || 100
  };

  // Remove undefined filters
  Object.keys(filters).forEach(key => 
    filters[key] === undefined && delete filters[key]
  );

  console.log('User ID:', req.user.id);
  console.log('Filters:', filters);

  // Create query object
  const query = { user: req.user.id };
  
  // Add filters to query
  if (filters.resolved !== undefined) {
    query.resolved = filters.resolved;
  }
  
  if (filters.severity) {
    query.severity = filters.severity;
  }
  
  if (filters.alertType) {
    query.alertType = filters.alertType;
  }
  
  if (filters.api) {
    query.api = filters.api;
  }

  console.log('Final query:', query);

  // Count total alerts for this query
  const totalCount = await Alert.countDocuments(query);
  console.log('Total count:', totalCount);

  const alerts = await Alert.find(query)
    .populate('api', 'name url')
    .sort({ createdAt: -1 })
    .limit(filters.limit);

  console.log('Found alerts:', alerts.length);

  res.status(200).json(alerts);
});

// @desc    Get alert by ID
// @route   GET /api/alerts/:id
// @access  Private
const getAlertById = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id)
    .populate('api', 'name url');

  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  // Check if the alert belongs to the user
  if (alert.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to access this alert');
  }

  res.status(200).json(alert);
});

// @desc    Mark alert as read
// @route   PUT /api/alerts/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  // Check if the alert belongs to the user
  if (alert.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to mark this alert as read');
  }

  alert.read = true;
  await alert.save();

  // Emit alert read event via Socket.IO if available
  try {
    const io = require('../server').io;
    if (io) {
      socketUtils.emitAlertRead(io, req.user, alert._id);
    }
  } catch (error) {
    console.error('Error emitting alert read event:', error);
  }

  res.status(200).json(alert);
});

// @desc    Mark alert as resolved
// @route   PUT /api/alerts/:id/resolve
// @access  Private
const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  // Check if the alert belongs to the user
  if (alert.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to resolve this alert');
  }

  alert.resolved = true;
  alert.resolvedAt = new Date();
  await alert.save();

  // Emit alert resolved event via Socket.IO
  // This will be handled by the alertService

  res.status(200).json(alert);
});

// @desc    Get alert counts by status
// @route   GET /api/alerts/counts
// @access  Private
const getAlertCounts = asyncHandler(async (req, res) => {
  const counts = await Alert.aggregate([
    { $match: { user: req.user._id } },
    { $group: {
        _id: '$resolved',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    resolved: 0,
    unresolved: 0
  };

  counts.forEach(item => {
    if (item._id === true) {
      result.resolved = item.count;
    } else {
      result.unresolved = item.count;
    }
  });

  res.status(200).json(result);
});

// @desc    Get unread alert count
// @route   GET /api/alerts/unread/count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  console.log('Getting unread count for user:', req.user.id);
  
  const query = { 
    user: req.user.id,
    read: { $ne: true }
  };
  
  console.log('Unread count query:', query);
  
  const count = await Alert.countDocuments(query);
  
  console.log('Unread count result:', count);

  res.status(200).json({ count });
});

// @desc    Mark all alerts as read
// @route   PUT /api/alerts/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  console.log('Marking all alerts as read for user:', req.user.id);
  
  const result = await Alert.updateMany(
    { user: req.user.id, read: { $ne: true } },
    { $set: { read: true } }
  );

  console.log('Mark all as read result:', result);

  // Emit mark all read event via Socket.IO if available
  try {
    const io = require('../server').io;
    if (io) {
      socketUtils.emitMarkAllRead(io, req.user);
    }
  } catch (error) {
    console.error('Error emitting mark all read event:', error);
  }

  res.status(200).json({ 
    message: 'All alerts marked as read',
    modifiedCount: result.modifiedCount 
  });
});

// @desc    Clear all alerts for a user
// @route   DELETE /api/alerts/clear-all
// @access  Private
const clearAllAlerts = asyncHandler(async (req, res) => {
  console.log('Clearing all alerts for user:', req.user.id);
  
  const result = await Alert.deleteMany({ user: req.user.id });

  console.log('Clear all alerts result:', result);

  // Emit refresh unread count event via Socket.IO if available
  try {
    const io = require('../server').io;
    if (io) {
      // Emit a special event for clearing all alerts
      socketUtils.emitToUser(io, req.user, 'clearAllAlerts');
      // Also refresh the unread count
      socketUtils.emitRefreshUnreadCount(io, req.user);
    }
  } catch (error) {
    console.error('Error emitting clear all alerts event:', error);
  }

  res.status(200).json({ 
    message: 'All alerts cleared',
    deletedCount: result.deletedCount 
  });
});

module.exports = {
  getUserAlerts,
  getAlertById,
  markAsRead,
  resolveAlert,
  getAlertCounts,
  getUnreadCount,
  markAllAsRead,
  clearAllAlerts
}; 