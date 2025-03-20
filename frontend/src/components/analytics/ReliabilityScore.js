import React from 'react';
import { Alert, Row, Col, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationTriangle, 
  faClock, 
  faExchangeAlt 
} from '@fortawesome/free-solid-svg-icons';

const ReliabilityScore = ({ data }) => {
  if (!data) {
    return <Alert variant="info">No reliability data available.</Alert>;
  }

  const { 
    uptime_percentage, 
    success_rate, 
    avg_response_time, 
    reliability_score,
    total_requests,
    total_failures
  } = data;

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  // Get description based on score
  const getScoreDescription = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Poor';
    return 'Critical';
  };

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className={`display-4 text-${getScoreColor(reliability_score)}`}>
          {Math.round(reliability_score)}%
        </h2>
        <p className="lead">{getScoreDescription(reliability_score)} Reliability</p>
      </div>

      <Row className="mb-3">
        <Col>
          <div className="d-flex align-items-center mb-2">
            <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
            <span>Uptime</span>
          </div>
          <ProgressBar 
            variant={getScoreColor(uptime_percentage)} 
            now={uptime_percentage} 
            label={`${uptime_percentage.toFixed(2)}%`} 
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <div className="d-flex align-items-center mb-2">
            <FontAwesomeIcon icon={faExchangeAlt} className="text-primary me-2" />
            <span>Success Rate</span>
          </div>
          <ProgressBar 
            variant={getScoreColor(success_rate)} 
            now={success_rate} 
            label={`${success_rate.toFixed(2)}%`} 
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs={6}>
          <div className="d-flex align-items-center mb-2">
            <FontAwesomeIcon icon={faClock} className="text-info me-2" />
            <span>Avg Response</span>
          </div>
          <h5>{avg_response_time.toFixed(2)} ms</h5>
        </Col>
        <Col xs={6}>
          <div className="d-flex align-items-center mb-2">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning me-2" />
            <span>Failures</span>
          </div>
          <h5>{total_failures} / {total_requests}</h5>
        </Col>
      </Row>
    </div>
  );
};

export default ReliabilityScore; 