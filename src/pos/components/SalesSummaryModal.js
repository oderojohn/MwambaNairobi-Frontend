import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI, formatCurrency } from '../../services/ApiService/api';

const SalesSummaryModal = ({ isOpen, onClose, shiftId }) => {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSalesSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = shiftId ? { shift_id: shiftId } : {};
      const data = await reportsAPI.getSalesReport(params);
      setSalesData(data);
    } catch (err) {
      console.error('Error fetching sales summary:', err);
      setError('Failed to load sales summary');
    } finally {
      setLoading(false);
    }
  }, [shiftId]);

  useEffect(() => {
    if (isOpen) {
      fetchSalesSummary();
    }
  }, [isOpen, shiftId, fetchSalesSummary]);

  if (!isOpen) return null;

  return (
    <div className="modal active">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h3>Sales Summary</h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          {loading && <div className="loading">Loading sales summary...</div>}

          {error && <div className="error-message">{error}</div>}

          {salesData && (
            <div className="sales-summary">
              <div className="summary-grid">
                <div className="summary-item">
                  <label>Total Sales:</label>
                  <span>{formatCurrency(salesData.total_sales || 0)}</span>
                </div>
                <div className="summary-item">
                  <label>Total Transactions:</label>
                  <span>{salesData.total_transactions || 0}</span>
                </div>
                <div className="summary-item">
                  <label>Average Sale:</label>
                  <span>{formatCurrency(salesData.average_sale || 0)}</span>
                </div>
                <div className="summary-item">
                  <label>Today's Sales:</label>
                  <span>{formatCurrency(salesData.today_sales || 0)}</span>
                </div>
              </div>

              {salesData.sales_by_payment_method && (
                <div className="payment-methods-summary">
                  <h4>Sales by Payment Method</h4>
                  <div className="summary-grid">
                    {Object.entries(salesData.sales_by_payment_method).map(([method, amount]) => (
                      <div key={method} className="summary-item">
                        <label>{method.charAt(0).toUpperCase() + method.slice(1)}:</label>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {salesData.recent_sales && salesData.recent_sales.length > 0 && (
                <div className="recent-sales">
                  <h4>Recent Sales</h4>
                  <div className="table-container">
                    <table className="official-data-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Receipt Number</th>
                          <th>Amount</th>
                          <th>Payment Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.recent_sales.map((sale, index) => (
                          <tr key={index}>
                            <td className="date-cell">{new Date(sale.created_at).toLocaleString()}</td>
                            <td className="receipt-cell">{sale.receipt_number || 'N/A'}</td>
                            <td className="amount-cell">{formatCurrency(sale.total_amount)}</td>
                            <td className="payment-cell">
                              <span className={`payment-badge ${sale.payment_method?.toLowerCase() || 'unknown'}`}>
                                {sale.payment_method || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2" className="summary-footer">
                            Total Records: {salesData.recent_sales.length}
                          </td>
                          <td colSpan="2" className="summary-footer text-right">
                            Period: {shiftId ? `Shift ${shiftId}` : 'Current'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={fetchSalesSummary} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesSummaryModal;