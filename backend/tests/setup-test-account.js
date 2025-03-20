/**
 * Script to set up a test account with APIs
 * 
 * This script:
 * 1. Deletes any existing test user
 * 2. Creates a new test user
 * 3. Adds mock APIs to the test user's account
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('../models/User');
const Api = require('../models/Api');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use local MongoDB connection if MONGO_URI is not defined
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/api-watcher';
    await mongoose.connect(mongoURI);
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

// Set up test account
const setupTestAccount = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const email = 'test@mail.com';
    const password = 'test123';
    
    console.log('Setting up test account...');
    
    // Step 1: Delete any existing test user
    const deleteUserResult = await User.deleteMany({ email });
    console.log(`Deleted ${deleteUserResult.deletedCount} existing users with email ${email}`);
    
    // Step 2: Create a new test user
    const newUser = new User({
      name: 'Test User',
      email,
      password
    });
    
    await newUser.save();
    
    console.log('New test user created successfully!');
    console.log('User ID:', newUser._id);
    
    // Step 3: Delete any existing APIs for the test user
    const deleteApisResult = await Api.deleteMany({ owner: newUser._id });
    console.log(`Deleted ${deleteApisResult.deletedCount} existing APIs for the test user`);
    
    // Step 4: Add mock APIs
    const mockData = readMockData();
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
        owner: newUser._id
      });
    }
    
    const addedApis = await Api.insertMany(apisToAdd);
    console.log(`Added ${addedApis.length} mock APIs to the test user account`);
    
    // Log the added APIs
    addedApis.forEach((api, index) => {
      console.log(`${index + 1}. ${api.name} (${api.url})`);
    });
    
    // Step 5: Verify login works
    const user = await User.findOne({ email }).select('+password');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match test result:', isMatch);
    
    if (!isMatch) {
      console.error('WARNING: Password match test failed. Login may not work!');
    } else {
      console.log('Password match test passed. Login should work.');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    
    console.log('Test account setup completed successfully!');
    
  } catch (err) {
    console.error('Error setting up test account:', err.message);
    process.exit(1);
  }
};

// Run the script
setupTestAccount(); 