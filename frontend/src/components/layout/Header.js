import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import AlertBadge from '../alerts/AlertBadge';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';

  return (
    <header className={`bg-white shadow-sm ${isLandingPage ? 'landing-header' : ''}`}>
      <div className="container py-3">
        <nav className="d-flex justify-content-between align-items-center">
          {/* Logo */}
          <Link to="/" className="text-decoration-none">
            <div className="d-flex align-items-center">
              <div className="me-2">
                <i className="fas fa-chart-line" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <h1 className="m-0" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                API Watcher
              </h1>
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="d-md-none btn btn-link p-0"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`} style={{ fontSize: '1.25rem' }}></i>
          </button>

          {/* Desktop Navigation */}
          <div className="d-none d-md-flex align-items-center">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-link text-decoration-none me-3">
                  <i className="fas fa-tachometer-alt me-1"></i> Dashboard
                </Link>
                <Link to="/analytics" className="btn btn-link text-decoration-none me-3">
                  <i className="fas fa-chart-bar me-1"></i> Analytics
                </Link>
                <Link to="/security" className="btn btn-link text-decoration-none me-3">
                  <i className="fas fa-shield-alt me-1"></i> Security
                </Link>
                <Link to="/alerts" className="btn btn-link text-decoration-none me-3">
                  <AlertBadge standalone={false} />
                  <span className="ms-1">Alerts</span>
                </Link>
                <Link to="/api/new" className="btn btn-outline-primary me-3">
                  <i className="fas fa-plus-circle me-1"></i> Add API
                </Link>
                <div className="dropdown">
                  <button 
                    className="btn btn-link dropdown-toggle text-decoration-none" 
                    type="button" 
                    id="userDropdown" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <i className="fas fa-user-circle me-1"></i>
                    {user?.name || 'Account'}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li>
                      <Link to="/profile" className="dropdown-item">
                        <i className="fas fa-user me-2"></i> Profile
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button onClick={handleLogout} className="dropdown-item text-danger">
                        <i className="fas fa-sign-out-alt me-2"></i> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary me-3">
                  <i className="fas fa-sign-in-alt me-1"></i> Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  <i className="fas fa-user-plus me-1"></i> Register
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="d-md-none mt-3 pb-2 slide-in-up">
            <div className="d-flex flex-column">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="btn btn-link text-decoration-none text-start py-2" onClick={toggleMenu}>
                    <i className="fas fa-tachometer-alt me-2"></i> Dashboard
                  </Link>
                  <Link to="/analytics" className="btn btn-link text-decoration-none text-start py-2" onClick={toggleMenu}>
                    <i className="fas fa-chart-bar me-2"></i> Analytics
                  </Link>
                  <Link to="/security" className="btn btn-link text-decoration-none text-start py-2" onClick={toggleMenu}>
                    <i className="fas fa-shield-alt me-2"></i> Security
                  </Link>
                  <Link to="/alerts" className="btn btn-link text-decoration-none text-start py-2" onClick={toggleMenu}>
                    <div className="d-flex align-items-center">
                      <AlertBadge standalone={false} />
                      <span className="ms-2">Alerts</span>
                    </div>
                  </Link>
                  <Link to="/api/new" className="btn btn-link text-decoration-none text-start py-2" onClick={toggleMenu}>
                    <i className="fas fa-plus-circle me-2"></i> Add API
                  </Link>
                  <Link to="/profile" className="btn btn-link text-decoration-none text-start py-2" onClick={toggleMenu}>
                    <i className="fas fa-user me-2"></i> Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="btn btn-link text-decoration-none text-start text-danger py-2"
                  >
                    <i className="fas fa-sign-out-alt me-2"></i> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-link text-decoration-none text-start py-2" onClick={toggleMenu}>
                    <i className="fas fa-sign-in-alt me-2"></i> Login
                  </Link>
                  <Link to="/register" className="btn btn-primary mt-2" onClick={toggleMenu}>
                    <i className="fas fa-user-plus me-2"></i> Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 