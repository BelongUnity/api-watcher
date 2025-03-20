const Alert = require('../models/Alert');
const socketUtils = require('../utils/socketUtils');

/**
 * Get a standardized user room name
 * @param {string|Object} user - User ID or user object
 * @returns {string|null} - Room name or null if invalid
 */
function getUserRoom(user) {
  // Extract user ID from user object or use directly if it's a string
  const userId = typeof user === 'object' 
    ? (user && user._id ? user._id.toString() : null) 
    : (user ? user.toString() : null);
  
  if (!userId) {
    console.error('getUserRoom called with invalid user:', user);
    return null;
  }
  
  return `user_${userId}`;
}

/**
 * Alert Service for creating and managing alerts
 */
class AlertService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Create a new alert and emit it via Socket.IO
   * @param {Object} alertData - Alert data
   * @param {string} alertData.user - User ID
   * @param {string} alertData.api - API ID
   * @param {string} alertData.alertType - Type of alert
   * @param {string} alertData.severity - Severity level
   * @param {string} alertData.message - Alert message
   * @param {Object} alertData.details - Additional details
   * @returns {Promise<Object>} - Created alert
   */
  async createAlert(alertData) {
    try {
      // Validate user ID
      if (!alertData.user) {
        console.error('Cannot create alert: User ID is missing', alertData);
        throw new Error('User ID is required to create an alert');
      }
      
      // Create alert in database
      const alert = await Alert.create(alertData);
      
      // Populate user and API information for the frontend
      const populatedAlert = await Alert.findById(alert._id)
        .populate('api', 'name url')
        .populate('user', 'name email');
      
      // Emit alert to the user via Socket.IO
      this.emitAlert(populatedAlert);
      
      return populatedAlert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Resolve an existing alert
   * @param {string} alertId - Alert ID
   * @returns {Promise<Object>} - Updated alert
   */
  async resolveAlert(alertId) {
    try {
      const alert = await Alert.findById(alertId);
      
      if (!alert) {
        throw new Error('Alert not found');
      }
      
      alert.resolved = true;
      alert.resolvedAt = new Date();
      await alert.save();
      
      // Emit alert resolved event
      socketUtils.emitToUser(this.io, alert.user, 'alertResolved', {
        alertId: alert._id,
        apiId: alert.api
      });
      
      // Also emit a refreshUnreadCount event to ensure the badge is updated
      socketUtils.emitRefreshUnreadCount(this.io, alert.user);
      
      return alert;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Get alerts for a specific user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - List of alerts
   */
  async getUserAlerts(userId, filters = {}) {
    try {
      const query = { user: userId };
      
      // Apply filters if provided
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
      
      // Get alerts with newest first
      const alerts = await Alert.find(query)
        .populate('api', 'name url')
        .sort({ createdAt: -1 })
        .limit(filters.limit || 100);
      
      return alerts;
    } catch (error) {
      console.error('Error getting user alerts:', error);
      throw error;
    }
  }

  /**
   * Emit an alert to a specific user via Socket.IO
   * @param {Object} alert - Alert object
   */
  emitAlert(alert) {
    try {
      // Convert Mongoose document to plain object
      const alertData = alert.toObject ? alert.toObject() : alert;
      
      // Check if user exists and extract user ID
      if (!alertData.user) {
        console.error('Cannot emit alert: User ID is missing', alertData);
        return;
      }
      
      // Extract user ID based on the format (object or string)
      const userId = typeof alertData.user === 'object' 
        ? (alertData.user._id ? alertData.user._id.toString() : alertData.user.id)
        : alertData.user.toString();
      
      if (!userId) {
        console.error('Cannot emit alert: Invalid user ID format', alertData.user);
        return;
      }
      
      console.log(`Emitting alert to user ${userId}:`, alertData.message);
      
      // Emit the alert using socketUtils
      socketUtils.emitNewAlert(this.io, userId, alertData);
      
      // Also broadcast to all clients for global notifications
      // This helps ensure toast notifications work even if the user room connection fails
      this.io.emit('globalAlert', alertData);
    } catch (error) {
      console.error('Error emitting alert:', error);
    }
  }
}

module.exports = AlertService; 