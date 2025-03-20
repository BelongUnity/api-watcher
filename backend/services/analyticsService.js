const mongoose = require('mongoose');
const StatusHistory = require('../models/StatusHistory');
const AnalyticsAggregate = require('../models/AnalyticsAggregate');
const Api = require('../models/Api');

/**
 * Calculate statistics for an array of response times
 * @param {Array} responseTimes - Array of response times
 * @returns {Object} - Statistics object
 */
const calculateResponseTimeStats = (responseTimes) => {
  if (!responseTimes || responseTimes.length === 0) {
    return {
      avg: 0,
      min: 0,
      max: 0,
      p95: 0,
      stdDev: 0
    };
  }

  // Sort the array for percentile calculation
  const sorted = [...responseTimes].sort((a, b) => a - b);
  
  // Calculate average
  const sum = responseTimes.reduce((acc, val) => acc + val, 0);
  const avg = sum / responseTimes.length;
  
  // Calculate min and max
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  // Calculate 95th percentile
  const p95Index = Math.ceil(sorted.length * 0.95) - 1;
  const p95 = sorted[p95Index];
  
  // Calculate standard deviation
  const squaredDiffs = responseTimes.map(val => Math.pow(val - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / responseTimes.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  return {
    avg,
    min,
    max,
    p95,
    stdDev
  };
};

/**
 * Calculate reliability score based on uptime and response time consistency
 * @param {Number} uptime - Uptime percentage
 * @param {Number} stdDev - Standard deviation of response time
 * @param {Number} avgResponseTime - Average response time
 * @returns {Number} - Reliability score (0-100)
 */
const calculateReliabilityScore = (uptime, stdDev, avgResponseTime) => {
  // Weight factors
  const uptimeWeight = 0.7;
  const consistencyWeight = 0.3;
  
  // Uptime score (0-100)
  const uptimeScore = uptime;
  
  // Response time consistency score (0-100)
  // Lower coefficient of variation (CV) is better
  // CV = stdDev / avgResponseTime
  let consistencyScore = 100;
  if (avgResponseTime > 0) {
    const cv = stdDev / avgResponseTime;
    // Convert CV to a score where 0 is perfect consistency and higher values are worse
    // A CV of 0.5 or higher will result in a score of 0
    consistencyScore = Math.max(0, 100 - (cv * 200));
  }
  
  // Calculate weighted score
  const reliabilityScore = (uptimeWeight * uptimeScore) + (consistencyWeight * consistencyScore);
  
  return Math.round(reliabilityScore);
};

/**
 * Calculate performance score based on response time
 * @param {Number} avgResponseTime - Average response time
 * @param {Number} expectedResponseTime - Expected response time
 * @returns {Number} - Performance score (0-100)
 */
const calculatePerformanceScore = (avgResponseTime, expectedResponseTime) => {
  if (avgResponseTime <= expectedResponseTime) {
    return 100;
  }
  
  // Calculate how much slower the actual response time is compared to expected
  const ratio = avgResponseTime / expectedResponseTime;
  
  // Score decreases as ratio increases
  // A ratio of 2 (twice as slow) will result in a score of 50
  // A ratio of 3 or higher will result in a score of 0
  const performanceScore = Math.max(0, 100 - ((ratio - 1) * 50));
  
  return Math.round(performanceScore);
};

/**
 * Calculate overall health score
 * @param {Number} reliabilityScore - Reliability score
 * @param {Number} performanceScore - Performance score
 * @returns {Number} - Health score (0-100)
 */
const calculateHealthScore = (reliabilityScore, performanceScore) => {
  // Weight factors
  const reliabilityWeight = 0.6;
  const performanceWeight = 0.4;
  
  // Calculate weighted score
  const healthScore = (reliabilityWeight * reliabilityScore) + (performanceWeight * performanceScore);
  
  return Math.round(healthScore);
};

/**
 * Aggregate analytics data for a specific API and time period
 * @param {String} apiId - API ID
 * @param {String} period - Time period ('hourly', 'daily', 'weekly', 'monthly')
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {Promise<Object>} - Aggregated data
 */
const aggregateApiData = async (apiId, period, startTime, endTime) => {
  try {
    // Get API details
    const api = await Api.findById(apiId);
    if (!api) {
      throw new Error(`API with ID ${apiId} not found`);
    }
    
    // Get status history for the specified time period
    const statusHistory = await StatusHistory.find({
      api: apiId,
      timestamp: { $gte: startTime, $lte: endTime }
    }).sort({ timestamp: 1 });
    
    if (statusHistory.length === 0) {
      return null;
    }
    
    // Extract response times and calculate statistics
    const responseTimes = statusHistory.map(record => record.responseTime);
    const responseTimeStats = calculateResponseTimeStats(responseTimes);
    
    // Calculate request and response sizes
    const requestSizes = statusHistory.map(record => record.requestSize || 0);
    const responseSizes = statusHistory.map(record => record.responseSize || 0);
    const avgRequestSize = requestSizes.reduce((acc, val) => acc + val, 0) / requestSizes.length;
    const avgResponseSize = responseSizes.reduce((acc, val) => acc + val, 0) / responseSizes.length;
    
    // Count successful and failed requests
    const requestCount = statusHistory.length;
    const successCount = statusHistory.filter(record => record.status === 'up').length;
    const failureCount = requestCount - successCount;
    
    // Calculate uptime percentage
    const uptime = (successCount / requestCount) * 100;
    
    // Count errors by type
    const errorCounts = {
      timeout: 0,
      connection: 0,
      server: 0,
      client: 0,
      unknown: 0
    };
    
    statusHistory.forEach(record => {
      if (record.status === 'down' && record.errorType && record.errorType !== 'none') {
        errorCounts[record.errorType]++;
      }
    });
    
    // Calculate scores
    const reliabilityScore = calculateReliabilityScore(
      uptime, 
      responseTimeStats.stdDev, 
      responseTimeStats.avg
    );
    
    const performanceScore = calculatePerformanceScore(
      responseTimeStats.avg, 
      api.expectedResponseTime
    );
    
    const healthScore = calculateHealthScore(reliabilityScore, performanceScore);
    
    // Create or update aggregate record
    const aggregateData = {
      api: apiId,
      period,
      startTime,
      endTime,
      metrics: {
        uptime,
        avgResponseTime: responseTimeStats.avg,
        minResponseTime: responseTimeStats.min,
        maxResponseTime: responseTimeStats.max,
        p95ResponseTime: responseTimeStats.p95,
        stdDevResponseTime: responseTimeStats.stdDev,
        requestCount,
        successCount,
        failureCount,
        errorCounts,
        avgRequestSize,
        avgResponseSize
      },
      reliabilityScore,
      performanceScore,
      healthScore,
      updatedAt: new Date()
    };
    
    // Find existing record or create new one
    const existingAggregate = await AnalyticsAggregate.findOne({
      api: apiId,
      period,
      startTime,
      endTime
    });
    
    if (existingAggregate) {
      // Update existing record
      await AnalyticsAggregate.findByIdAndUpdate(existingAggregate._id, aggregateData);
      return { ...aggregateData, _id: existingAggregate._id };
    } else {
      // Create new record
      const newAggregate = await AnalyticsAggregate.create(aggregateData);
      return newAggregate;
    }
  } catch (error) {
    console.error(`Error aggregating data for API ${apiId}:`, error);
    throw error;
  }
};

/**
 * Run aggregation for all APIs for a specific time period
 * @param {String} period - Time period ('hourly', 'daily', 'weekly', 'monthly')
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {Promise<Array>} - Array of aggregated data
 */
const runAggregation = async (period, startTime, endTime) => {
  try {
    // Get all APIs
    const apis = await Api.find({});
    
    // Run aggregation for each API
    const results = [];
    for (const api of apis) {
      const result = await aggregateApiData(api._id, period, startTime, endTime);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error running aggregation for period ${period}:`, error);
    throw error;
  }
};

/**
 * Schedule aggregation jobs
 */
const scheduleAggregations = () => {
  // Schedule hourly aggregation
  setInterval(async () => {
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
    const hourEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59, 59);
    
    await runAggregation('hourly', hourStart, hourEnd);
  }, 60 * 60 * 1000); // Run every hour
  
  // Schedule daily aggregation (at midnight)
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 5) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      const dayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
      
      await runAggregation('daily', dayStart, dayEnd);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  // Schedule weekly aggregation (on Sunday)
  setInterval(async () => {
    const now = new Date();
    if (now.getDay() === 0 && now.getHours() === 1 && now.getMinutes() < 5) {
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0);
      
      await runAggregation('weekly', weekStart, weekEnd);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  // Schedule monthly aggregation (on the 1st of each month)
  setInterval(async () => {
    const now = new Date();
    if (now.getDate() === 1 && now.getHours() === 2 && now.getMinutes() < 5) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1, 0, 0, 0);
      
      await runAggregation('monthly', monthStart, monthEnd);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};

/**
 * Get historical data for an API
 * @param {String} apiId - API ID
 * @param {Number} startTime - Start time (timestamp)
 * @param {Number} endTime - End time (timestamp)
 * @param {String} metric - Metric to retrieve ('response_time', 'uptime', 'request_count', 'success_rate')
 * @param {String} interval - Interval for data points ('hourly', 'daily', 'weekly', 'monthly')
 * @returns {Promise<Array>} - Array of data points
 */
const getHistoricalData = async (apiId, startTime, endTime, metric, interval) => {
  try {
    // Convert timestamps to Date objects
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    // Get aggregated data from the database
    const aggregates = await AnalyticsAggregate.find({
      api: apiId,
      period: interval,
      startTime: { $gte: startDate },
      endTime: { $lte: endDate }
    }).sort({ startTime: 1 });
    
    // Map aggregates to data points
    const dataPoints = aggregates.map(aggregate => {
      let value = 0;
      
      switch (metric) {
        case 'response_time':
          value = aggregate.metrics.avgResponseTime;
          break;
        case 'uptime':
          value = aggregate.metrics.uptime;
          break;
        case 'request_count':
          value = aggregate.metrics.requestCount;
          break;
        case 'success_rate':
          value = aggregate.metrics.successCount / aggregate.metrics.requestCount * 100;
          break;
        default:
          value = 0;
      }
      
      return {
        timestamp: aggregate.startTime,
        [metric]: value
      };
    });
    
    // If no aggregated data is available, fall back to raw data
    if (dataPoints.length === 0) {
      // Get raw status history data
      const statusHistory = await StatusHistory.find({
        api: apiId,
        timestamp: { $gte: startDate, $lte: endDate }
      }).sort({ timestamp: 1 });
      
      // Group data by interval
      const groupedData = groupDataByInterval(statusHistory, interval, startDate, endDate);
      
      // Map grouped data to data points
      return groupedData.map(group => {
        let value = 0;
        
        switch (metric) {
          case 'response_time':
            value = calculateAverage(group.data.map(item => item.responseTime));
            break;
          case 'uptime':
            value = calculateUptimePercentage(group.data);
            break;
          case 'request_count':
            value = group.data.length;
            break;
          case 'success_rate':
            value = calculateSuccessRate(group.data);
            break;
          default:
            value = 0;
        }
        
        return {
          timestamp: group.timestamp,
          [metric]: value
        };
      });
    }
    
    return dataPoints;
  } catch (error) {
    console.error(`Error getting historical data for API ${apiId}:`, error);
    throw error;
  }
};

/**
 * Group data by interval
 * @param {Array} data - Array of data points
 * @param {String} interval - Interval ('hourly', 'daily', 'weekly', 'monthly')
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Array of grouped data
 */
const groupDataByInterval = (data, interval, startDate, endDate) => {
  const groups = [];
  let currentDate = new Date(startDate);
  
  // Create time slots based on interval
  while (currentDate <= endDate) {
    let nextDate;
    
    switch (interval) {
      case 'hourly':
        nextDate = new Date(currentDate);
        nextDate.setHours(nextDate.getHours() + 1);
        break;
      case 'daily':
        nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        nextDate = new Date(currentDate);
        nextDate.setHours(nextDate.getHours() + 1);
    }
    
    // Filter data for current time slot
    const slotData = data.filter(item => 
      item.timestamp >= currentDate && item.timestamp < nextDate
    );
    
    // Add group if data exists
    if (slotData.length > 0) {
      groups.push({
        timestamp: new Date(currentDate),
        data: slotData
      });
    }
    
    // Move to next time slot
    currentDate = nextDate;
  }
  
  return groups;
};

/**
 * Calculate average of an array of numbers
 * @param {Array} values - Array of numbers
 * @returns {Number} - Average
 */
const calculateAverage = (values) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

/**
 * Calculate uptime percentage
 * @param {Array} data - Array of status history records
 * @returns {Number} - Uptime percentage
 */
const calculateUptimePercentage = (data) => {
  if (data.length === 0) return 0;
  const upCount = data.filter(item => item.status === 'up').length;
  return (upCount / data.length) * 100;
};

/**
 * Calculate success rate
 * @param {Array} data - Array of status history records
 * @returns {Number} - Success rate percentage
 */
const calculateSuccessRate = (data) => {
  if (data.length === 0) return 0;
  const successCount = data.filter(item => item.status === 'up').length;
  return (successCount / data.length) * 100;
};

/**
 * Get reliability metrics for an API
 * @param {String} apiId - API ID
 * @param {Number} startTime - Start time (timestamp)
 * @param {Number} endTime - End time (timestamp)
 * @returns {Promise<Object>} - Reliability metrics
 */
const getReliabilityMetrics = async (apiId, startTime, endTime) => {
  try {
    // Convert timestamps to Date objects
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    // Get status history for the specified time period
    const statusHistory = await StatusHistory.find({
      api: apiId,
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    if (statusHistory.length === 0) {
      return {
        uptime_percentage: 0,
        success_rate: 0,
        avg_response_time: 0,
        reliability_score: 0,
        total_requests: 0,
        total_failures: 0
      };
    }
    
    // Calculate metrics
    const total_requests = statusHistory.length;
    const total_failures = statusHistory.filter(record => record.status === 'down').length;
    const uptime_percentage = ((total_requests - total_failures) / total_requests) * 100;
    const success_rate = uptime_percentage;
    
    // Calculate response time statistics
    const responseTimes = statusHistory.map(record => record.responseTime);
    const responseTimeStats = calculateResponseTimeStats(responseTimes);
    
    // Get API details for expected response time
    const api = await Api.findById(apiId);
    const expectedResponseTime = api ? api.expectedResponseTime : 1000;
    
    // Calculate reliability score
    const reliabilityScore = calculateReliabilityScore(
      uptime_percentage,
      responseTimeStats.stdDev,
      responseTimeStats.avg
    );
    
    return {
      uptime_percentage,
      success_rate,
      avg_response_time: responseTimeStats.avg,
      reliability_score: reliabilityScore,
      total_requests,
      total_failures
    };
  } catch (error) {
    console.error(`Error getting reliability metrics for API ${apiId}:`, error);
    throw error;
  }
};

/**
 * Get trend analysis for an API
 * @param {String} apiId - API ID
 * @param {Number} startTime - Start time (timestamp)
 * @param {Number} endTime - End time (timestamp)
 * @param {String} metric - Metric to analyze ('response_time', 'uptime', 'request_count', 'success_rate')
 * @param {String} analysisType - Type of analysis ('degradation', 'improvement', 'anomaly')
 * @returns {Promise<Object>} - Trend analysis
 */
const getTrendAnalysis = async (apiId, startTime, endTime, metric, analysisType) => {
  try {
    // Get historical data
    const historicalData = await getHistoricalData(apiId, startTime, endTime, metric, 'daily');
    
    if (historicalData.length < 2) {
      return {
        trend_direction: 'stable',
        trend_percentage: 0,
        anomalies: [],
        is_degrading: false,
        trend_description: 'Insufficient data for trend analysis',
        comparison_points: []
      };
    }
    
    // Calculate trend
    const firstPoint = historicalData[0];
    const lastPoint = historicalData[historicalData.length - 1];
    const firstValue = firstPoint[metric];
    const lastValue = lastPoint[metric];
    
    // Calculate percentage change
    let trend_percentage = 0;
    if (firstValue !== 0) {
      trend_percentage = ((lastValue - firstValue) / firstValue) * 100;
    }
    
    // Determine trend direction
    let trend_direction = 'stable';
    if (trend_percentage > 5) {
      trend_direction = 'up';
    } else if (trend_percentage < -5) {
      trend_direction = 'down';
    }
    
    // Determine if degrading (depends on metric)
    let is_degrading = false;
    if (metric === 'response_time') {
      is_degrading = trend_direction === 'up';
    } else {
      is_degrading = trend_direction === 'down';
    }
    
    // Generate trend description
    let trend_description = '';
    if (trend_direction === 'stable') {
      trend_description = `${getMetricName(metric)} has remained stable over the selected period.`;
    } else if (is_degrading) {
      trend_description = `${getMetricName(metric)} has degraded by ${Math.abs(trend_percentage).toFixed(2)}% over the selected period.`;
    } else {
      trend_description = `${getMetricName(metric)} has improved by ${Math.abs(trend_percentage).toFixed(2)}% over the selected period.`;
    }
    
    // Detect anomalies
    const anomalies = detectAnomalies(historicalData, metric);
    
    return {
      trend_direction,
      trend_percentage,
      anomalies,
      is_degrading,
      trend_description,
      comparison_points: [
        { timestamp: firstPoint.timestamp, value: firstValue },
        { timestamp: lastPoint.timestamp, value: lastValue }
      ]
    };
  } catch (error) {
    console.error(`Error getting trend analysis for API ${apiId}:`, error);
    throw error;
  }
};

/**
 * Get metric name for display
 * @param {String} metric - Metric key
 * @returns {String} - Metric name
 */
const getMetricName = (metric) => {
  switch (metric) {
    case 'response_time':
      return 'Response time';
    case 'uptime':
      return 'Uptime';
    case 'request_count':
      return 'Request count';
    case 'success_rate':
      return 'Success rate';
    default:
      return metric;
  }
};

/**
 * Detect anomalies in historical data
 * @param {Array} data - Array of data points
 * @param {String} metric - Metric to analyze
 * @returns {Array} - Array of anomalies
 */
const detectAnomalies = (data, metric) => {
  if (data.length < 3) return [];
  
  // Calculate mean and standard deviation
  const values = data.map(point => point[metric]);
  const mean = calculateAverage(values);
  const stdDev = calculateStandardDeviation(values, mean);
  
  // Threshold for anomaly detection (2 standard deviations)
  const threshold = 2 * stdDev;
  
  // Detect anomalies
  const anomalies = [];
  data.forEach(point => {
    const value = point[metric];
    const deviation = Math.abs(value - mean);
    
    if (deviation > threshold) {
      const severity = deviation > 3 * stdDev ? 'high' : 'medium';
      const direction = value > mean ? 'above' : 'below';
      
      anomalies.push({
        timestamp: point.timestamp,
        value,
        deviation,
        severity,
        description: `${getMetricName(metric)} was ${direction} normal range (${deviation.toFixed(2)} ${direction} average)`
      });
    }
  });
  
  return anomalies;
};

/**
 * Calculate standard deviation
 * @param {Array} values - Array of values
 * @param {Number} mean - Mean value
 * @returns {Number} - Standard deviation
 */
const calculateStandardDeviation = (values, mean) => {
  if (values.length < 2) return 0;
  
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(variance);
};

/**
 * Generate report data for an API
 * @param {String} apiId - API ID
 * @param {Number} startTime - Start time (timestamp)
 * @param {Number} endTime - End time (timestamp)
 * @param {Object} include - What to include in the report
 * @returns {Promise<Object>} - Report data
 */
const generateReportData = async (apiId, startTime, endTime, include) => {
  try {
    const reportData = {};
    
    // Include historical data
    if (include.historical_data) {
      reportData.historical_data = await getHistoricalData(
        apiId,
        startTime,
        endTime,
        'response_time',
        'daily'
      );
    }
    
    // Include reliability metrics
    if (include.reliability_metrics) {
      reportData.reliability_metrics = await getReliabilityMetrics(
        apiId,
        startTime,
        endTime
      );
    }
    
    // Include trend analysis
    if (include.trend_analysis) {
      reportData.trend_analysis = await getTrendAnalysis(
        apiId,
        startTime,
        endTime,
        'response_time',
        'degradation'
      );
    }
    
    // Include anomalies
    if (include.anomalies) {
      const trendAnalysis = reportData.trend_analysis || await getTrendAnalysis(
        apiId,
        startTime,
        endTime,
        'response_time',
        'degradation'
      );
      
      reportData.anomalies = trendAnalysis.anomalies;
    }
    
    return reportData;
  } catch (error) {
    console.error(`Error generating report data for API ${apiId}:`, error);
    throw error;
  }
};

module.exports = {
  aggregateApiData,
  runAggregation,
  scheduleAggregations,
  calculateResponseTimeStats,
  calculateReliabilityScore,
  calculatePerformanceScore,
  calculateHealthScore,
  getHistoricalData,
  getReliabilityMetrics,
  getTrendAnalysis,
  generateReportData
}; 