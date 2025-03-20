/**
 * Test script for security checks
 * 
 * This script directly tests the security checks functionality
 * without going through the API endpoints.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const securityCheckService = require('../services/securityCheckService');
const Api = require('../models/Api');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/api-watcher');
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Test security checks for a specific API
const testSecurityCheck = async (apiId, userId) => {
  try {
    console.log(`Testing security check for API ${apiId} by user ${userId}`);
    
    // Run the security check
    const result = await securityCheckService.checkApi(apiId, userId);
    
    console.log('Security check result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error testing security check:', error);
    throw error;
  }
};

// Test security checks for all APIs owned by a user
const testUserApisSecurityChecks = async (userId) => {
  try {
    console.log(`Testing security checks for all APIs owned by user ${userId}`);
    
    // Get all APIs in the database
    const allApis = await Api.find({});
    console.log(`Total APIs in database: ${allApis.length}`);
    
    // Convert user ID to string for consistent comparison
    const userIdStr = userId.toString();
    
    // Filter APIs by owner using string comparison
    const userApis = allApis.filter(api => {
      const apiOwnerId = api.owner ? api.owner.toString() : '';
      console.log(`Comparing API ${api.name} owner (${apiOwnerId}) with user ID (${userIdStr}): ${apiOwnerId === userIdStr}`);
      return apiOwnerId === userIdStr;
    });
    
    console.log(`Found ${userApis.length} APIs for user ${userIdStr} after filtering`);
    
    // If no APIs found, return empty result
    if (userApis.length === 0) {
      console.log('No APIs found for user');
      return [];
    }
    
    // Run security checks for each API
    const results = [];
    const errors = [];
    
    for (const api of userApis) {
      try {
        console.log(`Running security check for API: ${api.name} (${api._id})`);
        
        // Run the security check
        const result = await securityCheckService.checkApi(api._id, userId);
        
        console.log(`Security check completed for API: ${api.name}`);
        results.push(result);
      } catch (error) {
        console.error(`Error checking API ${api._id}: ${error.message}`);
        errors.push({
          apiId: api._id,
          apiName: api.name,
          error: error.message
        });
      }
    }
    
    console.log(`Security checks completed for ${results.length} APIs`);
    if (errors.length > 0) {
      console.log(`Encountered ${errors.length} errors during security checks`);
      console.log('Errors:', errors);
    }
    
    return results;
  } catch (error) {
    console.error('Error testing user APIs security checks:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // User ID to test with
    const userId = '67d2eeeb0b060bc8b507570a';
    
    // Test security checks for all APIs owned by the user
    await testUserApisSecurityChecks(userId);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
};

// Run the main function
main(); 