const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise} Mongoose connection promise
 */
const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    // Try to connect to MongoDB
    // First try local MongoDB, if that fails, try MongoDB Atlas if URI is provided
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/api-watcher';
    
    console.log(`Attempting to connect to MongoDB at ${mongoURI.split('@').length > 1 ? mongoURI.split('@')[1] : 'localhost'}`);
    
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    
    // Provide helpful troubleshooting information
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure MongoDB is installed and running on your machine');
    console.log('2. Or set MONGO_URI in your .env file to use MongoDB Atlas');
    console.log('3. Example MONGO_URI: mongodb+srv://<username>:<password>@cluster0.mongodb.net/api-watcher\n');
    
    process.exit(1);
  }
};

module.exports = connectDB; 