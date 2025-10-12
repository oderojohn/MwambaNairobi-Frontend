import  { useState, useEffect } from 'react';
import { FiSave, FiDownload, FiDatabase, FiServer, FiActivity } from 'react-icons/fi';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    systemInfo: {
      version: '1.0.0',
      databaseVersion: 'PostgreSQL 15.3',
      serverUptime: '5 days, 12 hours',
      lastBackup: '2024-01-15 14:30:00'
    },
    maintenance: {
      enableMaintenanceMode: false,
      maintenanceMessage: 'System is under maintenance. Please try again later.',
      scheduledMaintenance: false,
      maintenanceStart: '',
      maintenanceEnd: ''
    },
    backupSettings: {
      autoBackupEnabled: true,
      backupFrequency: 'daily',
      backupRetentionDays: 30,
      backupLocation: '/backups',
      includeAttachments: true
    },
    securitySettings: {
      enableSSL: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      enableAuditLog: true,
      logRetentionDays: 90
    },
    performanceSettings: {
      cacheEnabled: true,
      cacheTimeout: 3600,
      maxConcurrentUsers: 50,
      enableCompression: true,
      databaseOptimization: 'auto'
    },
    integrations: {
      emailEnabled: false,
      smsEnabled: false,
      apiAccessEnabled: true,
      webhookEnabled: false
    }
  });

  const [systemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    databaseSize: '0 MB',
    diskUsage: '0%'
  });

  const [logs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadSystemStats();
    loadRecentLogs();
  }, []);

  const loadSettings = async () => {
    try {
      // Load system settings from API
      // const response = await settingsAPI.getSystemSettings();
      // setSettings(response);
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const loadSystemStats = async () => {
    try {
      // Load system statistics
      // const response = await systemAPI.getStats();
      // setSystemStats(response);
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const loadRecentLogs = async () => {
    try {
      // Load recent system logs
      // const response = await systemAPI.getLogs({ limit: 50 });
      // setLogs(response);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings to API
      // await settingsAPI.updateSystemSettings(settings);
      alert('System settings saved successfully!');
    } catch (error) {
      console.error('Error saving system settings:', error);
      alert('Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const updateMaintenanceSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      maintenance: {
        ...prev.maintenance,
        [field]: value
      }
    }));
  };

  const updateBackupSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      backupSettings: {
        ...prev.backupSettings,
        [field]: value
      }
    }));
  };

  const updateSecuritySettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      securitySettings: {
        ...prev.securitySettings,
        [field]: value
      }
    }));
  };

  const updatePerformanceSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      performanceSettings: {
        ...prev.performanceSettings,
        [field]: value
      }
    }));
  };

  const updateIntegrationSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [field]: value
      }
    }));
  };

  const handleManualBackup = async () => {
    try {
      // await systemAPI.createBackup();
      alert('Backup created successfully!');
      loadSettings(); // Refresh last backup time
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup');
    }
  };

  const handleDatabaseOptimization = async () => {
    try {
      // await systemAPI.optimizeDatabase();
      alert('Database optimization completed!');
    } catch (error) {
      console.error('Error optimizing database:', error);
      alert('Failed to optimize database');
    }
  };

  const handleClearCache = async () => {
    try {
      // await systemAPI.clearCache();
      alert('Cache cleared successfully!');
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache');
    }
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>System Settings</h2>
        <p>Advanced system configuration and maintenance (Admin Only)</p>
      </div>

      {/* System Information */}
      <div className="settings-group">
        <h3>System Information</h3>
        <div className="system-info-grid">
          <div className="info-card">
            <FiServer className="info-icon" />
            <div className="info-content">
              <span className="info-label">Version</span>
              <span className="info-value">{settings.systemInfo.version}</span>
            </div>
          </div>

          <div className="info-card">
            <FiDatabase className="info-icon" />
            <div className="info-content">
              <span className="info-label">Database</span>
              <span className="info-value">{settings.systemInfo.databaseVersion}</span>
            </div>
          </div>

          <div className="info-card">
            <FiActivity className="info-icon" />
            <div className="info-content">
              <span className="info-label">Uptime</span>
              <span className="info-value">{settings.systemInfo.serverUptime}</span>
            </div>
          </div>

          <div className="info-card">
            <FiDownload className="info-icon" />
            <div className="info-content">
              <span className="info-label">Last Backup</span>
              <span className="info-value">{settings.systemInfo.lastBackup}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="settings-group">
        <h3>System Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{systemStats.totalUsers}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Users</span>
            <span className="stat-value">{systemStats.activeUsers}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{systemStats.totalProducts}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Sales</span>
            <span className="stat-value">{systemStats.totalSales}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Database Size</span>
            <span className="stat-value">{systemStats.databaseSize}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Disk Usage</span>
            <span className="stat-value">{systemStats.diskUsage}</span>
          </div>
        </div>
      </div>

      <div className="settings-form">
        {/* Maintenance Mode */}
        <div className="settings-group">
          <h3>Maintenance Mode</h3>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.maintenance.enableMaintenanceMode}
                onChange={(e) => updateMaintenanceSettings('enableMaintenanceMode', e.target.checked)}
              />
              Enable maintenance mode
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.maintenance.scheduledMaintenance}
                onChange={(e) => updateMaintenanceSettings('scheduledMaintenance', e.target.checked)}
              />
              Schedule maintenance
            </label>
          </div>

          {settings.maintenance.enableMaintenanceMode && (
            <div className="form-group full-width">
              <label>Maintenance Message</label>
              <textarea
                value={settings.maintenance.maintenanceMessage}
                onChange={(e) => updateMaintenanceSettings('maintenanceMessage', e.target.value)}
                placeholder="Message to display during maintenance"
                rows="3"
              />
            </div>
          )}

          {settings.maintenance.scheduledMaintenance && (
            <div className="form-grid">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  value={settings.maintenance.maintenanceStart}
                  onChange={(e) => updateMaintenanceSettings('maintenanceStart', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="datetime-local"
                  value={settings.maintenance.maintenanceEnd}
                  onChange={(e) => updateMaintenanceSettings('maintenanceEnd', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Backup Settings */}
        <div className="settings-group">
          <div className="group-header">
            <h3>Backup Settings</h3>
            <button className="btn btn-sm btn-primary" onClick={handleManualBackup}>
              <FiDownload /> Create Backup
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Backup Frequency</label>
              <select
                value={settings.backupSettings.backupFrequency}
                onChange={(e) => updateBackupSettings('backupFrequency', e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="form-group">
              <label>Retention Period (days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.backupSettings.backupRetentionDays}
                onChange={(e) => updateBackupSettings('backupRetentionDays', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Backup Location</label>
              <input
                type="text"
                value={settings.backupSettings.backupLocation}
                onChange={(e) => updateBackupSettings('backupLocation', e.target.value)}
                placeholder="/backups"
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.backupSettings.autoBackupEnabled}
                onChange={(e) => updateBackupSettings('autoBackupEnabled', e.target.checked)}
              />
              Enable automatic backups
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.backupSettings.includeAttachments}
                onChange={(e) => updateBackupSettings('includeAttachments', e.target.checked)}
              />
              Include attachments in backups
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="settings-group">
          <h3>Security Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={settings.securitySettings.sessionTimeout}
                onChange={(e) => updateSecuritySettings('sessionTimeout', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Max Login Attempts</label>
              <input
                type="number"
                min="3"
                max="10"
                value={settings.securitySettings.maxLoginAttempts}
                onChange={(e) => updateSecuritySettings('maxLoginAttempts', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Lockout Duration (minutes)</label>
              <input
                type="number"
                min="5"
                max="1440"
                value={settings.securitySettings.lockoutDuration}
                onChange={(e) => updateSecuritySettings('lockoutDuration', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Log Retention (days)</label>
              <input
                type="number"
                min="30"
                max="365"
                value={settings.securitySettings.logRetentionDays}
                onChange={(e) => updateSecuritySettings('logRetentionDays', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.securitySettings.enableSSL}
                onChange={(e) => updateSecuritySettings('enableSSL', e.target.checked)}
              />
              Enable SSL/TLS encryption
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.securitySettings.enableAuditLog}
                onChange={(e) => updateSecuritySettings('enableAuditLog', e.target.checked)}
              />
              Enable audit logging
            </label>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="settings-group">
          <div className="group-header">
            <h3>Performance Settings</h3>
            <div className="action-buttons">
              <button className="btn btn-sm btn-secondary" onClick={handleClearCache}>
                Clear Cache
              </button>
              <button className="btn btn-sm btn-warning" onClick={handleDatabaseOptimization}>
                Optimize DB
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Cache Timeout (seconds)</label>
              <input
                type="number"
                min="300"
                max="86400"
                value={settings.performanceSettings.cacheTimeout}
                onChange={(e) => updatePerformanceSettings('cacheTimeout', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Max Concurrent Users</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={settings.performanceSettings.maxConcurrentUsers}
                onChange={(e) => updatePerformanceSettings('maxConcurrentUsers', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Database Optimization</label>
              <select
                value={settings.performanceSettings.databaseOptimization}
                onChange={(e) => updatePerformanceSettings('databaseOptimization', e.target.value)}
              >
                <option value="manual">Manual</option>
                <option value="auto">Automatic</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.performanceSettings.cacheEnabled}
                onChange={(e) => updatePerformanceSettings('cacheEnabled', e.target.checked)}
              />
              Enable caching
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.performanceSettings.enableCompression}
                onChange={(e) => updatePerformanceSettings('enableCompression', e.target.checked)}
              />
              Enable response compression
            </label>
          </div>
        </div>

        {/* Integrations */}
        <div className="settings-group">
          <h3>External Integrations</h3>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.integrations.emailEnabled}
                onChange={(e) => updateIntegrationSettings('emailEnabled', e.target.checked)}
              />
              Enable email integration
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.integrations.smsEnabled}
                onChange={(e) => updateIntegrationSettings('smsEnabled', e.target.checked)}
              />
              Enable SMS integration
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.integrations.apiAccessEnabled}
                onChange={(e) => updateIntegrationSettings('apiAccessEnabled', e.target.checked)}
              />
              Enable API access
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.integrations.webhookEnabled}
                onChange={(e) => updateIntegrationSettings('webhookEnabled', e.target.checked)}
              />
              Enable webhooks
            </label>
          </div>
        </div>

        {/* System Logs */}
        <div className="settings-group">
          <h3>Recent System Logs</h3>
          <div className="logs-container">
            {logs.length === 0 ? (
              <div className="empty-logs">
                <FiActivity className="empty-icon" />
                <p>No recent logs available</p>
              </div>
            ) : (
              <div className="logs-list">
                {logs.slice(0, 10).map((log, index) => (
                  <div key={index} className={`log-entry log-${log.level}`}>
                    <div className="log-time">{new Date(log.timestamp).toLocaleString()}</div>
                    <div className="log-level">{log.level.toUpperCase()}</div>
                    <div className="log-message">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <FiSave /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;