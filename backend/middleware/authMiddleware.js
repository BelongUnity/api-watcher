const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and add user to request
 */
const protect = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization');

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'No token, authorization denied' 
    });
  }

  // Check if token format is correct
  if (!token.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid token format' 
    });
  }

  // Extract token without Bearer prefix
  const tokenValue = token.split(' ')[1];

  // Verify token
  try {
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET || 'secret');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false,
      error: 'Token is not valid' 
    });
  }
};

module.exports = { protect }; 