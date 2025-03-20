import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

/**
 * This component handles socket connections for real-time alert updates
 * It doesn't render anything visible but manages the socket connection
 * and listens for events to update the alert badge count
 */
const AlertSocketManager = () => {
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    let socket;

    if (token && isAuthenticated && user) {
      console.log('AlertSocket: Setting up socket connection...');
      
      // Connect to socket
      socket = io('http://localhost:5000');
      
      // Setup connection event handlers
      socket.on('connect', () => {
        console.log('AlertSocket: Socket connected successfully');
      });
      
      socket.on('connect_error', (error) => {
        console.error('AlertSocket: Socket connection error:', error);
      });
      
      // Join user-specific room
      if (user && user._id) {
        socket.emit('join', user._id);
        console.log('AlertSocket: Joined socket room for user:', user._id);
      }
      
      // Listen for new alerts
      socket.on('newAlert', (alert) => {
        console.log('AlertSocket: New alert received:', alert);
      });
      
      // Listen for alert read events
      socket.on('alertRead', () => {
        console.log('AlertSocket: Alert marked as read');
      });
      
      // Listen for mark all read events
      socket.on('markAllRead', () => {
        console.log('AlertSocket: All alerts marked as read');
      });
      
      // Listen for refresh unread count events
      socket.on('refreshUnreadCount', () => {
        console.log('AlertSocket: Received refreshUnreadCount event');
      });
    }
    
    return () => {
      if (socket) {
        console.log('AlertSocket: Disconnecting socket');
        socket.disconnect();
      }
    };
  }, [user, token, isAuthenticated]);
  
  // This component doesn't render anything visible
  return null;
};

export default AlertSocketManager; 