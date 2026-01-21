// components/modals/VoidModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Modal.css';

const VoidModal = ({ show, onClose, selectedTransaction, voidReason, setVoidReason, onConfirm, isLoading }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container void-modal">
        <div className="modal-header alert-danger">
          <h3>
            <i className="fas fa-ban modal-title-icon"></i>
            Void Transaction #{selectedTransaction?.id}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="transaction-info-card">
            <div className="transaction-info-grid">
              <div className="transaction-info-item">
                <span className="transaction-info-label">Customer</span>
                <span className="transaction-info-value">
                  {selectedTransaction?.customer || 'Walk-in Customer'}
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">Total Amount</span>
                <span className="transaction-info-value amount">
                  ${selectedTransaction?.total_amount?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">Payment Method</span>
                <span className="transaction-info-value">
                  {selectedTransaction?.payment_method || 'N/A'}
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">Time</span>
                <span className="transaction-info-value">
                  {new Date(selectedTransaction?.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-form">
            <div className="modal-form-group">
              <label className="required">
                <i className="fas fa-comment"></i>
                Reason for Voiding
              </label>
              <textarea
                className="modal-form-control textarea"
                placeholder="Please provide a detailed reason for voiding this transaction..."
                rows="4"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                required
              />
              <div className="modal-form-helper warning">
                <i className="fas fa-exclamation-triangle"></i>
                This action cannot be undone. All items will be returned to inventory.
              </div>
            </div>

            <div className="danger-zone">
              <div className="danger-zone-header">
                <i className="fas fa-exclamation-circle danger-icon"></i>
                <h5>Warning: Critical Action</h5>
              </div>
              <div className="danger-zone-content">
                Voiding a transaction will permanently remove it from sales records.
                This action requires manager approval and will be logged in the audit trail.
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer modal-footer-space-between">
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i>
            Cancel
          </button>
          <button 
            className="modal-btn modal-btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="modal-loading-spinner" style={{width: '16px', height: '16px'}}></div>
                Voiding...
              </>
            ) : (
              <>
                <i className="fas fa-ban"></i>
                Confirm Void
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

VoidModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedTransaction: PropTypes.object,
  voidReason: PropTypes.string.isRequired,
  setVoidReason: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default VoidModal;