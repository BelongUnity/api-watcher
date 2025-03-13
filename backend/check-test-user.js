/**
 * Script to check if the test user exists and if the password is correct
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

// Check test user
const checkTestUser = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Check if test user exists
    const user = await User.findOne({ email: 'test@mail.com' }).select('+password');
    
    if (!user) {
      console.error('Test user not found!');
      process.exit(1);
    }
    
    console.log('Test user found:');
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Created At:', user.createdAt);
    
    // Check if password is correct
    const isMatch = await bcrypt.compare('test123', user.password);
    
    if (isMatch) {
      console.log('Password is correct!');
    } else {
      console.error('Password is incorrect!');
      
      // Update password
      console.log('Updating password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);
      
      user.password = hashedPassword;
      await user.save();
      
      console.log('Password updated successfully!');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    
  } catch (err) {
    console.error('Error checking test user:', err.message);
    process.exit(1);
  }
};

// Run the script
checkTestUser(); 