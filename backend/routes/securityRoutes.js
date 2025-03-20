const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Run security check for an API
router.post('/api/:apiId/security-check', securityController.runSecurityCheck);

// Get the latest security check for an API
router.get('/api/:apiId/security-check/latest', securityController.getLatestSecurityCheck);

// Get all security checks for an API
router.get('/api/:apiId/security-checks', securityController.getAllSecurityChecks);

// Get security check details
router.get('/security-check/:securityCheckId', securityController.getSecurityCheckDetails);

// Run security checks for all APIs (admin only)
router.post('/security-checks/run-all', securityController.runAllSecurityChecks);

// Run security checks for all APIs owned by the current user
router.post('/security-checks/run-user-apis', securityController.runUserApisSecurityChecks);

// Get security overview for all APIs
router.get('/security-overview', securityController.getSecurityOverview);

// Get all APIs for the current user
router.get('/user-apis', securityController.getUserApis);

module.exports = router; 