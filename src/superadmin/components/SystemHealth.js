import React, { useState, useEffect } from 'react';
import './SystemHealth.css';

const SystemHealth = () => {
  const [healthStatus, setHealthStatus] = useState({
    database: 'healthy',
    api: 'healthy',
    redis: 'degraded',
    storage: 'healthy',
    background_jobs: 'healthy',
    email_service: 'healthy',
    payment_gateway: 'healthy'
  });

  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 45,
    memory: 78,
    disk: 62,
    activeConnections: 124,
    responseTime: 142,
    requestsPerMinute: 2450
  });

  const [alerts, _setAlerts] = useState([
    {
      id: 1,
      level: 'warning',
      message: 'Redis memory usage at 85%',
      timestamp: '5 min ago',
      service: 'redis'
    },
    {
      id: 2,
      level: 'info',
      message: 'Database backup completed successfully',
      timestamp: '2 hours ago',
      service: 'database'
    },
    {
      id: 3,
      level: 'error',
      message: 'Email service experiencing delays',
      timestamp: '1 hour ago',
      service: 'email_service'
    }
  ]);

  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    console.log('SystemHealth: useEffect mounted');
    // Simulate real-time updates
    const interval = setInterval(() => {
      console.log('SystemHealth: updating metrics');
      setSystemMetrics(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() * 10 - 5))),
        activeConnections: Math.max(80, Math.min(200, prev.activeConnections + (Math.random() * 20 - 10))),
        requestsPerMinute: Math.max(2000, Math.min(3000, prev.requestsPerMinute + (Math.random() * 100 - 50)))
      }));
      setLastUpdated(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy': return '#28a745';
      case 'degraded': return '#ffc107';
      case 'unhealthy': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '⏳';
    }
  };

  const getAlertIcon = (level) => {
    switch(level) {
      case 'error': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <div className="system-health">
      <div className="health-header">
        <h2>System Health Monitor</h2>
        <div className="health-status">
          <span className="overall-status status-healthy">
            <span className="status-dot" />
            System Operational
          </span>
          <div className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="services-grid">
        {Object.entries(healthStatus).map(([service, status]) => (
          <div key={service} className="service-card">
            <div className="service-icon">
              {getStatusIcon(status)}
            </div>
            <div className="service-info">
              <div className="service-name">
                {service.replace('_', ' ').toUpperCase()}
              </div>
              <div className="service-status" style={{ color: getStatusColor(status) }}>
                {status.toUpperCase()}
              </div>
            </div>
            <div 
              className="status-indicator" 
              style={{backgroundColor: getStatusColor(status)}}
            />
          </div>
        ))}
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <h4>CPU Usage</h4>
            <span className="metric-value">{systemMetrics.cpu}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{
                width: `${systemMetrics.cpu}%`,
                background: systemMetrics.cpu > 80 ? 
                  'linear-gradient(90deg, #dc3545 0%, #c82333 100%)' :
                  systemMetrics.cpu > 60 ?
                  'linear-gradient(90deg, #ffc107 0%, #e0a800 100%)' :
                  'linear-gradient(90deg, #28a745 0%, #1e7e34 100%)'
              }}
            />
          </div>
          <div className="metric-footer">
            <span>Idle: {100 - systemMetrics.cpu}%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h4>Memory Usage</h4>
            <span className="metric-value">{systemMetrics.memory}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{
                width: `${systemMetrics.memory}%`,
                background: systemMetrics.memory > 85 ? 
                  'linear-gradient(90deg, #dc3545 0%, #c82333 100%)' :
                  systemMetrics.memory > 70 ?
                  'linear-gradient(90deg, #ffc107 0%, #e0a800 100%)' :
                  'linear-gradient(90deg, #28a745 0%, #1e7e34 100%)'
              }}
            />
          </div>
          <div className="metric-footer">
            <span>Available: {100 - systemMetrics.memory}%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h4>Disk Usage</h4>
            <span className="metric-value">{systemMetrics.disk}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{
                width: `${systemMetrics.disk}%`,
                background: systemMetrics.disk > 90 ? 
                  'linear-gradient(90deg, #dc3545 0%, #c82333 100%)' :
                  systemMetrics.disk > 75 ?
                  'linear-gradient(90deg, #ffc107 0%, #e0a800 100%)' :
                  'linear-gradient(90deg, #28a745 0%, #1e7e34 100%)'
              }}
            />
          </div>
          <div className="metric-footer">
            <span>Free: {100 - systemMetrics.disk}%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h4>Active Connections</h4>
            <span className="metric-value">{systemMetrics.activeConnections}</span>
          </div>
          <div className="metric-trend">
            <span className="trend-up">↗ 12%</span>
          </div>
          <div className="metric-footer">
            <span>Max: 500</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h4>Response Time</h4>
            <span className="metric-value">{systemMetrics.responseTime}ms</span>
          </div>
          <div className="metric-trend">
            <span className="trend-down">↘ 8%</span>
          </div>
          <div className="metric-footer">
            <span>Target: &lt;200ms</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h4>Requests/Minute</h4>
            <span className="metric-value">{systemMetrics.requestsPerMinute.toLocaleString()}</span>
          </div>
          <div className="metric-trend">
            <span className="trend-up">↗ 5%</span>
          </div>
          <div className="metric-footer">
            <span>Peak: 3,200</span>
          </div>
        </div>
      </div>

      <div className="alerts-section">
        <div className="alerts-header">
          <h3>Recent Alerts</h3>
          <button className="btn-sm btn-secondary">
            View All Alerts
          </button>
        </div>
        <div className="alerts-list">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert-item alert-${alert.level}`}>
              <div className="alert-icon">
                {getAlertIcon(alert.level)}
              </div>
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-meta">
                  <span className="alert-service">{alert.service.replace('_', ' ')}</span>
                  <span className="alert-timestamp">{alert.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;