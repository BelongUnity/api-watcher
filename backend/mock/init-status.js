/**
 * This script initializes the status collection in the db.json file
 * with realistic status data for the APIs.
 */

const fs = require('fs');
const path = require('path');

// Load the db.json file
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Clear existing status data
db.status = [];

// Get all APIs
const apis = db.apis;

// Generate status data for each API
const now = new Date();
const statusData = [];
let idCounter = 1;

// Generate status data for the last 24 hours (every hour)
for (let i = 24; i >= 0; i--) {
  const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
  
  apis.forEach(api => {
    // Generate a random status with probabilities:
    // - 75% chance of being up
    // - 15% chance of being degraded
    // - 10% chance of being down
    const random = Math.random();
    let status, responseTime, statusCode;
    
    if (random < 0.75) {
      // Up status
      status = 'up';
      responseTime = Math.floor(Math.random() * 200) + 50; // 50-250ms
      statusCode = api.expectedStatus;
    } else if (random < 0.90) {
      // Degraded status (high response time but successful)
      status = 'degraded';
      responseTime = Math.floor(Math.random() * 800) + 700; // 700-1500ms
      statusCode = api.expectedStatus;
    } else {
      // Down status
      status = 'down';
      responseTime = 0;
      statusCode = Math.random() < 0.5 ? 500 : 503; // Randomly choose between common error codes
    }
    
    statusData.push({
      id: (idCounter++).toString(),
      apiId: api.id,
      status,
      responseTime,
      statusCode,
      timestamp
    });
  });
}

// Add status data to db
db.status = statusData;

// Generate notifications for down or degraded status
db.notifications = [];
let notificationId = 1;

statusData.forEach(status => {
  if (status.status === 'down') {
    const api = apis.find(a => a.id === status.apiId);
    db.notifications.push({
      id: (notificationId++).toString(),
      userId: api.userId,
      apiId: api.id,
      message: `${api.name} is down (Status Code: ${status.statusCode})`,
      read: false,
      timestamp: status.timestamp
    });
  } else if (status.status === 'degraded') {
    const api = apis.find(a => a.id === status.apiId);
    db.notifications.push({
      id: (notificationId++).toString(),
      userId: api.userId,
      apiId: api.id,
      message: `${api.name} response time is high (${status.responseTime}ms)`,
      read: false,
      timestamp: status.timestamp
    });
  }
});

// Write the updated db.json file
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log(`Generated ${statusData.length} status entries and ${db.notifications.length} notifications`);
console.log('Database initialized successfully!'); 