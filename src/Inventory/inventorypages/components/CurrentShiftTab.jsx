// components/CurrentShiftTab.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../services/ApiService/api';
import './CurrentShiftTab.css';

const CurrentShiftTab = ({
  currentShift,
  currentShiftItems,
  currentShiftSales,
  isLoading,
  handleVoidSale,
  handleViewTransactionDetails,
  loadCurrentShift
}) => {
  if (!currentShift) {
    return (
      <div className="pos-admin-tab-content">
        <div className="empty-state">
          <i className="fas fa-clock"></i>
          <h3>No Active Shift</h3>
          <p>No shift is currently active in the POS system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-admin-tab-content">
      <div className="pos-admin-section-header">
        <h3>Current Shift Operations</h3>
        <div className="pos-admin-filters">
          <button
            className="btn btn-primary"
            onClick={loadCurrentShift}
            disabled={isLoading}
          >
            <i className="fas fa-refresh"></i> Refresh
          </button>
        </div>
      </div>

      <div className="current-shift-overview">
        {/* Shift Info */}
        <div className="shift-info-card">
          <h4>Shift Information</h4>
          <div className="shift-details-grid">
            <div className="detail-item">
              <label>Shift ID:</label>
              <span>#{currentShift.id}</span>
            </div>
            <div className="detail-item">
              <label>User:</label>
              <span>{currentShift.cashier_name || 'Unknown'}</span>
            </div>
            <div className="detail-item">
              <label>Start Time:</label>
              <span>{new Date(currentShift.start_time).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <label>Opening Balance:</label>
              <span>{formatCurrency(currentShift.opening_balance || 0)}</span>
            </div>
            <div className="detail-item">
              <label>Total Sales:</label>
              <span>{formatCurrency(currentShift.total_sales || 0)}</span>
            </div>
            <div className="detail-item">
              <label>Transactions:</label>
              <span>{currentShift.transaction_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Items Sold */}
        <div className="shift-items-section">
          <h4>Items Sold in Current Shift</h4>
          <div className="pos-admin-table-container">
            {currentShiftItems.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-shopping-cart"></i>
                <h3>No Items Sold</h3>
                <p>No items have been sold in the current shift yet.</p>
              </div>
            ) : (
              <table className="pos-admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity Sold</th>
                    <th>Unit Price</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentShiftItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>{formatCurrency(item.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="shift-sales-section">
          <h4>Recent Sales (Current Shift)</h4>
          <div className="pos-admin-table-container">
            {currentShiftSales.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-receipt"></i>
                <h3>No Sales Yet</h3>
                <p>No sales have been made in the current shift yet.</p>
              </div>
            ) : (
              <table className="pos-admin-table">
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentShiftSales.map(sale => (
                    <tr key={sale.id}>
                      <td>#{sale.id}</td>
                      <td>{sale.sale_date ? new Date(sale.sale_date).toLocaleTimeString() : 'N/A'}</td>
                      <td>{sale.customer_name || 'Walk-in'}</td>
                      <td>{sale.items?.length || 0}</td>
                      <td>{formatCurrency(sale.total_amount || 0)}</td>
                      <td>{sale.payment_method || 'N/A'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleViewTransactionDetails(sale)}
                          disabled={isLoading}
                          style={{ marginRight: '5px' }}
                        >
                          <i className="fas fa-eye"></i> View
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleVoidSale(sale)}
                          disabled={isLoading}
                        >
                          <i className="fas fa-ban"></i> Void
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

CurrentShiftTab.propTypes = {
  currentShift: PropTypes.object,
  currentShiftItems: PropTypes.array.isRequired,
  currentShiftSales: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  handleVoidSale: PropTypes.func.isRequired,
  handleViewTransactionDetails: PropTypes.func.isRequired,
  loadCurrentShift: PropTypes.func.isRequired
};

export default CurrentShiftTab;