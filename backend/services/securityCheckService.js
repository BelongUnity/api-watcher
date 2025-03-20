const axios = require('axios');
const https = require('https');
const Api = require('../models/Api');
const ApiSecurityCheck = require('../models/ApiSecurityCheck');
const SslCertificateCheck = require('../models/SslCertificateCheck');
const HeaderSecurityCheck = require('../models/HeaderSecurityCheck');
const VulnerabilityScanResult = require('../models/VulnerabilityScanResult');
const SecurityRecommendation = require('../models/SecurityRecommendation');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

/**
 * SecurityCheckService
 * Performs security checks for APIs and stores the results
 */
class SecurityCheckService {
  /**
   * Run a security check for a specific API
   * @param {string} apiId - The ID of the API to check
   * @param {string} userId - The ID of the user requesting the check
   * @returns {Promise<Object>} - The security check results
   */
  async checkApi(apiId, userId) {
    try {
      // Get the API
      const api = await Api.findById(apiId);
      if (!api) {
        throw new Error('API not found');
      }

      // Run the security checks
      const [sslResult, headerResult, vulnerabilityResult] = await Promise.all([
        this.checkSslCertificate(api.url),
        this.checkHeaderSecurity(api.url),
        this.scanForVulnerabilities(api.url)
      ]);

      // Calculate the overall security score
      const overallScore = this.calculateOverallScore(
        sslResult.score,
        headerResult.score,
        vulnerabilityResult.score
      );

      // Determine the overall security status
      const overallStatus = this.determineSecurityStatus(overallScore);

      // Create a new security check record
      const securityCheck = await ApiSecurityCheck.create({
        api: apiId,
        checkDate: new Date(),
        overallSecurityScore: overallScore,
        overallSecurityStatus: overallStatus
      });

      // Save SSL check and link to security check
      sslResult.securityCheck = securityCheck._id;
      const savedSslCheck = await SslCertificateCheck.create(sslResult);

      // Save header check and link to security check
      headerResult.securityCheck = securityCheck._id;
      const savedHeaderCheck = await HeaderSecurityCheck.create(headerResult);

      // Save vulnerability check and link to security check
      vulnerabilityResult.securityCheck = securityCheck._id;
      const savedVulnerabilityCheck = await VulnerabilityScanResult.create(vulnerabilityResult);

      // Generate recommendations
      const recommendations = [];
      
      // SSL recommendations
      if (!sslResult.valid || sslResult.score < 70) {
        recommendations.push({
          securityCheck: securityCheck._id,
          category: 'SSL',
          title: sslResult.valid ? 'Improve SSL Security' : 'Invalid SSL Certificate',
          description: sslResult.valid 
            ? `Your SSL security score is ${sslResult.score}, which is below recommended levels.`
            : 'Your API is using an invalid SSL certificate.',
          priority: sslResult.score < 50 ? 'Critical' : 'High',
          implementationSteps: sslResult.valid
            ? 'Upgrade to the latest TLS version and ensure proper certificate configuration.'
            : 'Obtain and install a valid SSL certificate from a trusted certificate authority.',
          resources: [
            'https://letsencrypt.org/',
            'https://www.ssllabs.com/ssltest/'
          ]
        });
      }

      // Header recommendations
      if (headerResult.missingHeaders && headerResult.missingHeaders.length > 0) {
        headerResult.missingHeaders.forEach(header => {
          recommendations.push({
            securityCheck: securityCheck._id,
            category: 'Headers',
            title: `Implement ${header}`,
            description: `Your API is missing the ${header} security header.`,
            priority: ['Content-Security-Policy', 'Strict-Transport-Security'].includes(header) 
              ? 'High' 
              : 'Medium',
            implementationSteps: `Add the ${header} header to your API responses with appropriate values.`,
            resources: [
              `https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/${header}`,
              'https://owasp.org/www-project-secure-headers/'
            ]
          });
        });
      }

      // Vulnerability recommendations
      if (vulnerabilityResult.vulnerabilities && vulnerabilityResult.vulnerabilities.length > 0) {
        vulnerabilityResult.vulnerabilities.forEach(vuln => {
          recommendations.push({
            securityCheck: securityCheck._id,
            category: 'Vulnerability',
            title: `Fix ${vuln.name}`,
            description: vuln.description,
            priority: vuln.severity,
            implementationSteps: vuln.remediation,
            resources: [
              'https://owasp.org/www-project-top-ten/',
              'https://cheatsheetseries.owasp.org/'
            ]
          });
        });
      }

      // Save all recommendations
      const savedRecommendations = await SecurityRecommendation.insertMany(recommendations);

      // Create alerts based on specific security issues
      if (!sslResult.valid || sslResult.score < 70) {
        await this.createSecurityAlert({
          userId,
          apiId,
          alertType: 'SSLIssue',
          severity: sslResult.score < 50 ? 'Critical' : 'High',
          message: `SSL certificate check failed with score ${sslResult.score}. ${!sslResult.valid ? 'Certificate is invalid.' : 'Certificate has security issues.'}`,
          details: {
            securityCheckId: securityCheck._id,
            score: sslResult.score,
            issuer: sslResult.issuer,
            expiresAt: sslResult.expiresAt,
            protocol: sslResult.protocol
          }
        });
      }

      if (headerResult.score < 70) {
        await this.createSecurityAlert({
          userId,
          apiId,
          alertType: 'Other',
          severity: headerResult.score < 50 ? 'High' : 'Medium',
          message: `Security headers check failed with score ${headerResult.score}. Missing important security headers.`,
          details: {
            securityCheckId: securityCheck._id,
            score: headerResult.score,
            missingHeaders: headerResult.missingHeaders
          }
        });
      }

      if (vulnerabilityResult.score < 70) {
        await this.createSecurityAlert({
          userId,
          apiId,
          alertType: 'ErrorRate',
          severity: vulnerabilityResult.score < 50 ? 'Critical' : 'High',
          message: `Vulnerability scan detected issues. Score: ${vulnerabilityResult.score}`,
          details: {
            securityCheckId: securityCheck._id,
            score: vulnerabilityResult.score,
            vulnerabilities: vulnerabilityResult.vulnerabilities
          }
        });
      }

      // Log the created data for debugging
      logger.info('Created security check data:', {
        apiId,
        securityCheckId: securityCheck._id,
        sslCheckId: savedSslCheck._id,
        headerCheckId: savedHeaderCheck._id,
        vulnerabilityCheckId: savedVulnerabilityCheck._id,
        recommendationsCount: savedRecommendations.length
      });

      return {
        securityCheck,
        sslCheck: savedSslCheck,
        headerCheck: savedHeaderCheck,
        vulnerabilityCheck: savedVulnerabilityCheck,
        recommendations: savedRecommendations
      };
    } catch (error) {
      logger.error('Error in security check:', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Check the SSL certificate of an API
   * @param {string} url - The URL of the API
   * @returns {Promise<Object>} - The SSL certificate check results
   */
  async checkSslCertificate(url) {
    try {
      // Make sure URL starts with https://
      if (!url.startsWith('https://')) {
        logger.info('URL does not use HTTPS', { url });
        // Create a failed SSL check
        const sslCheck = new SslCertificateCheck({
          valid: false,
          issuer: 'N/A',
          expiresAt: new Date(),
          daysUntilExpiration: 0,
          protocol: 'None',
          score: 0,
          details: {
            error: 'URL does not use HTTPS protocol',
            recommendations: ['Implement HTTPS to secure your API']
          }
        });
        
        return sslCheck;
      }
      
      // Make a request to the URL to get the certificate info
      const agent = new https.Agent({
        rejectUnauthorized: false // Allow self-signed certificates
      });
      
      const response = await axios.get(url, {
        httpsAgent: agent,
        timeout: 10000,
        validateStatus: () => true // Accept any status code
      });
      
      // Get certificate info from the response
      const cert = response.request.res.socket.getPeerCertificate();
      
      if (!cert || Object.keys(cert).length === 0) {
        logger.warn('Could not retrieve certificate information', { url });
        const sslCheck = new SslCertificateCheck({
          valid: false,
          issuer: 'Unknown',
          expiresAt: new Date(),
          daysUntilExpiration: 0,
          protocol: 'Unknown',
          score: 0,
          details: {
            error: 'Could not retrieve SSL certificate information',
            recommendations: ['Verify SSL certificate is properly installed']
          }
        });
        return sslCheck;
      }
      
      // Calculate days until expiration
      const expiresAt = new Date(cert.valid_to);
      const now = new Date();
      const daysUntilExpiration = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
      
      // Calculate score based on validity and expiration
      let score = 0;
      if (cert.valid) {
        score = 100; // Start with perfect score
        
        // Reduce score if expiring soon
        if (daysUntilExpiration < 30) {
          score -= (30 - daysUntilExpiration) * 2; // Lose 2 points per day under 30 days
        }
        
        // Check protocol version
        const protocol = response.request.res.socket.getProtocol();
        if (protocol !== 'TLSv1.3' && protocol !== 'TLSv1.2') {
          score -= 30; // Older TLS versions reduce score
        }
      }
      
      // Ensure score is within bounds
      score = Math.max(0, Math.min(100, score));
      
      // Create and save the SSL check
      const sslCheck = new SslCertificateCheck({
        valid: cert.valid || false,
        issuer: cert.issuer?.O || 'Unknown',
        expiresAt,
        daysUntilExpiration,
        protocol: response.request.res.socket.getProtocol() || 'Unknown',
        score,
        details: {
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          protocol: response.request.res.socket.getProtocol()
        }
      });
      
      return sslCheck;
    } catch (error) {
      logger.error('Error checking SSL certificate:', { error: error.message, url });
      // Create a failed SSL check
      const sslCheck = new SslCertificateCheck({
        valid: false,
        issuer: 'Error',
        expiresAt: new Date(),
        daysUntilExpiration: 0,
        protocol: 'Error',
        score: 0,
        details: {
          error: error.message,
          recommendations: ['Check if the API endpoint is accessible', 'Verify SSL certificate is properly configured']
        }
      });
      
      return sslCheck;
    }
  }
  
  /**
   * Check the security headers of an API
   * @param {string} url - The URL of the API
   * @returns {Promise<Object>} - The header security check results
   */
  async checkHeaderSecurity(url) {
    try {
      // Make a request to the URL to get the headers
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true, // Accept any status code
        headers: {
          'User-Agent': 'API-Watcher-Security-Check'
        }
      });
      
      // Get headers from the response
      const headers = response.headers;
      
      // Convert headers to a Map
      const headersMap = new Map();
      for (const [key, value] of Object.entries(headers)) {
        headersMap.set(key.toLowerCase(), value);
      }
      
      // Check for security headers
      const securityHeaders = {
        'Content-Security-Policy': {
          present: headersMap.has('content-security-policy'),
          value: headersMap.get('content-security-policy') || null,
          description: 'Helps prevent XSS attacks'
        },
        'X-Content-Type-Options': {
          present: headersMap.has('x-content-type-options'),
          value: headersMap.get('x-content-type-options') || null,
          description: 'Prevents MIME type sniffing'
        },
        'X-Frame-Options': {
          present: headersMap.has('x-frame-options'),
          value: headersMap.get('x-frame-options') || null,
          description: 'Protects against clickjacking'
        },
        'X-XSS-Protection': {
          present: headersMap.has('x-xss-protection'),
          value: headersMap.get('x-xss-protection') || null,
          description: 'Enables browser XSS filtering'
        },
        'Strict-Transport-Security': {
          present: headersMap.has('strict-transport-security'),
          value: headersMap.get('strict-transport-security') || null,
          description: 'Enforces HTTPS connections'
        }
      };
      
      // Determine missing headers
      const missingHeaders = [];
      for (const [header, info] of Object.entries(securityHeaders)) {
        if (!info.present) {
          missingHeaders.push(header);
        }
      }
      
      // Calculate score based on present headers
      const totalHeaders = Object.keys(securityHeaders).length;
      const presentHeaders = totalHeaders - missingHeaders.length;
      const score = Math.floor((presentHeaders / totalHeaders) * 100);
      
      // Create and save the header security check
      const headerCheck = new HeaderSecurityCheck({
        headers: Object.fromEntries(headersMap),
        securityHeaders,
        missingHeaders,
        score,
        details: {
          presentHeaders: Object.keys(securityHeaders).filter(header => securityHeaders[header].present),
          missingHeaders,
          recommendations: missingHeaders.map(header => ({
            header,
            description: securityHeaders[header].description,
            recommendation: `Implement the ${header} security header`
          }))
        }
      });
      
      return headerCheck;
    } catch (error) {
      logger.error('Error checking header security:', { error: error.message, url });
      // Create a failed header check
      const headerCheck = new HeaderSecurityCheck({
        headers: {},
        securityHeaders: {
          'Content-Security-Policy': { present: false, value: null },
          'X-Content-Type-Options': { present: false, value: null },
          'X-Frame-Options': { present: false, value: null },
          'X-XSS-Protection': { present: false, value: null },
          'Strict-Transport-Security': { present: false, value: null }
        },
        missingHeaders: [
          'Content-Security-Policy',
          'X-Content-Type-Options',
          'X-Frame-Options',
          'X-XSS-Protection',
          'Strict-Transport-Security'
        ],
        score: 0,
        details: {
          error: error.message,
          recommendations: ['Check if the API endpoint is accessible', 'Implement security headers']
        }
      });
      
      return headerCheck;
    }
  }
  
  /**
   * Scan for vulnerabilities in an API
   * @param {string} url - The URL of the API
   * @returns {Promise<Object>} - The vulnerability scan results
   */
  async scanForVulnerabilities(url) {
    try {
      // Make a request to the URL
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true, // Accept any status code
        headers: {
          'User-Agent': 'API-Watcher-Security-Check'
        }
      });
      
      // Get headers and status code from the response
      const headers = response.headers;
      const statusCode = response.status;
      
      // Initialize vulnerabilities array
      const vulnerabilities = [];
      
      // Check for common vulnerabilities
      
      // 1. Check for server information disclosure
      if (headers['server']) {
        vulnerabilities.push({
          name: 'Server Information Disclosure',
          description: `The server header reveals information about the server software: ${headers['server']}`,
          severity: 'Medium',
          remediation: 'Configure your server to remove or obfuscate the Server header'
        });
      }
      
      // 2. Check for missing security headers (already done in header check, but add as vulnerabilities)
      if (!headers['content-security-policy']) {
        vulnerabilities.push({
          name: 'Missing Content Security Policy',
          description: 'The API does not implement Content Security Policy, which helps prevent XSS attacks',
          severity: 'High',
          remediation: 'Implement a Content Security Policy header with appropriate directives'
        });
      }
      
      // 3. Check for CORS misconfiguration
      if (headers['access-control-allow-origin'] === '*') {
        vulnerabilities.push({
          name: 'CORS Misconfiguration',
          description: 'The API allows requests from any origin, which may lead to cross-site request forgery',
          severity: 'Medium',
          remediation: 'Restrict the Access-Control-Allow-Origin header to specific trusted domains'
        });
      }
      
      // 4. Check for insecure HTTP methods
      if (headers['access-control-allow-methods'] && 
          (headers['access-control-allow-methods'].includes('TRACE') || 
           headers['access-control-allow-methods'].includes('CONNECT'))) {
        vulnerabilities.push({
          name: 'Insecure HTTP Methods Allowed',
          description: 'The API allows potentially dangerous HTTP methods like TRACE or CONNECT',
          severity: 'Medium',
          remediation: 'Restrict allowed HTTP methods to only those required by your API'
        });
      }
      
      // 5. Check for error responses that might reveal too much information
      if (statusCode >= 400 && statusCode < 500 && response.data && 
          (typeof response.data === 'string' && response.data.includes('stack trace') || 
           typeof response.data === 'object' && JSON.stringify(response.data).includes('stack trace'))) {
        vulnerabilities.push({
          name: 'Information Leakage in Error Messages',
          description: 'The API reveals sensitive information in error responses, such as stack traces',
          severity: 'High',
          remediation: 'Implement proper error handling to avoid leaking implementation details'
        });
      }
      
      // Count vulnerabilities by severity
      const criticalCount = vulnerabilities.filter(v => v.severity === 'Critical').length;
      const highCount = vulnerabilities.filter(v => v.severity === 'High').length;
      const mediumCount = vulnerabilities.filter(v => v.severity === 'Medium').length;
      const lowCount = vulnerabilities.filter(v => v.severity === 'Low').length;
      
      // Calculate score based on vulnerabilities
      let score = 100; // Start with perfect score
      
      // Reduce score based on severity
      score -= criticalCount * 25; // -25 points per critical vulnerability
      score -= highCount * 15;     // -15 points per high vulnerability
      score -= mediumCount * 10;   // -10 points per medium vulnerability
      score -= lowCount * 5;       // -5 points per low vulnerability
      
      // Ensure score is within bounds
      score = Math.max(0, Math.min(100, score));
      
      // Create and save the vulnerability scan result
      const vulnerabilityScan = new VulnerabilityScanResult({
        vulnerabilities,
        vulnerabilityCount: vulnerabilities.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        score,
        details: {
          statusCode,
          headers: headers,
          vulnerabilitiesByType: {
            critical: vulnerabilities.filter(v => v.severity === 'Critical'),
            high: vulnerabilities.filter(v => v.severity === 'High'),
            medium: vulnerabilities.filter(v => v.severity === 'Medium'),
            low: vulnerabilities.filter(v => v.severity === 'Low')
          }
        }
      });
      
      return vulnerabilityScan;
    } catch (error) {
      logger.error('Error scanning for vulnerabilities:', { error: error.message, url });
      // Create a failed vulnerability scan
      const vulnerabilityScan = new VulnerabilityScanResult({
        vulnerabilities: [{
          name: 'Connection Error',
          description: `Could not connect to the API: ${error.message}`,
          severity: 'High',
          remediation: 'Ensure the API is accessible and properly configured'
        }],
        vulnerabilityCount: 1,
        criticalCount: 0,
        highCount: 1,
        mediumCount: 0,
        lowCount: 0,
        score: 0,
        details: {
          error: error.message,
          recommendations: ['Check if the API endpoint is accessible', 'Verify the API is properly configured']
        }
      });
      
      return vulnerabilityScan;
    }
  }
  
  /**
   * Calculate the overall security score
   * @param {number} sslScore - The SSL certificate score
   * @param {number} headerScore - The header security score
   * @param {number} vulnerabilityScore - The vulnerability scan score
   * @returns {number} - The overall security score
   */
  calculateOverallScore(sslScore, headerScore, vulnerabilityScore) {
    // Weight the scores (SSL is most important, then vulnerabilities, then headers)
    const weightedScore = (sslScore * 0.4) + (vulnerabilityScore * 0.4) + (headerScore * 0.2);
    
    // Round to nearest integer
    return Math.round(weightedScore);
  }
  
  /**
   * Determine the security status based on the score
   * @param {number} score - The security score
   * @returns {string} - The security status
   */
  determineSecurityStatus(score) {
    if (score >= 90) {
      return 'Pass';
    } else if (score >= 70) {
      return 'Warning';
    } else {
      return 'Fail';
    }
  }
  
  /**
   * Generate security recommendations based on check results
   * @param {string} securityCheckId - The ID of the security check
   * @param {Object} sslResult - The SSL certificate check results
   * @param {Object} headerResult - The header security check results
   * @param {Object} vulnerabilityResult - The vulnerability scan results
   * @returns {Promise<Array>} - The generated recommendations
   */
  async generateRecommendations(securityCheckId, sslResult, headerResult, vulnerabilityResult) {
    try {
      const recommendations = [];
      
      // SSL recommendations
      if (!sslResult.valid) {
        recommendations.push({
          securityCheck: securityCheckId,
          category: 'SSL',
          title: 'Implement HTTPS',
          description: 'Your API is not using HTTPS or has an invalid SSL certificate',
          priority: 'Critical',
          implementationSteps: 'Obtain and install a valid SSL certificate from a trusted certificate authority',
          resources: [
            'https://letsencrypt.org/',
            'https://www.ssllabs.com/ssltest/'
          ]
        });
      } else if (sslResult.daysUntilExpiration < 30) {
        recommendations.push({
          securityCheck: securityCheckId,
          category: 'SSL',
          title: 'Renew SSL Certificate',
          description: `Your SSL certificate will expire in ${sslResult.daysUntilExpiration} days`,
          priority: sslResult.daysUntilExpiration < 7 ? 'Critical' : 'High',
          implementationSteps: 'Renew your SSL certificate before it expires to avoid service disruption',
          resources: [
            'https://letsencrypt.org/docs/renewal/',
            'https://www.ssllabs.com/ssltest/'
          ]
        });
      }
      
      // Header recommendations
      for (const header of headerResult.missingHeaders) {
        let recommendation = {
          securityCheck: securityCheckId,
          category: 'Headers',
          title: `Implement ${header}`,
          description: `Your API is missing the ${header} security header`,
          priority: 'Medium',
          implementationSteps: '',
          resources: []
        };
        
        // Customize based on header type
        switch (header) {
          case 'Content-Security-Policy':
            recommendation.implementationSteps = 'Add a Content-Security-Policy header to restrict resource loading';
            recommendation.resources = [
              'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
              'https://content-security-policy.com/'
            ];
            break;
          case 'X-Content-Type-Options':
            recommendation.implementationSteps = 'Add X-Content-Type-Options: nosniff to prevent MIME type sniffing';
            recommendation.resources = [
              'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options'
            ];
            break;
          case 'X-Frame-Options':
            recommendation.implementationSteps = 'Add X-Frame-Options: DENY to prevent clickjacking attacks';
            recommendation.resources = [
              'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options'
            ];
            break;
          case 'X-XSS-Protection':
            recommendation.implementationSteps = 'Add X-XSS-Protection: 1; mode=block to enable XSS filtering';
            recommendation.resources = [
              'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection'
            ];
            break;
          case 'Strict-Transport-Security':
            recommendation.implementationSteps = 'Add Strict-Transport-Security header to enforce HTTPS';
            recommendation.resources = [
              'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security'
            ];
            break;
        }
        
        recommendations.push(recommendation);
      }
      
      // Vulnerability recommendations
      for (const vulnerability of vulnerabilityResult.vulnerabilities) {
        recommendations.push({
          securityCheck: securityCheckId,
          category: 'Vulnerability',
          title: vulnerability.name,
          description: vulnerability.description,
          priority: vulnerability.severity,
          implementationSteps: vulnerability.remediation,
          resources: []
        });
      }
      
      // Save all recommendations
      if (recommendations.length > 0) {
        await SecurityRecommendation.insertMany(recommendations);
      }
      
      return recommendations;
    } catch (error) {
      logger.error('Error generating recommendations:', { error: error.message });
      return [];
    }
  }
  
  /**
   * Get the latest security check for an API
   * @param {string} apiId - The ID of the API
   * @returns {Promise<Object>} - The latest security check with details
   */
  async getLatestSecurityCheck(apiId) {
    try {
      // Find the latest security check
      const securityCheck = await ApiSecurityCheck.findOne({ api: apiId })
        .sort({ checkDate: -1 })
        .populate('api')
        .lean();
      
      if (!securityCheck) {
        return null;
      }
      
      // Get the related check details
      const [sslCheck, headerCheck, vulnerabilityCheck, recommendations] = await Promise.all([
        SslCertificateCheck.findOne({ securityCheck: securityCheck._id }).lean(),
        HeaderSecurityCheck.findOne({ securityCheck: securityCheck._id }).lean(),
        VulnerabilityScanResult.findOne({ securityCheck: securityCheck._id }).lean(),
        SecurityRecommendation.find({ securityCheck: securityCheck._id }).lean()
      ]);
      
      // Log the retrieved data for debugging
      logger.info('Retrieved security check data:', {
        apiId,
        securityCheckId: securityCheck._id,
        hasSslCheck: !!sslCheck,
        hasHeaderCheck: !!headerCheck,
        hasVulnerabilityCheck: !!vulnerabilityCheck,
        recommendationsCount: recommendations.length
      });
      
      return {
        securityCheck,
        sslCheck,
        headerCheck,
        vulnerabilityCheck,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting latest security check:', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get all security checks for an API
   * @param {string} apiId - The ID of the API
   * @returns {Promise<Array>} - All security checks for the API
   */
  async getAllSecurityChecks(apiId) {
    try {
      // Find all security checks for the API
      const securityChecks = await ApiSecurityCheck.find({ api: apiId })
        .sort({ checkDate: -1 })
        .lean();
      
      return securityChecks;
    } catch (error) {
      logger.error('Error getting all security checks:', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get details for a specific security check
   * @param {string} checkId - The ID of the security check
   * @returns {Promise<Object>} - The security check details
   */
  async getSecurityCheckDetails(checkId) {
    try {
      // Get the security check
      const securityCheck = await ApiSecurityCheck.findById(checkId).lean();
      
      if (!securityCheck) {
        throw new Error('Security check not found');
      }
      
      // Get the related check details
      const sslCheck = await SslCertificateCheck.findOne({ securityCheck: checkId }).lean();
      const headerCheck = await HeaderSecurityCheck.findOne({ securityCheck: checkId }).lean();
      const vulnerabilityCheck = await VulnerabilityScanResult.findOne({ securityCheck: checkId }).lean();
      const recommendations = await SecurityRecommendation.find({ securityCheck: checkId }).lean();
      
      return {
        securityCheck,
        sslCheck,
        headerCheck,
        vulnerabilityCheck,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting security check details:', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Run security checks for all APIs
   * @returns {Promise<Array>} - The results of all security checks
   */
  async checkAllApis() {
    try {
      logger.info('Running security checks for all APIs');
      
      // Get all active APIs
      const apis = await Api.find({ isActive: true });
      
      const results = [];
      
      // Run security checks for each API
      for (const api of apis) {
        try {
          const result = await this.checkApi(api._id, api.owner);
          results.push(result);
        } catch (error) {
          logger.error(`Error checking API ${api._id}:`, { error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error checking all APIs:', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get a security overview for all APIs owned by a user
   * @param {string} userId - The ID of the user
   * @returns {Promise<Object>} - The security overview
   */
  async getSecurityOverview(userId) {
    try {
      // Get all APIs owned by the user
      const userApis = await Api.find({ owner: userId });

      // Initialize counters
      let totalApis = userApis.length;
      let secureApis = 0;
      let warningApis = 0;
      let failedApis = 0;
      let uncheckedApis = 0;
      
      // If no APIs found, return empty overview
      if (totalApis === 0) {
        return {
          totalApis: 0,
          secureApis: 0,
          warningApis: 0,
          failedApis: 0,
          uncheckedApis: 0,
          averageScore: 0,
          apiSecurityDetails: []
        };
      }
      
      // Get the latest security check for each API
      const apiSecurityDetails = [];
      
      for (const api of userApis) {
        const latestCheck = await ApiSecurityCheck.findOne({ api: api._id })
          .sort({ checkDate: -1 })
          .lean();
        
        if (!latestCheck) {
          uncheckedApis++;
          apiSecurityDetails.push({
            api,
            securityStatus: 'Unchecked',
            securityScore: 0,
            lastChecked: null
          });
          continue;
        }
        
        // Count by status
        switch (latestCheck.overallSecurityStatus) {
          case 'Pass':
            secureApis++;
            break;
          case 'Warning':
            warningApis++;
            break;
          case 'Fail':
            failedApis++;
            break;
          default:
            uncheckedApis++;
        }
        
        apiSecurityDetails.push({
          api,
          securityStatus: latestCheck.overallSecurityStatus,
          securityScore: latestCheck.overallSecurityScore,
          lastChecked: latestCheck.checkDate
        });
      }
      
      // Calculate average security score
      const checkedApis = apiSecurityDetails.filter(detail => detail.securityStatus !== 'Unchecked');
      const averageScore = checkedApis.length > 0
        ? checkedApis.reduce((sum, detail) => sum + detail.securityScore, 0) / checkedApis.length
        : 0;
      
      return {
        totalApis,
        secureApis,
        warningApis,
        failedApis,
        uncheckedApis,
        averageScore: Math.round(averageScore),
        apiSecurityDetails
      };
    } catch (error) {
      logger.error('Error getting security overview:', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a security alert
   * @param {Object} params - Alert parameters
   * @returns {Promise<Object>} - The created alert
   */
  async createSecurityAlert(params) {
    try {
      // Verify user exists
      const api = await Api.findById(params.apiId).populate('owner');
      if (!api) {
        logger.error('Cannot create security alert: API not found', { apiId: params.apiId });
        return null;
      }

      if (!api.owner) {
        logger.error('Cannot create security alert: API owner not found', { apiId: params.apiId });
        return null;
      }

      const alert = new Alert({
        user: params.userId || api.owner._id, // Use API owner as fallback
        api: params.apiId,
        alertType: params.alertType, // Using the provided alertType
        severity: params.severity,
        message: params.message,
        details: {
          ...params.details,
          checkType: 'security',
          recommendations: params.details.recommendations || []
        },
        read: false,
        resolved: false,
        resolvedAt: null,
        createdAt: new Date()
      });

      const savedAlert = await alert.save();
      logger.info('Created security alert', { 
        alertId: savedAlert._id, 
        apiId: params.apiId,
        alertType: params.alertType,
        severity: params.severity 
      });
      return savedAlert;
    } catch (error) {
      logger.error('Error creating security alert:', { error: error.message });
      // Don't throw the error - just log it and continue
      return null;
    }
  }
}

module.exports = new SecurityCheckService(); 