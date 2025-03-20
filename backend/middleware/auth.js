const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token and add user to request
 */
module.exports = function(req, res, next) {
  // Get token from header (support both x-auth-token and Authorization header)
  let token = req.header('x-auth-token');
  
  // If no x-auth-token, try Authorization header
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded.user;
    next();
  } catch (err) {
    logger.error('Token verification error:', { error: err.message });
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 