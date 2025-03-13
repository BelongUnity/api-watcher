import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { createApi, fetchApiById, updateApi, resetApiState } from '../redux/slices/apiSlice';

const ApiForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'GET',
    headers: '',
    body: '',
    expectedStatus: '200',
    checkInterval: '5',
    timeout: '5000',
    notifyOnFailure: true,
    notifyOnRecovery: true
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, success, currentApi } = useSelector(state => state.api);

  useEffect(() => {
    // If editing an existing API, fetch its details
    if (isEditMode) {
      dispatch(fetchApiById(id));
    }
    
    // Cleanup on component unmount
    return () => {
      dispatch(resetApiState());
    };
  }, [isEditMode, id, dispatch]);

  useEffect(() => {
    // If we have the API data and we're in edit mode, populate the form
    if (isEditMode && currentApi) {
      setFormData({
        name: currentApi.name || '',
        url: currentApi.url || '',
        method: currentApi.method || 'GET',
        headers: currentApi.headers ? JSON.stringify(currentApi.headers, null, 2) : '',
        body: currentApi.body || '',
        expectedStatus: currentApi.expectedStatus?.toString() || '200',
        checkInterval: currentApi.checkInterval?.toString() || '5',
        timeout: currentApi.timeout?.toString() || '5000',
        notifyOnFailure: currentApi.notifyOnFailure !== false,
        notifyOnRecovery: currentApi.notifyOnRecovery !== false
      });
    }
  }, [isEditMode, currentApi]);

  useEffect(() => {
    // Handle success state
    if (success) {
      toast.success(isEditMode ? 'API updated successfully!' : 'API added successfully!');
      navigate('/');
      dispatch(resetApiState());
    }
  }, [success, isEditMode, navigate, dispatch]);

  useEffect(() => {
    // Handle error state
    if (error) {
      toast.error(error);
      dispatch(resetApiState());
    }
  }, [error, dispatch]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    try {
      // Validate and parse headers if provided
      const parsedData = {
        ...formData,
        headers: formData.headers ? JSON.parse(formData.headers) : {},
        expectedStatus: parseInt(formData.expectedStatus, 10),
        checkInterval: parseInt(formData.checkInterval, 10),
        timeout: parseInt(formData.timeout, 10)
      };
      
      if (isEditMode) {
        dispatch(updateApi({ id, apiData: parsedData }));
      } else {
        dispatch(createApi(parsedData));
      }
    } catch (err) {
      toast.error('Invalid JSON format in headers');
    }
  };

  return (
    <div className="container mt-4 fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">{isEditMode ? 'Edit API' : 'Add New API'}</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">API Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter a descriptive name"
                    required
                  />
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="url" className="form-label">API URL</label>
                  <input
                    type="url"
                    className="form-control"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://api.example.com/endpoint"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="method" className="form-label">HTTP Method</label>
                  <select
                    className="form-control"
                    id="method"
                    name="method"
                    value={formData.method}
                    onChange={handleChange}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="expectedStatus" className="form-label">Expected Status Code</label>
                  <input
                    type="number"
                    className="form-control"
                    id="expectedStatus"
                    name="expectedStatus"
                    value={formData.expectedStatus}
                    onChange={handleChange}
                    min="100"
                    max="599"
                    required
                  />
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="timeout" className="form-label">Timeout (ms)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="timeout"
                    name="timeout"
                    value={formData.timeout}
                    onChange={handleChange}
                    min="1000"
                    max="30000"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label htmlFor="headers" className="form-label">Headers (JSON format)</label>
                  <textarea
                    className="form-control"
                    id="headers"
                    name="headers"
                    value={formData.headers}
                    onChange={handleChange}
                    rows="3"
                    placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                  ></textarea>
                  <small className="form-text">Enter headers in valid JSON format or leave empty</small>
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label htmlFor="body" className="form-label">Request Body</label>
                  <textarea
                    className="form-control"
                    id="body"
                    name="body"
                    value={formData.body}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Request body (for POST, PUT, PATCH methods)"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="checkInterval" className="form-label">Check Interval (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="checkInterval"
                    name="checkInterval"
                    value={formData.checkInterval}
                    onChange={handleChange}
                    min="1"
                    max="60"
                    required
                  />
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="mb-4 d-flex align-items-center">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="notifyOnFailure"
                      name="notifyOnFailure"
                      checked={formData.notifyOnFailure}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="notifyOnFailure">
                      Notify on Failure
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="mb-4 d-flex align-items-center">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="notifyOnRecovery"
                      name="notifyOnRecovery"
                      checked={formData.notifyOnRecovery}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="notifyOnRecovery">
                      Notify on Recovery
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    {isEditMode ? 'Updating...' : 'Adding...'}
                  </span>
                ) : (
                  isEditMode ? 'Update API' : 'Add API'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApiForm; 