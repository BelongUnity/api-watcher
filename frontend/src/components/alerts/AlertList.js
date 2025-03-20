import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Card, Badge, ListGroup, Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faInfoCircle, 
  faBell, 
  faCheckCircle,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import { createSocketConnection, setupAlertListeners } from '../../utils/socketUtils';
import './AlertList.css';

const AlertList = ({ filterType, filterSeverity, searchTerm }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token, isAuthenticated } = useSelector((state) => {
    console.log('Redux state:', state);
    return state.auth;
  });
  const [socket, setSocket] = useState(null);

  // Get severity badge color
  const getSeverityBadge = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <Badge bg="danger">Critical</Badge>;
      case 'high':
        return <Badge bg="warning" text="dark">High</Badge>;
      case 'medium':
        return <Badge bg="info">Medium</Badge>;
      case 'low':
        return <Badge bg="secondary">Low</Badge>;
      case 'info':
        return <Badge bg="primary">Info</Badge>;
      default:
        return <Badge bg="light" text="dark">{severity}</Badge>;
    }
  };

  // Get alert type icon
  const getAlertTypeIcon = (alertType) => {
    switch (alertType.toLowerCase()) {
      case 'downtime':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger" />;
      case 'highlatency':
        return <FontAwesomeIcon icon={faBell} className="text-warning" />;
      case 'other':
        return <FontAwesomeIcon icon={faInfoCircle} className="text-info" />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} className="text-secondary" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    console.log('Fetching alerts...');
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      console.log('Making request to http://localhost:5000/api/alerts');
      const res = await axios.get('http://localhost:5000/api/alerts', config);
      console.log('Alerts response:', res.data);
      setAlerts(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to fetch alerts. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Mark alert as read
  const markAsRead = async (alertId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      console.log(`Marking alert ${alertId} as read`);
      const response = await axios.put(`http://localhost:5000/api/alerts/${alertId}/read`, {}, config);
      console.log('Mark as read response:', response.data);
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert._id === alertId ? { ...alert, read: true } : alert
      ));
    } catch (err) {
      console.error('Error marking alert as read:', err);
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
      }
    }
  };

  // Setup socket connection
  useEffect(() => {
    console.log('Setting up socket connection and fetching alerts...');
    console.log('User:', user);
    console.log('Token:', token);
    console.log('IsAuthenticated:', isAuthenticated);
    
    if (token && isAuthenticated) {
      fetchAlerts();
      
      // Create socket connection using utility function
      // The updated createSocketConnection will extract userId from token if user is null
      const newSocket = createSocketConnection('http://localhost:5000', user?._id);
      
      if (newSocket) {
        // Set up alert listeners
        setupAlertListeners(newSocket, {
          onNewAlert: (newAlert) => {
            console.log('AlertList: New alert received:', newAlert);
            setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
          },
          onAlertRead: () => {
            console.log('AlertList: Alert marked as read, refreshing');
            fetchAlerts();
          },
          onMarkAllRead: () => {
            console.log('AlertList: All alerts marked as read, refreshing');
            fetchAlerts();
          },
          onRefreshCount: () => {
            console.log('AlertList: Received refreshUnreadCount event, refreshing');
            fetchAlerts();
          }
        });
        
        // Listen for clearAllAlerts event
        newSocket.on('clearAllAlerts', () => {
          console.log('AlertList: All alerts cleared, refreshing');
          fetchAlerts();
        });
        
        setSocket(newSocket);
      }
      
      return () => {
        if (newSocket) {
          console.log('AlertList: Disconnecting socket');
          newSocket.disconnect();
        }
      };
    }
  }, [user, token, isAuthenticated, fetchAlerts]);

  // Filter alerts based on props
  const filteredAlerts = alerts.filter(alert => {
    // Filter by type
    if (filterType !== 'all' && alert.alertType.toLowerCase() !== filterType.toLowerCase()) {
      return false;
    }
    
    // Filter by severity
    if (filterSeverity !== 'all' && alert.severity.toLowerCase() !== filterSeverity.toLowerCase()) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !alert.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  if (loading && alerts.length === 0) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="alert-error-card">
        <Card.Body>
          <Card.Title className="text-danger">
            <FontAwesomeIcon icon={faExclamationTriangle} /> Error
          </Card.Title>
          <Card.Text>{error}</Card.Text>
          <Button variant="primary" onClick={fetchAlerts}>
            <FontAwesomeIcon icon={faSync} /> Retry
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="alert-list-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faBell} className="me-2" />
            Alerts
          </h5>
          <div>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={fetchAlerts}
              disabled={loading}
              title="Refresh alerts"
            >
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FontAwesomeIcon icon={faSync} />
              )}
            </Button>
          </div>
        </Card.Header>
        <ListGroup variant="flush">
          {filteredAlerts.length === 0 ? (
            <ListGroup.Item className="text-center py-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-success mb-2" size="2x" />
              <p className="mb-0">No alerts to display</p>
            </ListGroup.Item>
          ) : (
            filteredAlerts.map((alert) => (
              <ListGroup.Item 
                key={alert._id} 
                className={`alert-item ${!alert.read ? 'unread' : ''}`}
              >
                <div className="d-flex align-items-start">
                  <div className="alert-icon me-3">
                    {getAlertTypeIcon(alert.alertType)}
                  </div>
                  <div className="alert-content flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{alert.message}</h6>
                        <p className="text-muted small mb-1">
                          {alert.api?.name || 'Unknown API'} • {formatDate(alert.createdAt)}
                        </p>
                      </div>
                      <div className="ms-2">
                        {getSeverityBadge(alert.severity)}
                      </div>
                    </div>
                    {!alert.read && (
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => markAsRead(alert._id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Card>
    </>
  );
};

export default AlertList; 