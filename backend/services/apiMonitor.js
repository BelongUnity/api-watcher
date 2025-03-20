const axios = require('axios');
const Api = require('../models/Api');
const StatusHistory = require('../models/StatusHistory');
const notificationService = require('./notificationService');
let alertService = null;

// This will be set when the server starts
const setAlertService = (service) => {
  alertService = service;
};

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
    
    // Create an alert for status change
    if (alertService && statusResult.status === 'down') {
      try {
        // Check if the API has a valid owner
        if (!api.owner) {
          console.warn(`Cannot create alert: API ${api.name} has no owner`);
        } else {
          await alertService.createAlert({
            user: api.owner,
            api: api._id,
            alertType: 'Downtime',
            severity: 'Critical',
            message: `API ${api.name} is down: ${statusResult.message}`,
            details: {
              previousStatus,
              statusCode: statusResult.statusCode,
              responseTime: statusResult.responseTime,
              timestamp: statusResult.timestamp
            }
          });
          console.log(`Created downtime alert for API ${api.name}`);
        }
      } catch (error) {
        console.error('Error creating alert:', error);
      }
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
    
    // Create an alert for performance issue
    if (alertService) {
      try {
        // Check if the API has a valid owner
        if (!api.owner) {
          console.warn(`Cannot create alert: API ${api.name} has no owner`);
        } else {
          await alertService.createAlert({
            user: api.owner,
            api: api._id,
            alertType: 'HighLatency',
            severity: 'Medium',
            message: `API ${api.name} is experiencing high latency: ${statusResult.responseTime}ms (expected: ${api.expectedResponseTime}ms)`,
            details: {
              responseTime: statusResult.responseTime,
              expectedResponseTime: api.expectedResponseTime,
              timestamp: statusResult.timestamp
            }
          });
          console.log(`Created high latency alert for API ${api.name}`);
        }
      } catch (error) {
        console.error('Error creating alert:', error);
      }
    }
  }
  
  // If API was down and is now up, create a recovery alert
  if (previousStatus === 'down' && statusResult.status === 'up' && alertService) {
    try {
      // Check if the API has a valid owner
      if (!api.owner) {
        console.warn(`Cannot create recovery alert: API ${api.name} has no owner`);
      } else {
        await alertService.createAlert({
          user: api.owner,
          api: api._id,
          alertType: 'Other',
          severity: 'Info',
          message: `API ${api.name} has recovered and is now up`,
          details: {
            previousStatus,
            responseTime: statusResult.responseTime,
            timestamp: statusResult.timestamp
          }
        });
        console.log(`Created recovery alert for API ${api.name}`);
      }
    } catch (error) {
      console.error('Error creating recovery alert:', error);
    }
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

/**
 * Create a test alert for debugging purposes
 * @param {Object} alertService - Alert service instance
 * @returns {Promise<void>}
 */
const createTestAlert = async (alertService) => {
  if (!alertService) {
    console.error('Alert service not available for test alert');
    return;
  }
  
  try {
    // Find the first API with a valid owner
    const api = await Api.findOne({ owner: { $ne: null } });
    
    if (!api) {
      console.error('No APIs with valid owners found for test alert');
      return;
    }
    
    console.log('Creating test alert for API:', api.name);
    
    // Create a test alert
    const testAlert = await alertService.createAlert({
      user: api.owner,
      api: api._id,
      alertType: 'Downtime',
      severity: 'Critical',
      message: `TEST ALERT: API ${api.name} is experiencing issues`,
      details: {
        timestamp: new Date(),
        testAlert: true
      }
    });
    
    console.log('Test alert created:', testAlert);
  } catch (error) {
    console.error('Error creating test alert:', error);
  }
};

module.exports = {
  checkApiStatus,
  updateApiStatus,
  checkAllDueApis,
  setAlertService,
  createTestAlert
}; 