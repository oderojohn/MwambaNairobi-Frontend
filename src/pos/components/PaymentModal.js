import React, { useState } from 'react';
import { toNumber, formatCurrency } from '../../services/ApiService/api';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, onProcessPayment, totalAmount, selectedCustomer, mode, initialMethod = 'cash' }) => {
  console.log('PaymentModal render - isOpen:', isOpen, 'totalAmount:', totalAmount, 'type:', typeof totalAmount);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handlePayment = async () => {
    // Prevent multiple clicks
    if (isProcessing) return;

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

    // Set processing state
    setIsProcessing(true);

    try {
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

      await onProcessPayment(paymentData);
    } catch (error) {
      console.error('Payment processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-content">
        <div className="modal-header">
          <h3>Process Payment</h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="payment-modal-body">
           <div className="payment-modal-total-line">
             <span>Total Amount:</span>
             <span>{formatCurrency(totalAmount)}</span>
           </div>

           <div className="payment-modal-options">
             <button
               type="button"
               className={`payment-modal-option-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
               onClick={() => setPaymentMethod('cash')}
             >
               <i className="fas fa-money-bill-wave"></i>
               <div>Cash</div>
             </button>
             <button
               type="button"
               className={`payment-modal-option-btn ${paymentMethod === 'mpesa' ? 'active' : ''}`}
               onClick={() => setPaymentMethod('mpesa')}
             >
               <i className="fas fa-mobile-alt"></i>
               <div>M-Pesa</div>
             </button>
           </div>

           {paymentMethod === 'cash' && (
             <div className="payment-modal-form-group">
               <label>Amount Received:</label>
               <input
                 type="number"
                 value={cashAmount}
                 onChange={(e) => calculateChange(e.target.value)}
                 placeholder="Enter amount received"
               />
               {change > 0 && (
                 <div className="payment-modal-cash-change">
                   Change: {formatCurrency(change)}
                 </div>
               )}
             </div>
           )}

           {paymentMethod === 'mpesa' && (
             <div className="payment-modal-form-group">
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

           <div className="payment-modal-form-group">
             <label>Transaction ID (Optional):</label>
             <input
               type="text"
               value={transactionId}
               onChange={(e) => setTransactionId(e.target.value)}
               placeholder="Enter transaction/reference ID"
             />
           </div>

           <div className="payment-modal-footer">
             <button className="payment-modal-btn payment-modal-btn-warning" onClick={onClose} disabled={isProcessing}>
               Cancel
             </button>
             <button
               className="payment-modal-btn payment-modal-btn-success"
               onClick={handlePayment}
               disabled={isProcessing}
             >
               {isProcessing ? 'Processing...' : 'Confirm Payment'}
             </button>
           </div>
         </div>
      </div>
    </div>
  );
};

export default PaymentModal;