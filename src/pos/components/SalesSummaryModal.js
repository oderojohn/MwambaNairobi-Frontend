import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI, formatCurrency } from '../../services/ApiService/api';

const SalesSummaryModal = ({ isOpen, onClose, shiftId }) => {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

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

  const toggleRowExpansion = (saleId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(saleId)) {
      newExpandedRows.delete(saleId);
    } else {
      newExpandedRows.add(saleId);
    }
    setExpandedRows(newExpandedRows);
  };

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
                          <th>Sale Type</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.recent_sales.map((sale, index) => (
                          <React.Fragment key={index}>
                            <tr>
                              <td className="date-cell">{new Date(sale.created_at).toLocaleString()}</td>
                              <td className="receipt-cell">{sale.receipt_number || 'N/A'}</td>
                              <td className="amount-cell">{formatCurrency(sale.total_amount)}</td>
                              <td className="payment-cell">
                                <span className={`payment-badge ${sale.payment_method?.toLowerCase() || 'unknown'}`}>
                                  {sale.payment_method || 'N/A'}
                                </span>
                              </td>
                              <td className="sale-type-cell">
                                <span className={`sale-type-badge ${sale.sale_type?.toLowerCase() || 'unknown'}`}>
                                  {sale.sale_type || 'N/A'}
                                </span>
                              </td>
                              <td className="actions-cell">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => toggleRowExpansion(sale.id)}
                                  title="View Items"
                                >
                                  V
                                </button>
                              </td>
                            </tr>
                            {expandedRows.has(sale.id) && sale.items && sale.items.length > 0 && (
                              <tr className="expanded-row">
                                <td colSpan="6" className="expanded-content">
                                  <div className="sale-items-detail">
                                    <h5>Items Sold:</h5>
                                    <table className="items-table">
                                      <thead>
                                        <tr>
                                          <th>Product</th>
                                          <th>Quantity</th>
                                          <th>Unit Price</th>
                                          <th>Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sale.items.map((item, itemIndex) => (
                                          <tr key={itemIndex}>
                                            <td>{item.product_name || item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.unit_price)}</td>
                                            <td>{formatCurrency(item.unit_price * item.quantity)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="4" className="summary-footer">
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