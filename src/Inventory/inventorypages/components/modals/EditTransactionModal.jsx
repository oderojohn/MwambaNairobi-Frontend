// components/modals/EditTransactionModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import { formatCurrency } from '../../../../services/ApiService/api';
import { salesAPI } from '../../../../services/ApiService/api';
import './Modal.css';

const EditTransactionModal = ({
  show,
  selectedTransaction,
  editTransactionData,
  setEditTransactionData,
  onClose,
  onConfirm,
  isLoading
}) => {
  if (!show || !selectedTransaction) return null;

  const handleConfirm = async () => {
    // Validate edit reason
    if (!editTransactionData.edit_reason || editTransactionData.edit_reason.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Edit Reason Required',
        text: 'Please provide a reason for editing this transaction.'
      });
      return;
    }

    try {
      // Include items data for stock adjustments
      const updateData = {
        ...editTransactionData,
        items: selectedTransaction.items?.map(item => ({
          id: item.id,
          quantity: item.quantity
        })) || []
      };

      await salesAPI.updateSale(selectedTransaction.id, updateData);
      Swal.fire({
        icon: 'success',
        title: 'Transaction Updated',
        text: 'The transaction has been successfully updated.'
      });
      onConfirm();
    } catch (error) {
      console.error('Error updating transaction:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update the transaction. Please try again.'
      });
    }
  };

  const calculateNewTotal = () => {
    const editedItems = editTransactionData.items || selectedTransaction.items || [];
    const itemTotal = editedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0;
    return itemTotal + (editTransactionData.tax || 0) - (editTransactionData.discount || 0);
  };

  const handleItemQuantityChange = (itemId, newQuantity) => {
    // Don't modify the original selectedTransaction object
    // Just update the editTransactionData to include items for the API call
    const currentItems = editTransactionData.items || selectedTransaction.items?.map(item => ({ id: item.id, quantity: item.quantity })) || [];
    const updatedItems = currentItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ).filter(item => item.quantity > 0); // Remove items with 0 quantity

    setEditTransactionData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  return (
    <div className="modal active">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3>Edit Transaction #{selectedTransaction.id}</h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          <div className="transaction-details">
            <div className="detail-group">
              <label>Original Total:</label>
              <span>{formatCurrency(selectedTransaction.total_amount || 0)}</span>
            </div>
            <div className="detail-group">
              <label>Date/Time:</label>
              <span>{selectedTransaction.sale_date ? new Date(selectedTransaction.sale_date).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="detail-group">
              <label>Payment Method:</label>
              <span>{selectedTransaction.payment_method || 'N/A'}</span>
            </div>
          </div>
          
          <div className="form-section">
            <h4>Edit Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name:</label>
                <input
                  type="text"
                  value={editTransactionData.customer_name}
                  onChange={(e) => setEditTransactionData(prev => ({
                    ...prev,
                    customer_name: e.target.value
                  }))}
                  placeholder="Customer Name"
                />
              </div>
              <div className="form-group">
                <label>Discount ($):</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editTransactionData.discount}
                  onChange={(e) => setEditTransactionData(prev => ({
                    ...prev,
                    discount: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="Discount Amount"
                />
              </div>
              <div className="form-group">
                <label>Tax ($):</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editTransactionData.tax}
                  onChange={(e) => setEditTransactionData(prev => ({
                    ...prev,
                    tax: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="Tax Amount"
                />
              </div>
            </div>
            
            <div className="form-row">
            </div>
            
            <div className="form-group">
              <label>Edit Reason: <span style={{color: 'red'}}>*</span></label>
              <textarea
                value={editTransactionData.edit_reason || ''}
                onChange={(e) => setEditTransactionData(prev => ({
                  ...prev,
                  edit_reason: e.target.value
                }))}
                placeholder="Please provide a reason for this edit..."
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Notes:</label>
              <textarea
                value={editTransactionData.notes}
                onChange={(e) => setEditTransactionData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="Transaction notes..."
                rows="3"
              />
            </div>

            {/* Items Table */}
            <div className="items-section">
              <h4>Transaction Items</h4>
              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(editTransactionData.items || selectedTransaction.items)?.map(item => (
                      <tr key={item.id}>
                        <td>{item.product_name || item.name}</td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            style={{ width: '60px', textAlign: 'center' }}
                          />
                        </td>
                        <td>{formatCurrency(item.unit_price * item.quantity)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleItemQuantityChange(item.id, 0)}
                            title="Remove Item"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                          No items in this transaction
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="new-total">
              <h4>New Calculated Total:
                <span className="total-amount">
                  {formatCurrency(calculateNewTotal())}
                </span>
              </h4>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-warning" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

EditTransactionModal.propTypes = {
  show: PropTypes.bool.isRequired,
  selectedTransaction: PropTypes.object,
  editTransactionData: PropTypes.object.isRequired,
  setEditTransactionData: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired
};

export default EditTransactionModal;