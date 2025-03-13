import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, resetAuthState } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { name, email, password, confirmPassword } = formData;
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error, success } = useSelector(state => state.auth);

  // Memoize navigation function to prevent re-renders
  const navigateToDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Handle authentication state
  useEffect(() => {
    // Only redirect if user is authenticated and directly accessing register page
    if (isAuthenticated && location.pathname === '/register') {
      navigateToDashboard();
    }
  }, [isAuthenticated, navigateToDashboard, location.pathname]);

  // Handle success state - separate from auth state handling
  useEffect(() => {
    if (success) {
      toast.success('Registration successful! Please log in.');
      navigate('/login');
      // Reset auth state after navigation
      setTimeout(() => dispatch(resetAuthState()), 100);
    }
  }, [success, navigate, dispatch]);

  // Handle error state - separate effect
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetAuthState());
    }
  }, [error, dispatch]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    dispatch(register({ name, email, password }));
  };

  return (
    <div className="container mt-5 fade-in">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <h2 className="mb-3">Create an Account</h2>
                <p className="text-muted">Join API Watcher to monitor your APIs in real-time</p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div className="mb-3">
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
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    minLength="6"
                  />
                  <small className="form-text">Password must be at least 6 characters</small>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    minLength="6"
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <i className="fas fa-spinner fa-spin mr-2"></i> Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
              
              <div className="text-center mt-4">
                <p>
                  Already have an account? <Link to="/login" className="fw-bold">Log In</Link>
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-muted">
              <i className="fas fa-lock mr-1"></i> Your information is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 