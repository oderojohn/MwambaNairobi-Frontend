// ReturnCodeModal.js - Modal for redeeming return codes
import React, { useState } from 'react';
import './ReturnCodeModal.css';

const ReturnCodeModal = ({ isOpen, onClose, onApply }) => {
  const [returnCode, setReturnCode] = useState('');
  const [error, setError] = useState('');
  const [decodedAmount, setDecodedAmount] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simple decode function to show preview
  const previewCode = (code) => {
    if (!code || code.length < 8) {
      setDecodedAmount(null);
      setError('');
      return;
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const codePart = code.split('-')[0];

    if (codePart.length !== 4) {
      setDecodedAmount(null);
      return;
    }

    // Decode amount (reverse of encoding)
    let amountStr = '';
    for (let i = 0; i < 4; i++) {
      const charIndex = chars.indexOf(codePart[i]);
      amountStr += charIndex.toString().padStart(2, '0');
    }

    const amount = parseInt(amountStr, 10) / 100;
    setDecodedAmount(amount);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setReturnCode(value);
    setError('');
    previewCode(value);
  };

  const handleApply = () => {
    if (!decodedAmount || decodedAmount <= 0) {
      setError('Invalid return code');
      return;
    }

    setLoading(true);
    // Simulate API validation
    setTimeout(() => {
      onApply(returnCode, decodedAmount);
      setReturnCode('');
      setDecodedAmount(null);
      setLoading(false);
      onClose();
    }, 500);
  };

  const handleClose = () => {
    setReturnCode('');
    setDecodedAmount(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="return-code-modal-overlay">
      <div className="return-code-modal">
        <div className="return-code-modal__header">
          <h2><i className="fas fa-undo"></i> Use Return Code</h2>
          <button className="return-code-modal__close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="return-code-modal__body">
          <p className="return-code-modal__instructions">
            Enter the 4-letter return code provided by the customer to apply the refund amount to this sale.
          </p>

          <div className="return-code-modal__input-group">
            <label>Return Code</label>
            <input
              type="text"
              value={returnCode}
              onChange={handleCodeChange}
              placeholder="XXXX-AAA"
              maxLength={8}
              className="return-code-modal__input"
            />
          </div>

          {error && (
            <div className="return-code-modal__error">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {decodedAmount !== null && (
            <div className="return-code-modal__preview">
              <div className="return-code-modal__preview-label">Refund Amount:</div>
              <div className="return-code-modal__preview-amount">
                KES {decodedAmount.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div className="return-code-modal__footer">
          <button 
            className="return-code-modal__btn return-code-modal__btn--secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button 
            className="return-code-modal__btn return-code-modal__btn--primary"
            onClick={handleApply}
            disabled={!decodedAmount || loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Applying...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i> Apply Refund
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnCodeModal;
