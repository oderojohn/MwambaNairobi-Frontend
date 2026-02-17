// components/modals/VoidItemsModal.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Modal.css';

const VoidItemsModal = ({ 
  show, 
  onClose, 
  selectedSale, 
  onConfirm, 
  isLoading 
}) => {
  const [voidReason, setVoidReason] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (show && selectedSale?.sale_items) {
      // Initialize all items as selected by default
      const initialSelection = {};
      selectedSale.sale_items.forEach(item => {
        initialSelection[item.id] = true;
      });
      setSelectedItems(initialSelection);
      setSelectAll(true);
    }
  }, [show, selectedSale]);

  const handleItemToggle = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
    setValidationError('');
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedItems({});
      setSelectAll(false);
    } else {
      // Select all
      const allSelection = {};
      selectedSale?.sale_items?.forEach(item => {
        allSelection[item.id] = true;
      });
      setSelectedItems(allSelection);
      setSelectAll(true);
    }
    setValidationError('');
  };

  const getSelectedItemsList = () => {
    if (!selectedSale?.sale_items) return [];
    return selectedSale.sale_items.filter(item => selectedItems[item.id]);
  };

  const getTotalVoidAmount = () => {
    const selected = getSelectedItemsList();
    return selected.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  };

  const handleConfirm = () => {
    const itemsToVoid = getSelectedItemsList();
    
    if (itemsToVoid.length === 0) {
      setValidationError('Please select at least one item to void');
      return;
    }
    
    if (!voidReason.trim()) {
      setValidationError('Void reason is required');
      return;
    }

    const voidData = {
      items: itemsToVoid.map(item => ({
        sale_item_id: item.id,
        quantity: item.quantity
      })),
      reason: voidReason
    };

    onConfirm(voidData);
  };

  if (!show) return null;

  const selectedItemsList = getSelectedItemsList();
  const totalVoidAmount = getTotalVoidAmount();

  return (
    <div className="modal-overlay">
      <div className="modal-container void-modal" style={{ maxWidth: '700px' }}>
        <div className="modal-header alert-warning">
          <h3>
            <i className="fas fa-ban modal-title-icon"></i>
            Void Items - Sale #{selectedSale?.id}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {/* Sale Info */}
          <div className="transaction-info-card">
            <div className="transaction-info-grid">
              <div className="transaction-info-item">
                <span className="transaction-info-label">Receipt #</span>
                <span className="transaction-info-value">
                  {selectedSale?.receipt_number || 'N/A'}
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">Original Total</span>
                <span className="transaction-info-value amount">
                  KES {selectedSale?.total_amount?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">Items to Void</span>
                <span className="transaction-info-value">
                  {selectedItemsList.length} of {selectedSale?.sale_items?.length || 0}
                </span>
              </div>
              <div className="transaction-info-item">
                <span className="transaction-info-label">Void Amount</span>
                <span className="transaction-info-value amount highlight">
                  KES {totalVoidAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Items Selection */}
          <div className="modal-form">
            <div className="modal-form-group">
              <label>
                <i className="fas fa-box"></i>
                Select Items to Void
              </label>
              
              <div className="items-selection-header">
                <label className="checkbox-label select-all">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                  <span className="checkbox-custom"></span>
                  Select All Items
                </label>
              </div>

              <div className="items-list">
                {selectedSale?.sale_items?.map(item => (
                  <div 
                    key={item.id} 
                    className={`item-row ${selectedItems[item.id] ? 'selected' : ''}`}
                    onClick={() => handleItemToggle(item.id)}
                  >
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={!!selectedItems[item.id]}
                        onChange={() => handleItemToggle(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="checkbox-custom"></span>
                    </label>
                    <div className="item-details">
                      <span className="item-name">{item.product_name}</span>
                      <span className="item-qty">x{item.quantity}</span>
                    </div>
                    <div className="item-price">
                      KES {(item.unit_price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Void Reason */}
            <div className="modal-form-group">
              <label className="required">
                <i className="fas fa-comment"></i>
                Reason for Voiding
              </label>
              <textarea
                className="modal-form-control textarea"
                placeholder="Please provide a detailed reason for voiding these items..."
                rows="3"
                value={voidReason}
                onChange={(e) => {
                  setVoidReason(e.target.value);
                  setValidationError('');
                }}
                required
              />
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="validation-error">
                <i className="fas fa-exclamation-circle"></i>
                {validationError}
              </div>
            )}

            {/* Warning */}
            <div className="danger-zone">
              <div className="danger-zone-header">
                <i className="fas fa-exclamation-circle danger-icon"></i>
                <h5>Warning: Partial Void</h5>
              </div>
              <div className="danger-zone-content">
                Voiding items will return them to inventory. The sale total will be 
                recalculated accordingly. This action requires manager approval and 
                will be logged in the audit trail.
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
            onClick={handleConfirm}
            disabled={isLoading || selectedItemsList.length === 0}
          >
            {isLoading ? (
              <>
                <div className="modal-loading-spinner" style={{width: '16px', height: '16px'}}></div>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-ban"></i>
                Void {selectedItemsList.length} Item(s) - KES {totalVoidAmount.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

VoidItemsModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedSale: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

VoidItemsModal.defaultProps = {
  selectedSale: null,
  isLoading: false
};

export default VoidItemsModal;
