import React, { useState, useCallback, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, ButtonGroup, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faFilter, 
  faCheckDouble, 
  faTrash,
  faSearch,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import AlertList from '../components/alerts/AlertList';
import axios from 'axios';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { createSocketConnection, setupAlertListeners } from '../utils/socketUtils';

const AlertsPage = () => {
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { token, user, isAuthenticated } = useSelector((state) => state.auth);
  const [alertListKey, setAlertListKey] = useState(0); // Used to force re-render of AlertList
  const [socket, setSocket] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Setup socket connection
  useEffect(() => {
    if (token && isAuthenticated) {
      console.log('AlertsPage: Setting up socket connection for user:', user?._id);
      
      // Create socket connection using utility function
      const newSocket = createSocketConnection('http://localhost:5000', user?._id);
      
      if (newSocket) {
        // Set up alert listeners
        setupAlertListeners(newSocket, {
          onNewAlert: () => {
            console.log('AlertsPage: New alert received, refreshing list');
            setAlertListKey(prevKey => prevKey + 1);
          },
          onAlertRead: () => {
            console.log('AlertsPage: Alert marked as read, refreshing list');
            setAlertListKey(prevKey => prevKey + 1);
          },
          onMarkAllRead: () => {
            console.log('AlertsPage: All alerts marked as read, refreshing list');
            setAlertListKey(prevKey => prevKey + 1);
          },
          onRefreshCount: () => {
            console.log('AlertsPage: Received refreshUnreadCount event, refreshing list');
            setAlertListKey(prevKey => prevKey + 1);
          }
        });
        
        // Listen for clearAllAlerts event
        newSocket.on('clearAllAlerts', () => {
          console.log('AlertsPage: All alerts cleared, refreshing list');
          setAlertListKey(prevKey => prevKey + 1);
        });
        
        setSocket(newSocket);
      }
      
      return () => {
        if (newSocket) {
          console.log('AlertsPage: Disconnecting socket');
          newSocket.disconnect();
        }
      };
    }
  }, [user, token, isAuthenticated]);

  // Mark all alerts as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      // Make sure we're using the correct API endpoint
      const response = await axios.put('http://localhost:5000/api/alerts/mark-all-read', {}, config);
      console.log('Mark all as read response:', response.data);
      
      // Force re-render of AlertList to refresh the alerts
      setAlertListKey(prevKey => prevKey + 1);
    } catch (err) {
      console.error('Error marking all alerts as read:', err);
      // Log more detailed error information
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
      }
    }
  }, [token]);

  // Clear all alerts
  const handleClearAll = useCallback(async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      // Make sure we're using the correct API endpoint
      const response = await axios.delete('http://localhost:5000/api/alerts/clear-all', config);
      console.log('Clear all alerts response:', response.data);
      
      // Force re-render of AlertList to refresh the alerts
      setAlertListKey(prevKey => prevKey + 1);
      
      // Close the confirmation modal
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Error clearing all alerts:', err);
      // Log more detailed error information
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
      }
      
      // Close the confirmation modal even if there's an error
      setShowConfirmModal(false);
    }
  }, [token]);

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-3">
            <FontAwesomeIcon icon={faBell} className="me-2" />
            Alerts
          </h1>
          <p className="text-muted">
            View and manage alerts for your monitored APIs. Alerts are generated when APIs experience downtime, 
            performance issues, or other notable events.
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12} lg={4} className="mb-3 mb-lg-0">
          <Card>
            <Card.Body>
              <Card.Title>
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                Filters
              </Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Alert Type</Form.Label>
                  <Form.Select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="downtime">Downtime</option>
                    <option value="highlatency">High Latency</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Severity</Form.Label>
                  <Form.Select 
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Search</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FontAwesomeIcon icon={faSearch} />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Form.Group>

                <div className="d-grid gap-2">
                  <ButtonGroup>
                    <Button 
                      variant="outline-primary"
                      onClick={handleMarkAllAsRead}
                    >
                      <FontAwesomeIcon icon={faCheckDouble} className="me-1" />
                      Mark All as Read
                    </Button>
                    <Button 
                      variant="outline-danger"
                      onClick={() => setShowConfirmModal(true)}
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-1" />
                      Clear All
                    </Button>
                  </ButtonGroup>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={12} lg={8}>
          <AlertList 
            key={alertListKey}
            filterType={filterType}
            filterSeverity={filterSeverity}
            searchTerm={searchTerm}
          />
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning me-2" />
            Confirm Clear All Alerts
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to clear all alerts? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleClearAll}>
            Clear All Alerts
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AlertsPage; 