// components/PaymentMethodBreakdown.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../services/ApiService/api';
import './PaymentMethodBreakdown.css';

const PaymentMethodBreakdown = ({ paymentMethods, totalSales }) => {
  if (Object.keys(paymentMethods).length === 0) {
    return null;
  }

  return (
    <div className="manager-section">
      <h4>Payment Method Breakdown</h4>
      <div className="payment-methods-grid">
        {Object.entries(paymentMethods).map(([method, amount]) => (
          <div key={method} className="payment-method-card">
            <h5>{method.toUpperCase()}</h5>
            <p>{formatCurrency(amount)}</p>
            <div className="percentage-bar">
              <div 
                className="percentage-fill"
                style={{ 
                  width: totalSales > 0 ? `${(amount / totalSales) * 100}%` : '0%' 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

PaymentMethodBreakdown.propTypes = {
  paymentMethods: PropTypes.object.isRequired,
  totalSales: PropTypes.number.isRequired
};

export default PaymentMethodBreakdown;