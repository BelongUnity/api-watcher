import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApiById, fetchApiHistory, checkApiStatus } from '../redux/slices/apiSlice';
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
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ApiDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentApi, apiHistory, historyPagination, loading, historyLoading } = useSelector((state) => state.api);
  const [chartData, setChartData] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchApiById(id));
    dispatch(fetchApiHistory({ id, limit: pageSize, page: currentPage }));
  }, [dispatch, id, pageSize, currentPage]);

  useEffect(() => {
    if (apiHistory && apiHistory.length > 0) {
      // Create a copy of the history array to avoid mutating the original
      const historyData = [...apiHistory];
      
      // Sort by timestamp in ascending order for the chart
      historyData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      const labels = historyData.map(item => {
        const date = new Date(item.timestamp);
        return `${date.getHours()}:${date.getMinutes()}`;
      });

      const responseTimeData = historyData.map(item => item.responseTime);
      
      setChartData({
        labels,
        datasets: [
          {
            label: 'Response Time (ms)',
            data: responseTimeData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1
          }
        ]
      });
    }
  }, [apiHistory]);

  const handleCheckStatus = () => {
    dispatch(checkApiStatus(id)).then(() => {
      // Refresh the API details and history after checking status
      dispatch(fetchApiById(id));
      dispatch(fetchApiHistory({ id, limit: pageSize, page: currentPage }));
    });
  };

  // Use pagination data from the backend if available
  const totalPages = historyPagination ? historyPagination.pages : 
    (apiHistory ? Math.ceil(apiHistory.length / pageSize) : 0);
  
  // No need to paginate on the client side if the backend is handling it
  const paginatedHistory = apiHistory || [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
    dispatch(fetchApiHistory({ id, limit: size, page: 1 }));
  };

  if (loading && !currentApi) {
    return <div className="container mt-3">Loading API details...</div>;
  }

  if (!currentApi) {
    return <div className="container mt-3">API not found</div>;
  }

  return (
    <div className="container mt-3">
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>{currentApi.name}</h2>
            <div>
              <Link to={`/api/edit/${currentApi._id}`} className="btn btn-primary me-2">
                Edit
              </Link>
              <button onClick={handleCheckStatus} className="btn btn-success" disabled={loading}>
                {loading ? 'Checking...' : 'Check Now'}
              </button>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h4>API Details</h4>
                  <p><strong>URL:</strong> {currentApi.url}</p>
                  <p><strong>Method:</strong> {currentApi.method}</p>
                  <p><strong>Expected Status:</strong> {currentApi.expectedStatus}</p>
                  <p><strong>Timeout:</strong> {currentApi.timeout || 5000}ms</p>
                  <p><strong>Check Interval:</strong> {currentApi.monitoringInterval || currentApi.interval} minutes</p>
                  <p>
                    <strong>Status:</strong> 
                    <span className={`ms-2 ${
                      currentApi.status === 'up' ? 'text-success' : 
                      currentApi.status === 'down' ? 'text-danger' : 'text-secondary'
                    }`}>
                      {currentApi.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </p>
                  <p>
                    <strong>Last Checked:</strong> {' '}
                    {currentApi.lastChecked ? new Date(currentApi.lastChecked).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h4>Response Time History</h4>
                  {historyLoading ? (
                    <p>Loading history data...</p>
                  ) : chartData ? (
                    <Line data={chartData} options={{ responsive: true }} />
                  ) : (
                    <p>No history data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Status History</h4>
                <div className="d-flex align-items-center">
                  <span className="me-2">Show</span>
                  <select 
                    className="form-select form-select-sm" 
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    style={{ width: 'auto' }}
                  >
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="ms-2">entries</span>
                </div>
              </div>
              
              {historyLoading ? (
                <p>Loading history...</p>
              ) : apiHistory && apiHistory.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Status</th>
                          <th>Response Time</th>
                          <th>Status Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedHistory.map((item) => (
                          <tr key={item._id}>
                            <td>{new Date(item.timestamp).toLocaleString()}</td>
                            <td>
                              <span className={`
                                ${item.status === 'up' ? 'text-success' : 
                                item.status === 'down' ? 'text-danger' : 'text-secondary'}
                              `}>
                                {item.status?.toUpperCase() || 'UNKNOWN'}
                              </span>
                            </td>
                            <td>{item.responseTime}ms</td>
                            <td>{item.statusCode || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {totalPages > 1 && (
                    <nav aria-label="Status history pagination">
                      <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        
                        {[...Array(totalPages).keys()].map(page => (
                          <li 
                            key={page + 1} 
                            className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}
                          >
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(page + 1)}
                            >
                              {page + 1}
                            </button>
                          </li>
                        ))}
                        
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                  
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      {historyPagination ? (
                        `Showing ${(historyPagination.page - 1) * historyPagination.limit + 1} to ${Math.min(historyPagination.page * historyPagination.limit, historyPagination.total)} of ${historyPagination.total} entries`
                      ) : (
                        `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, apiHistory.length)} of ${apiHistory.length} entries`
                      )}
                    </small>
                  </div>
                </>
              ) : (
                <p>No history data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDetail; 