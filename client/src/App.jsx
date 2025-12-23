import React, { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Card, Row, Col, Table, Form, Button, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5001/api';

function App() {
  const [logs, setLogs] = useState([]);
  const [ccps, setCcps] = useState([]);
  const [stats, setStats] = useState({ totalLogs: 0, deviations: 0 });
  const [formData, setForm] = useState({ equipmentName: '', temperature: '', staffName: '' });
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const [l, c, s] = await Promise.all([
        axios.get(`${API_URL}/logs`),
        axios.get(`${API_URL}/ccps`),
        axios.get(`${API_URL}/stats`)
      ]);
      setLogs(l.data);
      setCcps(c.data);
      setStats(s.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsError(true);
      setAlert({ type: 'danger', msg: 'Failed to load data. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ccp = ccps.find(c => c.name === formData.equipmentName);
    let isDeviation = false;
    const temp = parseFloat(formData.temperature);

    if (ccp) {
      if (ccp.maxLimit && temp > ccp.maxLimit) isDeviation = true;
      if (ccp.minLimit && temp < ccp.minLimit) isDeviation = true;
    }

    try {
      await axios.post(`${API_URL}/logs`, {
        ...formData,
        temperature: temp,
        isDeviation,
        status: isDeviation ? 'Deviation' : 'Normal'
      });
      setForm({ equipmentName: '', temperature: '', staffName: '' });
      fetchData();
      setAlert({ type: isDeviation ? 'danger' : 'success', msg: isDeviation ? 'DEVIATION DETECTED! Please record corrective action.' : 'Log saved successfully.' });
    } catch (err) {
      console.error("Error submitting log:", err);
      setAlert({ type: 'danger', msg: 'Failed to save log. Please try again.' });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-light min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-light min-vh-100 d-flex justify-content-center align-items-center">
        <Alert variant="danger">Failed to load application. Please check your network connection and refresh the page.</Alert>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 shadow">
        <Container>
          <Navbar.Brand href="#"><i className="bi bi-shield-check me-2"></i>HACCP Sweden - Branäs</Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link active>Dashboard</Nav.Link>
            <Nav.Link>Logs</Nav.Link>
            <Nav.Link>Reports</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container>
        {alert && <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>{alert.msg}</Alert>}
        
        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center shadow-sm border-0 border-start border-primary border-4">
              <Card.Body>
                <h6 className="text-muted">Total Checks Today</h6>
                <h2>{stats.totalLogs}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center shadow-sm border-0 border-start border-danger border-4">
              <Card.Body>
                <h6 className="text-muted">Open Deviations</h6>
                <h2 className="text-danger">{stats.deviations}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center shadow-sm border-0 border-start border-success border-4">
              <Card.Body>
                <h6 className="text-muted">Compliance Score</h6>
                <h2>{stats.totalLogs > 0 ? Math.round(((stats.totalLogs - stats.deviations) / stats.totalLogs) * 100) : 100}%</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white fw-bold"><i className="bi bi-plus-circle me-2"></i>Quick Temp Log</Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Equipment / CCP</Form.Label>
                    <Form.Select 
                      required 
                      value={formData.equipmentName} 
                      onChange={e => setForm({...formData, equipmentName: e.target.value})}
                    >
                      <option value="">Select equipment...</option>
                      {ccps.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Temperature (°C)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.1" 
                      required 
                      value={formData.temperature}
                      onChange={e => setForm({...formData, temperature: e.target.value})}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Staff Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      required 
                      value={formData.staffName}
                      onChange={e => setForm({...formData, staffName: e.target.value})}
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100">Log Entry</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col md={8}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white fw-bold"><i className="bi bi-list-task me-2"></i>Recent Activity Log</Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Equipment</th>
                      <th>Temp</th>
                      <th>Staff</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.createdAt).toLocaleTimeString()}</td>
                        <td>{log.equipmentName}</td>
                        <td className={log.isDeviation ? 'text-danger fw-bold' : ''}>{log.temperature}°C</td>
                        <td>{log.staffName}</td>
                        <td>
                          <Badge bg={log.isDeviation ? 'danger' : 'success'}>
                            {log.isDeviation ? 'AVVIKELSE' : 'OK'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;