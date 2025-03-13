const axios = require('axios');
const Api = require('../models/Api');
const StatusHistory = require('../models/StatusHistory');
const notificationService = require('./notificationService');

/**
 * Check the status of a single API
 * @param {Object} api - The API document from MongoDB
 * @returns {Promise<Object>} - The status check result
 */
const checkApiStatus = async (api) => {
  const startTime = Date.now();
  let status = 'down';
  let statusCode = 0;
  let responseTime = 0;
  let message = '';

  try {
    // Prepare request config
    const config = {
      method: api.method,
      url: api.url,
      timeout: api.expectedResponseTime * 2, // Double the expected time as timeout
      validateStatus: () => true, // Don't throw on any status code
    };

    // Add headers if present
    if (api.headers && api.headers.size > 0) {
      config.headers = {};
      api.headers.forEach((value, key) => {
        config.headers[key] = value;
      });
    }

    // Add body if present and method is not GET
    if (api.body && api.method !== 'GET') {
      try {
        config.data = JSON.parse(api.body);
      } catch (e) {
        config.data = api.body;
      }
    }

    // Make the request
    const response = await axios(config);
    
    // Calculate response time
    responseTime = Date.now() - startTime;
    
    // Get status code
    statusCode = response.status;
    
    // Determine if API is up based on expected status code
    if (statusCode === api.expectedStatus) {
      status = 'up';
      message = 'API is up and running';
    } else {
      status = 'down';
      message = `API returned unexpected status code: ${statusCode}`;
    }

    // Check if response time exceeds expected time
    if (status === 'up' && responseTime > api.expectedResponseTime) {
      message = `API is up but response time (${responseTime}ms) exceeds expected time (${api.expectedResponseTime}ms)`;
    }
  } catch (error) {
    status = 'down';
    responseTime = Date.now() - startTime;
    
    if (error.code === 'ECONNABORTED') {
      message = 'Request timed out';
    } else if (error.code === 'ENOTFOUND') {
      message = 'DNS lookup failed';
    } else {
      message = error.message || 'Unknown error occurred';
    }
  }

  return {
    status,
    statusCode,
    responseTime,
    message,
    timestamp: new Date()
  };
};

/**
 * Update API status in database and create history record
 * @param {Object} api - The API document from MongoDB
 * @param {Object} statusResult - The result from checkApiStatus
 * @returns {Promise<void>}
 */
const updateApiStatus = async (api, statusResult) => {
  const previousStatus = api.status;
  
  // Update API document
  api.status = statusResult.status;
  api.lastChecked = statusResult.timestamp;
  api.responseTime = statusResult.responseTime;
  
  // Update uptime calculation
  if (api.uptime === null) {
    api.uptime = statusResult.status === 'up' ? 100 : 0;
  } else {
    // Simple moving average for uptime
    const weight = 0.1; // Weight for new value
    const newUptime = statusResult.status === 'up' ? 100 : 0;
    api.uptime = api.uptime * (1 - weight) + newUptime * weight;
  }
  
  await api.save();
  
  // Create status history record
  await StatusHistory.create({
    api: api._id,
    status: statusResult.status,
    responseTime: statusResult.responseTime,
    statusCode: statusResult.statusCode,
    message: statusResult.message,
    timestamp: statusResult.timestamp
  });
  
  // Send notifications if status changed
  if (previousStatus !== 'unknown' && previousStatus !== statusResult.status) {
    console.log(`Status changed for API ${api.name}: ${previousStatus} -> ${statusResult.status}`);
    
    const notificationType = statusResult.status === 'up' ? 'onUp' : 'onDown';
    
    if (api.notificationSettings[notificationType]) {
      await notificationService.sendStatusChangeNotification(
        api,
        previousStatus,
        statusResult
      );
    }
    
    // Try to emit socket event if io is available
    try {
      const io = require('../server').io;
      if (io) {
        io.emit('statusChange', {
          apiId: api._id,
          name: api.name,
          oldStatus: previousStatus,
          newStatus: statusResult.status,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error emitting socket event:', error);
    }
  }
  
  // Send performance notification if needed
  if (
    statusResult.status === 'up' &&
    statusResult.responseTime > api.expectedResponseTime &&
    api.notificationSettings.onPerformanceIssue
  ) {
    await notificationService.sendPerformanceNotification(api, statusResult);
  }
};

/**
 * Check all APIs that are due for monitoring
 * @returns {Promise<number>} - Number of APIs checked
 */
const checkAllDueApis = async () => {
  const now = new Date();
  
  // Find APIs that are due for checking
  // An API is due if:
  // 1. It has never been checked (lastChecked is null)
  // 2. The time since last check is greater than or equal to its monitoring interval
  const dueApis = await Api.find({
    $or: [
      { lastChecked: null },
      {
        $expr: {
          $gte: [
            { $subtract: [now, '$lastChecked'] },
            { $multiply: ['$monitoringInterval', 60 * 1000] } // Convert minutes to milliseconds
          ]
        }
      }
    ]
  });
  
  console.log(`Found ${dueApis.length} APIs due for status check`);
  
  // Check each API
  for (const api of dueApis) {
    try {
      const statusResult = await checkApiStatus(api);
      await updateApiStatus(api, statusResult);
      console.log(`Checked API ${api.name}: ${statusResult.status}`);
    } catch (error) {
      console.error(`Error checking API ${api.name}:`, error);
    }
  }
  
  return dueApis.length;
};

module.exports = {
  checkApiStatus,
  updateApiStatus,
  checkAllDueApis
}; 