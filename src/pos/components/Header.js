// Header.js
import React from 'react';
import logo from '../../logo.png';
import './Header.css';

const Header = ({ onOpenHeldOrders, onShiftManagement, onPrint, onLogout, onOpenSalesSummary, onOpenOrderPreparation, currentShift, mode, onModeChange, onCustomerLookup, onCustomerClear, selectedCustomer }) => {

  return (
    <header className="pos-header">
      {/* Logo Section */}
      <div className="pos-header__brand">
        <div className="pos-header__logo">
          <img src={logo} alt="Logo" className="pos-header__logo-png" />
          <span className="pos-header__logo-text">ModernPOS</span>
        </div>
        <span className={`pos-header__mode-indicator pos-header__mode-indicator--${mode}`}>
          {mode === 'wholesale' ? '🏪 WHOLESALE' : '🛒 RETAIL'}
        </span>
      </div>

      {/* Shift Status */}
      {/* {getShiftStatusDisplay()} */}

      {/* Header Controls */}
      <div className="pos-header__controls">
        {/* Mode Toggle */}
        <div className="pos-header__mode-toggle">
          <button
            className={`pos-header__mode-btn ${mode === 'retail' ? 'pos-header__mode-btn--retail-active' : 'pos-header__mode-btn--retail'}`}
            onClick={() => onModeChange('retail')}
          >
            <i className="fas fa-shopping-bag pos-header__mode-icon"></i>
            <span className="pos-header__mode-text">Retail</span>
          </button>
          <button
            className={`pos-header__mode-btn ${mode === 'wholesale' ? 'pos-header__mode-btn--wholesale-active' : 'pos-header__mode-btn--wholesale'}`}
            onClick={() => onModeChange('wholesale')}
          >
            <i className="fas fa-truck pos-header__mode-icon"></i>
            <span className="pos-header__mode-text">Wholesale</span>
          </button>
        </div>

        {/* Customer Selection (Wholesale Mode) */}
        {mode === 'wholesale' && (
          <button
            className={`pos-header__customer-btn ${selectedCustomer ? 'pos-header__customer-btn--selected' : 'pos-header__customer-btn--default'}`}
            onClick={onCustomerLookup}
          >
            <i className="fas fa-user pos-header__customer-icon"></i>
            <span className="pos-header__customer-text">
              {selectedCustomer ? `Customer: ${selectedCustomer.name}` : 'Select Customer'}
            </span>
          </button>
        )}

        {/* Action Buttons */}
        <div className="pos-header__action-buttons">
          <button className="pos-header__action-btn pos-header__action-btn--secondary" onClick={onOpenHeldOrders}>
            <i className="fas fa-clock pos-header__action-icon"></i>
            <span className="pos-header__action-text">Held Orders</span>
          </button>

          <button className="pos-header__action-btn pos-header__action-btn--info" onClick={() => onOpenSalesSummary(currentShift?.id)}>
            <i className="fas fa-chart-line pos-header__action-icon"></i>
            <span className="pos-header__action-text">Sales Summary</span>
          </button>

          <button className="pos-header__action-btn pos-header__action-btn--warning" onClick={onShiftManagement}>
            <i className="fas fa-user-clock pos-header__action-icon"></i>
            <span className="pos-header__action-text">Shift</span>
          </button>

          <button className="pos-header__action-btn pos-header__action-btn--success" onClick={onOpenOrderPreparation}>
            <i className="fas fa-clipboard-list pos-header__action-icon"></i>
            <span className="pos-header__action-text">Order Prep</span>
          </button>

          <button className="pos-header__action-btn pos-header__action-btn--danger" onClick={onLogout}>
            <i className="fas fa-sign-out-alt pos-header__action-icon"></i>
            <span className="pos-header__action-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;