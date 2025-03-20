import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Import analytics components
import HistoricalChart from '../components/analytics/HistoricalChart';
import ReliabilityScore from '../components/analytics/ReliabilityScore';
import TrendAnalysis from '../components/analytics/TrendAnalysis';
import ReportGenerator from '../components/analytics/ReportGenerator';

const Analytics = () => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [apis, setApis] = useState([]);
  const [selectedApi, setSelectedApi] = useState('');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [selectedMetric, setSelectedMetric] = useState('response_time');
  const [selectedInterval, setSelectedInterval] = useState('hourly');
  const [error, setError] = useState(null);
  
  // Data states
  const [historicalData, setHistoricalData] = useState([]);
  const [reliabilityData, setReliabilityData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  
  // Fetch APIs on component mount
  useEffect(() => {
    const fetchApis = async () => {
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        };
        
        console.log('Fetching APIs from:', 'http://localhost:5000/api/analytics/apis');
        const res = await axios.get('http://localhost:5000/api/analytics/apis', config);
        
        console.log('API response:', res.data);
        if (res.data.success) {
          setApis(res.data.data);
          if (res.data.data.length > 0) {
            console.log('Setting selected API to:', res.data.data[0].id);
            setSelectedApi(res.data.data[0].id);
          } else {
            console.log('No APIs found in response');
          }
        }
      } catch (err) {
        console.error('Error fetching APIs:', err);
        setError('Failed to fetch APIs');
        toast.error('Failed to fetch APIs');
      }
    };
    
    fetchApis();
  }, [token]);
  
  // Memoize fetchData function to prevent infinite loops
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Fetch historical data
      const historicalRes = await axios.get(`http://localhost:5000/api/analytics/data?api_id=${selectedApi}&start_time=${startDate.getTime()}&end_time=${endDate.getTime()}&metric=${selectedMetric}&interval=${selectedInterval}`, config);
      
      if (historicalRes.data.success) {
        setHistoricalData(historicalRes.data.data);
      }
      
      // Fetch reliability data
      const reliabilityRes = await axios.get(`http://localhost:5000/api/analytics/reliability?api_id=${selectedApi}&start_time=${startDate.getTime()}&end_time=${endDate.getTime()}`, config);
      
      if (reliabilityRes.data.success) {
        setReliabilityData(reliabilityRes.data.data);
      }
      
      // Fetch trend data
      const trendRes = await axios.get(`http://localhost:5000/api/analytics/trend?api_id=${selectedApi}&start_time=${startDate.getTime()}&end_time=${endDate.getTime()}&metric=${selectedMetric}&analysis_type=degradation`, config);
      
      if (trendRes.data.success) {
        setTrendData(trendRes.data.data);
      }
    } catch (err) {
      setError('Failed to fetch analytics data');
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [selectedApi, startDate, endDate, selectedMetric, selectedInterval, token]);
  
  // Fetch data when selection changes
  useEffect(() => {
    if (selectedApi) {
      fetchData();
    }
  }, [selectedApi, startDate, endDate, selectedMetric, selectedInterval, fetchData]);
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">Advanced Analytics</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Analytics Settings</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Select API</Form.Label>
                <Form.Select
                  value={selectedApi}
                  onChange={(e) => setSelectedApi(e.target.value)}
                >
                  {apis.map((api) => (
                    <option key={api.id} value={api.id}>
                      {api.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={endDate}
                  className="form-control"
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="form-control"
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Metric</Form.Label>
                <Form.Select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <option value="response_time">Response Time</option>
                  <option value="uptime">Uptime</option>
                  <option value="request_count">Request Count</option>
                  <option value="success_rate">Success Rate</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Interval</Form.Label>
                <Form.Select
                  value={selectedInterval}
                  onChange={(e) => setSelectedInterval(e.target.value)}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button
                variant="primary"
                onClick={fetchData}
                disabled={loading || !selectedApi}
                className="mb-3"
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Loading...
                  </>
                ) : (
                  'Refresh Data'
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          <Row>
            <Col md={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Historical Data</h5>
                </Card.Header>
                <Card.Body>
                  <HistoricalChart
                    data={historicalData}
                    metric={selectedMetric}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Reliability Scores</h5>
                </Card.Header>
                <Card.Body>
                  <ReliabilityScore data={reliabilityData} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Trend Analysis</h5>
                </Card.Header>
                <Card.Body>
                  <TrendAnalysis
                    data={trendData}
                    metric={selectedMetric}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Generate Report</h5>
                </Card.Header>
                <Card.Body>
                  <ReportGenerator
                    apiId={selectedApi}
                    startDate={startDate}
                    endDate={endDate}
                    token={token}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Analytics; 