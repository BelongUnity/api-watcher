/**
 * Script to add mock APIs to the testing account
 * 
 * This script reads the mock APIs from the mock/db.json file and adds them to the database
 * for the testing account (test@mail.com / test123).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Api = require('../models/Api');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use local MongoDB connection if MONGO_URI is not defined
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/api-watcher';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

// Read mock data
const readMockData = () => {
  try {
    const dbPath = path.join(__dirname, 'mock', 'db.json');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return data;
  } catch (err) {
    console.error('Error reading mock data:', err.message);
    process.exit(1);
  }
};

// Add mock APIs to the database
const addMockApis = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Read mock data
    const mockData = readMockData();
    
    // Find the test user
    const testUser = await User.findOne({ email: 'test@mail.com' });
    
    if (!testUser) {
      console.error('Test user not found. Please create a test user first.');
      process.exit(1);
    }
    
    console.log(`Found test user: ${testUser.name} (${testUser.email})`);
    
    // Delete existing APIs for the test user
    const deletedApis = await Api.deleteMany({ owner: testUser._id });
    console.log(`Deleted ${deletedApis.deletedCount} existing APIs for the test user`);
    
    // Add mock APIs
    const mockApis = mockData.apis;
    const apisToAdd = [];
    
    for (const mockApi of mockApis) {
      apisToAdd.push({
        name: mockApi.name,
        url: mockApi.url,
        method: mockApi.method,
        headers: mockApi.headers || {},
        body: mockApi.body || '',
        expectedStatus: mockApi.expectedStatus || 200,
        monitoringInterval: mockApi.interval || 5,
        owner: testUser._id
      });
    }
    
    const addedApis = await Api.insertMany(apisToAdd);
    console.log(`Added ${addedApis.length} mock APIs to the test user account`);
    
    // Log the added APIs
    addedApis.forEach((api, index) => {
      console.log(`${index + 1}. ${api.name} (${api.url})`);
    });
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    
    console.log('Mock APIs added successfully!');
  } catch (err) {
    console.error('Error adding mock APIs:', err.message);
    process.exit(1);
  }
};

// Run the script
addMockApis(); 