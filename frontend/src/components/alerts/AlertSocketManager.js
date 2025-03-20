import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaExclamationTriangle, FaInfoCircle, FaBell } from 'react-icons/fa';
import { createSocketConnection, setupAlertListeners } from '../../utils/socketUtils';

/**
 * This component handles socket connections for real-time alert updates
 * It doesn't render anything visible but manages the socket connection
 * and listens for events to update the alert badge count
 */
const AlertSocketManager = () => {
  const [socket, setSocket] = useState(null);
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  
  useEffect(() => {
    // Only connect if we have a user
    if (isAuthenticated && token && user && user._id) {
      console.log('AlertSocketManager: Setting up socket connection for user:', user._id);
      
      // Create socket connection using utility function
      const newSocket = createSocketConnection('http://localhost:5000', user._id);
      
      if (newSocket) {
        // Set up alert listeners
        setupAlertListeners(newSocket, {
          onNewAlert: (alert) => {
            console.log('AlertSocketManager: New alert received:', alert);
            
            // Create toast notification based on severity
            if (alert && alert.severity) {
              let toastIcon;
              let toastType;
              
              switch (alert.severity) {
                case 'Critical':
                  toastIcon = <FaExclamationTriangle />;
                  toastType = 'error';
                  break;
                case 'High':
                  toastIcon = <FaExclamationTriangle />;
                  toastType = 'warning';
                  break;
                case 'Medium':
                  toastIcon = <FaInfoCircle />;
                  toastType = 'info';
                  break;
                default:
                  toastIcon = <FaBell />;
                  toastType = 'info';
              }
              
              toast[toastType](
                <div>
                  <strong>{alert.message}</strong>
                  {alert.api && alert.api.name && (
                    <p>API: {alert.api.name}</p>
                  )}
                </div>,
                {
                  icon: toastIcon,
                  autoClose: 5000,
                  position: 'top-right'
                }
              );
            }
          }
        });
        
        // Save the socket connection
        setSocket(newSocket);
        
        // Clean up on unmount
        return () => {
          console.log('AlertSocketManager: Disconnecting socket');
          newSocket.disconnect();
        };
      }
    }
  }, [user, token, isAuthenticated]);
  
  // This component doesn't render anything visible
  return null;
};

export default AlertSocketManager; 