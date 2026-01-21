// components/SalesTab.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../services/ApiService/api';
import './TransactionTable.css'; // Reuse the same CSS

const SalesTab = ({
  sales,
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
        <p>Loading sales...</p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-shopping-cart"></i>
        <h3>No Sales Found</h3>
        <p>No sales found for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className="pos-admin-tab-content">
      <div className="pos-admin-section-header">
        <h3>All Sales</h3>
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
              <th>Sale ID</th>
              <th>Time</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{new Date(sale.created_at).toLocaleString()}</td>
                <td>{sale.customer_name || 'Walk-in'}</td>
                <td>{sale.items?.length || 0}</td>
                <td>{formatCurrency(sale.total_amount || 0)}</td>
                <td>{sale.payment_method || 'Unknown'}</td>
                <td>
                  <span className={`status-badge ${sale.status === 'completed' ? 'completed' : 'pending'}`}>
                    {sale.status || 'Completed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && sales.length >= pagination.limit && (
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

SalesTab.propTypes = {
  sales: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  dateRange: PropTypes.object.isRequired,
  pagination: PropTypes.object.isRequired,
  handleDateRangeChange: PropTypes.func.isRequired,
  handlePaginationChange: PropTypes.func.isRequired
};

export default SalesTab;