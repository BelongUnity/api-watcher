const nodemailer = require('nodemailer');
const User = require('../models/User');
const axios = require('axios');

/**
 * Configure email transporter
 * @returns {Object} - Nodemailer transporter
 */
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email content in HTML format
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createEmailTransporter();
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

/**
 * Send SMS notification (placeholder - would need a real SMS provider)
 * @param {string} to - Phone number
 * @param {string} message - SMS content
 * @returns {Promise<boolean>} - Success status
 */
const sendSMS = async (to, message) => {
  try {
    // This is a placeholder. In a real application, you would integrate with
    // an SMS provider like Twilio, Nexmo, etc.
    console.log(`SMS would be sent to ${to}: ${message}`);
    
    // Example of how it might look with a real provider:
    /*
    const response = await axios.post('https://api.sms-provider.com/send', {
      apiKey: process.env.SMS_API_KEY,
      to,
      from: process.env.SMS_FROM,
      message
    });
    */
    
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
};

/**
 * Send webhook notification
 * @param {string} url - Webhook URL
 * @param {Object} payload - Data to send
 * @returns {Promise<boolean>} - Success status
 */
const sendWebhook = async (url, payload) => {
  try {
    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Watcher-Signature': process.env.WEBHOOK_SECRET
      }
    });
    
    console.log(`Webhook sent to ${url}`);
    return true;
  } catch (error) {
    console.error(`Webhook to ${url} failed:`, error);
    return false;
  }
};

/**
 * Send status change notification to a user
 * @param {Object} api - The API document
 * @param {string} previousStatus - Previous API status
 * @param {Object} statusResult - Current status check result
 * @returns {Promise<void>}
 */
const sendStatusChangeNotification = async (api, previousStatus, statusResult) => {
  try {
    // Get the API owner
    const user = await User.findById(api.owner);
    
    if (!user) {
      console.error(`User not found for API ${api.name}`);
      return;
    }
    
    const statusChange = `${previousStatus.toUpperCase()} → ${statusResult.status.toUpperCase()}`;
    const subject = `[API Watcher] ${api.name} is ${statusResult.status.toUpperCase()}`;
    const message = `
      <h2>API Status Change</h2>
      <p>Your API <strong>${api.name}</strong> status has changed from <strong>${previousStatus.toUpperCase()}</strong> to <strong>${statusResult.status.toUpperCase()}</strong>.</p>
      <p><strong>URL:</strong> ${api.url}</p>
      <p><strong>Status Code:</strong> ${statusResult.statusCode}</p>
      <p><strong>Response Time:</strong> ${statusResult.responseTime}ms</p>
      <p><strong>Message:</strong> ${statusResult.message}</p>
      <p><strong>Time:</strong> ${statusResult.timestamp.toLocaleString()}</p>
    `;
    
    // Send email notification if enabled
    if (user.notificationPreferences.email.enabled) {
      await sendEmail(user.email, subject, message);
    }
    
    // Send SMS notification if enabled
    if (user.notificationPreferences.sms.enabled && user.notificationPreferences.sms.phoneNumber) {
      const smsMessage = `API Watcher: ${api.name} is ${statusResult.status.toUpperCase()}. Status code: ${statusResult.statusCode}. Time: ${statusResult.timestamp.toLocaleString()}`;
      await sendSMS(user.notificationPreferences.sms.phoneNumber, smsMessage);
    }
    
    // Send webhook notification if enabled
    if (user.notificationPreferences.webhook.enabled && user.notificationPreferences.webhook.url) {
      const webhookPayload = {
        event: 'status_change',
        api: {
          id: api._id,
          name: api.name,
          url: api.url
        },
        previousStatus,
        currentStatus: statusResult.status,
        statusCode: statusResult.statusCode,
        responseTime: statusResult.responseTime,
        message: statusResult.message,
        timestamp: statusResult.timestamp
      };
      
      await sendWebhook(user.notificationPreferences.webhook.url, webhookPayload);
    }
  } catch (error) {
    console.error(`Failed to send status change notification for API ${api.name}:`, error);
  }
};

/**
 * Send performance issue notification
 * @param {Object} api - The API document
 * @param {Object} statusResult - Current status check result
 * @returns {Promise<void>}
 */
const sendPerformanceNotification = async (api, statusResult) => {
  try {
    // Get the API owner
    const user = await User.findById(api.owner);
    
    if (!user) {
      console.error(`User not found for API ${api.name}`);
      return;
    }
    
    const subject = `[API Watcher] ${api.name} - Performance Issue Detected`;
    const message = `
      <h2>API Performance Issue</h2>
      <p>Your API <strong>${api.name}</strong> is responding slower than expected.</p>
      <p><strong>URL:</strong> ${api.url}</p>
      <p><strong>Status:</strong> ${statusResult.status.toUpperCase()}</p>
      <p><strong>Response Time:</strong> ${statusResult.responseTime}ms (Expected: ${api.expectedResponseTime}ms)</p>
      <p><strong>Time:</strong> ${statusResult.timestamp.toLocaleString()}</p>
    `;
    
    // Send email notification if enabled
    if (user.notificationPreferences.email.enabled) {
      await sendEmail(user.email, subject, message);
    }
    
    // Send SMS notification if enabled
    if (user.notificationPreferences.sms.enabled && user.notificationPreferences.sms.phoneNumber) {
      const smsMessage = `API Watcher: ${api.name} performance issue. Response time: ${statusResult.responseTime}ms (Expected: ${api.expectedResponseTime}ms). Time: ${statusResult.timestamp.toLocaleString()}`;
      await sendSMS(user.notificationPreferences.sms.phoneNumber, smsMessage);
    }
    
    // Send webhook notification if enabled
    if (user.notificationPreferences.webhook.enabled && user.notificationPreferences.webhook.url) {
      const webhookPayload = {
        event: 'performance_issue',
        api: {
          id: api._id,
          name: api.name,
          url: api.url
        },
        status: statusResult.status,
        responseTime: statusResult.responseTime,
        expectedResponseTime: api.expectedResponseTime,
        timestamp: statusResult.timestamp
      };
      
      await sendWebhook(user.notificationPreferences.webhook.url, webhookPayload);
    }
  } catch (error) {
    console.error(`Failed to send performance notification for API ${api.name}:`, error);
  }
};

module.exports = {
  sendEmail,
  sendSMS,
  sendWebhook,
  sendStatusChangeNotification,
  sendPerformanceNotification
}; 