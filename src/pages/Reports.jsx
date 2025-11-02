import React, { useState, useEffect } from 'react';
import { reportsAPI, formatCurrency } from '../services/ApiService/api';
import './Reports.css';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState([]);
  const [detailedTransactions, setDetailedTransactions] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [chitDetails, setChitDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      const data = await reportsAPI.getSalesSummary({ detailed_transactions: true });
      setDetailedTransactions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load sales data');
      console.error('Error loading sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesForDateRange = async () => {
    if (!dateRange.date_from || !dateRange.date_to) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const data = await reportsAPI.getSalesSummary({
        detailed_transactions: true,
        date_from: dateRange.date_from,
        date_to: dateRange.date_to
      });
      setDetailedTransactions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load sales data for date range');
      console.error('Error loading sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaleClick = async (saleId) => {
    setLoading(true);
    try {
      const details = await reportsAPI.getSaleChitDetails(saleId);
      setSelectedSale(saleId);
      setChitDetails(details);
      setError(null);
    } catch (err) {
      setError('Failed to load sale details');
      console.error('Error loading sale details:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeChitModal = () => {
    setSelectedSale(null);
    setChitDetails(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Sales Reports</h1>
        <div className="date-filter">
          <input
            type="date"
            value={dateRange.date_from}
            onChange={(e) => setDateRange(prev => ({ ...prev, date_from: e.target.value }))}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={dateRange.date_to}
            onChange={(e) => setDateRange(prev => ({ ...prev, date_to: e.target.value }))}
            placeholder="End Date"
          />
          <button onClick={loadSalesForDateRange} className="filter-btn">
            Filter
          </button>
          <button onClick={() => {
            setDateRange({ date_from: '', date_to: '' });
            loadSalesData();
          }} className="reset-btn">
            Reset
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="reports-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {detailedTransactions.map((transaction) => (
                  <tr
                    key={transaction.transaction_id}
                    className={selectedSale === transaction.transaction_id ? 'selected' : ''}
                  >
                    <td>#{transaction.transaction_id}</td>
                    <td>{formatDate(transaction.sale_date)}</td>
                    <td>{transaction.customer}</td>
                    <td>{transaction.items?.length || 0}</td>
                    <td>{formatCurrency(transaction.final_amount)}</td>
                    <td>{transaction.payments?.[0]?.payment_type || 'N/A'}</td>
                    <td>
                      <span className={`status ${transaction.voided ? 'voided' : 'completed'}`}>
                        {transaction.voided ? 'Voided' : 'Completed'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleSaleClick(transaction.transaction_id)}
                        className="view-btn"
                      >
                        View Chit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chit Details Modal */}
      {chitDetails && (
        <div className="modal-overlay" onClick={closeChitModal}>
          <div className="modal-content chit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sale Chit Details</h2>
              <button onClick={closeChitModal} className="close-btn">&times;</button>
            </div>

            <div className="chit-details">
              <div className="chit-header">
                <div className="chit-info">
                  <p><strong>Receipt #:</strong> {chitDetails.receipt_number}</p>
                  <p><strong>Date:</strong> {formatDate(chitDetails.sale_date)}</p>
                  <p><strong>Customer:</strong> {chitDetails.customer?.name || 'Walk-in'}</p>
                  <p><strong>Cashier:</strong> {chitDetails.cashier?.name || 'Unknown'}</p>
                  <p><strong>Type:</strong> {chitDetails.sale_type}</p>
                </div>
              </div>

              <div className="chit-items">
                <h3>Items Sold</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chitDetails.items?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>{item.product_sku}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="chit-payments">
                <h3>Payment Details</h3>
                {chitDetails.payments?.map((payment, index) => (
                  <div key={index} className="payment-item">
                    <span className="payment-method">{payment.payment_type}</span>
                    <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="chit-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(chitDetails.summary?.subtotal || 0)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax:</span>
                  <span>{formatCurrency(chitDetails.summary?.tax_amount || 0)}</span>
                </div>
                <div className="summary-row">
                  <span>Discount:</span>
                  <span>{formatCurrency(chitDetails.summary?.discount_amount || 0)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>{formatCurrency(chitDetails.summary?.final_amount || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;