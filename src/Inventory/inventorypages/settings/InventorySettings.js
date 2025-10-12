import React, { useState, useEffect } from 'react';
import { FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';

const InventorySettings = () => {
  const [settings, setSettings] = useState({
    defaultLowStockThreshold: 10,
    autoReorderEnabled: false,
    reorderPoint: 5,
    defaultSupplier: null,
    batchTracking: true,
    expiryAlerts: true,
    expiryAlertDays: 30,
    negativeStockAllowed: false,
    stockAdjustmentReasons: [
      { id: 1, reason: 'Damaged Goods', active: true },
      { id: 2, reason: 'Lost/Stolen', active: true },
      { id: 3, reason: 'Count Discrepancy', active: true },
      { id: 4, reason: 'Supplier Return', active: true }
    ],
    valuationMethod: 'fifo', // fifo, lifo, average
    costPriceUpdate: 'manual', // manual, automatic
    stockTakingFrequency: 'monthly',
    enableBarcodeScanning: true,
    defaultUOM: 'pieces',
    categories: [
      { id: 1, name: 'Beverages', active: true },
      { id: 2, name: 'Snacks', active: true },
      { id: 3, name: 'Household', active: true }
    ]
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load inventory settings from API
      // const response = await settingsAPI.getInventorySettings();
      // setSettings(response);
    } catch (error) {
      console.error('Error loading inventory settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings to API
      // await settingsAPI.updateInventorySettings(settings);
      alert('Inventory settings saved successfully!');
    } catch (error) {
      console.error('Error saving inventory settings:', error);
      alert('Failed to save inventory settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateStockAdjustmentReason = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      stockAdjustmentReasons: prev.stockAdjustmentReasons.map(reason =>
        reason.id === id ? { ...reason, [field]: value } : reason
      )
    }));
  };

  const addStockAdjustmentReason = () => {
    const newReason = {
      id: Date.now(),
      reason: '',
      active: true
    };
    setSettings(prev => ({
      ...prev,
      stockAdjustmentReasons: [...prev.stockAdjustmentReasons, newReason]
    }));
  };

  const removeStockAdjustmentReason = (id) => {
    setSettings(prev => ({
      ...prev,
      stockAdjustmentReasons: prev.stockAdjustmentReasons.filter(reason => reason.id !== id)
    }));
  };

  const updateCategory = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.map(category =>
        category.id === id ? { ...category, [field]: value } : category
      )
    }));
  };

  const addCategory = () => {
    const newCategory = {
      id: Date.now(),
      name: '',
      active: true
    };
    setSettings(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  const removeCategory = (id) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category.id !== id)
    }));
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>Inventory Settings</h2>
        <p>Configure inventory management and stock control settings</p>
      </div>

      <div className="settings-form">
        {/* Stock Management */}
        <div className="settings-group">
          <h3>Stock Management</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Default Low Stock Threshold</label>
              <input
                type="number"
                min="0"
                value={settings.defaultLowStockThreshold}
                onChange={(e) => updateSetting('defaultLowStockThreshold', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Reorder Point</label>
              <input
                type="number"
                min="0"
                value={settings.reorderPoint}
                onChange={(e) => updateSetting('reorderPoint', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Stock Taking Frequency</label>
              <select
                value={settings.stockTakingFrequency}
                onChange={(e) => updateSetting('stockTakingFrequency', e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div className="form-group">
              <label>Default Unit of Measure</label>
              <select
                value={settings.defaultUOM}
                onChange={(e) => updateSetting('defaultUOM', e.target.value)}
              >
                <option value="pieces">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="liters">Liters</option>
                <option value="meters">Meters</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.autoReorderEnabled}
                onChange={(e) => updateSetting('autoReorderEnabled', e.target.checked)}
              />
              Enable automatic reordering
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.negativeStockAllowed}
                onChange={(e) => updateSetting('negativeStockAllowed', e.target.checked)}
              />
              Allow negative stock levels
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enableBarcodeScanning}
                onChange={(e) => updateSetting('enableBarcodeScanning', e.target.checked)}
              />
              Enable barcode scanning
            </label>
          </div>
        </div>

        {/* Batch & Expiry Tracking */}
        <div className="settings-group">
          <h3>Batch & Expiry Tracking</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Expiry Alert (days before expiry)</label>
              <input
                type="number"
                min="1"
                value={settings.expiryAlertDays}
                onChange={(e) => updateSetting('expiryAlertDays', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.batchTracking}
                onChange={(e) => updateSetting('batchTracking', e.target.checked)}
              />
              Enable batch tracking
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.expiryAlerts}
                onChange={(e) => updateSetting('expiryAlerts', e.target.checked)}
              />
              Enable expiry date alerts
            </label>
          </div>
        </div>

        {/* Valuation & Costing */}
        <div className="settings-group">
          <h3>Valuation & Costing</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Inventory Valuation Method</label>
              <select
                value={settings.valuationMethod}
                onChange={(e) => updateSetting('valuationMethod', e.target.value)}
              >
                <option value="fifo">First In, First Out (FIFO)</option>
                <option value="lifo">Last In, First Out (LIFO)</option>
                <option value="average">Weighted Average Cost</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cost Price Updates</label>
              <select
                value={settings.costPriceUpdate}
                onChange={(e) => updateSetting('costPriceUpdate', e.target.value)}
              >
                <option value="manual">Manual Updates Only</option>
                <option value="automatic">Automatic on Purchase</option>
                <option value="approval">Require Approval</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stock Adjustment Reasons */}
        <div className="settings-group">
          <div className="group-header">
            <h3>Stock Adjustment Reasons</h3>
            <button className="btn btn-sm btn-primary" onClick={addStockAdjustmentReason}>
              <FiPlus /> Add Reason
            </button>
          </div>

          <div className="adjustment-reasons-list">
            {settings.stockAdjustmentReasons.map(reason => (
              <div key={reason.id} className="reason-item">
                <input
                  type="text"
                  value={reason.reason}
                  onChange={(e) => updateStockAdjustmentReason(reason.id, 'reason', e.target.value)}
                  placeholder="Adjustment reason"
                  className="reason-input"
                />

                <div className="reason-controls">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={reason.active}
                      onChange={(e) => updateStockAdjustmentReason(reason.id, 'active', e.target.checked)}
                    />
                    Active
                  </label>

                  <button
                    className="btn-icon btn-danger"
                    onClick={() => removeStockAdjustmentReason(reason.id)}
                    title="Remove reason"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Categories */}
        <div className="settings-group">
          <div className="group-header">
            <h3>Product Categories</h3>
            <button className="btn btn-sm btn-primary" onClick={addCategory}>
              <FiPlus /> Add Category
            </button>
          </div>

          <div className="categories-list">
            {settings.categories.map(category => (
              <div key={category.id} className="category-item">
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                  placeholder="Category name"
                  className="category-input"
                />

                <div className="category-controls">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={category.active}
                      onChange={(e) => updateCategory(category.id, 'active', e.target.checked)}
                    />
                    Active
                  </label>

                  <button
                    className="btn-icon btn-danger"
                    onClick={() => removeCategory(category.id)}
                    title="Remove category"
                  >
                    <FiTrash2 />
                  </button>
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

export default InventorySettings;