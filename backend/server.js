const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const connectDB = require('./config/db');
const socketUtils = require('./utils/socketUtils');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./api/auth');
const apiRoutes = require('./api/apis');
const userRoutes = require('./api/users');
const analyticsRoutes = require('./routes/analyticsRoutes');
const alertRoutes = require('./routes/alertRoutes');
const securityRoutes = require('./routes/securityRoutes');

// Import services
const apiMonitor = require('./services/apiMonitor');
const notificationService = require('./services/notificationService');
const analyticsService = require('./services/analyticsService');
const AlertService = require('./services/alertService');
const securityCheckService = require('./services/securityCheckService');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Use morgan for HTTP request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to API Watcher Backend API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/security', securityRoutes);

// Initialize alert service
const alertService = new AlertService(io);

// Set alert service in API monitor
apiMonitor.setAlertService(alertService);

// Socket.io connection
io.on('connection', (socket) => {
  logger.socket('New client connected');
  
  // Join user-specific room for alerts
  socket.on('join', (userId) => {
    if (userId) {
      // Create a consistent room name
      const roomName = socketUtils.getUserRoom(userId);
      if (roomName) {
        socket.join(roomName);
        logger.socket(`User ${userId} joined room ${roomName}`);
      }
    }
  });
  
  // Handle alert read event
  socket.on('alertRead', ({ alertId, userId }) => {
    if (userId) {
      logger.socket(`Alert ${alertId} marked as read by user ${userId}`);
      // Use socketUtils to emit events
      socketUtils.emitAlertRead(io, userId, alertId);
    }
  });
  
  // Handle mark all read event
  socket.on('markAllRead', (userId) => {
    if (userId) {
      logger.socket(`All alerts marked as read by user ${userId}`);
      // Use socketUtils to emit events
      socketUtils.emitMarkAllRead(io, userId);
    }
  });
  
  // Handle refresh unread count event
  socket.on('refreshUnreadCount', (userId) => {
    if (userId) {
      logger.socket(`Refreshing unread count for user ${userId}`);
      socketUtils.emitRefreshUnreadCount(io, userId);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    logger.socket('Client disconnected');
  });
});

// Schedule API status checks
cron.schedule('*/1 * * * *', async () => {
  logger.info('Running API status checks every minute');
  
  try {
    // Use the checkAllDueApis function from apiMonitor service
    const checkedCount = await apiMonitor.checkAllDueApis();
    logger.info(`Checked ${checkedCount} APIs that were due for status check`);
  } catch (error) {
    logger.error('Error in scheduled API status check:', error);
  }
});

// Schedule security checks (once a day at midnight)
cron.schedule('0 0 * * *', async () => {
  logger.info('Running daily security checks for all APIs');
  
  try {
    const results = await securityCheckService.checkAllApis();
    logger.info(`Completed security checks for ${results.length} APIs`);
  } catch (error) {
    logger.error('Error in scheduled security checks:', error);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  // Connect to MongoDB
  await connectDB();
  logger.info(`Server running on port ${PORT}`);
  
  // Initialize analytics service
  analyticsService.scheduleAggregations();
  logger.info('Analytics aggregation jobs scheduled');
});

// Export for testing
module.exports = { app, server, io }; 