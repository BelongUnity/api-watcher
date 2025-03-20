import React from 'react';
import { Alert, Card, Badge, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowUp, 
  faArrowDown, 
  faExclamationCircle, 
  faCheckCircle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';

const TrendAnalysis = ({ data, metric, startDate, endDate }) => {
  if (!data) {
    return <Alert variant="info">No trend data available.</Alert>;
  }

  const { 
    trend_direction, 
    trend_percentage, 
    anomalies, 
    is_degrading,
    trend_description,
    comparison_points
  } = data;

  const getMetricLabel = (metricName) => {
    switch (metricName) {
      case 'response_time':
        return 'Response Time';
      case 'uptime':
        return 'Uptime';
      case 'request_count':
        return 'Request Count';
      case 'success_rate':
        return 'Success Rate';
      default:
        return metricName;
    }
  };

  const getTrendIcon = () => {
    if (trend_direction === 'up') {
      return metric === 'response_time' ? 
        <FontAwesomeIcon icon={faArrowUp} className="text-danger" /> : 
        <FontAwesomeIcon icon={faArrowUp} className="text-success" />;
    } else if (trend_direction === 'down') {
      return metric === 'response_time' ? 
        <FontAwesomeIcon icon={faArrowDown} className="text-success" /> : 
        <FontAwesomeIcon icon={faArrowDown} className="text-danger" />;
    } else {
      return <FontAwesomeIcon icon={faInfoCircle} className="text-info" />;
    }
  };

  const getTrendClass = () => {
    if (is_degrading) {
      return 'text-danger';
    } else if (trend_direction === 'stable') {
      return 'text-info';
    } else {
      return 'text-success';
    }
  };

  const formatValue = (value, metricType) => {
    if (metricType === 'response_time') {
      return `${value.toFixed(2)} ms`;
    } else if (metricType === 'uptime' || metricType === 'success_rate') {
      return `${value.toFixed(2)}%`;
    } else {
      return value;
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h5 className="mb-3">Trend Analysis for {getMetricLabel(metric)}</h5>
        
        <div className="d-flex align-items-center mb-3">
          <div className="me-3">
            {getTrendIcon()}
          </div>
          <div>
            <h4 className={getTrendClass()}>
              {trend_percentage > 0 ? '+' : ''}{trend_percentage.toFixed(2)}%
            </h4>
            <p className="mb-0">{trend_description}</p>
          </div>
        </div>
        
        {comparison_points && comparison_points.length >= 2 && (
          <div className="d-flex justify-content-between small text-muted mb-3">
            <div>
              <div>Start: {formatValue(comparison_points[0].value, metric)}</div>
              <div>{format(new Date(comparison_points[0].timestamp), 'MMM d, yyyy')}</div>
            </div>
            <div className="text-end">
              <div>Current: {formatValue(comparison_points[1].value, metric)}</div>
              <div>{format(new Date(comparison_points[1].timestamp), 'MMM d, yyyy')}</div>
            </div>
          </div>
        )}
      </div>

      {anomalies && anomalies.length > 0 && (
        <div>
          <h6 className="mb-2">
            <FontAwesomeIcon icon={faExclamationCircle} className="text-warning me-2" />
            Detected Anomalies
          </h6>
          <ListGroup variant="flush" className="border rounded">
            {anomalies.map((anomaly, index) => (
              <ListGroup.Item key={index} className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Badge bg={anomaly.severity === 'high' ? 'danger' : anomaly.severity === 'medium' ? 'warning' : 'info'} className="me-2">
                      {anomaly.severity}
                    </Badge>
                    {anomaly.description}
                  </div>
                  <small className="text-muted">
                    {format(new Date(anomaly.timestamp), 'MMM d, h:mm a')}
                  </small>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}

      {(!anomalies || anomalies.length === 0) && (
        <div className="text-center p-3 border rounded">
          <FontAwesomeIcon icon={faCheckCircle} className="text-success mb-2" size="2x" />
          <p className="mb-0">No anomalies detected in the selected time period.</p>
        </div>
      )}
    </div>
  );
};

export default TrendAnalysis; 