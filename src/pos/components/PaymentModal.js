import React, { useState } from 'react';
import { toNumber, formatCurrency } from '../../services/ApiService/api';

const PaymentModal = ({ isOpen, onClose, onProcessPayment, totalAmount, selectedCustomer, mode, initialMethod = 'cash' }) => {
  console.log('PaymentModal render - isOpen:', isOpen, 'totalAmount:', totalAmount, 'type:', typeof totalAmount);

  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Set initial method when modal opens
  React.useEffect(() => {
    if (isOpen && initialMethod) {
      console.log('Setting initial payment method:', initialMethod);
      setPaymentMethod(initialMethod);
    }
  }, [isOpen, initialMethod]);

  const [mpesaNumber, setMpesaNumber] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [change, setChange] = useState(0);
  const [transactionId, setTransactionId] = useState('');

  if (!isOpen) {
    console.log('PaymentModal not rendering because isOpen is false');
    return null;
  }

  console.log('PaymentModal rendering with totalAmount:', totalAmount);

  const calculateChange = (amount) => {
    const numericTotal = toNumber(totalAmount);
    const changeAmount = toNumber(amount) - numericTotal;
    setChange(changeAmount >= 0 ? changeAmount : 0);
    setCashAmount(amount);
  };

  const handlePayment = () => {
    // Validate required fields based on payment method
    if (paymentMethod === 'mpesa' && !mpesaNumber.trim()) {
      alert('Please enter M-Pesa phone number');
      return;
    }


    if (paymentMethod === 'cash' && !cashAmount) {
      alert('Please enter cash amount received');
      return;
    }

    // Credit payment validation removed

    if (paymentMethod === 'cash') {
      const cashReceived = parseFloat(cashAmount);
      if (cashReceived < totalAmount) {
        alert('Cash received is less than total amount');
        return;
      }
    }

    const paymentData = {
      method: paymentMethod,
      amount: totalAmount,
      transactionId: transactionId.trim() || null,
      // Additional data based on payment method
      ...(paymentMethod === 'mpesa' && { mpesaNumber: mpesaNumber.trim() }),
      ...(paymentMethod === 'cash' && {
        cashReceived: parseFloat(cashAmount),
        change: change
      })
    };

    onProcessPayment(paymentData);
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Process Payment</h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          <div className="total-line total-final" style={{ marginBottom: '20px' }}>
            <span>Total Amount:</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>

          <div className="payment-options" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              type="button"
              className={`payment-option ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('cash')}
              style={{
                backgroundColor: paymentMethod === 'cash' ? '#2563eb' : '#ffffff',
                color: paymentMethod === 'cash' ? '#ffffff' : '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                minWidth: '100px',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-money-bill-wave"></i>
              <div>Cash</div>
            </button>
            <button
              type="button"
              className={`payment-option ${paymentMethod === 'mpesa' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('mpesa')}
              style={{
                backgroundColor: paymentMethod === 'mpesa' ? '#2563eb' : '#ffffff',
                color: paymentMethod === 'mpesa' ? '#ffffff' : '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                minWidth: '100px',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-mobile-alt"></i>
              <div>M-Pesa</div>
            </button>
          </div>

          {paymentMethod === 'cash' && (
            <div className="form-group">
              <label>Amount Received:</label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => calculateChange(e.target.value)}
                placeholder="Enter amount received"
              />
              {change > 0 && (
                <div style={{ marginTop: '10px', color: 'green', fontWeight: 'bold' }}>
                  Change: {formatCurrency(change)}
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'mpesa' && (
            <div className="form-group">
              <label>M-Pesa Phone Number:</label>
              <input
                type="tel"
                value={mpesaNumber}
                onChange={(e) => setMpesaNumber(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          )}


           {/* Split payment removed */}

           {/* Credit and installment sections removed */}

          <div className="form-group">
            <label>Transaction ID (Optional):</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction/reference ID"
            />
          </div>

          <div className="modal-footer">
            <button className="btn btn-warning" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={handlePayment}>
              Confirm Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;