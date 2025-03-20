/**
 * Socket Utilities
 * 
 * This file contains utility functions for standardizing socket operations
 * across the backend application, ensuring consistent room naming and event handling.
 */

/**
 * Get a standardized user room name
 * @param {string|Object} user - User ID or user object
 * @returns {string|null} - Room name or null if invalid
 */
function getUserRoom(user) {
  // Extract user ID from user object or use directly if it's a string
  const userId = typeof user === 'object' 
    ? (user && user._id ? user._id.toString() : (user && user.id ? user.id.toString() : null)) 
    : (user ? user.toString() : null);
  
  if (!userId) {
    console.error('getUserRoom called with invalid user:', user);
    return null;
  }
  
  return `user_${userId}`;
}

/**
 * Emit an event to a user's room
 * @param {Object} io - Socket.io instance
 * @param {string|Object} user - User ID or user object
 * @param {string} event - Event name
 * @param {Object} data - Event data
 * @returns {boolean} - Success status
 */
function emitToUser(io, user, event, data = {}) {
  if (!io) {
    console.error('emitToUser called with invalid io instance');
    return false;
  }
  
  const roomName = getUserRoom(user);
  if (!roomName) {
    console.error('emitToUser called with invalid user:', user);
    return false;
  }
  
  try {
    console.log(`Emitting ${event} event to ${roomName}`, data);
    io.to(roomName).emit(event, data);
    return true;
  } catch (error) {
    console.error(`Error emitting ${event} event:`, error);
    return false;
  }
}

/**
 * Emit an alert read event
 * @param {Object} io - Socket.io instance
 * @param {string|Object} user - User ID or user object
 * @param {string} alertId - Alert ID
 * @returns {boolean} - Success status
 */
function emitAlertRead(io, user, alertId) {
  const success = emitToUser(io, user, 'alertRead', { alertId });
  if (success) {
    // Also emit a refreshUnreadCount event to ensure the badge is updated
    emitToUser(io, user, 'refreshUnreadCount');
  }
  return success;
}

/**
 * Emit a mark all read event
 * @param {Object} io - Socket.io instance
 * @param {string|Object} user - User ID or user object
 * @returns {boolean} - Success status
 */
function emitMarkAllRead(io, user) {
  const success = emitToUser(io, user, 'markAllRead');
  if (success) {
    // Also emit a refreshUnreadCount event to ensure the badge is updated
    emitToUser(io, user, 'refreshUnreadCount');
  }
  return success;
}

/**
 * Emit a new alert event
 * @param {Object} io - Socket.io instance
 * @param {string|Object} user - User ID or user object
 * @param {Object} alert - Alert data
 * @returns {boolean} - Success status
 */
function emitNewAlert(io, user, alert) {
  const success = emitToUser(io, user, 'newAlert', alert);
  if (success) {
    // Also emit a refreshUnreadCount event to ensure the badge is updated
    emitToUser(io, user, 'refreshUnreadCount');
  }
  return success;
}

/**
 * Emit a refresh unread count event
 * @param {Object} io - Socket.io instance
 * @param {string|Object} user - User ID or user object
 * @returns {boolean} - Success status
 */
function emitRefreshUnreadCount(io, user) {
  return emitToUser(io, user, 'refreshUnreadCount');
}

module.exports = {
  getUserRoom,
  emitToUser,
  emitAlertRead,
  emitMarkAllRead,
  emitNewAlert,
  emitRefreshUnreadCount
}; 