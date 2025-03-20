/**
 * Socket Utilities
 * 
 * This file contains utility functions for standardizing socket operations
 * across the application, ensuring consistent room naming and event handling.
 */

/**
 * Generate a standardized room name for a user
 * @param {string} userId - The user's ID
 * @returns {string} - Standardized room name in format 'user_userId'
 */
export const getUserRoom = (userId) => {
  if (!userId) {
    console.error('getUserRoom called with invalid userId:', userId);
    return null;
  }
  return `user_${userId}`;
};

/**
 * Join a user's room with proper error handling
 * @param {Object} socket - Socket.io socket instance
 * @param {string} userId - The user's ID
 * @returns {boolean} - Success status
 */
export const joinUserRoom = (socket, userId) => {
  if (!socket) {
    console.error('joinUserRoom called with invalid socket');
    return false;
  }
  
  if (!userId) {
    console.error('joinUserRoom called with invalid userId:', userId);
    return false;
  }
  
  try {
    const roomName = getUserRoom(userId);
    socket.emit('join', userId);
    console.log(`Joined room: ${roomName}`);
    return true;
  } catch (error) {
    console.error('Error joining user room:', error);
    return false;
  }
};

/**
 * Setup standard socket event listeners for alerts
 * @param {Object} socket - Socket.io socket instance
 * @param {Function} onNewAlert - Callback for new alert events
 * @param {Function} onAlertRead - Callback for alert read events
 * @param {Function} onMarkAllRead - Callback for mark all read events
 * @param {Function} onRefreshCount - Callback for refresh count events
 */
export const setupAlertListeners = (socket, {
  onNewAlert,
  onAlertRead,
  onMarkAllRead,
  onRefreshCount
}) => {
  if (!socket) {
    console.error('setupAlertListeners called with invalid socket');
    return;
  }
  
  // New alert received
  if (onNewAlert) {
    socket.on('newAlert', (data) => {
      console.log('Socket: New alert received', data);
      onNewAlert(data);
    });
  }
  
  // Alert marked as read
  if (onAlertRead) {
    socket.on('alertRead', (data) => {
      console.log('Socket: Alert marked as read', data);
      onAlertRead(data);
    });
  }
  
  // All alerts marked as read
  if (onMarkAllRead) {
    socket.on('markAllRead', () => {
      console.log('Socket: All alerts marked as read');
      onMarkAllRead();
    });
  }
  
  // Refresh unread count
  if (onRefreshCount) {
    socket.on('refreshUnreadCount', () => {
      console.log('Socket: Refresh unread count requested');
      onRefreshCount();
    });
  }
};

/**
 * Extract user ID from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} - User ID or null if extraction fails
 */
export const extractUserIdFromToken = (token) => {
  if (!token) {
    console.error('extractUserIdFromToken called with invalid token');
    return null;
  }
  
  try {
    // Simple base64 decoding of the JWT payload
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    console.log('Extracted JWT payload:', payload);
    
    // Return user ID from payload
    return payload.user?.id || null;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};

/**
 * Create a standardized socket connection with proper error handling
 * @param {string} serverUrl - Socket.io server URL
 * @param {string|null} userId - The user's ID (can be null if token is provided)
 * @param {Object} options - Additional socket.io options
 * @returns {Object} - Socket.io socket instance
 */
export const createSocketConnection = (serverUrl, userId, options = {}) => {
  if (!serverUrl) {
    console.error('createSocketConnection called with invalid serverUrl');
    return null;
  }
  
  // If userId is not provided, try to extract it from the token
  if (!userId) {
    console.log('No userId provided, attempting to extract from token');
    const token = localStorage.getItem('token');
    if (token) {
      userId = extractUserIdFromToken(token);
      console.log('Extracted userId from token:', userId);
    }
  }
  
  if (!userId) {
    console.error('createSocketConnection: Unable to determine userId');
    return null;
  }
  
  try {
    // Import socket.io-client dynamically to avoid issues
    const io = require('socket.io-client');
    const socket = io(serverUrl, options);
    
    // Set up connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected successfully');
      joinUserRoom(socket, userId);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    return socket;
  } catch (error) {
    console.error('Error creating socket connection:', error);
    return null;
  }
}; 