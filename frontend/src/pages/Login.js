import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, resetAuthState } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { email, password } = formData;
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector(state => state.auth);

  // Memoize the navigation function to prevent infinite loops
  const navigateToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Handle authentication state changes
  useEffect(() => {
    // Only redirect if coming directly to login page and already authenticated
    if (isAuthenticated && location.pathname === '/login') {
      console.log('User is authenticated, redirecting to dashboard');
      navigateToDashboard();
    }
  }, [isAuthenticated, navigateToDashboard, location.pathname]);

  // Handle errors separately to avoid infinite loops
  useEffect(() => {
    if (error) {
      console.error('Login error:', error);
      toast.error(error);
      dispatch(resetAuthState());
    }
  }, [error, dispatch]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    console.log('Attempting login with:', { email, password });
    
    // For testing purposes, hardcode the test credentials
    if (process.env.NODE_ENV === 'development') {
      console.log('Using test credentials for development');
      dispatch(login({ 
        email: 'test@mail.com', 
        password: 'test123' 
      }));
    } else {
      dispatch(login({ email, password }));
    }
  };

  return (
    <div className="container mt-5 fade-in">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <h2 className="mb-3">Welcome Back</h2>
                <p className="text-muted">Log in to your account to access the dashboard</p>
                {process.env.NODE_ENV === 'development' && (
                  <div className="alert alert-info">
                    <strong>Test Account:</strong> test@mail.com / test123
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <div className="d-flex justify-content-between">
                    <label htmlFor="password" className="form-label">Password</label>
                    <Link to="/forgot-password" className="small">Forgot Password?</Link>
                  </div>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <i className="fas fa-spinner fa-spin me-2"></i> Logging in...
                    </span>
                  ) : (
                    'Log In'
                  )}
                </button>
              </form>
              
              <div className="text-center mt-4">
                <p>
                  Don't have an account? <Link to="/register" className="fw-bold">Register</Link>
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-muted">
              <i className="fas fa-shield-alt me-1"></i> Secure login protected by encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 