/**
 * Script to directly test the login functionality
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

// Test login
const testLogin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const email = 'test@mail.com';
    const password = 'test123';
    
    console.log('Testing login with:', { email, password });
    
    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.error('User not found!');
      process.exit(1);
    }
    
    console.log('User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      passwordLength: user.password.length
    });
    
    // Test password match using bcrypt directly
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.error('Password does not match!');
      
      // Create a new user with the same email but a new password
      console.log('Creating a new user with the same email...');
      
      // Delete the existing user
      await User.deleteOne({ email });
      
      // Create a new user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const newUser = new User({
        name: 'Test User',
        email,
        password: hashedPassword
      });
      
      await newUser.save();
      
      console.log('New user created successfully!');
      
      // Test password match again
      const updatedUser = await User.findOne({ email }).select('+password');
      const updatedMatch = await bcrypt.compare(password, updatedUser.password);
      console.log('Updated password match result:', updatedMatch);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    
  } catch (err) {
    console.error('Error testing login:', err.message);
    process.exit(1);
  }
};

// Run the script
testLogin(); 