import React, { useState, useEffect, useCallback } from 'react';
import { shiftsAPI } from '../../../services/ApiService/api';
import './ShiftManager.css';

const ShiftManager = ({ show, onClose, currentShift, onShiftUpdated }) => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftDetails, setShiftDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadClosedShifts = useCallback(async () => {
    try {
      setLoading(true);
      const shiftsData = await shiftsAPI.getAllShifts({
        page: 1,
        page_size: 50
      });
      const closedShifts = (shiftsData || []).filter(s => s.status === 'closed')
        .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      setShifts(closedShifts);
    } catch (err) {
      console.error('Error loading closed shifts:', err);
      setError('Failed to load closed shifts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      loadClosedShifts();
    }
  }, [show, loadClosedShifts]);

  const loadShiftDetails = async (shift) => {
    try {
      setLoading(true);
      setSelectedShift(shift);
      const details = await shiftsAPI.getShift(shift.id);
      setShiftDetails(details);
    } catch (err) {
      console.error('Error loading shift details:', err);
      setError('Failed to load shift details');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenShift = async (shift) => {
    if (!window.confirm(`Are you sure you want to reopen shift #${shift.id}? This will allow the cashier to continue this shift.`)) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await shiftsAPI.reopenShift(shift.id);
      setSuccess(`Shift #${shift.id} has been reopened successfully`);
      loadClosedShifts();
      setSelectedShift(null);
      setShiftDetails(null);
      if (onShiftUpdated) onShiftUpdated();
    } catch (err) {
      console.error('Error reopening shift:', err);
      setError(err.response?.data?.message || 'Failed to reopen shift');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceCloseShift = async (shift) => {
    const reason = window.prompt('Please enter a reason for force closing this shift:');
    if (!reason || !reason.trim()) {
      alert('Force close reason is required');
      return;
    }
    if (!window.confirm(`WARNING: You are about to force close shift #${shift.id}. This action should only be done if the cashier cannot close the shift normally. Are you sure?`)) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await shiftsAPI.forceCloseShift(shift.id, { reason });
      setSuccess(`Shift #${shift.id} has been force closed successfully`);
      loadClosedShifts();
      setSelectedShift(null);
      setShiftDetails(null);
      if (onShiftUpdated) onShiftUpdated();
    } catch (err) {
      console.error('Error force closing shift:', err);
      setError(err.response?.data?.message || 'Failed to force close shift');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container shift-manager-modal">
        <div className="modal-header">
          <h3>
            <i className="fas fa-clock modal-title-icon"></i>
            Shift Manager
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="shift-manager">
            <div className="shift-manager-header">
              <h4>Current Shift Status</h4>
              {currentShift ? (
                <div className="current-shift-info">
                  <span className="status-badge open">Open</span>
                  <span>Shift #{currentShift.id} started at {formatDate(currentShift.start_time)}</span>
                </div>
              ) : (
                <div className="current-shift-info">
                  <span className="status-badge closed">No Open Shift</span>
                  <span>There is no currently open shift</span>
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
                <button onClick={() => setError(null)} className="close-btn">&times;</button>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                {success}
                <button onClick={() => setSuccess(null)} className="close-btn">&times;</button>
              </div>
            )}

            <div className="shift-manager-content">
              <div className="closed-shifts-panel">
                <h4>Closed Shifts</h4>
                {loading && actionLoading ? (
                  <div className="loading">Loading...</div>
                ) : (
                  <div className="shifts-list">
                    {shifts.length === 0 ? (
                      <div className="no-shifts">No closed shifts found</div>
                    ) : (
                      <div className="shifts-grid">
                        {shifts.map((shift) => (
                          <div
                            key={shift.id}
                            className={`shift-card ${selectedShift?.id === shift.id ? 'selected' : ''}`}
                            onClick={() => loadShiftDetails(shift)}
                          >
                            <div className="shift-card-header">
                              <span className="shift-id">Shift #{shift.id}</span>
                              <span className="status-badge closed">Closed</span>
                            </div>
                            <div className="shift-card-body">
                              <div className="shift-info-row">
                                <span className="label">Cashier:</span>
                                <span className="value">{shift.cashier || 'Unknown'}</span>
                              </div>
                              <div className="shift-info-row">
                                <span className="label">Date:</span>
                                <span className="value">{formatDate(shift.start_time)}</span>
                              </div>
                              <div className="shift-info-row">
                                <span className="label">Sales:</span>
                                <span className="value">{formatCurrency(shift.total_sales)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedShift && (
                <div className="shift-details-panel">
                  <h4>Shift #{selectedShift.id} Details</h4>
                  {loading && !shiftDetails ? (
                    <div className="loading">Loading details...</div>
                  ) : shiftDetails ? (
                    <div className="shift-details">
                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="label">Cashier:</span>
                          <span className="value">{shiftDetails.cashier || 'Unknown'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Start Time:</span>
                          <span className="value">{formatDate(shiftDetails.start_time)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">End Time:</span>
                          <span className="value">{formatDate(shiftDetails.end_time) || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Opening Balance:</span>
                          <span className="value">{formatCurrency(shiftDetails.opening_balance)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Closing Balance:</span>
                          <span className="value">{formatCurrency(shiftDetails.closing_balance) || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Variance:</span>
                          <span className="value">{formatCurrency(shiftDetails.discrepancy) || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="shift-financials">
                        <h5>Financial Summary</h5>
                        <div className="financials-grid">
                          <div className="financial-item">
                            <span className="label">Total Sales:</span>
                            <span className="value positive">{formatCurrency(shiftDetails.total_sales)}</span>
                          </div>
                          <div className="financial-item">
                            <span className="label">Total Returns:</span>
                            <span className="value negative">{formatCurrency(shiftDetails.total_returns)}</span>
                          </div>
                          <div className="financial-item">
                            <span className="label">Net Sales:</span>
                            <span className="value">{formatCurrency((shiftDetails.total_sales || 0) - (shiftDetails.total_returns || 0))}</span>
                          </div>
                          <div className="financial-item">
                            <span className="label">Transactions:</span>
                            <span className="value">{shiftDetails.total_transactions || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shift-actions">
                        <h5>Actions</h5>
                        <div className="action-buttons">
                          <button
                            className="btn btn-success"
                            onClick={() => handleReopenShift(selectedShift)}
                            disabled={actionLoading}
                          >
                            <i className="fas fa-folder-open"></i> Reopen Shift
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleForceCloseShift(selectedShift)}
                            disabled={actionLoading}
                          >
                            <i className="fas fa-lock"></i> Force Close
                          </button>
                        </div>
                        <p className="action-note">
                          <i className="fas fa-info-circle"></i>
                          Reopen Shift allows the cashier to continue from where they left off.
                          Force Close should only be used when the cashier cannot close the shift normally.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="no-details">No details available</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" style={{ background: '#6c757d', color: 'white' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftManager;
