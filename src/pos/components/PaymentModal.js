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
  const [cashReceived, setCashReceived] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [change, setChange] = useState(0);
  const [transactionId, setTransactionId] = useState('');

  // Split payment states - commented out as they are not used
  // const [splitCashAmount, setSplitCashAmount] = useState('');
  // const [splitMpesaAmount, setSplitMpesaAmount] = useState('');
  // const [splitMpesaNumber, setSplitMpesaNumber] = useState('');

  if (!isOpen) {
    console.log('PaymentModal not rendering because isOpen is false');
    return null;
  }

  console.log('PaymentModal rendering with totalAmount:', totalAmount);

  const calculateChange = (amount) => {
    if (paymentMethod === 'split') {
      // For split payments, calculate change based on cash received vs required cash
      const requiredCash = parseFloat(cashAmount) || 0;
      const receivedCash = parseFloat(amount) || 0;
      const changeAmount = Math.round((receivedCash - requiredCash) * 100) / 100;
      setChange(changeAmount >= 0 ? changeAmount : 0);
    } else {
      // For regular cash payments
      const numericTotal = toNumber(totalAmount);
      const changeAmount = Math.round((toNumber(amount) - numericTotal) * 100) / 100;
      setChange(changeAmount >= 0 ? changeAmount : 0);
      setCashAmount(amount);
    }
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

    if (paymentMethod === 'split') {
      const mpesaValue = parseFloat(mpesaAmount) || 0;
      const cashValue = parseFloat(cashAmount) || 0;

      if (mpesaValue < 0) {
        alert('M-Pesa amount cannot be negative');
        return;
      }
      if (cashValue < 0) {
        alert('Cash amount cannot be negative');
        return;
      }
      if (mpesaValue === 0 && cashValue === 0) {
        alert('Please enter amounts for at least one payment method');
        return;
      }
      if (mpesaValue > 0 && !mpesaNumber.trim()) {
        alert('Please enter M-Pesa phone number when M-Pesa amount is greater than 0');
        return;
      }

      const totalPaid = mpesaValue + cashValue;
      if (Math.abs(totalPaid - totalAmount) > 0.01) { // Allow for small floating point differences
        alert(`Total payment (${formatCurrency(totalPaid)}) does not match total due (${formatCurrency(totalAmount)})`);
        return;
      }
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
      // Determine the actual payment method based on amounts
      let actualMethod = paymentMethod;
      let paymentData = {
        amount: totalAmount,
        transactionId: transactionId.trim() || null,
      };

      if (paymentMethod === 'cash') {
        actualMethod = 'cash';
        paymentData = {
          ...paymentData,
          method: 'cash',
          cashReceived: parseFloat(cashAmount),
          change: change
        };
      } else if (paymentMethod === 'mpesa') {
        actualMethod = 'mpesa';
        paymentData = {
          ...paymentData,
          method: 'mpesa',
          mpesaNumber: mpesaNumber.trim()
        };
      } else if (paymentMethod === 'split') {
        const mpesaAmt = parseFloat(mpesaAmount) || 0;
        const cashAmt = parseFloat(cashAmount) || 0;

        if (mpesaAmt > 0 && cashAmt > 0) {
          // True split payment
          actualMethod = 'split';
          paymentData = {
            ...paymentData,
            method: 'split',
            split_data: {
              mpesa: mpesaAmt,
              cash: cashAmt
            },
            mpesaNumber: mpesaNumber.trim(),
            cashReceived: parseFloat(cashReceived) || 0,
            change: change
          };
        } else if (mpesaAmt > 0) {
          // Pure MPESA payment
          actualMethod = 'mpesa';
          paymentData = {
            ...paymentData,
            method: 'mpesa',
            mpesaNumber: mpesaNumber.trim()
          };
        } else if (cashAmt > 0) {
          // Pure cash payment
          actualMethod = 'cash';
          paymentData = {
            ...paymentData,
            method: 'cash',
            cashReceived: parseFloat(cashReceived) || 0,
            change: change
          };
        } else {
          alert('Please enter valid payment amounts');
          setIsProcessing(false);
          return;
        }
      }

      console.log('PaymentModal: Actual payment method determined:', actualMethod);
      console.log('PaymentModal: Payment data being sent to backend:', paymentData);
      console.log('PaymentModal: Total amount:', totalAmount);

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
             <button
               type="button"
               className={`payment-modal-option-btn ${paymentMethod === 'split' ? 'active' : ''}`}
               onClick={() => setPaymentMethod('split')}
             >
               <i className="fas fa-exchange-alt"></i>
               <div>Split</div>
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

           {paymentMethod === 'split' && (
             <div className="payment-modal-split-section">
               <div className="payment-modal-split-summary">
                 <div className="split-total-due">
                   <strong>Total Due: {formatCurrency(totalAmount)}</strong>
                 </div>
               </div>

               <div className="payment-modal-form-group">
                 <label>M-Pesa Amount:</label>
                 <input
                   type="number"
                   value={mpesaAmount}
                   onChange={(e) => {
                     const mpesaValue = parseFloat(e.target.value) || 0;
                     setMpesaAmount(e.target.value);
                     // Auto-calculate remaining cash needed with proper rounding
                     const remaining = Math.max(0, Math.round((totalAmount - mpesaValue) * 100) / 100);
                     setCashAmount(remaining.toString());
                   }}
                   placeholder="Enter M-Pesa amount"
                   min="0"
                   max={totalAmount}
                   step="0.01"
                 />
               </div>

               <div className="payment-modal-form-group">
                 <label>Cash Amount Required:</label>
                 <input
                   type="number"
                   value={cashAmount}
                   readOnly
                   placeholder="Cash amount needed"
                 />
                 <small className="form-help">Auto-calculated based on M-Pesa amount</small>
               </div>

               <div className="payment-modal-form-group">
                 <label>M-Pesa Phone Number:</label>
                 <input
                   type="tel"
                   value={mpesaNumber}
                   onChange={(e) => setMpesaNumber(e.target.value)}
                   placeholder="Enter phone number"
                   required={parseFloat(mpesaAmount) > 0}
                 />
               </div>

               <div className="payment-modal-form-group">
                 <label>Cash Received:</label>
                 <input
                   type="number"
                   value={cashReceived}
                   onChange={(e) => {
                     setCashReceived(e.target.value);
                     calculateChange(e.target.value);
                   }}
                   placeholder="Enter cash received"
                   min={cashAmount}
                   step="0.01"
                 />
                 {change > 0 && (
                   <div className="payment-modal-cash-change">
                     Change: {formatCurrency(change)}
                   </div>
                 )}
                 {parseFloat(cashReceived) > 0 && parseFloat(cashReceived) < parseFloat(cashAmount) && (
                   <small className="form-warning">
                     Cash received is less than required amount
                   </small>
                 )}
               </div>

               <div className="payment-modal-split-breakdown">
                 <h5>Payment Breakdown</h5>
                 <div className="breakdown-item">
                   <span>M-Pesa:</span>
                   <span>{formatCurrency(parseFloat(mpesaAmount) || 0)}</span>
                 </div>
                 <div className="breakdown-item">
                   <span>Cash:</span>
                   <span>{formatCurrency(parseFloat(cashAmount) || 0)}</span>
                 </div>
                 <div className="breakdown-item total">
                   <span><strong>Total:</strong></span>
                   <span><strong>{formatCurrency((parseFloat(mpesaAmount) || 0) + (parseFloat(cashAmount) || 0))}</strong></span>
                 </div>
               </div>
             </div>
           )}

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