const winston = require('winston');

// Custom log levels
const LOG_LEVELS = {
  error: 0,    // Errors that need immediate attention
  warn: 1,     // Warnings that might need attention
  info: 2,     // Important business events
  http: 3,     // HTTP request logs
  debug: 4,    // Detailed information for debugging
};

// Custom format to handle objects and arrays
const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  // Convert objects to strings with limited depth and truncate long arrays
  let metaString = '';
  if (Object.keys(meta).length) {
    const processedMeta = { ...meta };
    
    // Process nested objects and arrays
    Object.keys(processedMeta).forEach(key => {
      if (Array.isArray(processedMeta[key]) && processedMeta[key].length > 3) {
        processedMeta[key] = `[Array(${processedMeta[key].length})]`;
      } else if (typeof processedMeta[key] === 'object' && processedMeta[key] !== null) {
        if (Object.keys(processedMeta[key]).length > 3) {
          processedMeta[key] = '[Object]';
        }
      }
    });
    
    metaString = JSON.stringify(processedMeta, null, 0);
  }
  
  return `${timestamp} ${level}: ${message} ${metaString}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Don't log detailed information in production
const shouldLog = (level) => {
  if (process.env.NODE_ENV === 'production') {
    return LOG_LEVELS[level] <= LOG_LEVELS.info;
  }
  // In development, still limit some verbose logging
  if (level === 'debug') {
    return process.env.DEBUG === 'true';
  }
  return true;
};

const log = {
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },
  
  warn: (message, meta = {}) => {
    if (shouldLog('warn')) {
      logger.warn(message, meta);
    }
  },
  
  info: (message, meta = {}) => {
    if (shouldLog('info')) {
      // Filter out sensitive or verbose data
      const filteredMeta = { ...meta };
      delete filteredMeta.headers;
      delete filteredMeta.body;
      delete filteredMeta.token;
      delete filteredMeta.password;
      
      // Truncate long arrays and objects
      if (typeof filteredMeta === 'object') {
        Object.keys(filteredMeta).forEach(key => {
          if (Array.isArray(filteredMeta[key]) && filteredMeta[key].length > 3) {
            filteredMeta[key] = `Array(${filteredMeta[key].length})`;
          } else if (typeof filteredMeta[key] === 'object' && filteredMeta[key] !== null) {
            if (Object.keys(filteredMeta[key]).length > 3) {
              filteredMeta[key] = '[Object]';
            }
          }
        });
      }
      
      logger.info(message, filteredMeta);
    }
  },
  
  http: (message, meta = {}) => {
    if (shouldLog('http')) {
      // Only log essential HTTP information
      const { method, url, status, responseTime } = meta;
      logger.http(message, { method, url, status, responseTime });
    }
  },
  
  debug: (message, meta = {}) => {
    if (shouldLog('debug')) {
      logger.debug(message, meta);
    }
  },
  
  // Special method for security-related logs
  security: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG === 'true') {
      logger.info(`[SECURITY] ${message}`, meta);
    }
  },
  
  // Special method for socket events
  socket: (message, meta = {}) => {
    if (shouldLog('debug')) {
      // Only log essential socket information
      const { event, userId } = meta;
      logger.debug(`[SOCKET] ${message}`, { event, userId });
    }
  }
};

module.exports = log; 