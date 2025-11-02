import React, { useState } from 'react';
import { formatCurrency } from '../../services/ApiService/api';
import { salesAPI } from '../../services/ApiService/api';
import './HeldOrderDetailsModal.css';

const HeldOrderDetailsModal = ({ isOpen, onClose, onProceedToPayment, heldOrder, products, onOrderVoided }) => {
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  if (!isOpen || !heldOrder) return null;

  const calculateTotal = () => {
    if (!heldOrder.items || !Array.isArray(heldOrder.items)) return 0;
    return heldOrder.items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0));
    }, 0);
  };

  const getProductName = (item) => {
    return item.product_name || `Product ${item.product}`;
  };

  const handleVoidOrder = async () => {
    if (!voidReason.trim()) {
      alert('Please enter a reason for voiding the order');
      return;
    }

    setIsVoiding(true);
    try {
      await salesAPI.voidHeldOrder(heldOrder.id, { void_reason: voidReason.trim() });
      alert('Order voided successfully');
      setShowVoidModal(false);
      setVoidReason('');
      onClose();
      if (onOrderVoided) {
        onOrderVoided();
      }
    } catch (error) {
      console.error('Error voiding order:', error);
      alert('Failed to void order. Please try again.');
    } finally {
      setIsVoiding(false);
    }
  };

  const mainModal = (
    <div className="held-order-modal-overlay">
      <div className="held-order-modal-content">
        <div className="modal-header">
          <h3>
            <i className="fas fa-receipt"></i>
            Held Order Details - Order #{heldOrder.id}
          </h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>

        <div className="held-order-modal-body">
          <div className="order-info-cards">
            <div className="info-card">
              <div className="info-card__icon">
                <i className="fas fa-calendar"></i>
              </div>
              <div className="info-card__content">
                <div className="info-card__label">Date & Time</div>
                <div className="info-card__value">
                  {new Date(heldOrder.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            {heldOrder.customer_name && (
              <div className="info-card">
                <div className="info-card__icon">
                  <i className="fas fa-user"></i>
                </div>
                <div className="info-card__content">
                  <div className="info-card__label">Customer</div>
                  <div className="info-card__value">{heldOrder.customer_name}</div>
                </div>
              </div>
            )}

            <div className="info-card info-card--total">
              <div className="info-card__icon">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <div className="info-card__content">
                <div className="info-card__label">Total Amount</div>
                <div className="info-card__value info-card__value--total">
                  {formatCurrency(calculateTotal())}
                </div>
              </div>
            </div>
          </div>

          <div className="order-items-section">
            <div className="section-header">
              <h4 className="section-title">
                <i className="fas fa-list-ul"></i>
                Order Items ({heldOrder.items?.length || 0})
              </h4>
            </div>
            
            <div className="held-order-modal-table-responsive">
              <table className="held-order-modal-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {heldOrder.items && heldOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{getProductName(item)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(parseFloat(item.unit_price || 0))}</td>
                      <td>{formatCurrency(parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="held-order-modal-footer">
          <button className="held-order-modal-btn held-order-modal-btn-danger" onClick={() => setShowVoidModal(true)}>
            <i className="fas fa-ban"></i>
            Void Order
          </button>
          <button className="held-order-modal-btn held-order-modal-btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i>
            Cancel
          </button>
          <button className="held-order-modal-btn held-order-modal-btn-primary" onClick={() => onProceedToPayment(heldOrder)}>
            <i className="fas fa-credit-card"></i>
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );

  const renderVoidModal = () => (
    <div className="held-order-modal-overlay" style={{ zIndex: 1100 }}>
      <div className="held-order-modal-content">
        <div className="modal-header">
          <h3>
            <i className="fas fa-exclamation-triangle"></i>
            Void Held Order
          </h3>
          <span className="close" onClick={() => setShowVoidModal(false)}>&times;</span>
        </div>

        <div className="held-order-modal-body">
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-circle"></i>
            <div>
              <strong>Warning: Destructive Action</strong>
              <div>This held order will be permanently voided and cannot be recovered.</div>
            </div>
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-edit"></i>
              Reason for Voiding
            </label>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Please provide a detailed reason for voiding this order..."
              rows="4"
              className="form-control"
              required
              disabled={isVoiding}
            />
            <small className="text-muted">This reason will be recorded in the system logs.</small>
          </div>
        </div>

        <div className="held-order-modal-footer">
          <button
            className="held-order-modal-btn held-order-modal-btn-secondary"
            onClick={() => setShowVoidModal(false)}
            disabled={isVoiding}
          >
            <i className="fas fa-arrow-left"></i>
            Go Back
          </button>
          <button
            className="held-order-modal-btn held-order-modal-btn-danger"
            onClick={handleVoidOrder}
            disabled={isVoiding || !voidReason.trim()}
          >
            {isVoiding ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
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

  if (showVoidModal) {
    return renderVoidModal();
  }

  return mainModal;
};

export default HeldOrderDetailsModal;