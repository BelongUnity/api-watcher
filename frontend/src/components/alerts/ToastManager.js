import React, { useEffect, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { createSocketConnection } from '../../utils/socketUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faInfoCircle, 
  faBell, 
  faCheckCircle 
} from '@fortawesome/free-solid-svg-icons';

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  
  // Get alert type icon
  const getAlertTypeIcon = (alertType) => {
    switch (alertType?.toLowerCase()) {
      case 'downtime':
        return <FontAwesomeIcon icon={faExclamationTriangle} />;
      case 'highlatency':
        return <FontAwesomeIcon icon={faBell} />;
      case 'recovery':
        return <FontAwesomeIcon icon={faCheckCircle} />;
      case 'other':
      default:
        return <FontAwesomeIcon icon={faInfoCircle} />;
    }
  };
  
  // Get toast background color based on severity
  const getToastBg = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'secondary';
      case 'info':
      default:
        return 'primary';
    }
  };
  
  // Remove a toast by id
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };
  
  // Add a new toast
  const addToast = (alert) => {
    const newToast = {
      id: Date.now(),
      title: alert.alertType || 'Alert',
      message: alert.message || 'New alert received',
      severity: alert.severity || 'info',
      apiName: alert.api?.name || 'Unknown API',
      alertType: alert.alertType || 'other',
      time: new Date()
    };
    
    setToasts(prevToasts => [newToast, ...prevToasts]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(newToast.id);
    }, 5000);
  };
  
  useEffect(() => {
    if (!token || !isAuthenticated) return;
    
    console.log('ToastManager: Setting up socket connection');
    
    // Create socket connection
    const socket = createSocketConnection('http://localhost:5000');
    
    if (socket) {
      // Listen for new alerts (user-specific)
      socket.on('newAlert', (alertData) => {
        console.log('ToastManager: New alert received', alertData);
        addToast(alertData);
      });
      
      // Listen for global alerts (broadcast to all)
      socket.on('globalAlert', (alertData) => {
        console.log('ToastManager: Global alert received', alertData);
        addToast(alertData);
      });
      
      return () => {
        socket.disconnect();
      };
    }
  }, [token, isAuthenticated]);
  
  return (
    <ToastContainer 
      className="p-3" 
      position="top-end" 
      style={{ zIndex: 1060 }}
    >
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          onClose={() => removeToast(toast.id)} 
          bg={getToastBg(toast.severity)}
          className="mb-2"
          animation={true}
        >
          <Toast.Header>
            <span className="me-2">{getAlertTypeIcon(toast.alertType)}</span>
            <strong className="me-auto">{toast.apiName}</strong>
            <small>{toast.time.toLocaleTimeString()}</small>
          </Toast.Header>
          <Toast.Body className={toast.severity === 'high' || toast.severity === 'medium' ? 'text-dark' : 'text-white'}>
            {toast.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default ToastManager; 