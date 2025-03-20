const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const StatusHistory = require('../models/StatusHistory');
const AnalyticsAggregate = require('../models/AnalyticsAggregate');
const Api = require('../models/Api');
const analyticsService = require('../services/analyticsService');
const PDFDocument = require('pdfkit');
const { createObjectCsvStringifier } = require('csv-writer');

/**
 * @route   GET /api/analytics/data
 * @desc    Get historical data for an API
 * @access  Private
 */
router.get('/data', protect, async (req, res) => {
  try {
    const { api_id, start_time, end_time, interval, metric } = req.query;
    
    // Validate required parameters
    if (!api_id || !start_time || !end_time || !metric) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: api_id, start_time, end_time, metric'
      });
    }
    
    // Validate API ownership
    const api = await Api.findById(api_id);
    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }
    
    if (api.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this API'
      });
    }
    
    // Parse timestamps
    const startDate = new Date(parseInt(start_time));
    const endDate = new Date(parseInt(end_time));
    
    // If interval is specified, get aggregated data
    if (interval && ['hourly', 'daily', 'weekly', 'monthly'].includes(interval)) {
      const aggregates = await AnalyticsAggregate.find({
        api: api_id,
        period: interval,
        startTime: { $gte: startDate },
        endTime: { $lte: endDate }
      }).sort({ startTime: 1 });
      
      // Format response based on the requested metric
      const data = aggregates.map(agg => {
        let value;
        
        switch (metric) {
          case 'response_time':
            value = agg.metrics.avgResponseTime;
            break;
          case 'uptime':
            value = agg.metrics.uptime;
            break;
          case 'request_count':
            value = agg.metrics.requestCount;
            break;
          case 'success_rate':
            value = agg.metrics.successCount / agg.metrics.requestCount * 100;
            break;
          case 'reliability_score':
            value = agg.reliabilityScore;
            break;
          case 'performance_score':
            value = agg.performanceScore;
            break;
          case 'health_score':
            value = agg.healthScore;
            break;
          default:
            value = null;
        }
        
        return {
          timestamp: agg.startTime.getTime(),
          value
        };
      });
      
      return res.json({
        success: true,
        data
      });
    } else {
      // Get raw data from status history
      const statusHistory = await StatusHistory.find({
        api: api_id,
        timestamp: { $gte: startDate, $lte: endDate }
      }).sort({ timestamp: 1 });
      
      // Format response based on the requested metric
      const data = statusHistory.map(record => {
        let value;
        
        switch (metric) {
          case 'response_time':
            value = record.responseTime;
            break;
          case 'status':
            value = record.status === 'up' ? 1 : 0;
            break;
          case 'status_code':
            value = record.statusCode;
            break;
          default:
            value = null;
        }
        
        return {
          timestamp: record.timestamp.getTime(),
          value
        };
      });
      
      return res.json({
        success: true,
        data
      });
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/analytics/reliability
 * @desc    Get reliability metrics for an API
 * @access  Private
 */
router.get('/reliability', protect, async (req, res) => {
  try {
    const { api_id, start_time, end_time } = req.query;
    
    // Validate required parameters
    if (!api_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: api_id, start_time, end_time'
      });
    }
    
    // Validate API ownership
    const api = await Api.findById(api_id);
    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }
    
    if (api.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this API'
      });
    }
    
    // Parse timestamps
    const startDate = new Date(parseInt(start_time));
    const endDate = new Date(parseInt(end_time));
    
    // Get status history for the specified time period
    const statusHistory = await StatusHistory.find({
      api: api_id,
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    if (statusHistory.length === 0) {
      return res.json({
        success: true,
        data: {
          uptime_percentage: 100,
          response_time_consistency: 1,
          overall_health_score: 100
        }
      });
    }
    
    // Extract response times
    const responseTimes = statusHistory.map(record => record.responseTime);
    
    // Calculate statistics
    const responseTimeStats = analyticsService.calculateResponseTimeStats(responseTimes);
    
    // Count successful and failed requests
    const requestCount = statusHistory.length;
    const successCount = statusHistory.filter(record => record.status === 'up').length;
    
    // Calculate uptime percentage
    const uptime = (successCount / requestCount) * 100;
    
    // Calculate reliability score
    const reliabilityScore = analyticsService.calculateReliabilityScore(
      uptime,
      responseTimeStats.stdDev,
      responseTimeStats.avg
    );
    
    // Calculate performance score
    const performanceScore = analyticsService.calculatePerformanceScore(
      responseTimeStats.avg,
      api.expectedResponseTime
    );
    
    // Calculate health score
    const healthScore = analyticsService.calculateHealthScore(
      reliabilityScore,
      performanceScore
    );
    
    // Calculate response time consistency (1 - coefficient of variation)
    let responseTimeConsistency = 1;
    if (responseTimeStats.avg > 0) {
      const cv = responseTimeStats.stdDev / responseTimeStats.avg;
      responseTimeConsistency = Math.max(0, 1 - cv);
    }
    
    return res.json({
      success: true,
      data: {
        uptime_percentage: uptime,
        response_time_consistency: responseTimeConsistency,
        overall_health_score: healthScore,
        reliability_score: reliabilityScore,
        performance_score: performanceScore,
        avg_response_time: responseTimeStats.avg,
        min_response_time: responseTimeStats.min,
        max_response_time: responseTimeStats.max,
        p95_response_time: responseTimeStats.p95
      }
    });
  } catch (error) {
    console.error('Error fetching reliability metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/analytics/trend
 * @desc    Get trend analysis for an API
 * @access  Private
 */
router.get('/trend', protect, async (req, res) => {
  try {
    const { api_id, start_time, end_time, metric, analysis_type = 'degradation' } = req.query;
    
    // Validate required parameters
    if (!api_id || !start_time || !end_time || !metric) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: api_id, start_time, end_time, metric'
      });
    }
    
    // Validate API ownership
    const api = await Api.findById(api_id);
    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }
    
    if (api.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this API'
      });
    }
    
    // Parse timestamps
    const startDate = new Date(parseInt(start_time));
    const endDate = new Date(parseInt(end_time));
    
    // Get status history for the specified time period
    const statusHistory = await StatusHistory.find({
      api: api_id,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });
    
    if (statusHistory.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Not enough data points for trend analysis'
      });
    }
    
    // Extract data points based on the requested metric
    const dataPoints = statusHistory.map(record => {
      let value;
      
      switch (metric) {
        case 'response_time':
          value = record.responseTime;
          break;
        case 'status':
          value = record.status === 'up' ? 1 : 0;
          break;
        default:
          value = null;
      }
      
      return {
        timestamp: record.timestamp.getTime(),
        value
      };
    });
    
    // Perform trend analysis based on the requested type
    if (analysis_type === 'degradation') {
      // Simple linear regression for trend detection
      const n = dataPoints.length;
      const timestamps = dataPoints.map(point => point.timestamp);
      const values = dataPoints.map(point => point.value);
      
      // Normalize timestamps to days from start for better numerical stability
      const startTimestamp = timestamps[0];
      const normalizedTimestamps = timestamps.map(ts => (ts - startTimestamp) / (24 * 60 * 60 * 1000));
      
      // Calculate means
      const meanX = normalizedTimestamps.reduce((sum, x) => sum + x, 0) / n;
      const meanY = values.reduce((sum, y) => sum + y, 0) / n;
      
      // Calculate slope and intercept
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < n; i++) {
        numerator += (normalizedTimestamps[i] - meanX) * (values[i] - meanY);
        denominator += Math.pow(normalizedTimestamps[i] - meanX, 2);
      }
      
      const slope = denominator !== 0 ? numerator / denominator : 0;
      const intercept = meanY - slope * meanX;
      
      // Calculate R-squared
      const predictions = normalizedTimestamps.map(x => slope * x + intercept);
      const totalSumOfSquares = values.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
      const residualSumOfSquares = values.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
      const rSquared = 1 - (residualSumOfSquares / totalSumOfSquares);
      
      // Determine trend direction
      let trend;
      if (Math.abs(slope) < 0.001) {
        trend = 'stable';
      } else if (metric === 'response_time') {
        trend = slope > 0 ? 'increasing' : 'decreasing';
      } else {
        trend = slope > 0 ? 'improving' : 'degrading';
      }
      
      // Convert slope to daily change
      const dailyChange = slope;
      
      return res.json({
        success: true,
        data: {
          trend,
          slope: dailyChange,
          confidence: rSquared,
          start_value: values[0],
          end_value: values[values.length - 1],
          percent_change: ((values[values.length - 1] - values[0]) / values[0]) * 100
        }
      });
    } else if (analysis_type === 'anomaly_detection') {
      // Simple anomaly detection using Z-score
      const values = dataPoints.map(point => point.value);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Calculate standard deviation
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Detect anomalies (Z-score > 3 or < -3)
      const anomalies = [];
      for (let i = 0; i < dataPoints.length; i++) {
        const zScore = stdDev !== 0 ? (values[i] - mean) / stdDev : 0;
        
        if (Math.abs(zScore) > 3) {
          anomalies.push({
            timestamp: dataPoints[i].timestamp,
            value: dataPoints[i].value,
            z_score: zScore,
            reason: zScore > 0 ? 'Unusually high value' : 'Unusually low value'
          });
        }
      }
      
      return res.json({
        success: true,
        data: anomalies
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported analysis type: ${analysis_type}`
      });
    }
  } catch (error) {
    console.error('Error performing trend analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/analytics/report
 * @desc    Generate a report for an API
 * @access  Private
 */
router.get('/report', protect, async (req, res) => {
  try {
    const { api_id, start_time, end_time, format } = req.query;
    
    // Validate required parameters
    if (!api_id || !start_time || !end_time || !format) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: api_id, start_time, end_time, format'
      });
    }
    
    // Validate format
    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Supported formats: pdf, csv'
      });
    }
    
    // Validate API ownership
    const api = await Api.findById(api_id);
    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }
    
    if (api.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this API'
      });
    }
    
    // Parse timestamps
    const startDate = new Date(parseInt(start_time));
    const endDate = new Date(parseInt(end_time));
    
    // Get status history for the specified time period
    const statusHistory = await StatusHistory.find({
      api: api_id,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });
    
    // Get reliability metrics
    const responseTimes = statusHistory.map(record => record.responseTime);
    const responseTimeStats = analyticsService.calculateResponseTimeStats(responseTimes);
    
    const requestCount = statusHistory.length;
    const successCount = statusHistory.filter(record => record.status === 'up').length;
    const uptime = requestCount > 0 ? (successCount / requestCount) * 100 : 100;
    
    const reliabilityScore = analyticsService.calculateReliabilityScore(
      uptime,
      responseTimeStats.stdDev,
      responseTimeStats.avg
    );
    
    const performanceScore = analyticsService.calculatePerformanceScore(
      responseTimeStats.avg,
      api.expectedResponseTime
    );
    
    const healthScore = analyticsService.calculateHealthScore(
      reliabilityScore,
      performanceScore
    );
    
    // Generate report based on the requested format
    if (format === 'pdf') {
      // Create PDF document
      const doc = new PDFDocument();
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=api_report_${api_id}.pdf`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add content to PDF
      doc.fontSize(25).text('API Performance Report', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(16).text(`API: ${api.name}`);
      doc.fontSize(12).text(`URL: ${api.url}`);
      doc.fontSize(12).text(`Report Period: ${startDate.toLocaleString()} to ${endDate.toLocaleString()}`);
      doc.moveDown();
      
      doc.fontSize(16).text('Summary');
      doc.fontSize(12).text(`Total Requests: ${requestCount}`);
      doc.fontSize(12).text(`Successful Requests: ${successCount}`);
      doc.fontSize(12).text(`Failed Requests: ${requestCount - successCount}`);
      doc.fontSize(12).text(`Uptime: ${uptime.toFixed(2)}%`);
      doc.moveDown();
      
      doc.fontSize(16).text('Response Time');
      doc.fontSize(12).text(`Average: ${responseTimeStats.avg.toFixed(2)} ms`);
      doc.fontSize(12).text(`Minimum: ${responseTimeStats.min.toFixed(2)} ms`);
      doc.fontSize(12).text(`Maximum: ${responseTimeStats.max.toFixed(2)} ms`);
      doc.fontSize(12).text(`95th Percentile: ${responseTimeStats.p95.toFixed(2)} ms`);
      doc.moveDown();
      
      doc.fontSize(16).text('Scores');
      doc.fontSize(12).text(`Reliability Score: ${reliabilityScore}/100`);
      doc.fontSize(12).text(`Performance Score: ${performanceScore}/100`);
      doc.fontSize(12).text(`Overall Health Score: ${healthScore}/100`);
      
      // Finalize PDF
      doc.end();
    } else if (format === 'csv') {
      // Create CSV stringifier
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'timestamp', title: 'Timestamp' },
          { id: 'status', title: 'Status' },
          { id: 'responseTime', title: 'Response Time (ms)' },
          { id: 'statusCode', title: 'Status Code' },
          { id: 'message', title: 'Message' }
        ]
      });
      
      // Format data for CSV
      const csvData = statusHistory.map(record => ({
        timestamp: record.timestamp.toISOString(),
        status: record.status,
        responseTime: record.responseTime,
        statusCode: record.statusCode,
        message: record.message
      }));
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=api_report_${api_id}.csv`);
      
      // Send CSV data
      res.send(csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData));
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/analytics/apis
 * @desc    Get list of APIs for the user
 * @access  Private
 */
router.get('/apis', protect, async (req, res) => {
  try {
    const apis = await Api.find({ owner: req.user.id }).select('name url status');
    
    res.json({
      success: true,
      data: apis.map(api => ({
        id: api._id,
        name: api.name,
        url: api.url,
        status: api.status
      }))
    });
  } catch (error) {
    console.error('Error fetching APIs:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 