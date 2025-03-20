const asyncHandler = require('express-async-handler');
const API = require('../models/Api');
const StatusHistory = require('../models/StatusHistory');
const AnalyticsData = require('../models/AnalyticsAggregate');
const analyticsService = require('../services/analyticsService');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const os = require('os');

// @desc    Get all APIs for analytics
// @route   GET /api/analytics/apis
// @access  Private
const getApis = asyncHandler(async (req, res) => {
  const apis = await API.find({ owner: req.user.id }).select('name url _id');
  
  res.status(200).json({
    success: true,
    data: apis.map(api => ({
      id: api._id,
      name: api.name,
      url: api.url
    }))
  });
});

// @desc    Get historical data for an API
// @route   GET /api/analytics/data
// @access  Private
const getHistoricalData = asyncHandler(async (req, res) => {
  const { api_id, start_time, end_time, metric, interval } = req.query;
  
  // Validate input
  if (!api_id) {
    res.status(400);
    throw new Error('API ID is required');
  }
  
  // Verify API belongs to user
  const api = await API.findOne({ _id: api_id, owner: req.user.id });
  if (!api) {
    res.status(404);
    throw new Error('API not found');
  }
  
  // Get data from analytics service
  const data = await analyticsService.getHistoricalData(
    api_id,
    parseInt(start_time) || Date.now() - 7 * 24 * 60 * 60 * 1000, // Default to 7 days ago
    parseInt(end_time) || Date.now(),
    metric || 'response_time',
    interval || 'hourly'
  );
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Get reliability metrics for an API
// @route   GET /api/analytics/reliability
// @access  Private
const getReliabilityMetrics = asyncHandler(async (req, res) => {
  const { api_id, start_time, end_time } = req.query;
  
  // Validate input
  if (!api_id) {
    res.status(400);
    throw new Error('API ID is required');
  }
  
  // Verify API belongs to user
  const api = await API.findOne({ _id: api_id, owner: req.user.id });
  if (!api) {
    res.status(404);
    throw new Error('API not found');
  }
  
  // Get reliability metrics from analytics service
  const data = await analyticsService.getReliabilityMetrics(
    api_id,
    parseInt(start_time) || Date.now() - 7 * 24 * 60 * 60 * 1000, // Default to 7 days ago
    parseInt(end_time) || Date.now()
  );
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Get trend analysis for an API
// @route   GET /api/analytics/trend
// @access  Private
const getTrendAnalysis = asyncHandler(async (req, res) => {
  const { api_id, start_time, end_time, metric, analysis_type } = req.query;
  
  // Validate input
  if (!api_id) {
    res.status(400);
    throw new Error('API ID is required');
  }
  
  // Verify API belongs to user
  const api = await API.findOne({ _id: api_id, owner: req.user.id });
  if (!api) {
    res.status(404);
    throw new Error('API not found');
  }
  
  // Get trend analysis from analytics service
  const data = await analyticsService.getTrendAnalysis(
    api_id,
    parseInt(start_time) || Date.now() - 7 * 24 * 60 * 60 * 1000, // Default to 7 days ago
    parseInt(end_time) || Date.now(),
    metric || 'response_time',
    analysis_type || 'degradation'
  );
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Generate a report for an API
// @route   POST /api/analytics/report
// @access  Private
const generateReport = asyncHandler(async (req, res) => {
  const { api_id, start_time, end_time, format, include } = req.body;
  
  // Validate input
  if (!api_id) {
    res.status(400);
    throw new Error('API ID is required');
  }
  
  // Verify API belongs to user
  const api = await API.findOne({ _id: api_id, owner: req.user.id });
  if (!api) {
    res.status(404);
    throw new Error('API not found');
  }
  
  // Get data for report
  const reportData = await analyticsService.generateReportData(
    api_id,
    parseInt(start_time) || Date.now() - 7 * 24 * 60 * 60 * 1000, // Default to 7 days ago
    parseInt(end_time) || Date.now(),
    include || { historical_data: true, reliability_metrics: true, trend_analysis: true, anomalies: true }
  );
  
  // Generate report in requested format
  const reportFormat = format || 'pdf';
  
  switch (reportFormat) {
    case 'pdf':
      return generatePdfReport(res, api, reportData);
    case 'csv':
      return generateCsvReport(res, api, reportData);
    case 'json':
      return res.status(200).json({
        success: true,
        data: reportData
      });
    default:
      res.status(400);
      throw new Error('Invalid report format');
  }
});

// Helper function to generate PDF report
const generatePdfReport = (res, api, data) => {
  // Create a temporary file path
  const tempFilePath = path.join(os.tmpdir(), `api_report_${api._id}_${Date.now()}.pdf`);
  
  // Create a PDF document
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(tempFilePath);
  
  // Pipe the PDF to the file
  doc.pipe(stream);
  
  // Add content to the PDF
  doc.fontSize(25).text('API Performance Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(`API: ${api.name}`, { align: 'center' });
  doc.fontSize(12).text(`URL: ${api.url}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Report generated on: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown();
  
  // Add reliability metrics
  if (data.reliability_metrics) {
    doc.moveDown();
    doc.fontSize(18).text('Reliability Metrics');
    doc.moveDown();
    doc.fontSize(12).text(`Uptime: ${data.reliability_metrics.uptime_percentage.toFixed(2)}%`);
    doc.fontSize(12).text(`Success Rate: ${data.reliability_metrics.success_rate.toFixed(2)}%`);
    doc.fontSize(12).text(`Average Response Time: ${data.reliability_metrics.avg_response_time.toFixed(2)} ms`);
    doc.fontSize(12).text(`Reliability Score: ${data.reliability_metrics.reliability_score.toFixed(2)}%`);
    doc.fontSize(12).text(`Total Requests: ${data.reliability_metrics.total_requests}`);
    doc.fontSize(12).text(`Total Failures: ${data.reliability_metrics.total_failures}`);
  }
  
  // Add trend analysis
  if (data.trend_analysis) {
    doc.moveDown();
    doc.fontSize(18).text('Trend Analysis');
    doc.moveDown();
    doc.fontSize(12).text(`Trend Direction: ${data.trend_analysis.trend_direction}`);
    doc.fontSize(12).text(`Trend Percentage: ${data.trend_analysis.trend_percentage.toFixed(2)}%`);
    doc.fontSize(12).text(`Is Degrading: ${data.trend_analysis.is_degrading ? 'Yes' : 'No'}`);
    doc.fontSize(12).text(`Description: ${data.trend_analysis.trend_description}`);
  }
  
  // Add anomalies
  if (data.anomalies && data.anomalies.length > 0) {
    doc.moveDown();
    doc.fontSize(18).text('Detected Anomalies');
    doc.moveDown();
    
    data.anomalies.forEach((anomaly, index) => {
      doc.fontSize(12).text(`${index + 1}. ${anomaly.description} (${anomaly.severity})`);
      doc.fontSize(10).text(`   Time: ${new Date(anomaly.timestamp).toLocaleString()}`);
      doc.moveDown(0.5);
    });
  }
  
  // Finalize the PDF
  doc.end();
  
  // Wait for the PDF to be written to the file
  stream.on('finish', () => {
    // Send the file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="api_report_${api._id}.pdf"`);
    
    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);
    
    // Clean up the temporary file after sending
    fileStream.on('end', () => {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
      });
    });
  });
};

// Helper function to generate CSV report
const generateCsvReport = (res, api, data) => {
  let csvData = [];
  
  // Add historical data to CSV
  if (data.historical_data && data.historical_data.length > 0) {
    csvData = data.historical_data.map(item => ({
      timestamp: new Date(item.timestamp).toISOString(),
      response_time: item.response_time,
      uptime: item.uptime,
      success_rate: item.success_rate,
      request_count: item.request_count
    }));
  }
  
  // Convert to CSV
  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(csvData);
  
  // Send the CSV
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="api_report_${api._id}.csv"`);
  res.status(200).send(csv);
};

module.exports = {
  getApis,
  getHistoricalData,
  getReliabilityMetrics,
  getTrendAnalysis,
  generateReport
}; 