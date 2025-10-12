import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import { settingsAPI } from '../../../services/ApiService/api';

const GeneralSettings = () => {
  const [settings, setSettings] = useState({
    company_name: 'Modern Retail POS',
    company_address: '',
    company_phone: '',
    company_email: '',
    timezone: 'Africa/Nairobi',
    date_format: 'DD/MM/YYYY',
    currency: 'KES',
    currency_symbol: 'Ksh',
    language: 'en',
    theme: 'light',
    auto_backup: true,
    backup_frequency: 'daily',
    session_timeout: 30,
    enable_notifications: true,
    enable_email_alerts: false
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getGeneralSettings();
      setSettings(response);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateGeneralSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      loadSettings();
    }
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>General Settings</h2>
        <p>Configure basic system settings and preferences</p>
      </div>

      <div className="settings-form">
        {/* Company Information */}
        <div className="settings-group">
          <h3>Company Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div className="form-group">
              <label>Company Phone</label>
              <input
                type="tel"
                value={settings.company_phone}
                onChange={(e) => handleInputChange('company_phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label>Company Email</label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group full-width">
              <label>Company Address</label>
              <textarea
                value={settings.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                placeholder="Enter company address"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="settings-group">
          <h3>Regional Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
              >
                <option value="Africa/Nairobi">East Africa Time (UTC+3)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (UTC-5)</option>
                <option value="Europe/London">GMT (UTC+0)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date Format</label>
              <select
                value={settings.date_format}
                onChange={(e) => handleInputChange('date_format', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="form-group">
              <label>Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
              >
                <option value="KES">Kenyan Shilling (KES)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Currency Symbol</label>
              <input
                type="text"
                value={settings.currency_symbol}
                onChange={(e) => handleInputChange('currency_symbol', e.target.value)}
                placeholder="Ksh"
              />
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="settings-group">
          <h3>System Preferences</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="sw">Swahili</option>
              </select>
            </div>

            <div className="form-group">
              <label>Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div className="form-group">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={settings.session_timeout}
                onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enable_notifications}
                onChange={(e) => handleInputChange('enable_notifications', e.target.checked)}
              />
              Enable system notifications
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enable_email_alerts}
                onChange={(e) => handleInputChange('enable_email_alerts', e.target.checked)}
              />
              Enable email alerts
            </label>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="settings-group">
          <h3>Backup Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Backup Frequency</label>
              <select
                value={settings.backup_frequency}
                onChange={(e) => handleInputChange('backup_frequency', e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.auto_backup}
                onChange={(e) => handleInputChange('auto_backup', e.target.checked)}
              />
              Enable automatic backups
            </label>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={loading}
        >
          <FiRefreshCw /> Reset to Defaults
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || loading}
        >
          <FiSave /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default GeneralSettings;