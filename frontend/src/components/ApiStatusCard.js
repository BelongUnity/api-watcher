import React from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaExclamationTriangle } from 'react-icons/fa';
import { format } from 'date-fns';

const ApiStatusCard = ({ api }) => {
  // Get the latest status for this API
  const getStatus = () => {
    // If we have a status property directly on the API, use it
    if (api.status) return api.status;
    
    // Otherwise, determine status based on the latest check
    // In our mock data, we don't have this directly on the API object
    return 'unknown';
  };

  const getStatusIcon = () => {
    const status = getStatus();
    switch (status) {
      case 'up':
        return <FaCheckCircle className="text-success fs-4" />;
      case 'down':
        return <FaTimesCircle className="text-danger fs-4" />;
      case 'degraded':
        return <FaExclamationTriangle className="text-warning fs-4" />;
      default:
        return <FaQuestionCircle className="text-secondary fs-4" />;
    }
  };

  const getStatusClass = () => {
    const status = getStatus();
    switch (status) {
      case 'up':
        return 'border-success bg-success bg-opacity-10';
      case 'down':
        return 'border-danger bg-danger bg-opacity-10';
      case 'degraded':
        return 'border-warning bg-warning bg-opacity-10';
      default:
        return 'border-secondary bg-secondary bg-opacity-10';
    }
  };

  const getResponseTimeClass = () => {
    if (!api.responseTime || getStatus() !== 'up') return 'text-secondary';
    
    // Default expected response time if not specified
    const expectedResponseTime = api.expectedResponseTime || 200;
    
    if (api.responseTime <= expectedResponseTime) {
      return 'text-success';
    } else if (api.responseTime <= expectedResponseTime * 1.5) {
      return 'text-warning';
    } else {
      return 'text-danger';
    }
  };

  return (
    <div className={`card h-100 border-start border-4 ${getStatusClass()}`}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="card-title mb-1">{api.name}</h5>
            <div className="d-flex align-items-center small text-muted">
              <a 
                href={api.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-decoration-none d-flex align-items-center"
              >
                {api.url.length > 30 ? `${api.url.substring(0, 30)}...` : api.url}
                <FaExternalLinkAlt className="ms-1 small" />
              </a>
            </div>
          </div>
          {getStatusIcon()}
        </div>
        
        <div className="row row-cols-2 g-3 mb-3">
          <div className="col">
            <p className="small text-muted mb-1">Status</p>
            <p className="fw-medium text-capitalize">
              {getStatus() === 'up' && <span className="text-success">Up</span>}
              {getStatus() === 'down' && <span className="text-danger">Down</span>}
              {getStatus() === 'degraded' && <span className="text-warning">Degraded</span>}
              {getStatus() === 'unknown' && <span className="text-secondary">Unknown</span>}
            </p>
          </div>
          <div className="col">
            <p className="small text-muted mb-1">Uptime</p>
            <p className="fw-medium">{api.uptime ? `${Math.round(api.uptime)}%` : 'N/A'}</p>
          </div>
          <div className="col">
            <p className="small text-muted mb-1">Response Time</p>
            <p className={`fw-medium ${getResponseTimeClass()}`}>
              {api.responseTime ? `${api.responseTime} ms` : 'N/A'}
            </p>
          </div>
          <div className="col">
            <p className="small text-muted mb-1">Last Checked</p>
            <p className="fw-medium d-flex align-items-center">
              <FaClock className="me-1 small text-muted" />
              {api.lastChecked 
                ? format(new Date(api.lastChecked), 'HH:mm:ss')
                : api.updatedAt 
                  ? format(new Date(api.updatedAt), 'HH:mm:ss')
                  : 'Never'
              }
            </p>
          </div>
        </div>
        
        {api.tags && api.tags.length > 0 && (
          <div className="mb-3">
            <div className="d-flex flex-wrap gap-1">
              {api.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="badge bg-primary bg-opacity-10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="d-flex justify-content-end">
          <Link 
            to={`/api/${api._id}`}
            className="btn btn-sm btn-link text-decoration-none"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApiStatusCard;