/**
 * Script to create a completely new test user
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

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

// Create new test user
const createNewTestUser = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const email = 'test@mail.com';
    const password = 'test123';
    
    console.log('Creating new test user with:', { email, password });
    
    // Delete any existing user with the same email
    const deleteResult = await User.deleteMany({ email });
    console.log(`Deleted ${deleteResult.deletedCount} existing users with email ${email}`);
    
    // Create a new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({
      name: 'Test User',
      email,
      password: hashedPassword
    });
    
    await newUser.save();
    
    console.log('New test user created successfully!');
    console.log('User ID:', newUser._id);
    
    // Test password match
    const user = await User.findOne({ email }).select('+password');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match test result:', isMatch);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    
  } catch (err) {
    console.error('Error creating new test user:', err.message);
    process.exit(1);
  }
};

// Run the script
createNewTestUser(); 