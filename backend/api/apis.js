const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Api = require('../models/Api');
const StatusHistory = require('../models/StatusHistory');
const apiMonitor = require('../services/apiMonitor');

/**
 * @route   GET /api/apis/status
 * @desc    Get status for all APIs
 * @access  Private
 */
router.get('/status', auth, async (req, res) => {
  try {
    // Get all status history entries, sorted by timestamp (newest first)
    // and limited to the most recent entry for each API
    const statusHistory = await StatusHistory.find()
      .sort({ timestamp: -1 });
    
    // Group by API and get the latest entry for each
    const latestStatusByApi = {};
    statusHistory.forEach(status => {
      const apiId = status.api.toString();
      if (!latestStatusByApi[apiId]) {
        latestStatusByApi[apiId] = {
          id: status._id,
          apiId: apiId,
          status: status.status,
          responseTime: status.responseTime,
          statusCode: status.statusCode,
          timestamp: status.timestamp
        };
      }
    });
    
    // Convert to array
    const result = Object.values(latestStatusByApi);
    
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/apis
 * @desc    Get all APIs for the authenticated user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching APIs for user:', req.user.id);
    const apis = await Api.find({ owner: req.user.id });
    console.log(`Found ${apis.length} APIs for user ${req.user.id}`);
    res.json(apis);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/apis
 * @desc    Create a new API to monitor
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, url, method, headers, body, expectedStatus, timeout, interval } = req.body;

    // Create new API
    const newApi = new Api({
      name,
      url,
      method: method || 'GET',
      headers: headers || {},
      body: body || '',
      expectedStatus: expectedStatus || 200,
      timeout: timeout || 5000,
      interval: interval || 5,
      owner: req.user.id
    });

    // Save API to database
    const api = await newApi.save();

    // Perform initial status check
    const initialStatus = await apiMonitor.checkApiStatus(api);
    
    // Create initial status history
    const statusHistory = new StatusHistory({
      api: api._id,
      status: initialStatus.status,
      responseTime: initialStatus.responseTime,
      statusCode: initialStatus.statusCode,
      responseBody: initialStatus.responseBody
    });
    
    await statusHistory.save();
    
    // Update API with initial status
    api.lastStatus = initialStatus.status;
    api.status = initialStatus.status;
    api.lastChecked = Date.now();
    await api.save();

    res.json(api);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/apis/:id
 * @desc    Get API by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const api = await Api.findById(req.params.id);
    
    // Check if API exists
    if (!api) {
      return res.status(404).json({ message: 'API not found' });
    }
    
    // Check if user owns the API
    if (api.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(api);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'API not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/apis/:id
 * @desc    Update API
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, url, method, headers, body, expectedStatus, timeout, interval } = req.body;
    
    // Find API by ID
    let api = await Api.findById(req.params.id);
    
    // Check if API exists
    if (!api) {
      return res.status(404).json({ message: 'API not found' });
    }
    
    // Check if user owns the API
    if (api.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Update API
    api.name = name || api.name;
    api.url = url || api.url;
    api.method = method || api.method;
    api.headers = headers || api.headers;
    api.body = body || api.body;
    api.expectedStatus = expectedStatus || api.expectedStatus;
    api.timeout = timeout || api.timeout;
    api.interval = interval || api.interval;
    
    // Save updated API
    await api.save();
    
    res.json(api);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'API not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/apis/:id
 * @desc    Delete API
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find API by ID
    const api = await Api.findById(req.params.id);
    
    // Check if API exists
    if (!api) {
      return res.status(404).json({ message: 'API not found' });
    }
    
    // Check if user owns the API
    if (api.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Delete API
    await api.remove();
    
    // Delete associated status history
    await StatusHistory.deleteMany({ api: req.params.id });
    
    res.json({ message: 'API removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'API not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/apis/:id/history
 * @desc    Get API status history with pagination
 * @access  Private
 */
router.get('/:id/history', auth, async (req, res) => {
  try {
    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Find API by ID
    const api = await Api.findById(req.params.id);
    
    // Check if API exists
    if (!api) {
      return res.status(404).json({ message: 'API not found' });
    }
    
    // Check if user owns the API
    if (api.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Get total count for pagination
    const total = await StatusHistory.countDocuments({ api: req.params.id });
    
    // Get status history with pagination
    const history = await StatusHistory.find({ api: req.params.id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      history,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'API not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/apis/:id/check
 * @desc    Manually check API status
 * @access  Private
 */
router.post('/:id/check', auth, async (req, res) => {
  try {
    // Find API by ID
    const api = await Api.findById(req.params.id);
    
    // Check if API exists
    if (!api) {
      return res.status(404).json({ message: 'API not found' });
    }
    
    // Check if user owns the API
    if (api.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Check API status
    const status = await apiMonitor.checkApiStatus(api);
    
    // Update API status using the service function
    await apiMonitor.updateApiStatus(api, status);
    
    res.json({ api, status });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'API not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 