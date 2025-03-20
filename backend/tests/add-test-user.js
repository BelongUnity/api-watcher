/**
 * Script to add a test user to the database
 * 
 * This script creates a test user with the credentials:
 * Email: test@mail.com
 * Password: test123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

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

// Add test user to the database
const addTestUser = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@mail.com' });
    
    if (existingUser) {
      console.log('Test user already exists. Updating password...');
      
      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);
      
      existingUser.password = hashedPassword;
      await existingUser.save();
      
      console.log('Test user password updated successfully!');
    } else {
      // Create test user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);
      
      const testUser = new User({
        name: 'Test User',
        email: 'test@mail.com',
        password: hashedPassword
      });
      
      await testUser.save();
      
      console.log('Test user created successfully!');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    
  } catch (err) {
    console.error('Error adding test user:', err.message);
    process.exit(1);
  }
};

// Run the script
addTestUser(); 