// components/modals/RefundModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import { formatCurrency } from '../../../../services/ApiService/api';
import { salesAPI } from '../../../../services/ApiService/api';
import './Modal.css';

const RefundModal = ({
  show,
  selectedSale,
  refundReason,
  setRefundReason,
  refundAmount,
  setRefundAmount,
  onClose,
  onConfirm,
  isLoading
}) => {
  if (!show || !selectedSale) return null;

  const handleConfirm = async () => {
    if (!refundReason.trim() || refundAmount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please provide a reason and valid refund amount.'
      });
      return;
    }

    if (refundAmount > selectedSale.total_amount) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Amount',
        text: 'Refund amount cannot exceed original sale amount.'
      });
      return;
    }

    try {
      await salesAPI.refundSale(selectedSale.id, {
        reason: refundReason.trim(),
        amount: refundAmount
      });

      Swal.fire({
        icon: 'success',
        title: 'Refund Processed',
        text: `Refund of ${formatCurrency(refundAmount)} has been processed.`
      });
      onConfirm();
    } catch (error) {
      console.error('Error processing refund:', error);
      Swal.fire({
        icon: 'error',
        title: 'Refund Failed',
        text: 'Failed to process the refund. Please try again.'
      });
    }
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Refund Sale #{selectedSale.id}</h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          <div className="refund-sale-info">
            <p><strong>Original Amount:</strong> {formatCurrency(selectedSale.total_amount || 0)}</p>
            <p><strong>Customer:</strong> {selectedSale.customer_name || 'Walk-in'}</p>
            <p><strong>Time:</strong> {new Date(selectedSale.created_at).toLocaleString()}</p>
            <p><strong>Payment Method:</strong> {selectedSale.payment_method || 'N/A'}</p>
          </div>
          <div className="form-group">
            <label htmlFor="refundAmount">Refund Amount: *</label>
            <input
              type="number"
              id="refundAmount"
              min="0.01"
              max={selectedSale.total_amount}
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter refund amount"
              required
            />
            <small>Maximum: {formatCurrency(selectedSale.total_amount || 0)}</small>
          </div>
          <div className="form-group">
            <label htmlFor="refundReason">Reason for refund: *</label>
            <textarea
              id="refundReason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Please provide a reason for this refund..."
              rows="3"
              required
            />
          </div>
          <div className="refund-summary">
            <p><strong>Refund Summary:</strong></p>
            <p>Refund Amount: {formatCurrency(refundAmount)}</p>
            <p>Original Amount: {formatCurrency(selectedSale.total_amount || 0)}</p>
            <p>Remaining Balance: {formatCurrency((selectedSale.total_amount || 0) - refundAmount)}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-warning" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={isLoading || !refundReason.trim() || refundAmount <= 0}
          >
            {isLoading ? 'Processing...' : 'Process Refund'}
          </button>
        </div>
      </div>
    </div>
  );
};

RefundModal.propTypes = {
  show: PropTypes.bool.isRequired,
  selectedSale: PropTypes.object,
  refundReason: PropTypes.string.isRequired,
  setRefundReason: PropTypes.func.isRequired,
  refundAmount: PropTypes.number.isRequired,
  setRefundAmount: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired
};

export default RefundModal;