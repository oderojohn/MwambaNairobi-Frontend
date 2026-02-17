import React, { useState, useEffect } from 'react';
import './IntegrationsDashboard.css';

const IntegrationsDashboard = () => {
  const [integrations, setIntegrations] = useState([
    {
      id: 'mpesa',
      name: 'M-Pesa Payment Gateway',
      status: 'active',
      lastSync: '2 minutes ago',
      successRate: '99.8%',
      enabled: true,
      configuration: { merchantCode: '12345', callbackUrl: 'https://api.mwambapos.com/mpesa/callback' },
      icon: '💸',
      color: '#00A859'
    },
    {
      id: 'sms',
      name: 'SMS Gateway',
      status: 'active',
      lastSync: '5 minutes ago',
      successRate: '97.2%',
      enabled: true,
      configuration: { provider: 'AfricasTalking', apiKey: '••••••••' },
      icon: '📱',
      color: '#FF6B35'
    },
    {
      id: 'email',
      name: 'Email Service',
      status: 'degraded',
      lastSync: '1 hour ago',
      successRate: '89.5%',
      enabled: true,
      configuration: { provider: 'SendGrid', dailyLimit: 1000 },
      icon: '📧',
      color: '#1E90FF'
    },
    {
      id: 'accounting',
      name: 'QuickBooks Integration',
      status: 'inactive',
      lastSync: 'Never',
      successRate: '0%',
      enabled: false,
      configuration: { companyId: '', connected: false },
      icon: '📊',
      color: '#2CA01C'
    },
    {
      id: 'analytics',
      name: 'Google Analytics',
      status: 'active',
      lastSync: '10 minutes ago',
      successRate: '100%',
      enabled: true,
      configuration: { trackingId: 'UA-XXXXX-Y', connected: true },
      icon: '📈',
      color: '#4285F4'
    },
    {
      id: 'cloud_storage',
      name: 'AWS S3 Storage',
      status: 'active',
      lastSync: 'Just now',
      successRate: '99.9%',
      enabled: true,
      configuration: { bucket: 'mwamba-backups', region: 'us-east-1' },
      icon: '☁️',
      color: '#FF9900'
    }
  ]);

  const [showConfigModal, setShowConfigModal] = useState(null);
  const [testResults, setTestResults] = useState({});

  const toggleIntegration = async (id) => {
    const integration = integrations.find(i => i.id === id);
    
    if (integration.enabled && integration.status === 'active') {
      if (!window.confirm(`Disable ${integration.name}? This may affect system functionality.`)) {
        return;
      }
    }

    setIntegrations(prev => 
      prev.map(integ => 
        integ.id === id ? { ...integ, enabled: !integ.enabled } : integ
      )
    );
  };

  const testIntegration = async (id) => {
    const integration = integrations.find(i => i.id === id);
    
    // Simulate API test
    setTestResults(prev => ({
      ...prev,
      [id]: 'Testing...'
    }));

    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate
      setTestResults(prev => ({
        ...prev,
        [id]: success ? '✅ Test successful' : '❌ Test failed'
      }));
      
      if (!success && integration.enabled) {
        setIntegrations(prev => 
          prev.map(integ => 
            integ.id === id ? { ...integ, status: 'degraded' } : integ
          )
        );
      }
    }, 2000);
  };

  const viewLogs = (id) => {
    alert(`Logs for ${integrations.find(i => i.id === id)?.name} would open here`);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#28a745';
      case 'degraded': return '#ffc107';
      case 'inactive': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return '●';
      case 'degraded': return '●';
      case 'inactive': return '●';
      default: return '○';
    }
  };

  return (
    <div className="integrations-dashboard">
      <div className="integrations-header">
        <h2>Integration Status</h2>
        <div className="integrations-stats">
          <div className="stat">
            <span className="stat-label">Active</span>
            <span className="stat-value">
              {integrations.filter(i => i.status === 'active').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Total</span>
            <span className="stat-value">{integrations.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Enabled</span>
            <span className="stat-value">
              {integrations.filter(i => i.enabled).length}
            </span>
          </div>
        </div>
      </div>

      <div className="integrations-grid">
        {integrations.map(integration => (
          <div 
            key={integration.id} 
            className={`integration-card status-${integration.status} ${integration.enabled ? 'enabled' : 'disabled'}`}
          >
            <div className="integration-header">
              <div className="integration-icon" style={{ color: integration.color }}>
                {integration.icon}
              </div>
              <div className="integration-title">
                <h3>{integration.name}</h3>
                <div className="integration-status">
                  <span 
                    className="status-dot" 
                    style={{ color: getStatusColor(integration.status) }}
                  >
                    {getStatusIcon(integration.status)}
                  </span>
                  <span className="status-text">{integration.status}</span>
                </div>
              </div>
              <div className="integration-toggle">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={integration.enabled}
                    onChange={() => toggleIntegration(integration.id)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            <div className="integration-metrics">
              <div className="metric">
                <span className="metric-label">Last Sync</span>
                <span className="metric-value">{integration.lastSync}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Success Rate</span>
                <span className="metric-value success-rate">
                  {integration.successRate}
                </span>
              </div>
            </div>

            <div className="integration-config">
              <div className="config-item">
                <span className="config-label">Provider</span>
                <span className="config-value">
                  {integration.configuration.provider || 'N/A'}
                </span>
              </div>
              {integration.configuration.connected !== undefined && (
                <div className="config-item">
                  <span className="config-label">Connected</span>
                  <span className={`config-value ${integration.configuration.connected ? 'connected' : 'disconnected'}`}>
                    {integration.configuration.connected ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>

            <div className="integration-actions">
              <button 
                className="btn-sm btn-secondary"
                onClick={() => setShowConfigModal(integration.id)}
              >
                Configure
              </button>
              <button 
                className="btn-sm btn-secondary"
                onClick={() => testIntegration(integration.id)}
                disabled={!integration.enabled}
              >
                {testResults[integration.id] ? testResults[integration.id] : 'Test'}
              </button>
              <button 
                className="btn-sm btn-secondary"
                onClick={() => viewLogs(integration.id)}
              >
                Logs
              </button>
            </div>
          </div>
        ))}
      </div>

      {showConfigModal && (
        <IntegrationConfigModal
          integration={integrations.find(i => i.id === showConfigModal)}
          onClose={() => setShowConfigModal(null)}
        />
      )}
    </div>
  );
};

const IntegrationConfigModal = ({ integration, onClose }) => {
  const [config, setConfig] = useState(integration.configuration || {});

  const handleSave = () => {
    // Save configuration logic here
    alert(`Configuration saved for ${integration.name}`);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Configure {integration.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={config.apiKey || ''}
              onChange={(e) => setConfig({...config, apiKey: e.target.value})}
              placeholder="Enter API key"
            />
          </div>
          
          <div className="form-group">
            <label>Secret Key</label>
            <input
              type="password"
              value={config.secretKey || ''}
              onChange={(e) => setConfig({...config, secretKey: e.target.value})}
              placeholder="Enter secret key"
            />
          </div>
          
          {integration.id === 'mpesa' && (
            <>
              <div className="form-group">
                <label>Merchant Code</label>
                <input
                  type="text"
                  value={config.merchantCode || ''}
                  onChange={(e) => setConfig({...config, merchantCode: e.target.value})}
                  placeholder="Enter merchant code"
                />
              </div>
              <div className="form-group">
                <label>Callback URL</label>
                <input
                  type="url"
                  value={config.callbackUrl || ''}
                  onChange={(e) => setConfig({...config, callbackUrl: e.target.value})}
                  placeholder="https://example.com/callback"
                />
              </div>
            </>
          )}
          
          {integration.id === 'email' && (
            <div className="form-group">
              <label>Daily Limit</label>
              <input
                type="number"
                value={config.dailyLimit || ''}
                onChange={(e) => setConfig({...config, dailyLimit: e.target.value})}
                placeholder="Enter daily email limit"
              />
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsDashboard;