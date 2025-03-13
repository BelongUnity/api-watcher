import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchApis } from '../redux/slices/apiSlice';
import ApiStatusCard from './ApiStatusCard';
import ApiStatusChart from './ApiStatusChart';
import { FaPlus, FaFilter, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { apiManagementAPI } from '../utils/api';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { apis, loading, error } = useSelector((state) => state.api);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, up, down
  const [sortBy, setSortBy] = useState('name'); // name, status, responseTime
  const [statusData, setStatusData] = useState({ up: 0, down: 0, degraded: 0, unknown: 0 });

  useEffect(() => {
    dispatch(fetchApis());
    
    // Set up polling for API status updates
    const interval = setInterval(() => {
      dispatch(fetchApis());
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [dispatch]);

  // Process API data when it changes
  useEffect(() => {
    if (apis && apis.length > 0) {
      // Calculate status counts directly from the APIs array
      const up = apis.filter(api => api.status === 'up').length;
      const down = apis.filter(api => api.status === 'down').length;
      const degraded = apis.filter(api => api.status === 'degraded').length;
      const unknown = apis.filter(api => api.status === 'unknown' || !api.status).length;
      
      setStatusData({ up, down, degraded, unknown });
      
      // Also fetch the latest status for each API using the apiManagementAPI
      apiManagementAPI.getAllStatus()
        .then(response => {
          const statusData = response.data;
          
          // Ensure statusData is an array before using forEach
          if (!Array.isArray(statusData)) {
            console.error('Status data is not an array:', statusData);
            return;
          }
          
          console.log('Latest API status data:', statusData);
        })
        .catch(error => {
          console.error('Error fetching status data:', error);
        });
    }
  }, [apis]);

  // Filter and sort APIs
  const filteredApis = apis.filter(api => {
    // Apply search filter
    const matchesSearch = api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          api.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    let apiStatus = 'unknown';
    if (api.status) {
      apiStatus = api.status;
    }
    
    const matchesFilter = filter === 'all' || apiStatus === filter;
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    // Apply sorting
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'status') {
      const statusA = a.status || 'unknown';
      const statusB = b.status || 'unknown';
      return statusA.localeCompare(statusB);
    } else if (sortBy === 'responseTime') {
      const rtA = a.responseTime || 0;
      const rtB = b.responseTime || 0;
      return rtA - rtB;
    }
    return 0;
  });

  // Calculate statistics
  const totalApis = apis.length;
  const { up: apisUp, down: apisDown, degraded: apisDegraded, unknown: apisUnknown } = statusData;
  
  // Calculate average response time for up APIs
  const upApis = apis.filter(api => api.status === 'up' && api.responseTime);
  const avgResponseTime = upApis.length > 0
    ? Math.round(upApis.reduce((sum, api) => sum + api.responseTime, 0) / upApis.length)
    : 0;

  if (loading && apis.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '16rem' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && apis.length === 0) {
    return (
      <div className="alert alert-danger" role="alert">
        <strong>Error!</strong> {error}
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold">API Dashboard</h1>
        <Link 
          to="/api/new" 
          className="btn btn-primary d-flex align-items-center"
        >
          <FaPlus className="me-2" /> Add New API
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3 mb-md-0">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">Total APIs</h6>
              <p className="fs-2 fw-bold">{totalApis}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3 mb-md-0">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">APIs Up</h6>
              <p className="fs-2 fw-bold text-success">{apisUp}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3 mb-md-0">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">APIs Down</h6>
              <p className="fs-2 fw-bold text-danger">{apisDown}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">Avg Response Time</h6>
              <p className="fs-2 fw-bold text-primary">{avgResponseTime} ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Chart */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">Status Overview</h5>
          <div style={{ height: '16rem' }}>
            <ApiStatusChart 
              up={apisUp} 
              down={apisDown}
              degraded={apisDegraded}
              unknown={apisUnknown} 
            />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="row mb-4 align-items-center">
        <div className="col-md-8 mb-3 mb-md-0">
          <div className="d-flex gap-3">
            <div className="position-relative flex-grow-1">
              <input
                type="text"
                placeholder="Search APIs..."
                className="form-control ps-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            
            <div className="d-flex align-items-center">
              <FaFilter className="me-2 text-muted" />
              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="degraded">Degraded</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
            <option value="responseTime">Sort by Response Time</option>
          </select>
        </div>
      </div>

      {/* API List */}
      {filteredApis.length === 0 ? (
        <div className="card text-center p-4">
          <p className="text-muted fs-5">
            {apis.length === 0 
              ? "No APIs found. Add your first API to start monitoring!" 
              : "No APIs match your search criteria."}
          </p>
          {apis.length === 0 && (
            <div className="text-center">
              <Link 
                to="/api/new" 
                className="btn btn-primary mt-3"
              >
                Add New API
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredApis.map(api => (
            <div className="col" key={api.id || api._id}>
              <ApiStatusCard api={api} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 