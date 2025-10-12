import React, { useState, useEffect } from 'react';
import { FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';

const POSSettings = () => {
  const [settings, setSettings] = useState({
    receiptSettings: {
      printReceipt: true,
      receiptCopies: 1,
      showLogo: true,
      showBarcode: false,
      footerMessage: 'Thank you for your business!',
      paperSize: '80mm'
    },
    salesSettings: {
      allowDiscounts: true,
      maxDiscountPercent: 20,
      requireManagerApproval: false,
      enableHeldOrders: true,
      autoSaveInterval: 5,
      enableCustomerDisplay: false
    },
    paymentSettings: {
      requirePaymentMethod: true,
      allowSplitPayments: true,
      maxSplitPayments: 3,
      enableTips: false,
      tipOptions: [5, 10, 15, 20],
      enableCashDrawer: true
    },
    displaySettings: {
      itemsPerPage: 12,
      showStockLevels: true,
      enableSearch: true,
      categoryView: 'grid',
      productImageSize: 'medium'
    },
    shiftSettings: {
      requireShiftStart: true,
      autoEndShift: false,
      shiftDurationHours: 8,
      allowMultipleShifts: false
    },
    shortcuts: [
      { id: 1, key: 'F1', action: 'Open Cash Drawer', enabled: true },
      { id: 2, key: 'F2', action: 'Apply Discount', enabled: true },
      { id: 3, key: 'F3', action: 'Held Orders', enabled: true },
      { id: 4, key: 'F4', action: 'Customer Lookup', enabled: true }
    ]
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load POS settings from API
      // const response = await settingsAPI.getPOSSettings();
      // setSettings(response);
    } catch (error) {
      console.error('Error loading POS settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings to API
      // await settingsAPI.updatePOSSettings(settings);
      alert('POS settings saved successfully!');
    } catch (error) {
      console.error('Error saving POS settings:', error);
      alert('Failed to save POS settings');
    } finally {
      setSaving(false);
    }
  };

  const updateReceiptSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      receiptSettings: {
        ...prev.receiptSettings,
        [field]: value
      }
    }));
  };

  const updateSalesSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      salesSettings: {
        ...prev.salesSettings,
        [field]: value
      }
    }));
  };

  const updatePaymentSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      paymentSettings: {
        ...prev.paymentSettings,
        [field]: value
      }
    }));
  };

  const updateDisplaySettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      displaySettings: {
        ...prev.displaySettings,
        [field]: value
      }
    }));
  };

  const updateShiftSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      shiftSettings: {
        ...prev.shiftSettings,
        [field]: value
      }
    }));
  };

  const updateShortcut = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      shortcuts: prev.shortcuts.map(shortcut =>
        shortcut.id === id ? { ...shortcut, [field]: value } : shortcut
      )
    }));
  };

  const addShortcut = () => {
    const newShortcut = {
      id: Date.now(),
      key: '',
      action: '',
      enabled: true
    };
    setSettings(prev => ({
      ...prev,
      shortcuts: [...prev.shortcuts, newShortcut]
    }));
  };

  const removeShortcut = (id) => {
    setSettings(prev => ({
      ...prev,
      shortcuts: prev.shortcuts.filter(shortcut => shortcut.id !== id)
    }));
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>POS Settings</h2>
        <p>Configure Point of Sale system behavior and interface</p>
      </div>

      <div className="settings-form">
        {/* Receipt Settings */}
        <div className="settings-group">
          <h3>Receipt Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Receipt Copies</label>
              <input
                type="number"
                min="1"
                max="5"
                value={settings.receiptSettings.receiptCopies}
                onChange={(e) => updateReceiptSettings('receiptCopies', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Paper Size</label>
              <select
                value={settings.receiptSettings.paperSize}
                onChange={(e) => updateReceiptSettings('paperSize', e.target.value)}
              >
                <option value="58mm">58mm (Mobile)</option>
                <option value="80mm">80mm (Standard)</option>
                <option value="A4">A4 (Full Page)</option>
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Footer Message</label>
            <textarea
              value={settings.receiptSettings.footerMessage}
              onChange={(e) => updateReceiptSettings('footerMessage', e.target.value)}
              placeholder="Message to display at receipt bottom"
              rows="2"
            />
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.receiptSettings.printReceipt}
                onChange={(e) => updateReceiptSettings('printReceipt', e.target.checked)}
              />
              Automatically print receipts
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.receiptSettings.showLogo}
                onChange={(e) => updateReceiptSettings('showLogo', e.target.checked)}
              />
              Show company logo on receipts
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.receiptSettings.showBarcode}
                onChange={(e) => updateReceiptSettings('showBarcode', e.target.checked)}
              />
              Show barcode on receipts
            </label>
          </div>
        </div>

        {/* Sales Settings */}
        <div className="settings-group">
          <h3>Sales Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Max Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.salesSettings.maxDiscountPercent}
                onChange={(e) => updateSalesSettings('maxDiscountPercent', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Auto-save Interval (minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.salesSettings.autoSaveInterval}
                onChange={(e) => updateSalesSettings('autoSaveInterval', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.salesSettings.allowDiscounts}
                onChange={(e) => updateSalesSettings('allowDiscounts', e.target.checked)}
              />
              Allow discounts on sales
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.salesSettings.requireManagerApproval}
                onChange={(e) => updateSalesSettings('requireManagerApproval', e.target.checked)}
              />
              Require manager approval for discounts
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.salesSettings.enableHeldOrders}
                onChange={(e) => updateSalesSettings('enableHeldOrders', e.target.checked)}
              />
              Enable held orders feature
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.salesSettings.enableCustomerDisplay}
                onChange={(e) => updateSalesSettings('enableCustomerDisplay', e.target.checked)}
              />
              Enable customer display
            </label>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="settings-group">
          <h3>Payment Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Max Split Payments</label>
              <input
                type="number"
                min="2"
                max="10"
                value={settings.paymentSettings.maxSplitPayments}
                onChange={(e) => updatePaymentSettings('maxSplitPayments', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.paymentSettings.requirePaymentMethod}
                onChange={(e) => updatePaymentSettings('requirePaymentMethod', e.target.checked)}
              />
              Require payment method selection
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.paymentSettings.allowSplitPayments}
                onChange={(e) => updatePaymentSettings('allowSplitPayments', e.target.checked)}
              />
              Allow split payments
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.paymentSettings.enableTips}
                onChange={(e) => updatePaymentSettings('enableTips', e.target.checked)}
              />
              Enable tip collection
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.paymentSettings.enableCashDrawer}
                onChange={(e) => updatePaymentSettings('enableCashDrawer', e.target.checked)}
              />
              Enable cash drawer integration
            </label>
          </div>
        </div>

        {/* Display Settings */}
        <div className="settings-group">
          <h3>Display Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Items Per Page</label>
              <input
                type="number"
                min="6"
                max="24"
                value={settings.displaySettings.itemsPerPage}
                onChange={(e) => updateDisplaySettings('itemsPerPage', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Product Image Size</label>
              <select
                value={settings.displaySettings.productImageSize}
                onChange={(e) => updateDisplaySettings('productImageSize', e.target.value)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category View</label>
              <select
                value={settings.displaySettings.categoryView}
                onChange={(e) => updateDisplaySettings('categoryView', e.target.value)}
              >
                <option value="grid">Grid View</option>
                <option value="list">List View</option>
              </select>
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.displaySettings.showStockLevels}
                onChange={(e) => updateDisplaySettings('showStockLevels', e.target.checked)}
              />
              Show stock levels on product cards
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.displaySettings.enableSearch}
                onChange={(e) => updateDisplaySettings('enableSearch', e.target.checked)}
              />
              Enable product search
            </label>
          </div>
        </div>

        {/* Shift Settings */}
        <div className="settings-group">
          <h3>Shift Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Shift Duration (hours)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.shiftSettings.shiftDurationHours}
                onChange={(e) => updateShiftSettings('shiftDurationHours', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.shiftSettings.requireShiftStart}
                onChange={(e) => updateShiftSettings('requireShiftStart', e.target.checked)}
              />
              Require shift start before sales
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.shiftSettings.autoEndShift}
                onChange={(e) => updateShiftSettings('autoEndShift', e.target.checked)}
              />
              Auto-end shifts after duration
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.shiftSettings.allowMultipleShifts}
                onChange={(e) => updateShiftSettings('allowMultipleShifts', e.target.checked)}
              />
              Allow multiple concurrent shifts
            </label>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="settings-group">
          <div className="group-header">
            <h3>Keyboard Shortcuts</h3>
            <button className="btn btn-sm btn-primary" onClick={addShortcut}>
              <FiPlus /> Add Shortcut
            </button>
          </div>

          <div className="shortcuts-list">
            {settings.shortcuts.map(shortcut => (
              <div key={shortcut.id} className="shortcut-item">
                <div className="shortcut-details">
                  <input
                    type="text"
                    value={shortcut.key}
                    onChange={(e) => updateShortcut(shortcut.id, 'key', e.target.value)}
                    placeholder="F1, Ctrl+S, etc."
                    className="shortcut-key"
                  />
                  <input
                    type="text"
                    value={shortcut.action}
                    onChange={(e) => updateShortcut(shortcut.id, 'action', e.target.value)}
                    placeholder="Action description"
                    className="shortcut-action"
                  />
                </div>

                <div className="shortcut-controls">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={shortcut.enabled}
                      onChange={(e) => updateShortcut(shortcut.id, 'enabled', e.target.checked)}
                    />
                    Enabled
                  </label>

                  <button
                    className="btn-icon btn-danger"
                    onClick={() => removeShortcut(shortcut.id)}
                    title="Remove shortcut"
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

export default POSSettings;