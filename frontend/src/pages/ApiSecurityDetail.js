import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  Container, Row, Col, Card, Button, Alert, 
  Badge, ListGroup, ProgressBar, Spinner 
} from 'react-bootstrap';
import { 
  FaShieldAlt, FaLock, FaUnlock, FaExclamationTriangle, 
  FaCheckCircle, FaTimesCircle, FaArrowLeft, FaSync 
} from 'react-icons/fa';
import '../styles/security.css';

// Create an axios instance with the backend URL
const apiClient = axios.create({
  baseURL: 'http://localhost:5000'
});

const ApiSecurityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [api, setApi] = useState(null);
  const [securityCheck, setSecurityCheck] = useState(null);
  const [runningCheck, setRunningCheck] = useState(false);
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  // Debug token information
  useEffect(() => {
    console.log('ApiSecurityDetail - Auth state:', { token, isAuthenticated });
    console.log('ApiSecurityDetail - Token from localStorage:', localStorage.getItem('token'));
  }, [token, isAuthenticated]);

  const fetchApiDetails = useCallback(async (tokenOverride = null) => {
    setLoading(true);
    setError(null);
    
    // Get token directly from localStorage as a fallback
    const storedToken = localStorage.getItem('token');
    const tokenToUse = tokenOverride || token || storedToken;

    if (!tokenToUse) {
      console.error('No authentication token found in Redux or localStorage');
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }

    console.log('Using token for data fetch request:', tokenToUse.substring(0, 10) + '...');
    
    try {
      // Fetch API details
      console.log(`Fetching API details for ID: ${id}`);
      const apiResponse = await apiClient.get(`/api/apis/${id}`, {
        headers: { 
          'Authorization': `Bearer ${tokenToUse}`,
          'x-auth-token': tokenToUse,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API details response:', apiResponse.data);
      setApi(apiResponse.data);
      
      // Fetch latest security check using the correct endpoint
      try {
        console.log(`Fetching security check for API ID: ${id}`);
        console.log(`Using endpoint: /api/security/api/${id}/security-check/latest`);
        
        const securityResponse = await apiClient.get(`/api/security/api/${id}/security-check/latest`, {
          headers: { 
            'Authorization': `Bearer ${tokenToUse}`,
            'x-auth-token': tokenToUse,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Security check response:', securityResponse.data);
        setSecurityCheck(securityResponse.data.data || securityResponse.data);
      } catch (securityErr) {
        console.error('Error fetching security check:', securityErr);
        console.log('Security check error status:', securityErr.response?.status);
        console.log('Security check error data:', securityErr.response?.data);
        
        // If 404, it means no security check has been run yet
        if (securityErr.response && securityErr.response.status === 404) {
          console.log('No security check found for this API yet');
          setSecurityCheck(null);
        } else {
          // For other errors, show a message but don't block the whole page
          console.error('Failed to fetch security check details:', securityErr);
        }
      }
    } catch (err) {
      console.error('Error fetching API security details:', err);
      setError('Failed to fetch API security details. Please ensure the backend server is running and properly configured.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (token) {
      fetchApiDetails();
    } else {
      // Try to get token from localStorage as a fallback
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log('Using token from localStorage instead of Redux');
        fetchApiDetails(storedToken);
      } else {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
      }
    }
  }, [fetchApiDetails, token]);

  const handleRunSecurityCheck = async () => {
    setRunningCheck(true);
    
    // Get token directly from localStorage as a fallback
    const storedToken = localStorage.getItem('token');
    const tokenToUse = token || storedToken;

    if (!tokenToUse) {
      console.error('No authentication token found in Redux or localStorage');
      setError('Authentication token not found. Please log in again.');
      setRunningCheck(false);
      return;
    }

    console.log('Using token for security check request:', tokenToUse.substring(0, 10) + '...');
    console.log('API ID:', id);
    
    try {
      console.log(`Running security check for API ${id}`);
      console.log(`Using endpoint: /api/security/api/${id}/security-check`);
      console.log('Request headers:', { 
        'Authorization': `Bearer ${tokenToUse}`,
        'x-auth-token': tokenToUse,
        'Content-Type': 'application/json'
      });
      
      // Use the correct endpoint from the backend
      const response = await apiClient.post(`/api/security/api/${id}/security-check`, {}, {
        headers: { 
          'Authorization': `Bearer ${tokenToUse}`,
          'x-auth-token': tokenToUse,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Security check completed successfully:', response.data);
      
      // Refresh data after security check
      console.log('Refreshing API details after security check');
      await fetchApiDetails(tokenToUse);
    } catch (err) {
      console.error('Error running security check:', err);
      console.error('Request headers:', err.config?.headers);
      console.error('Request URL:', err.config?.url);
      console.error('Request method:', err.config?.method);
      console.log('Error status:', err.response?.status);
      console.log('Error data:', err.response?.data);
      
      // Check if the error is due to lack of permissions
      if (err.response && err.response.status === 403) {
        setError('You do not have permission to run a security check for this API.');
      } else if (err.response && err.response.status === 404) {
        setError('API not found. It may have been deleted or you may not have permission to access it.');
      } else {
        setError('Failed to run security check. Please ensure the backend server is running and properly configured.');
      }
    } finally {
      setRunningCheck(false);
    }
  };

  const getScoreColor = (score) => {
    if (!score || isNaN(score)) return 'danger';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/security')}>
            <FaArrowLeft className="me-2" /> Back to Security Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!api) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <Alert.Heading>API Not Found</Alert.Heading>
          <p>The requested API could not be found. It may have been deleted or you may not have permission to view it.</p>
          <Button variant="outline-primary" onClick={() => navigate('/security')}>
            <FaArrowLeft className="me-2" /> Back to Security Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate('/security')}>
            <FaArrowLeft className="me-2" /> Back to Security Dashboard
          </Button>
        </Col>
        <Col className="text-end">
          <Button 
            variant="primary" 
            onClick={handleRunSecurityCheck} 
            disabled={runningCheck}
          >
            {runningCheck ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Running Check...
              </>
            ) : (
              <>
                <FaSync className="me-2" /> Run Security Check
              </>
            )}
          </Button>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header as="h5">
          <FaShieldAlt className="me-2" /> API Security Details
        </Card.Header>
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="mb-3">
                <h4 className="mb-2">{api.name}</h4>
                <div className="d-flex align-items-center mb-2">
                  <Badge bg="secondary" className="me-2">URL</Badge>
                  <span className="text-muted text-break">{api.url}</span>
                </div>
                <div className="d-flex align-items-center">
                  <Badge bg="info" className="me-2">Method</Badge>
                  <span>{api.method}</span>
                </div>
                {api.description && (
                  <div className="mt-2">
                    <Badge bg="secondary" className="me-2">Description</Badge>
                    <span>{api.description}</span>
                  </div>
                )}
              </div>
            </Col>
            <Col md={4} className="text-center">
              {securityCheck ? (
                <div className="security-score-container">
                  <div className={`security-score-circle score-${getScoreColor(securityCheck.securityCheck?.overallSecurityScore)}`}>
                    <div className="score-value">
                      {!securityCheck.securityCheck?.overallSecurityScore || isNaN(securityCheck.securityCheck?.overallSecurityScore) 
                        ? '0' 
                        : Math.round(securityCheck.securityCheck.overallSecurityScore)}
                    </div>
                    <div className="score-label">Security Score</div>
                  </div>
                  <div className="mt-3 text-muted">
                    <small>Last checked: {securityCheck.securityCheck?.checkDate ? new Date(securityCheck.securityCheck.checkDate).toLocaleString() : 'Invalid Date'}</small>
                  </div>
                  <div className="mt-2">
                    {!securityCheck.securityCheck?.overallSecurityScore || isNaN(securityCheck.securityCheck?.overallSecurityScore) ? (
                      <Badge bg="danger">No Score Available</Badge>
                    ) : securityCheck.securityCheck.overallSecurityScore >= 80 ? (
                      <Badge bg="success">Excellent Security</Badge>
                    ) : securityCheck.securityCheck.overallSecurityScore >= 60 ? (
                      <Badge bg="warning">Needs Improvement</Badge>
                    ) : (
                      <Badge bg="danger">Critical Issues</Badge>
                    )}
                  </div>
                </div>
              ) : (
                <Alert variant="warning" className="mb-0">
                  <FaExclamationTriangle className="me-2" />
                  No security check has been run yet
                </Alert>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {securityCheck && (
        <>
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header as="h5">
                  <FaLock className="me-2" /> SSL Certificate
                </Card.Header>
                <Card.Body>
                  {securityCheck.sslCheck ? (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6>Certificate Status</h6>
                        {securityCheck.sslCheck.valid ? (
                          <Badge bg="success"><FaCheckCircle className="me-1" /> Valid</Badge>
                        ) : (
                          <Badge bg="danger"><FaTimesCircle className="me-1" /> Invalid</Badge>
                        )}
                      </div>
                      
                      <ListGroup variant="flush">
                        <ListGroup.Item>
                          <strong>Score:</strong>{' '}
                          <Badge bg={getScoreColor(securityCheck.sslCheck.score)}>
                            {securityCheck.sslCheck.score}
                          </Badge>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Issuer:</strong> {securityCheck.sslCheck.issuer}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Expires:</strong> {new Date(securityCheck.sslCheck.expiresAt).toLocaleDateString()}
                          {securityCheck.sslCheck.daysUntilExpiration < 30 && (
                            <Badge bg="warning" className="ms-2">Expires in {securityCheck.sslCheck.daysUntilExpiration} days</Badge>
                          )}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Protocol:</strong> {securityCheck.sslCheck.protocol}
                        </ListGroup.Item>
                        {securityCheck.sslCheck.details?.error && (
                          <ListGroup.Item className="text-danger">
                            <strong>Error:</strong> {securityCheck.sslCheck.details.error}
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </>
                  ) : (
                    <Alert variant="warning">
                      <FaExclamationTriangle className="me-2" />
                      No SSL certificate information available
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header as="h5">
                  <FaShieldAlt className="me-2" /> HTTP Headers
                </Card.Header>
                <Card.Body>
                  {securityCheck.headerCheck ? (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6>Header Security Score</h6>
                        <div>
                          <ProgressBar 
                            variant={getScoreColor(securityCheck.headerCheck.score)} 
                            now={securityCheck.headerCheck.score} 
                            label={`${securityCheck.headerCheck.score}%`}
                            style={{ width: '100px', height: '20px' }}
                          />
                        </div>
                      </div>
                      
                      <ListGroup variant="flush">
                        {Object.entries(securityCheck.headerCheck.securityHeaders || {}).map(([header, info], index) => (
                          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{header}</strong>
                              <p className="mb-0 text-muted small">{info.description}</p>
                            </div>
                            {info.present ? (
                              <Badge bg="success"><FaCheckCircle className="me-1" /> Present</Badge>
                            ) : (
                              <Badge bg="danger"><FaTimesCircle className="me-1" /> Missing</Badge>
                            )}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                      
                      {securityCheck.headerCheck.details?.recommendations?.length > 0 && (
                        <div className="mt-3">
                          <h6>Recommendations:</h6>
                          <ListGroup variant="flush">
                            {securityCheck.headerCheck.details.recommendations.map((rec, index) => (
                              <ListGroup.Item key={index}>
                                <strong>{rec.header}:</strong> {rec.recommendation}
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </div>
                      )}
                    </>
                  ) : (
                    <Alert variant="warning">
                      <FaExclamationTriangle className="me-2" />
                      No HTTP header security information available
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="mb-4">
            <Card.Header as="h5">
              <FaExclamationTriangle className="me-2" /> Vulnerability Scan
            </Card.Header>
            <Card.Body>
              {securityCheck.vulnerabilityCheck ? (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Vulnerability Score</h6>
                    <div>
                      <ProgressBar 
                        variant={getScoreColor(securityCheck.vulnerabilityCheck.score)} 
                        now={securityCheck.vulnerabilityCheck.score} 
                        label={`${securityCheck.vulnerabilityCheck.score}%`}
                        style={{ width: '100px', height: '20px' }}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <Row>
                      <Col xs={6} md={3}>
                        <div className="text-center">
                          <h6>Critical</h6>
                          <Badge bg="danger" pill>{securityCheck.vulnerabilityCheck.criticalCount || 0}</Badge>
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="text-center">
                          <h6>High</h6>
                          <Badge bg="warning" pill>{securityCheck.vulnerabilityCheck.highCount || 0}</Badge>
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="text-center">
                          <h6>Medium</h6>
                          <Badge bg="info" pill>{securityCheck.vulnerabilityCheck.mediumCount || 0}</Badge>
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="text-center">
                          <h6>Low</h6>
                          <Badge bg="secondary" pill>{securityCheck.vulnerabilityCheck.lowCount || 0}</Badge>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  
                  {securityCheck.vulnerabilityCheck.vulnerabilities.length > 0 ? (
                    <ListGroup variant="flush">
                      {securityCheck.vulnerabilityCheck.vulnerabilities.map((vuln, index) => (
                        <ListGroup.Item key={index}>
                          <div className="d-flex justify-content-between">
                            <h6>{vuln.name}</h6>
                            <Badge bg={
                              vuln.severity.toLowerCase() === 'critical' ? 'danger' :
                              vuln.severity.toLowerCase() === 'high' ? 'warning' :
                              vuln.severity.toLowerCase() === 'medium' ? 'info' : 'secondary'
                            }>
                              {vuln.severity}
                            </Badge>
                          </div>
                          <p className="mb-2">{vuln.description}</p>
                          {vuln.remediation && (
                            <Alert variant="info" className="mb-0">
                              <strong>Remediation:</strong> {vuln.remediation}
                            </Alert>
                          )}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <Alert variant="success">
                      <FaCheckCircle className="me-2" />
                      No vulnerabilities detected
                    </Alert>
                  )}
                </>
              ) : (
                <Alert variant="warning">
                  <FaExclamationTriangle className="me-2" />
                  No vulnerability scan information available
                </Alert>
              )}
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5">
              <FaShieldAlt className="me-2" /> Security Recommendations
            </Card.Header>
            <Card.Body>
              {securityCheck.recommendations && securityCheck.recommendations.length > 0 ? (
                <ListGroup variant="flush">
                  {securityCheck.recommendations.map((rec, index) => (
                    <ListGroup.Item key={index} className="security-recommendation">
                      <div className="d-flex">
                        <div className={`recommendation-priority priority-${rec.priority.toLowerCase()}`}>
                          {rec.priority}
                        </div>
                        <div className="ms-3">
                          <h6>{rec.title}</h6>
                          <p className="mb-2">{rec.description}</p>
                          {rec.implementationSteps && (
                            <div className="recommendation-action">
                              <strong>Implementation:</strong> {rec.implementationSteps}
                            </div>
                          )}
                          {rec.resources && rec.resources.length > 0 && (
                            <div className="recommendation-resources mt-2">
                              <strong>Resources:</strong>
                              <ul className="mb-0">
                                {rec.resources.map((resource, i) => (
                                  <li key={i}>
                                    <a href={resource} target="_blank" rel="noopener noreferrer">{resource}</a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="info">
                  <FaCheckCircle className="me-2" />
                  No security recommendations at this time
                </Alert>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default ApiSecurityDetail; 