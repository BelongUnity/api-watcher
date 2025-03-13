import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';

  return (
    <footer className="bg-dark text-white py-5 mt-auto">
      <div className="container">
        <div className="row">
          {/* About */}
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="d-flex align-items-center mb-3">
              <i className="fas fa-chart-line me-2" style={{ color: 'var(--primary-color)', fontSize: '1.25rem' }}></i>
              <h3 className="h5 mb-0 fw-bold">API Watcher</h3>
            </div>
            <p className="text-muted mb-3">
              A comprehensive solution for monitoring API health and performance in real-time.
            </p>
            <div className="d-flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover-text-white"
                aria-label="GitHub"
              >
                <i className="fab fa-github fa-lg"></i>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover-text-white"
                aria-label="Twitter"
              >
                <i className="fab fa-twitter fa-lg"></i>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover-text-white"
                aria-label="LinkedIn"
              >
                <i className="fab fa-linkedin fa-lg"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-md-4 mb-4 mb-md-0">
            <h3 className="h5 mb-3 fw-bold">Quick Links</h3>
            <ul className="list-unstyled">
              {isAuthenticated ? (
                <>
                  <li className="mb-2">
                    <Link to="/dashboard" className="text-muted text-decoration-none hover-text-primary">
                      <i className="fas fa-chevron-right me-1 small"></i> Dashboard
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/api/new" className="text-muted text-decoration-none hover-text-primary">
                      <i className="fas fa-chevron-right me-1 small"></i> Add New API
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/profile" className="text-muted text-decoration-none hover-text-primary">
                      <i className="fas fa-chevron-right me-1 small"></i> Profile
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="mb-2">
                    <Link to="/login" className="text-muted text-decoration-none hover-text-primary">
                      <i className="fas fa-chevron-right me-1 small"></i> Login
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/register" className="text-muted text-decoration-none hover-text-primary">
                      <i className="fas fa-chevron-right me-1 small"></i> Register
                    </Link>
                  </li>
                </>
              )}
              <li className="mb-2">
                <Link to="/docs" className="text-muted text-decoration-none hover-text-primary">
                  <i className="fas fa-chevron-right me-1 small"></i> Documentation
                </Link>
              </li>
              <li className="mb-2">
                <a href="#faqAccordion" className="text-muted text-decoration-none hover-text-primary">
                  <i className="fas fa-chevron-right me-1 small"></i> FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-md-4">
            <h3 className="h5 mb-3 fw-bold">Contact</h3>
            <p className="text-muted mb-2">
              Have questions or feedback?
            </p>
            <a
              href="mailto:support@apiwatcher.com"
              className="text-primary text-decoration-none"
            >
              <i className="fas fa-envelope me-1"></i> support@apiwatcher.com
            </a>
            <div className="mt-3">
              <p className="text-muted mb-0">
                <i className="fas fa-shield-alt me-1"></i> Secure & Reliable Monitoring
              </p>
              <p className="text-muted mb-0 mt-2">
                <i className="fas fa-bell me-1"></i> Real-time Notifications
              </p>
            </div>
          </div>
        </div>

        <hr className="my-4 bg-secondary opacity-25" />
        
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
          <p className="text-muted mb-2 mb-md-0">
            &copy; {currentYear} API Watcher. All rights reserved.
          </p>
          <div>
            <Link to="/privacy" className="text-muted text-decoration-none me-3 small">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted text-decoration-none small">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 