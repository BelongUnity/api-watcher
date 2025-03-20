const securityCheckService = require('../services/securityCheckService');
const Api = require('../models/Api');
const ApiSecurityCheck = require('../models/ApiSecurityCheck');
const SslCertificateCheck = require('../models/SslCertificateCheck');
const HeaderSecurityCheck = require('../models/HeaderSecurityCheck');
const VulnerabilityScanResult = require('../models/VulnerabilityScanResult');
const SecurityRecommendation = require('../models/SecurityRecommendation');
const axios = require('axios');
const https = require('https');
const logger = require('../utils/logger');

/**
 * Run security checks for an API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.runSecurityCheck = async (req, res) => {
  try {
    const { apiId } = req.params;
    
    // Check if the API exists and belongs to the user
    const api = await Api.findOne({ _id: apiId, owner: req.user.id });
    if (!api) {
      return res.status(404).json({ message: 'API not found' });
    }
    
    // Run the security checks
    const result = await securityCheckService.checkApi(apiId, req.user.id);
    
    res.status(200).json({
      message: 'Security check completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error running security check:', { error: error.message });
    res.status(500).json({ message: 'Error running security check', error: error.message });
  }
};

/**
 * Get the latest security check for an API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getLatestSecurityCheck = async (req, res) => {
  try {
    const { apiId } = req.params;
    
    // Check if the API exists and belongs to the user
    const api = await Api.findOne({ _id: apiId, owner: req.user.id });
    if (!api) {
      return res.status(404).json({ message: 'API not found' });
    }
    
    // Get the latest security check
    const securityCheck = await securityCheckService.getLatestSecurityCheck(apiId);
    
    if (!securityCheck) {
      return res.status(404).json({ message: 'No security checks found for this API' });
    }
    
    res.status(200).json({
      message: 'Latest security check retrieved successfully',
      data: securityCheck
    });
  } catch (error) {
    logger.error('Error getting latest security check:', { error: error.message });
    res.status(500).json({ message: 'Error getting latest security check', error: error.message });
  }
};

/**
 * Get all security checks for an API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllSecurityChecks = async (req, res) => {
  try {
    const { apiId } = req.params;
    
    // Check if the API exists and belongs to the user
    const api = await Api.findOne({ _id: apiId, owner: req.user.id });
    if (!api) {
      return res.status(404).json({ message: 'API not found' });
    }
    
    // Get all security checks
    const securityChecks = await securityCheckService.getAllSecurityChecks(apiId);
    
    res.status(200).json({
      message: 'Security checks retrieved successfully',
      data: securityChecks
    });
  } catch (error) {
    logger.error('Error getting security checks:', { error: error.message });
    res.status(500).json({ message: 'Error getting security checks', error: error.message });
  }
};

/**
 * Get security check details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSecurityCheckDetails = async (req, res) => {
  try {
    const { securityCheckId } = req.params;
    
    // Get the security check
    const apiSecurityCheck = await ApiSecurityCheck.findById(securityCheckId);
    if (!apiSecurityCheck) {
      return res.status(404).json({ message: 'Security check not found' });
    }
    
    // Check if the API belongs to the user
    const api = await Api.findOne({ _id: apiSecurityCheck.api, owner: req.user.id });
    if (!api) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Get the security check details
    const sslCheck = await SslCertificateCheck.findOne({ apiSecurityCheck: securityCheckId });
    const headerChecks = await HeaderSecurityCheck.find({ apiSecurityCheck: securityCheckId });
    const vulnerabilities = await VulnerabilityScanResult.find({ apiSecurityCheck: securityCheckId });
    
    res.status(200).json({
      message: 'Security check details retrieved successfully',
      data: {
        apiSecurityCheck,
        sslCheck,
        headerChecks,
        vulnerabilities
      }
    });
  } catch (error) {
    logger.error('Error getting security check details:', { error: error.message });
    res.status(500).json({ message: 'Error getting security check details', error: error.message });
  }
};

/**
 * Run security checks for all APIs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.runAllSecurityChecks = async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Run security checks for all APIs
    const results = await securityCheckService.checkAllApis();
    
    res.status(200).json({
      message: 'Security checks completed for all APIs',
      data: results
    });
  } catch (error) {
    logger.error('Error running security checks for all APIs:', { error: error.message });
    res.status(500).json({ message: 'Error running security checks for all APIs', error: error.message });
  }
};

/**
 * Run security checks for all APIs owned by the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.runUserApisSecurityChecks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all APIs owned by the user
    const userApis = await Api.find({ owner: userId });
    
    if (userApis.length === 0) {
      return res.status(200).json({
        message: 'Security checks completed for 0 APIs',
        data: []
      });
    }
    
    // Run security checks for each API
    const results = [];
    const errors = [];
    
    for (const api of userApis) {
      try {
        const result = await securityCheckService.checkApi(api._id, userId);
        if (result && result.securityCheck) {
          results.push(result);
        } else {
          errors.push({
            apiId: api._id,
            apiName: api.name,
            error: 'Invalid or empty result'
          });
        }
      } catch (error) {
        logger.error(`Error checking API ${api._id}:`, { error: error.message });
        errors.push({
          apiId: api._id,
          apiName: api.name,
          error: error.message
        });
      }
    }
    
    // Even if we have errors, return the successful results
    res.status(200).json({
      message: `Security checks completed for ${results.length} APIs`,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error('Error running security checks for user APIs:', { error: error.message });
    res.status(500).json({ message: 'Error running security checks for user APIs', error: error.message });
  }
};

/**
 * Get security overview for all APIs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSecurityOverview = async (req, res) => {
  try {
    // Get security overview from service
    const securityOverview = await securityCheckService.getSecurityOverview(req.user.id);
    
    // Ensure we're returning a valid response even if the service returns null or undefined
    const response = securityOverview || {
      totalApis: 0,
      secureApis: 0,
      warningApis: 0,
      failedApis: 0,
      uncheckedApis: 0,
      averageScore: 0,
      apiSecurityDetails: []
    };
    
    res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting security overview:', { error: error.message });
    res.status(500).json({ message: 'Error getting security overview', error: error.message });
  }
};

/**
 * Get all APIs for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserApis = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info('Getting APIs for user. User ID:', userId);
    
    // Direct query for APIs with the user ID
    const userApis = await Api.find({ owner: userId });
    logger.info(`Direct query found ${userApis.length} APIs for user ${userId}`);
    
    // If no APIs found with direct query, try string comparison as fallback
    if (userApis.length === 0) {
      logger.info('No APIs found with direct query, trying string comparison');
      
      // Convert userId to string for consistent comparison
      const userIdStr = userId.toString();
      
      // Get all APIs in the database
      const allApis = await Api.find({});
      logger.info(`Total APIs in database: ${allApis.length}`);
      
      // Filter APIs by owner using string comparison
      const filteredApis = allApis.filter(api => api.owner && api.owner.toString() === userIdStr);
      logger.info(`Found ${filteredApis.length} APIs for user ${userIdStr} after string comparison`);
      
      res.status(200).json({
        message: `Found ${filteredApis.length} APIs for the user`,
        data: filteredApis
      });
    } else {
      res.status(200).json({
        message: `Found ${userApis.length} APIs for the user`,
        data: userApis
      });
    }
  } catch (error) {
    logger.error('Error getting user APIs:', { error: error.message });
    res.status(500).json({ message: 'Error getting user APIs', error: error.message });
  }
};

// Helper functions

/**
 * Check SSL certificate for a URL
 */
async function checkSslCertificate(url) {
  try {
    // For demo purposes, we'll simulate the SSL check
    const valid = Math.random() > 0.2; // 80% chance of being valid
    const daysUntilExpiration = Math.floor(Math.random() * 365); // Random days until expiration
    const score = valid ? (daysUntilExpiration > 30 ? 100 : 70) : 0;
    
    return {
      valid,
      issuer: 'Demo CA',
      expiresAt: new Date(Date.now() + daysUntilExpiration * 24 * 60 * 60 * 1000),
      daysUntilExpiration,
      protocol: 'TLSv1.2',
      score
    };
  } catch (error) {
    logger.error('Error checking SSL certificate:', { error: error.message });
    return {
      valid: false,
      issuer: 'Unknown',
      expiresAt: new Date(),
      daysUntilExpiration: 0,
      protocol: 'Unknown',
      score: 0
    };
  }
}

/**
 * Check HTTP headers for security
 */
async function checkHeaderSecurity(url) {
  try {
    // For demo purposes, we'll simulate the header check
    const headers = [
      {
        name: 'Content-Security-Policy',
        description: 'Helps prevent XSS attacks',
        present: Math.random() > 0.3 // 70% chance of being present
      },
      {
        name: 'X-XSS-Protection',
        description: 'Enables browser XSS filtering',
        present: Math.random() > 0.2 // 80% chance of being present
      },
      {
        name: 'X-Content-Type-Options',
        description: 'Prevents MIME type sniffing',
        present: Math.random() > 0.1 // 90% chance of being present
      },
      {
        name: 'X-Frame-Options',
        description: 'Prevents clickjacking',
        present: Math.random() > 0.2 // 80% chance of being present
      },
      {
        name: 'Strict-Transport-Security',
        description: 'Enforces HTTPS',
        present: Math.random() > 0.4 // 60% chance of being present
      }
    ];
    
    // Calculate score based on present headers
    const presentHeaders = headers.filter(h => h.present).length;
    const score = Math.floor((presentHeaders / headers.length) * 100);
    
    return {
      headers,
      score
    };
  } catch (error) {
    logger.error('Error checking header security:', { error: error.message });
    return {
      headers: [],
      score: 0
    };
  }
}

/**
 * Scan for vulnerabilities
 */
async function scanForVulnerabilities(api) {
  try {
    // For demo purposes, we'll simulate the vulnerability scan
    const vulnerabilities = [];
    
    // 30% chance of having a vulnerability
    if (Math.random() < 0.3) {
      vulnerabilities.push({
        name: 'Insecure API Endpoint',
        description: 'The API endpoint is not properly secured against unauthorized access.',
        severity: 'high',
        remediation: 'Implement proper authentication and authorization mechanisms.'
      });
    }
    
    // 20% chance of having another vulnerability
    if (Math.random() < 0.2) {
      vulnerabilities.push({
        name: 'Outdated Dependencies',
        description: 'The API is using outdated dependencies with known security vulnerabilities.',
        severity: 'medium',
        remediation: 'Update dependencies to the latest secure versions.'
      });
    }
    
    // 10% chance of having a third vulnerability
    if (Math.random() < 0.1) {
      vulnerabilities.push({
        name: 'Insecure Data Transmission',
        description: 'Data is being transmitted without proper encryption.',
        severity: 'high',
        remediation: 'Use HTTPS for all data transmission.'
      });
    }
    
    // Calculate score based on vulnerabilities
    let score = 100;
    for (const vuln of vulnerabilities) {
      if (vuln.severity === 'high') {
        score -= 30;
      } else if (vuln.severity === 'medium') {
        score -= 15;
      } else {
        score -= 5;
      }
    }
    
    // Ensure score is not negative
    score = Math.max(0, score);
    
    return {
      vulnerabilities,
      score
    };
  } catch (error) {
    logger.error('Error scanning for vulnerabilities:', { error: error.message });
    return {
      vulnerabilities: [],
      score: 0
    };
  }
}

/**
 * Calculate overall security score
 */
function calculateOverallScore(sslScore, headerScore, vulnerabilityScore) {
  // Weight the scores
  const weightedSslScore = sslScore * 0.3;
  const weightedHeaderScore = headerScore * 0.3;
  const weightedVulnerabilityScore = vulnerabilityScore * 0.4;
  
  // Calculate overall score
  const overallScore = Math.floor(weightedSslScore + weightedHeaderScore + weightedVulnerabilityScore);
  
  return overallScore;
}

/**
 * Generate security recommendations
 */
function generateRecommendations(api, sslScore, headerCheckResult, vulnerabilityScanResult) {
  const recommendations = [];
  
  // SSL recommendations
  if (sslScore < 100) {
    if (sslScore === 0) {
      recommendations.push({
        title: 'Implement SSL/TLS',
        description: 'Your API is not using SSL/TLS encryption. This puts your data at risk of being intercepted.',
        priority: 'high',
        actionItem: 'Implement HTTPS for your API endpoint.'
      });
    } else if (sslScore < 80) {
      recommendations.push({
        title: 'Update SSL Certificate',
        description: 'Your SSL certificate is expiring soon or using an outdated protocol.',
        priority: 'medium',
        actionItem: 'Renew your SSL certificate and ensure it uses modern protocols like TLSv1.2 or higher.'
      });
    }
  }
  
  // Header recommendations
  for (const header of headerCheckResult.headers) {
    if (!header.present) {
      recommendations.push({
        title: `Implement ${header.name} Header`,
        description: `The ${header.name} header is missing. ${header.description}.`,
        priority: header.name === 'Content-Security-Policy' || header.name === 'Strict-Transport-Security' ? 'high' : 'medium',
        actionItem: `Add the ${header.name} header to your API responses.`
      });
    }
  }
  
  // Vulnerability recommendations
  for (const vuln of vulnerabilityScanResult.vulnerabilities) {
    recommendations.push({
      title: `Fix ${vuln.name}`,
      description: vuln.description,
      priority: vuln.severity,
      actionItem: vuln.remediation
    });
  }
  
  return recommendations;
} 