const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Api = require('../models/Api');
const StatusHistory = require('../models/StatusHistory');
const bcrypt = require('bcryptjs');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, notificationPreferences } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user
    if (name) user.name = name;
    if (email) user.email = email;
    if (notificationPreferences) user.notificationPreferences = notificationPreferences;
    
    // Save updated user
    await user.save();
    
    // Return user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/users/password
 * @desc    Update user password
 * @access  Private
 */
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    
    // Save updated user
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/users
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/', auth, async (req, res) => {
  try {
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all APIs for the user
    const apis = await Api.find({ user: req.user.id });
    
    // Delete all status history for the user's APIs
    for (const api of apis) {
      await StatusHistory.deleteMany({ api: api._id });
    }
    
    // Delete all APIs for the user
    await Api.deleteMany({ user: req.user.id });
    
    // Delete user
    await user.remove();
    
    res.json({ message: 'User account deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Get all APIs for the user
    const apis = await Api.find({ user: req.user.id });
    
    // Count APIs by status
    const apiCounts = {
      total: apis.length,
      up: apis.filter(api => api.lastStatus === 'up').length,
      down: apis.filter(api => api.lastStatus === 'down').length,
      unknown: apis.filter(api => api.lastStatus === 'unknown').length
    };
    
    // Get recent status changes
    const recentStatusChanges = await StatusHistory.find({ 
      api: { $in: apis.map(api => api._id) },
      statusChanged: true
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('api', 'name url');
    
    res.json({
      apiCounts,
      recentStatusChanges
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 