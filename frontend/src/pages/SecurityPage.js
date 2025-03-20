import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Table } from 'react-bootstrap';
import { FaShieldAlt, FaExclamationTriangle, FaCheck, FaLock, FaUnlock, FaSync, FaCheckCircle, FaTimesCircle, FaPlus, FaRedoAlt } from 'react-icons/fa';
import '../styles/security.css';

// Create an axios instance with the backend URL
const apiClient = axios.create({
  baseURL: 'http://localhost:5000'
});

const SecurityPage = () => {
  console.log('SecurityPage component rendering');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [securityOverview, setSecurityOverview] = useState(null);
  const [runningCheck, setRunningCheck] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userApis, setUserApis] = useState([]);
  const { user } = useSelector(state => state.auth);
  const { token, isAuthenticated } = useSelector(state => state.auth);

  // Debug token information
  useEffect(() => {
    console.log('Auth state:', { token, isAuthenticated, user });
    console.log('Token from localStorage:', localStorage.getItem('token'));
    console.log('Token value:', localStorage.getItem('token'));
  }, [token, isAuthenticated, user]);

  const fetchUserApis = useCallback(async () => {
    // Get token directly from localStorage as a fallback
    const storedToken = localStorage.getItem('token');
    const tokenToUse = token || storedToken;

    if (!tokenToUse) {
      console.error('No authentication token found in Redux or localStorage');
      return;
    }

    try {
      // Fetch user APIs
      const response = await apiClient.get('/api/apis', {
        headers: { 
          'Authorization': `Bearer ${tokenToUse}`,
          'x-auth-token': tokenToUse
        }
      });
      console.log('User APIs response:', response.data);
      
      // Check if response.data is an array (direct data) or has a data property
      const apiData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      console.log('Processed API data:', apiData);
      setUserApis(apiData);
    } catch (err) {
      console.error('Error fetching user APIs:', err);
    }
  }, [token]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Get token directly from localStorage as a fallback
    const storedToken = localStorage.getItem('token');
    const tokenToUse = token || storedToken;

    if (!tokenToUse) {
      console.error('No authentication token found in Redux or localStorage');
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }

    console.log('Using token for security overview request:', tokenToUse.substring(0, 10) + '...');
    
    try {
      // Fetch security overview using the correct endpoint
      console.log('Fetching security overview from:', '/api/security/security-overview');
      const response = await apiClient.get('/api/security/security-overview', {
        headers: { 
          'Authorization': `Bearer ${tokenToUse}`,
          'x-auth-token': tokenToUse
        }
      });
      console.log('Security overview response:', response.data);
      
      // Check if response.data has a data property or is the data itself
      const overviewData = response.data.data || response.data;
      console.log('Processed security overview data:', overviewData);
      
      // Ensure apiSecurityDetails is always an array
      if (overviewData && !overviewData.apiSecurityDetails) {
        overviewData.apiSecurityDetails = [];
      }
      
      // Calculate security metrics
      if (overviewData && overviewData.apiSecurityDetails) {
        const details = overviewData.apiSecurityDetails;
        overviewData.totalApis = details.length;
        overviewData.secureApis = details.filter(api => api.securityStatus === 'Pass').length;
        overviewData.warningApis = details.filter(api => api.securityStatus === 'Warning').length;
        overviewData.failedApis = details.filter(api => api.securityStatus === 'Fail').length;
        overviewData.uncheckedApis = details.filter(api => !api.securityStatus || api.securityStatus === 'Unchecked').length;
        
        // Calculate average security score
        const scores = details.map(api => api.securityScore || 0);
        overviewData.averageScore = scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
          : 0;
      }
      
      setSecurityOverview(overviewData);
    } catch (err) {
      console.error('Error fetching security overview:', err);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      setError('Failed to fetch security overview. Please ensure the backend server is running and properly configured.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    // First fetch the user's APIs
    const fetchInitialData = async () => {
      try {
        console.log('Fetching initial data...');
        await fetchUserApis();
        // Then fetch the security overview
        await fetchData();
        console.log('Initial data fetched successfully');
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    
    fetchInitialData();
  }, [fetchData, fetchUserApis]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const handleRefresh = async () => {
    console.log('Refreshing security overview data...');
    setRefreshing(true);
    await fetchData();
  };

  const handleRunAllSecurityChecks = async () => {
    console.log('Attempting to run security checks...');
    console.log('Auth state:', { token, isAuthenticated, user });
    console.log('Token from localStorage:', localStorage.getItem('token') ? 'Token exists' : 'No token in localStorage');
    
    // Get token directly from localStorage as a fallback
    const storedToken = localStorage.getItem('token');
    const tokenToUse = token || storedToken;

    if (!tokenToUse) {
      console.error('No authentication token found in Redux or localStorage');
      setError('Authentication token not found. Please log in again.');
      return;
    }

    console.log('Using token for run all checks request:', tokenToUse.substring(0, 10) + '...');
    console.log('User APIs before running checks:', userApis);

    setRunningCheck(true);
    setError(null); // Clear any previous errors
    
    try {
      console.log('Running security checks for user APIs');
      console.log('Request URL:', 'http://localhost:5000/api/security/security-checks/run-user-apis');
      
      // Use axios instead of fetch for better error handling
      const response = await axios({
        method: 'post',
        url: 'http://localhost:5000/api/security/security-checks/run-user-apis',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'x-auth-token': tokenToUse,
          'Content-Type': 'application/json'
        },
        data: {}
      });
      
      console.log('Security checks response:', response.data);
      
      // Refresh the security overview after running checks
      console.log('Refreshing security overview after running checks...');
      await fetchData();
      
      // Show success message
      setError(null);
      console.log('Security checks completed successfully');
    } catch (error) {
      console.error('Error running security checks:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        setError(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        setError('No response received from server. Please check if the backend is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        setError(`Error: ${error.message}`);
      }
    } finally {
      setRunningCheck(false);
    }
  };

  // Render security status badge
  const renderSecurityBadge = (status) => {
    if (!status) return <Badge bg="secondary">Unknown</Badge>;
    
    switch (status) {
      case 'Pass':
        return <Badge bg="success">Secure</Badge>;
      case 'Warning':
        return <Badge bg="warning">Warning</Badge>;
      case 'Fail':
        return <Badge bg="danger">Vulnerable</Badge>;
      case 'Unchecked':
        return <Badge bg="secondary">Unchecked</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  if (loading && !securityOverview) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <h2><FaShieldAlt className="me-2" />API Security Dashboard</h2>
          <p>Loading security information...</p>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Security Data</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={handleRefresh}>
            <FaRedoAlt className="me-2" />
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  // If user has no APIs, show a message
  if (userApis.length === 0) {
    console.log('No APIs found for user, showing "No APIs Found" message');
    return (
      <Container className="mt-4">
        <div className="text-center">
          <h2><FaShieldAlt className="me-2" />API Security Dashboard</h2>
          <Alert variant="info">
            <Alert.Heading>No APIs Found</Alert.Heading>
            <p>You don't have any APIs to monitor. Add an API to start monitoring its security.</p>
            <div className="d-grid gap-2 d-sm-flex justify-content-sm-center mt-3">
              <Link to="/apis/add" className="btn btn-primary">
                <FaPlus className="me-2" /> Add API
              </Link>
            </div>
          </Alert>
        </div>
      </Container>
    );
  }

  // If security overview is empty but user has APIs, show a message to run security checks
  if ((!securityOverview || !securityOverview.apiSecurityDetails || securityOverview.apiSecurityDetails.length === 0) && userApis.length > 0) {
    console.log('User has APIs but no security checks have been run, showing "Run Security Checks" message');
    console.log('Security overview:', securityOverview);
    console.log('User APIs:', userApis);
    
    return (
      <Container className="mt-4">
        <Row className="mb-4">
          <Col>
            <h2><FaShieldAlt className="me-2" />API Security Dashboard</h2>
            <p>Monitor and manage the security of your APIs</p>
          </Col>
          <Col xs="auto" className="d-flex gap-2">
            <Button 
              variant="primary" 
              onClick={handleRunAllSecurityChecks}
              disabled={runningCheck}
            >
              {runningCheck ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Running Checks...
                </>
              ) : (
                <>
                  <FaSync className="me-2" />
                  Run Security Checks
                </>
              )}
            </Button>
          </Col>
        </Row>
        <Alert variant="info">
          <Alert.Heading>No Security Data Available</Alert.Heading>
          <p>You have {userApis.length} APIs, but no security checks have been run yet. Click the "Run Security Checks" button to analyze the security of your APIs.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2><FaShieldAlt className="me-2" />API Security Dashboard</h2>
          <p>Monitor and manage the security of your APIs</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button 
            variant="primary" 
            onClick={handleRunAllSecurityChecks}
            disabled={runningCheck}
          >
            {runningCheck ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Running Checks...
              </>
            ) : (
              <>
                <FaSync className="me-2" />
                Run Security Checks
              </>
            )}
          </Button>
        </Col>
      </Row>

      {/* Security Overview Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="security-card">
            <Card.Body className="text-center">
              <h3 className="mb-3">{securityOverview?.totalApis || 0}</h3>
              <Card.Title>Total APIs</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="security-card secure-card">
            <Card.Body className="text-center">
              <h3 className="mb-3">{securityOverview?.secureApis || 0}</h3>
              <Card.Title>Secure APIs</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="security-card warning-card">
            <Card.Body className="text-center">
              <h3 className="mb-3">{securityOverview?.warningApis || 0}</h3>
              <Card.Title>Warning APIs</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="security-card vulnerable-card">
            <Card.Body className="text-center">
              <h3 className="mb-3">{securityOverview?.failedApis || 0}</h3>
              <Card.Title>Vulnerable APIs</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Average Security Score */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Average Security Score</Card.Title>
              <div className="d-flex align-items-center">
                <div className="security-score-circle" style={{ 
                  backgroundColor: getScoreColor(securityOverview?.averageScore || 0) 
                }}>
                  <span>{securityOverview?.averageScore || 0}</span>
                </div>
                <div className="ms-3">
                  <p className="mb-1">
                    {securityOverview?.averageScore >= 80 ? (
                      <>
                        <FaCheckCircle className="text-success me-2" />
                        Your APIs are generally secure
                      </>
                    ) : securityOverview?.averageScore >= 50 ? (
                      <>
                        <FaExclamationTriangle className="text-warning me-2" />
                        Your APIs have some security issues
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="text-danger me-2" />
                        Your APIs have critical security vulnerabilities
                      </>
                    )}
                  </p>
                  <p className="text-muted mb-0">
                    {securityOverview?.uncheckedApis > 0 && 
                      `${securityOverview.uncheckedApis} APIs have not been checked for security.`
                    }
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* API Security Table */}
      <Card>
        <Card.Body>
          <Card.Title>API Security Status</Card.Title>
          <Table responsive>
            <thead>
              <tr>
                <th>API Name</th>
                <th>URL</th>
                <th>Security Status</th>
                <th>Security Score</th>
                <th>Last Checked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {securityOverview?.apiSecurityDetails?.length > 0 ? (
                securityOverview.apiSecurityDetails.map((item) => (
                  <tr key={item.api._id}>
                    <td>{item.api.name}</td>
                    <td>
                      <a href={item.api.url} target="_blank" rel="noopener noreferrer">
                        {item.api.url}
                      </a>
                    </td>
                    <td>
                      {renderSecurityBadge(item.securityStatus)}
                    </td>
                    <td>
                      <div className="security-score-pill" style={{ 
                        backgroundColor: getScoreColor(item.securityScore) 
                      }}>
                        {item.securityScore || 0}
                      </div>
                    </td>
                    <td>
                      {item.lastChecked ? new Date(item.lastChecked).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <Link to={`/security/${item.api._id}`} className="btn btn-sm btn-primary">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No API security data available. Run a security check to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SecurityPage; 