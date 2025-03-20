import React, { useState } from 'react';
import { Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilePdf, 
  faFileExcel, 
  faFileCode,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { format } from 'date-fns';

const ReportGenerator = ({ apiId, startDate, endDate, token }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [includeOptions, setIncludeOptions] = useState({
    historical_data: true,
    reliability_metrics: true,
    trend_analysis: true,
    anomalies: true
  });

  const handleCheckboxChange = (e) => {
    setIncludeOptions({
      ...includeOptions,
      [e.target.name]: e.target.checked
    });
  };

  const generateReport = async () => {
    if (!apiId) {
      setError('Please select an API first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob' // Important for file download
      };

      const response = await axios.post(
        '/api/analytics/report',
        {
          api_id: apiId,
          start_time: startDate.getTime(),
          end_time: endDate.getTime(),
          format: reportFormat,
          include: includeOptions
        },
        config
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename based on API ID and date range
      const startDateStr = format(startDate, 'yyyyMMdd');
      const endDateStr = format(endDate, 'yyyyMMdd');
      const filename = `api_report_${apiId}_${startDateStr}_${endDateStr}.${reportFormat}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error('Report generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf':
        return <FontAwesomeIcon icon={faFilePdf} className="me-2" />;
      case 'csv':
        return <FontAwesomeIcon icon={faFileExcel} className="me-2" />;
      case 'json':
        return <FontAwesomeIcon icon={faFileCode} className="me-2" />;
      default:
        return null;
    }
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Report Format</Form.Label>
          <div>
            <Form.Check
              inline
              type="radio"
              id="pdf-format"
              label={<><FontAwesomeIcon icon={faFilePdf} className="me-1" /> PDF</>}
              name="reportFormat"
              value="pdf"
              checked={reportFormat === 'pdf'}
              onChange={(e) => setReportFormat(e.target.value)}
            />
            <Form.Check
              inline
              type="radio"
              id="csv-format"
              label={<><FontAwesomeIcon icon={faFileExcel} className="me-1" /> CSV</>}
              name="reportFormat"
              value="csv"
              checked={reportFormat === 'csv'}
              onChange={(e) => setReportFormat(e.target.value)}
            />
            <Form.Check
              inline
              type="radio"
              id="json-format"
              label={<><FontAwesomeIcon icon={faFileCode} className="me-1" /> JSON</>}
              name="reportFormat"
              value="json"
              checked={reportFormat === 'json'}
              onChange={(e) => setReportFormat(e.target.value)}
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Include in Report</Form.Label>
          <Row>
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                id="include-historical"
                label="Historical Data"
                name="historical_data"
                checked={includeOptions.historical_data}
                onChange={handleCheckboxChange}
              />
              <Form.Check
                type="checkbox"
                id="include-reliability"
                label="Reliability Metrics"
                name="reliability_metrics"
                checked={includeOptions.reliability_metrics}
                onChange={handleCheckboxChange}
              />
            </Col>
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                id="include-trend"
                label="Trend Analysis"
                name="trend_analysis"
                checked={includeOptions.trend_analysis}
                onChange={handleCheckboxChange}
              />
              <Form.Check
                type="checkbox"
                id="include-anomalies"
                label="Anomalies"
                name="anomalies"
                checked={includeOptions.anomalies}
                onChange={handleCheckboxChange}
              />
            </Col>
          </Row>
        </Form.Group>

        <div className="d-grid">
          <Button
            variant="primary"
            onClick={generateReport}
            disabled={loading || !apiId}
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
                Generating...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Generate {reportFormat.toUpperCase()} Report
              </>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ReportGenerator; 