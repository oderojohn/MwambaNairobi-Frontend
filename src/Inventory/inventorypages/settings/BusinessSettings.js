import React, { useState, useEffect } from 'react';
import { FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';

const BusinessSettings = () => {
  const [settings, setSettings] = useState({
    businessType: 'retail',
    taxSettings: {
      enableTax: true,
      defaultTaxRate: 16,
      taxInclusive: false,
      taxNumber: ''
    },
    paymentMethods: [
      { id: 1, name: 'Cash', enabled: true, isDefault: true },
      { id: 2, name: 'M-Pesa', enabled: true, isDefault: false },
      { id: 3, name: 'Card', enabled: true, isDefault: false },
      { id: 4, name: 'Bank Transfer', enabled: false, isDefault: false }
    ],
    loyaltyProgram: {
      enabled: false,
      pointsPerShilling: 1,
      shillingPerPoint: 1,
      minimumPoints: 100
    },
    operatingHours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '16:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    }
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load business settings from API
      // const response = await settingsAPI.getBusinessSettings();
      // setSettings(response);
    } catch (error) {
      console.error('Error loading business settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings to API
      // await settingsAPI.updateBusinessSettings(settings);
      alert('Business settings saved successfully!');
    } catch (error) {
      console.error('Error saving business settings:', error);
      alert('Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  const updateTaxSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      taxSettings: {
        ...prev.taxSettings,
        [field]: value
      }
    }));
  };

  const updatePaymentMethod = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map(method =>
        method.id === id ? { ...method, [field]: value } : method
      )
    }));
  };

  const addPaymentMethod = () => {
    const newMethod = {
      id: Date.now(),
      name: '',
      enabled: false,
      isDefault: false
    };
    setSettings(prev => ({
      ...prev,
      paymentMethods: [...prev.paymentMethods, newMethod]
    }));
  };

  const removePaymentMethod = (id) => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter(method => method.id !== id)
    }));
  };

  const updateLoyaltySettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      loyaltyProgram: {
        ...prev.loyaltyProgram,
        [field]: value
      }
    }));
  };

  const updateOperatingHours = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>Business Settings</h2>
        <p>Configure business-specific settings and operations</p>
      </div>

      <div className="settings-form">
        {/* Business Type */}
        <div className="settings-group">
          <h3>Business Type</h3>
          <div className="form-group">
            <label>Business Category</label>
            <select
              value={settings.businessType}
              onChange={(e) => setSettings(prev => ({ ...prev, businessType: e.target.value }))}
            >
              <option value="retail">Retail Store</option>
              <option value="wholesale">Wholesale</option>
              <option value="restaurant">Restaurant</option>
              <option value="supermarket">Supermarket</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="settings-group">
          <h3>Tax Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.taxSettings.defaultTaxRate}
                onChange={(e) => updateTaxSettings('defaultTaxRate', parseFloat(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Tax Number</label>
              <input
                type="text"
                value={settings.taxSettings.taxNumber}
                onChange={(e) => updateTaxSettings('taxNumber', e.target.value)}
                placeholder="Enter tax registration number"
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.taxSettings.enableTax}
                onChange={(e) => updateTaxSettings('enableTax', e.target.checked)}
              />
              Enable tax calculation
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.taxSettings.taxInclusive}
                onChange={(e) => updateTaxSettings('taxInclusive', e.target.checked)}
              />
              Prices are tax inclusive
            </label>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="settings-group">
          <div className="group-header">
            <h3>Payment Methods</h3>
            <button className="btn btn-sm btn-primary" onClick={addPaymentMethod}>
              <FiPlus /> Add Method
            </button>
          </div>

          <div className="payment-methods-list">
            {settings.paymentMethods.map(method => (
              <div key={method.id} className="payment-method-item">
                <div className="method-details">
                  <input
                    type="text"
                    value={method.name}
                    onChange={(e) => updatePaymentMethod(method.id, 'name', e.target.value)}
                    placeholder="Payment method name"
                    className="method-name"
                  />
                </div>

                <div className="method-controls">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={method.enabled}
                      onChange={(e) => updatePaymentMethod(method.id, 'enabled', e.target.checked)}
                    />
                    Enabled
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="defaultPayment"
                      checked={method.isDefault}
                      onChange={() => {
                        setSettings(prev => ({
                          ...prev,
                          paymentMethods: prev.paymentMethods.map(m => ({
                            ...m,
                            isDefault: m.id === method.id
                          }))
                        }));
                      }}
                    />
                    Default
                  </label>

                  <button
                    className="btn-icon btn-danger"
                    onClick={() => removePaymentMethod(method.id)}
                    disabled={settings.paymentMethods.length <= 1}
                    title="Remove payment method"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty Program */}
        <div className="settings-group">
          <h3>Loyalty Program</h3>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.loyaltyProgram.enabled}
                onChange={(e) => updateLoyaltySettings('enabled', e.target.checked)}
              />
              Enable loyalty program
            </label>
          </div>

          {settings.loyaltyProgram.enabled && (
            <div className="form-grid">
              <div className="form-group">
                <label>Points per Shilling</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={settings.loyaltyProgram.pointsPerShilling}
                  onChange={(e) => updateLoyaltySettings('pointsPerShilling', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Shilling per Point</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={settings.loyaltyProgram.shillingPerPoint}
                  onChange={(e) => updateLoyaltySettings('shillingPerPoint', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Minimum Points for Redemption</label>
                <input
                  type="number"
                  min="1"
                  value={settings.loyaltyProgram.minimumPoints}
                  onChange={(e) => updateLoyaltySettings('minimumPoints', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Operating Hours */}
        <div className="settings-group">
          <h3>Operating Hours</h3>
          <div className="operating-hours">
            {Object.entries(settings.operatingHours).map(([day, hours]) => (
              <div key={day} className="day-hours">
                <div className="day-name">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </div>

                <div className="hours-controls">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => updateOperatingHours(day, 'closed', !e.target.checked)}
                    />
                    Open
                  </label>

                  {!hours.closed && (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                        className="time-input"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                        className="time-input"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
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

export default BusinessSettings;