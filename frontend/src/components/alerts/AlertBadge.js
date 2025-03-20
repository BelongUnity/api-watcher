import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';
import { createSocketConnection, setupAlertListeners } from '../../utils/socketUtils';
import './AlertBadge.css';

const AlertBadge = ({ standalone = true }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [animated, setAnimated] = useState(false);
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(null);

  // Function to fetch unread alerts count
  const fetchUnreadCount = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    
    try {
      console.log('AlertBadge: Fetching unread alerts count...');
      const response = await axios.get(
        'http://localhost:5000/api/alerts/unread/count',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('AlertBadge: Unread count response:', response.data);
      setUnreadCount(response.data.count);
      
      // Animate if there are unread alerts
      if (response.data.count > 0) {
        setAnimated(true);
        setTimeout(() => setAnimated(false), 1000);
      }
    } catch (error) {
      console.error('AlertBadge: Error fetching unread alerts count:', error);
    }
  }, [token, isAuthenticated]);

  // Set up socket connection
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    
    console.log('AlertBadge: Setting up socket connection');
    
    // Create socket connection using utility function
    // The updated createSocketConnection will extract userId from token if user is null
    const newSocket = createSocketConnection('http://localhost:5000', user?._id);
    
    if (newSocket) {
      // Set up alert listeners
      setupAlertListeners(newSocket, {
        onNewAlert: () => {
          console.log('AlertBadge: New alert received, updating count');
          fetchUnreadCount();
          setAnimated(true);
          setTimeout(() => setAnimated(false), 1000);
        },
        onAlertRead: () => {
          console.log('AlertBadge: Alert marked as read, updating count');
          fetchUnreadCount();
        },
        onMarkAllRead: () => {
          console.log('AlertBadge: All alerts marked as read, updating count');
          fetchUnreadCount();
        },
        onRefreshCount: () => {
          console.log('AlertBadge: Received refreshUnreadCount event, updating count');
          fetchUnreadCount();
        }
      });
      
      // Listen for clearAllAlerts event
      newSocket.on('clearAllAlerts', () => {
        console.log('AlertBadge: All alerts cleared, updating count');
        fetchUnreadCount();
      });
      
      // Listen for any alert event that might affect the count
      newSocket.on('newAlert', () => {
        console.log('AlertBadge: Direct newAlert event received, updating count');
        fetchUnreadCount();
        setAnimated(true);
        setTimeout(() => setAnimated(false), 1000);
      });
      
      setSocket(newSocket);
    }
    
    // Initial fetch
    fetchUnreadCount();
    
    // Set up a refresh interval to ensure count stays updated
    const intervalId = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
    
    return () => {
      if (newSocket) {
        console.log('AlertBadge: Disconnecting socket');
        newSocket.disconnect();
      }
      clearInterval(intervalId);
    };
  }, [token, isAuthenticated, fetchUnreadCount]);

  // The badge content without the Link wrapper
  const badgeContent = (
    <>
      <FaBell className={`alert-icon ${animated ? 'animated' : ''}`} />
      {unreadCount > 0 && (
        <span className="alert-count">{unreadCount}</span>
      )}
    </>
  );

  // Return either a standalone link or just the badge content
  return standalone ? (
    <Link to="/alerts" className="alert-badge-container">
      {badgeContent}
    </Link>
  ) : (
    <div className="alert-badge-container">
      {badgeContent}
    </div>
  );
};

export default AlertBadge; 