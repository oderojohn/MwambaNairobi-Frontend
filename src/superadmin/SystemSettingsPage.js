import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SystemSettingsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    default_currency: 'KES',
    default_timezone: 'Africa/Nairobi',
    system_email: '',
    maintenance_mode: false,
    max_tenants: 1000,
    allow_self_registration: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real implementation, fetch system settings from API
      // For now, use default values
      setSettings({
        default_currency: 'KES',
        default_timezone: 'Africa/Nairobi',
        system_email: 'admin@mwambapos.com',
        maintenance_mode: false,
        max_tenants: 1000,
        allow_self_registration: false
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real implementation, save settings to API
      console.log('Saving settings:', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-container">
        <div className="page-header">
          <h1>System Settings</h1>
          <div className="breadcrumbs">
            <span onClick={() => navigate('/admin')} style={{cursor: 'pointer'}}>Admin</span> / <span>System Settings</span>
          </div>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-section">
              <h3>General Settings</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Default Currency</label>
                  <select
                    name="default_currency"
                    value={settings.default_currency}
                    onChange={handleChange}
                  >
                    <option value="KES">Kenyan Shilling (KES)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Default Timezone</label>
                  <select
                    name="default_timezone"
                    value={settings.default_timezone}
                    onChange={handleChange}
                  >
                    <option value="Africa/Nairobi">East Africa Time (UTC+3)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (UTC-5)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>System Email</label>
                  <input
                    type="email"
                    name="system_email"
                    value={settings.system_email}
                    onChange={handleChange}
                    placeholder="admin@yourcompany.com"
                  />
                </div>

                <div className="form-group">
                  <label>Max Tenants</label>
                  <input
                    type="number"
                    name="max_tenants"
                    value={settings.max_tenants}
                    onChange={handleChange}
                    min="1"
                    max="10000"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Security & Access</h3>
              <div className="form-grid">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="maintenance_mode"
                      checked={settings.maintenance_mode}
                      onChange={handleChange}
                    />
                    Maintenance Mode
                  </label>
                  <small>Enable to put the system in maintenance mode</small>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="allow_self_registration"
                      checked={settings.allow_self_registration}
                      onChange={handleChange}
                    />
                    Allow Self Registration
                  </label>
                  <small>Allow users to register new tenants themselves</small>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/admin')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;