// Header.js
import React, { useState, useEffect } from 'react';
import logo from '../../logo.png';
import { userService } from '../../services/ApiService/api';
import './Header.css';

const Header = ({ onOpenHeldOrders, onShiftManagement, onPrint, onLogout, onOpenSalesSummary, onOpenOrderPreparation, currentShift, mode, onModeChange, onCustomerLookup, onCustomerClear, selectedCustomer, onEndShift, canUseWholesale, showMobileRefreshButton = false, onRefreshProducts, refreshingProducts = false, permissions = { pending_orders: true, sales_summary: true, shift: true, order_prep: true, logout: true, global_sales: false } }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasActiveShift = currentShift && currentShift.has_active_shift;
  const currentRole = (userService.getUserRole() || '').toLowerCase();
  const allowWholesale = typeof canUseWholesale === 'boolean' ? canUseWholesale : currentRole !== 'waiter';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleActionClick = (action) => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    action();
  };

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
          {showMobileRefreshButton && (
            <button
              type="button"
              className="pos-header__mode-btn pos-header__mode-btn--refresh"
              onClick={onRefreshProducts}
              disabled={refreshingProducts}
              aria-label="Refresh products"
            >
              <i className={`fas ${refreshingProducts ? 'fa-spinner fa-spin' : 'fa-rotate-right'} pos-header__mode-icon`}></i>
              <span className="pos-header__mode-text">{refreshingProducts ? 'Refreshing' : 'Refresh'}</span>
            </button>
          )}
          {allowWholesale && (
            <button
              className={`pos-header__mode-btn ${mode === 'wholesale' ? 'pos-header__mode-btn--wholesale-active' : 'pos-header__mode-btn--wholesale'}`}
              onClick={() => onModeChange('wholesale')}
            >
              <i className="fas fa-truck pos-header__mode-icon"></i>
              <span className="pos-header__mode-text">Wholesale</span>
            </button>
          )}
        </div>

        {/* Customer Selection (Wholesale Mode) */}
        {allowWholesale && mode === 'wholesale' && (
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

        <button
          className="pos-header__mobile-menu-btn"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          <span>Menu</span>
        </button>

        {/* Action Buttons */}
        <div className={`pos-header__action-buttons ${mobileMenuOpen ? 'pos-header__action-buttons--open' : ''}`}>
          {permissions.pending_orders && (
            <button
              className="pos-header__action-btn pos-header__action-btn--secondary"
              onClick={() => handleActionClick(onOpenHeldOrders)}
            >
              <i className="fas fa-clock pos-header__action-icon"></i>
              <span className="pos-header__action-text">Pending Orders</span>
            </button>
          )}

          {permissions.sales_summary && (
            <button
              className="pos-header__action-btn pos-header__action-btn--info"
              onClick={() => handleActionClick(() => {
              // Navigate to sales summary page with current shift ID
              const shiftId = currentShift?.id;
              if (shiftId) {
                window.location.href = `/#/sales-summary?shift_id=${shiftId}`;
              } else {
                window.location.href = '/#/sales-summary';
              }
            })}
            >
              <i className="fas fa-chart-line pos-header__action-icon"></i>
              <span className="pos-header__action-text">Sales Summary</span>
            </button>
          )}


          {permissions.shift && (
            <button 
              className={`pos-header__action-btn ${hasActiveShift ? 'pos-header__action-btn--danger' : 'pos-header__action-btn--warning'}`}
              onClick={() => handleActionClick(() => {
                console.log('Shift button clicked:', { hasActiveShift, currentShift: currentShift ? { id: currentShift.id, has_active_shift: currentShift.has_active_shift, status: currentShift.status } : null });
                if (hasActiveShift) {
                  onEndShift();
                } else {
                  onShiftManagement();
                }
              })}
            >
              <i className={`fas ${hasActiveShift ? 'fa-stop-circle' : 'fa-user-clock'} pos-header__action-icon`}></i>
              <span className="pos-header__action-text">{hasActiveShift ? 'End Shift' : 'Shift'}</span>
            </button>
          )}

          {permissions.order_prep && (
            <button
              className="pos-header__action-btn pos-header__action-btn--success"
              onClick={() => handleActionClick(onOpenOrderPreparation)}
            >
              <i className="fas fa-clipboard-list pos-header__action-icon"></i>
              <span className="pos-header__action-text">Order Prep</span>
            </button>
          )}

          {permissions.logout && (
            <button
              className="pos-header__action-btn pos-header__action-btn--danger"
              onClick={() => handleActionClick(onLogout)}
            >
              <i className="fas fa-sign-out-alt pos-header__action-icon"></i>
              <span className="pos-header__action-text">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
