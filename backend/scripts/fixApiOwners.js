/**
 * Script to fix any APIs that don't have a valid owner
 * 
 * This script will:
 * 1. Find all APIs without an owner
 * 2. Find a default user to assign as owner
 * 3. Update the APIs to have the default owner
 * 
 * Run with: node scripts/fixApiOwners.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Api = require('../models/Api');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const fixApiOwners = async () => {
  try {
    console.log('Starting API owner fix script...');
    
    // Find APIs without an owner
    const apisWithoutOwner = await Api.find({ 
      $or: [
        { owner: null },
        { owner: { $exists: false } }
      ]
    });
    
    console.log(`Found ${apisWithoutOwner.length} APIs without an owner`);
    
    if (apisWithoutOwner.length === 0) {
      console.log('No APIs need fixing. Exiting.');
      process.exit(0);
    }
    
    // Find a default user to assign as owner
    const defaultUser = await User.findOne();
    
    if (!defaultUser) {
      console.error('No users found in the database. Cannot fix APIs without an owner.');
      process.exit(1);
    }
    
    console.log(`Using user ${defaultUser.name} (${defaultUser._id}) as default owner`);
    
    // Update APIs to have the default owner
    const updatePromises = apisWithoutOwner.map(api => 
      Api.findByIdAndUpdate(api._id, { owner: defaultUser._id })
    );
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully updated ${apisWithoutOwner.length} APIs with default owner`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing API owners:', error);
    process.exit(1);
  }
};

// Run the function
fixApiOwners(); 