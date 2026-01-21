// components/ShiftsTab.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../services/ApiService/api';
import './TransactionTable.css'; // Reuse the same CSS

const ShiftsTab = ({
  shifts,
  isLoading,
  dateRange,
  pagination,
  handleViewShiftDetails,
  handleDateRangeChange,
  handlePaginationChange
}) => {
  if (isLoading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading shifts...</p>
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-clock"></i>
        <h3>No Shifts Found</h3>
        <p>No shifts found for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className="pos-admin-tab-content">
      <div className="pos-admin-section-header">
        <h3>All Shifts</h3>
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
              <th>Shift ID</th>
              <th>Cashier</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Total Sales</th>
              <th>Transactions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map(shift => (
              <tr key={shift.id}>
                <td>{shift.id}</td>
                <td>{shift.user_name || 'Unknown'}</td>
                <td>{new Date(shift.start_time).toLocaleString()}</td>
                <td>
                  {shift.end_time ? new Date(shift.end_time).toLocaleString() : 'Active'}
                </td>
                <td>
                  {shift.end_time
                    ? `${Math.round((new Date(shift.end_time) - new Date(shift.start_time)) / 60000)} min`
                    : 'Ongoing'
                  }
                </td>
                <td>{formatCurrency(shift.total_sales || 0)}</td>
                <td>{shift.transaction_count || 0}</td>
                <td>
                  <span className={`status-badge ${shift.end_time ? 'completed' : 'active'}`}>
                    {shift.end_time ? 'Closed' : 'Active'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() => handleViewShiftDetails(shift)}
                    title="View Details"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && shifts.length >= pagination.limit && (
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

ShiftsTab.propTypes = {
  shifts: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  dateRange: PropTypes.object.isRequired,
  pagination: PropTypes.object.isRequired,
  handleViewShiftDetails: PropTypes.func.isRequired,
  handleDateRangeChange: PropTypes.func.isRequired,
  handlePaginationChange: PropTypes.func.isRequired
};

export default ShiftsTab;