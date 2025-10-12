import React, { useState } from 'react';
import { customersAPI } from '../../services/ApiService/api';

const CustomerLookupModal = ({ isOpen, onClose, onCustomerSelect, mode }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');
    setCustomer(null);

    try {
      const customerData = await customersAPI.lookupCustomer(phoneNumber.trim());
      setCustomer(customerData);
    } catch (err) {
      setError('Customer not found or inactive');
      console.error('Customer lookup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = () => {
    if (customer) {
      onCustomerSelect(customer);
      onClose();
      setPhoneNumber('');
      setCustomer(null);
      setError('');
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setCustomer(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal active">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>Customer Lookup</h3>
          <span className="close" onClick={handleClose}>&times;</span>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Customer Phone Number:</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter customer phone number"
              onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleLookup}
            disabled={loading || !phoneNumber.trim()}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            {loading ? 'Searching...' : 'Lookup Customer'}
          </button>

          {error && (
            <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {customer && (
            <div className="customer-details" style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: '#f9f9f9'
            }}>
              <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>Customer Found</h4>

              <div style={{ marginBottom: '10px' }}>
                <strong>Name:</strong> {customer.name}
              </div>

              <div style={{ marginBottom: '10px' }}>
                <strong>Phone:</strong> {customer.phone}
              </div>

              {customer.business_name && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>Business:</strong> {customer.business_name}
                </div>
              )}

              {customer.customer_type === 'wholesale' && (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Credit Limit:</strong> Ksh {Number(customer.credit_limit || 0).toFixed(2)}
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <strong>Current Balance:</strong> Ksh {Number(customer.credit_balance || 0).toFixed(2)}
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong>Available Credit:</strong>
                    <span style={{
                      color: (customer.credit_limit - customer.credit_balance) > 0 ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      Ksh {Number((customer.credit_limit || 0) - (customer.credit_balance || 0)).toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <button
                className="btn btn-success"
                onClick={handleSelectCustomer}
                style={{ width: '100%' }}
              >
                Select This Customer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLookupModal;