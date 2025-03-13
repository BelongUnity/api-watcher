const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./api/auth');
const apiRoutes = require('./api/apis');
const userRoutes = require('./api/users');

// Import services
const apiMonitor = require('./services/apiMonitor');
const notificationService = require('./services/notificationService');

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
app.use(morgan('dev'));

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to API Watcher Backend API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/users', userRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Schedule API status checks
cron.schedule('*/1 * * * *', async () => {
  console.log('Running API status checks every minute');
  
  try {
    // Use the checkAllDueApis function from apiMonitor service
    const checkedCount = await apiMonitor.checkAllDueApis();
    console.log(`Checked ${checkedCount} APIs that were due for status check`);
  } catch (error) {
    console.error('Error in scheduled API status check:', error);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  // Connect to MongoDB
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});

// Export for testing
module.exports = { app, server, io }; 