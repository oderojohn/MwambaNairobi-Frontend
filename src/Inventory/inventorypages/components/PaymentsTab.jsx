// components/PaymentsTab.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../services/ApiService/api';
import './TransactionTable.css'; // Reuse the same CSS

const PaymentsTab = ({
  payments,
  isLoading,
  dateRange,
  pagination,
  handleDateRangeChange,
  handlePaginationChange
}) => {
  if (isLoading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading payments...</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-credit-card"></i>
        <h3>No Payments Found</h3>
        <p>No payments found for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className="pos-admin-tab-content">
      <div className="pos-admin-section-header">
        <h3>All Payments</h3>
        <div className="pos-admin-filters">
          <div className="filter-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pos-admin-table-container">
        <table className="pos-admin-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Sale ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td>{payment.sale || 'N/A'}</td>
                <td>{formatCurrency(payment.amount || 0)}</td>
                <td>{payment.method || 'Unknown'}</td>
                <td>{new Date(payment.created_at).toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${payment.status === 'completed' ? 'completed' : 'pending'}`}>
                    {payment.status || 'Completed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && payments.length >= pagination.limit && (
        <div className="pagination-controls">
          <button
            className="btn btn-secondary"
            onClick={handlePaginationChange}
            disabled={isLoading}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

PaymentsTab.propTypes = {
  payments: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  dateRange: PropTypes.object.isRequired,
  pagination: PropTypes.object.isRequired,
  handleDateRangeChange: PropTypes.func.isRequired,
  handlePaginationChange: PropTypes.func.isRequired
};

export default PaymentsTab;