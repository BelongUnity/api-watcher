import React from 'react';
import { Link } from 'react-router-dom';
import { FaRocket, FaChartLine, FaBell, FaShieldAlt, FaCheck, FaArrowRight } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-3">Monitor Your APIs with Confidence</h1>
              <p className="lead mb-4">
                API Watcher provides real-time monitoring, alerting, and analytics for your critical API endpoints.
                Never miss a downtime again.
              </p>
              <div className="d-flex gap-3">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start Free Trial
                </Link>
                <Link to="/login" className="btn btn-outline-secondary btn-lg">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="col-lg-6 mt-5 mt-lg-0">
              <div className="hero-image p-3 bg-light rounded shadow-sm">
                <img 
                  src="https://via.placeholder.com/600x400?text=API+Dashboard+Preview" 
                  alt="API Watcher Dashboard" 
                  className="img-fluid rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Powerful Features for API Monitoring</h2>
            <p className="lead text-muted">Everything you need to ensure your APIs are performing at their best</p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="feature-icon bg-primary bg-opacity-10 text-primary p-3 rounded-circle mb-3 mx-auto" style={{ width: '70px', height: '70px' }}>
                    <FaRocket size={24} className="mx-auto my-auto" />
                  </div>
                  <h5 className="card-title">Real-time Monitoring</h5>
                  <p className="card-text text-muted">
                    Track API performance and availability in real-time with customizable dashboards.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="feature-icon bg-success bg-opacity-10 text-success p-3 rounded-circle mb-3 mx-auto" style={{ width: '70px', height: '70px' }}>
                    <FaChartLine size={24} className="mx-auto my-auto" />
                  </div>
                  <h5 className="card-title">Advanced Analytics</h5>
                  <p className="card-text text-muted">
                    Gain insights with detailed performance metrics, trends, and historical data.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="feature-icon bg-danger bg-opacity-10 text-danger p-3 rounded-circle mb-3 mx-auto" style={{ width: '70px', height: '70px' }}>
                    <FaBell size={24} className="mx-auto my-auto" />
                  </div>
                  <h5 className="card-title">Instant Alerts</h5>
                  <p className="card-text text-muted">
                    Get notified immediately when your APIs experience downtime or performance issues.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="feature-icon bg-info bg-opacity-10 text-info p-3 rounded-circle mb-3 mx-auto" style={{ width: '70px', height: '70px' }}>
                    <FaShieldAlt size={24} className="mx-auto my-auto" />
                  </div>
                  <h5 className="card-title">Security Checks</h5>
                  <p className="card-text text-muted">
                    Verify SSL certificates, detect vulnerabilities, and ensure API security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">How API Watcher Works</h2>
            <p className="lead text-muted">Simple setup, powerful monitoring</p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="step-number bg-primary text-white rounded-circle mb-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    1
                  </div>
                  <h5 className="card-title">Add Your APIs</h5>
                  <p className="card-text">
                    Simply enter your API endpoints and configure monitoring parameters.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="step-number bg-primary text-white rounded-circle mb-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    2
                  </div>
                  <h5 className="card-title">Set Alert Preferences</h5>
                  <p className="card-text">
                    Choose notification channels and define thresholds for alerts.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="step-number bg-primary text-white rounded-circle mb-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    3
                  </div>
                  <h5 className="card-title">Monitor & Analyze</h5>
                  <p className="card-text">
                    Track performance, receive alerts, and gain insights from your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Simple, Transparent Pricing</h2>
            <p className="lead text-muted">Choose the plan that fits your needs</p>
          </div>
          
          <div className="row g-4 justify-content-center">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-header bg-transparent border-0 text-center pt-4">
                  <h5 className="fw-bold">Starter</h5>
                  <div className="pricing-value">
                    <span className="display-5 fw-bold">$29</span>
                    <span className="text-muted">/month</span>
                  </div>
                </div>
                <div className="card-body p-4">
                  <ul className="list-unstyled">
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> Up to 10 API endpoints
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> 5-minute check intervals
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> Email notifications
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> 7-day data retention
                    </li>
                  </ul>
                </div>
                <div className="card-footer bg-transparent border-0 text-center pb-4">
                  <Link to="/register" className="btn btn-outline-primary w-100">
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm border-primary border-2">
                <div className="card-header bg-transparent border-0 text-center pt-4">
                  <span className="badge bg-primary mb-2">Most Popular</span>
                  <h5 className="fw-bold">Professional</h5>
                  <div className="pricing-value">
                    <span className="display-5 fw-bold">$79</span>
                    <span className="text-muted">/month</span>
                  </div>
                </div>
                <div className="card-body p-4">
                  <ul className="list-unstyled">
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> Up to 50 API endpoints
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> 1-minute check intervals
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> Email, SMS & Slack notifications
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> 30-day data retention
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> Advanced analytics
                    </li>
                  </ul>
                </div>
                <div className="card-footer bg-transparent border-0 text-center pb-4">
                  <Link to="/register" className="btn btn-primary w-100">
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-header bg-transparent border-0 text-center pt-4">
                  <h5 className="fw-bold">Enterprise</h5>
                  <div className="pricing-value">
                    <span className="display-5 fw-bold">$199</span>
                    <span className="text-muted">/month</span>
                  </div>
                </div>
                <div className="card-body p-4">
                  <ul className="list-unstyled">
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> Unlimited API endpoints
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> 30-second check intervals
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> All notification channels
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> 90-day data retention
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> Custom integrations
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <FaCheck className="text-success me-2" /> Dedicated support
                    </li>
                  </ul>
                </div>
                <div className="card-footer bg-transparent border-0 text-center pb-4">
                  <Link to="/register" className="btn btn-outline-primary w-100">
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">What Our Customers Say</h2>
            <p className="lead text-muted">Trusted by developers and companies worldwide</p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex mb-3">
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning">★</span>
                  </div>
                  <p className="card-text mb-4">
                    "API Watcher has been a game-changer for our team. We can now detect and resolve API issues before they impact our customers."
                  </p>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                      JD
                    </div>
                    <div>
                      <h6 className="mb-0">John Doe</h6>
                      <small className="text-muted">CTO, TechCorp</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex mb-3">
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning">★</span>
                  </div>
                  <p className="card-text mb-4">
                    "The analytics and alerting features have helped us improve our API performance by 40%. Highly recommended!"
                  </p>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                      JS
                    </div>
                    <div>
                      <h6 className="mb-0">Jane Smith</h6>
                      <small className="text-muted">Lead Developer, WebSolutions</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex mb-3">
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning me-1">★</span>
                    <span className="text-warning">★</span>
                  </div>
                  <p className="card-text mb-4">
                    "Setting up API Watcher was incredibly easy, and the insights we've gained have been invaluable for our development team."
                  </p>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                      RJ
                    </div>
                    <div>
                      <h6 className="mb-0">Robert Johnson</h6>
                      <small className="text-muted">DevOps Engineer, CloudNine</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Frequently Asked Questions</h2>
            <p className="lead text-muted">Find answers to common questions about API Watcher</p>
          </div>
          
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item border-0 mb-3 shadow-sm">
                  <h2 className="accordion-header" id="headingOne">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                      How does API Watcher monitor my APIs?
                    </button>
                  </h2>
                  <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      API Watcher sends periodic requests to your API endpoints and analyzes the responses for status codes, response times, and content validation. You can configure the check frequency, expected responses, and alert thresholds based on your specific requirements.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item border-0 mb-3 shadow-sm">
                  <h2 className="accordion-header" id="headingTwo">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                      Can I monitor private APIs behind a firewall?
                    </button>
                  </h2>
                  <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes, API Watcher offers an agent-based solution for monitoring private APIs behind firewalls. Simply install our lightweight agent in your environment, and it will securely communicate with our platform while keeping your APIs private.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item border-0 mb-3 shadow-sm">
                  <h2 className="accordion-header" id="headingThree">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                      What notification channels are supported?
                    </button>
                  </h2>
                  <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      API Watcher supports multiple notification channels including email, SMS, Slack, Microsoft Teams, webhook integrations, and PagerDuty. You can configure different channels for different types of alerts and severity levels.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item border-0 mb-3 shadow-sm">
                  <h2 className="accordion-header" id="headingFour">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                      Is there a free trial available?
                    </button>
                  </h2>
                  <div id="collapseFour" className="accordion-collapse collapse" aria-labelledby="headingFour" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes, we offer a 14-day free trial with full access to all features. No credit card is required to start your trial. You can upgrade to a paid plan at any time during or after your trial period.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5 bg-primary text-white">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 text-center text-lg-start">
              <h2 className="fw-bold mb-3">Ready to monitor your APIs?</h2>
              <p className="lead mb-0">
                Start your 14-day free trial today. No credit card required.
              </p>
            </div>
            <div className="col-lg-4 text-center text-lg-end mt-4 mt-lg-0">
              <Link to="/register" className="btn btn-light btn-lg">
                Get Started <FaArrowRight className="ms-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 