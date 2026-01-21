// components/modals/ShiftDetailsModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../../services/ApiService/api';
import './Modal.css';

const ShiftDetailsModal = ({ show, onClose, shift }) => {
  if (!show || !shift) return null;

  const calculateTotals = (shift) => ({
    cashSales: shift.cash_sales || 0,
    cardSales: shift.card_sales || 0,
    mobileSales: shift.mobile_sales || 0,
    totalSales: shift.total_sales || 0,
    expectedCash: shift.expected_cash || 0,
    actualCash: shift.actual_cash || 0,
    variance: (shift.expected_cash || 0) - (shift.actual_cash || 0),
    transactionCount: shift.transaction_count || 0,
    averageTicket: shift.total_sales / (shift.transaction_count || 1)
  });

  const totals = calculateTotals(shift);

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-xl">
        <div className="modal-header">
          <h3>
            <i className="fas fa-clipboard-list modal-title-icon"></i>
            Shift Details #{shift?.id}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="transaction-info-card">
            <div className="transaction-info-grid">
              <div className="transaction-info-item">
                <span className="transaction-info-label">Cashier</span>
                <span className="transaction-info-value">
                  {shift?.cashier_name || 'Unknown'}
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">Status</span>
                <span className={`transaction-info-value ${shift?.end_time ? 'warning' : 'success'}`}>
                  {shift?.end_time ? 'Closed' : 'Active'}
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">Start Time</span>
                <span className="transaction-info-value">
                  {new Date(shift?.start_time).toLocaleString()}
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">End Time</span>
                <span className="transaction-info-value">
                  {shift?.end_time ? new Date(shift?.end_time).toLocaleString() : 'Still Active'}
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">Duration</span>
                <span className="transaction-info-value">
                  {shift?.end_time 
                    ? `${Math.round((new Date(shift.end_time) - new Date(shift.start_time)) / 60000)} minutes`
                    : 'Ongoing'
                  }
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">Opening Balance</span>
                <span className="transaction-info-value">
                  {formatCurrency(shift?.opening_balance || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="shift-stats-grid">
            <div className="shift-stat-card">
              <div className="shift-stat-value">{formatCurrency(totals.totalSales)}</div>
              <div className="shift-stat-label">Total Sales</div>
            </div>
            <div className="shift-stat-card">
              <div className="shift-stat-value">{totals.transactionCount}</div>
              <div className="shift-stat-label">Transactions</div>
            </div>
            <div className="shift-stat-card">
              <div className="shift-stat-value">{formatCurrency(totals.averageTicket)}</div>
              <div className="shift-stat-label">Average Ticket</div>
            </div>
            <div className="shift-stat-card">
              <div className="shift-stat-value">{formatCurrency(totals.cashSales)}</div>
              <div className="shift-stat-label">Cash Sales</div>
            </div>
            <div className="shift-stat-card">
              <div className="shift-stat-value">{formatCurrency(totals.cardSales)}</div>
              <div className="shift-stat-label">Card Sales</div>
            </div>
            <div className="shift-stat-card">
              <div className="shift-stat-value">{formatCurrency(totals.mobileSales)}</div>
              <div className="shift-stat-label">Mobile Sales</div>
            </div>
          </div>

          {shift?.end_time && (
            <div className="summary-section">
              <h5>
                <i className="fas fa-cash-register"></i>
                Cash Reconciliation
              </h5>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Opening Cash</span>
                  <span className="summary-value">
                    {formatCurrency(shift?.opening_balance || 0)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Cash Sales</span>
                  <span className="summary-value">
                    {formatCurrency(totals.cashSales)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Expected Cash</span>
                  <span className="summary-value success">
                    {formatCurrency(totals.expectedCash)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Actual Cash</span>
                  <span className="summary-value">
                    {formatCurrency(totals.actualCash)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Cash Variance</span>
                  <span className={`summary-value ${Math.abs(totals.variance) > 0.01 ? 'danger' : 'success'}`}>
                    {formatCurrency(Math.abs(totals.variance))} 
                    {totals.variance > 0 ? ' (Over)' : totals.variance < 0 ? ' (Short)' : ' (Exact)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {shift?.notes && (
            <div className="modal-content-section">
              <h4>
                <i className="fas fa-sticky-note section-icon"></i>
                Shift Notes
              </h4>
              <div className="transaction-info-card">
                <p style={{ margin: 0, lineHeight: 1.6, color: '#4a5568' }}>
                  {shift.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i>
            Close
          </button>
          <button className="modal-btn modal-btn-primary">
            <i className="fas fa-print"></i>
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
};

ShiftDetailsModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  shift: PropTypes.object
};

export default ShiftDetailsModal;