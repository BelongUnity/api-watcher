import React, { useEffect, useState } from 'react';
import { Card, Alert } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const HistoricalChart = ({ data, metric, startDate, endDate }) => {
  const [chartData, setChartData] = useState(null);
  const [noDataMessage, setNoDataMessage] = useState('');

  useEffect(() => {
    if (!data || data.length === 0) {
      setNoDataMessage('No historical data available for the selected period.');
      setChartData(null);
      return;
    }

    setNoDataMessage('');

    // Format data for chart
    const formattedData = {
      labels: data.map(item => new Date(item.timestamp)),
      datasets: [
        {
          label: getMetricLabel(metric),
          data: data.map(item => item[metric]),
          borderColor: getMetricColor(metric),
          backgroundColor: `${getMetricColor(metric)}33`, // Add transparency
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    };

    setChartData(formattedData);
  }, [data, metric]);

  const getMetricLabel = (metricName) => {
    switch (metricName) {
      case 'response_time':
        return 'Response Time (ms)';
      case 'uptime':
        return 'Uptime (%)';
      case 'request_count':
        return 'Request Count';
      case 'success_rate':
        return 'Success Rate (%)';
      default:
        return metricName;
    }
  };

  const getMetricColor = (metricName) => {
    switch (metricName) {
      case 'response_time':
        return '#4e73df'; // Blue
      case 'uptime':
        return '#1cc88a'; // Green
      case 'request_count':
        return '#f6c23e'; // Yellow
      case 'success_rate':
        return '#36b9cc'; // Teal
      default:
        return '#4e73df'; // Default blue
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            return format(new Date(context[0].parsed.x), 'PPpp');
          },
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (metric === 'response_time') {
                label += `${context.parsed.y.toFixed(2)} ms`;
              } else if (metric === 'uptime' || metric === 'success_rate') {
                label += `${context.parsed.y.toFixed(2)}%`;
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: getTimeUnit(startDate, endDate)
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        beginAtZero: metric !== 'response_time',
        title: {
          display: true,
          text: getMetricLabel(metric)
        }
      }
    }
  };

  // Determine appropriate time unit based on date range
  function getTimeUnit(start, end) {
    const diffInDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    if (diffInDays <= 1) {
      return 'hour';
    } else if (diffInDays <= 7) {
      return 'day';
    } else if (diffInDays <= 30) {
      return 'week';
    } else {
      return 'month';
    }
  }

  return (
    <div style={{ height: '400px' }}>
      {noDataMessage ? (
        <Alert variant="info">{noDataMessage}</Alert>
      ) : chartData ? (
        <Line data={chartData} options={chartOptions} />
      ) : (
        <div className="text-center p-5">Loading chart data...</div>
      )}
    </div>
  );
};

export default HistoricalChart; 