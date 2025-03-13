import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ApiStatusChart = ({ up, down, degraded, unknown }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Up', 'Down', 'Degraded', 'Unknown'],
        datasets: [{
          data: [up, down, degraded, unknown],
          backgroundColor: [
            'rgba(25, 135, 84, 0.8)',  // Bootstrap success color for up
            'rgba(220, 53, 69, 0.8)',  // Bootstrap danger color for down
            'rgba(255, 193, 7, 0.8)',  // Bootstrap warning color for degraded
            'rgba(108, 117, 125, 0.8)'  // Bootstrap secondary color for unknown
          ],
          borderColor: [
            'rgba(25, 135, 84, 1)',
            'rgba(220, 53, 69, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(108, 117, 125, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [up, down, degraded, unknown]);

  return (
    <div className="position-relative h-100 w-100">
      <canvas ref={chartRef}></canvas>
      {up + down + degraded + unknown === 0 && (
        <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center">
          <p className="text-muted fs-5">No data available</p>
        </div>
      )}
    </div>
  );
};

export default ApiStatusChart; 