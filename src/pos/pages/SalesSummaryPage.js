// SalesSummaryPage.js - Compact Redesign
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, formatCurrency } from '../../services/ApiService/api';
import './SalesSummaryPage.css';


const SalesSummaryPage = ({ shiftId }) => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
    setExpandedRow(expandedRow === saleId ? null : saleId);
  };

  const handleReprintReceipt = async (saleId) => {
    try {
      console.log('Reprinting receipt for sale ID:', saleId);

      // Get the sale chit details which includes all receipt information
      const chitDetails = await reportsAPI.getSaleChitDetails(saleId);
      console.log('Chit details received:', chitDetails);

      // Create a printable receipt format
      const receiptContent = generateReceiptContent(chitDetails);
      console.log('Receipt content generated');

      // Print the receipt
      printReceipt(receiptContent);
    } catch (error) {
      console.error('Error reprinting receipt:', error);
      // Show more detailed error message
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to reprint receipt: ${errorMessage}`);
    }
  };

  const generateReceiptContent = (chitDetails) => {
    const items = chitDetails.items || [];
    const payments = chitDetails.payments || [];

    let content = `
      <div style="font-family: monospace; font-size: 12px; max-width: 300px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h3 style="margin: 0;">RECEIPT</h3>
          <p style="margin: 5px 0;">Receipt #: ${chitDetails.receipt_number || 'N/A'}</p>
          <p style="margin: 5px 0;">Date: ${new Date(chitDetails.sale_date).toLocaleString()}</p>
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Customer:</span>
            <span>${chitDetails.customer?.name || 'Walk-in'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Type:</span>
            <span>${chitDetails.sale_type?.toUpperCase() || 'N/A'}</span>
          </div>
        </div>

        <div style="margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
            <span>Item</span>
            <span>Qty</span>
            <span>Total</span>
          </div>`;

    items.forEach(item => {
      content += `
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="flex: 1;">${item.product_name || item.name}</span>
            <span style="width: 30px; text-align: center;">${item.quantity}</span>
            <span style="width: 60px; text-align: right;">${formatCurrency(item.line_total || (item.unit_price * item.quantity))}</span>
          </div>`;
    });

    content += `
        </div>

        <div style="border-top: 1px solid #000; padding-top: 5px; margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>TOTAL:</span>
            <span>${formatCurrency(chitDetails.summary?.final_amount || chitDetails.final_amount)}</span>
          </div>
        </div>`;

    if (payments.length > 0) {
      content += `
        <div style="margin: 10px 0;">
          <div style="font-weight: bold; margin-bottom: 5px;">Payment Details:</div>`;

      payments.forEach(payment => {
        content += `
          <div style="display: flex; justify-content: space-between;">
            <span>${payment.payment_type?.toUpperCase() || 'N/A'}:</span>
            <span>${formatCurrency(payment.amount)}</span>
          </div>`;
      });

      content += `
        </div>`;
    }

    content += `
        <div style="text-align: center; margin-top: 20px; font-size: 10px;">
          <p>Thank you for your business!</p>
          <p>Reprinted: ${new Date().toLocaleString()}</p>
        </div>
      </div>`;

    return content;
  };

  const printReceipt = (content) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website to print receipts.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Don't close immediately to allow print dialog
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  };

  useEffect(() => {
    fetchSalesSummary();
  }, [shiftId, fetchSalesSummary]);

  return (
    <div className="sales-summary-page">
      <div className="page-header">
        <h2>Sales Summary</h2>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i> Back to POS
          </button>
          <button className="btn btn-primary" onClick={fetchSalesSummary} disabled={loading}>
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
            {loading ? ' Refreshing...' : ' Refresh Data'}
          </button>
        </div>
      </div>

      {/* Payment Method Tabs */}
      <div className="payment-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'mpesa' ? 'active' : ''}`}
          onClick={() => setActiveTab('mpesa')}
        >
          M-Pesa
        </button>
        <button
          className={`tab-button ${activeTab === 'cash' ? 'active' : ''}`}
          onClick={() => setActiveTab('cash')}
        >
          Cash
        </button>
        <button
          className={`tab-button ${activeTab === 'split' ? 'active' : ''}`}
          onClick={() => setActiveTab('split')}
        >
          Split Payments
        </button>
      </div>

      <div className="page-content">
        {loading && <div className="loading">Loading sales summary...</div>}

        {error && <div className="error-message">{error}</div>}

        {salesData && (
          <div className="sales-summary">
            {activeTab === 'overview' && (
              <>
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

                {salesData.sales_by_payment_method && Object.keys(salesData.sales_by_payment_method).length > 0 && (
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
              </>
            )}

            {activeTab === 'mpesa' && (
              <div className="payment-detail">
                <h4>M-Pesa Transactions</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Total M-Pesa:</label>
                    <span>{formatCurrency(salesData.sales_by_payment_method?.mpesa || 0)}</span>
                  </div>
                  <div className="summary-item">
                    <label>M-Pesa Count:</label>
                    <span>{salesData.recent_sales?.filter(sale => sale.payment_method === 'mpesa').length || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cash' && (
              <div className="payment-detail">
                <h4>Cash Transactions</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Total Cash:</label>
                    <span>{formatCurrency(salesData.sales_by_payment_method?.cash || 0)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Cash Count:</label>
                    <span>{salesData.recent_sales?.filter(sale => sale.payment_method === 'cash').length || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'split' && (
              <div className="payment-detail">
                <h4>Split Payment Transactions</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Split Cash:</label>
                    <span>{formatCurrency(salesData.sales_by_payment_method?.cash || 0)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Split M-Pesa:</label>
                    <span>{formatCurrency(salesData.sales_by_payment_method?.mpesa || 0)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Split Count:</label>
                    <span>{salesData.recent_sales?.filter(sale => sale.payment_method === 'split').length || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {salesData.recent_sales && salesData.recent_sales.length > 0 ? (
              <div className="recent-sales">
                <h4>Recent Sales ({salesData.recent_sales.length})</h4>
                <div className="table-container">
                  <table className="official-data-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Receipt #</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Type</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.recent_sales
                        .filter(sale => {
                          if (activeTab === 'overview') return true;
                          if (activeTab === 'mpesa') return sale.payment_method === 'mpesa';
                          if (activeTab === 'cash') return sale.payment_method === 'cash';
                          if (activeTab === 'split') return sale.payment_method === 'split';
                          return true;
                        })
                        .map((sale, index) => (
                        <React.Fragment key={sale.id || index}>
                          <tr>
                            <td className="date-cell">
                              {new Date(sale.created_at).toLocaleDateString()}
                              <br />
                              <small>{new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </td>
                            <td className="receipt-cell">
                              {sale.receipt_number ? sale.receipt_number.replace('POS-', '').split('-')[0] : 'N/A'}
                            </td>
                            <td className="amount-cell">{formatCurrency(sale.total_amount)}</td>
                            <td className="payment-cell">
                              <span className={`payment-badge ${sale.payment_method?.toLowerCase() || 'unknown'}`}>
                                {sale.payment_method ? sale.payment_method.charAt(0).toUpperCase() : 'N/A'}
                              </span>
                            </td>
                            <td className="sale-type-cell">
                              <span className={`sale-type-badge ${sale.sale_type?.toLowerCase() || 'unknown'}`}>
                                {sale.sale_type ? sale.sale_type.charAt(0).toUpperCase() : 'N/A'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <div className="sales-summary-action-buttons">
                                <button
                                  className={`btn btn-icon ${expandedRow === sale.id ? 'expanded' : 'btn-outline-primary'}`}
                                  onClick={() => toggleRowExpansion(sale.id)}
                                  title={expandedRow === sale.id ? "Hide items" : "Show items"}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="btn btn-icon btn-outline-secondary"
                                  onClick={() => handleReprintReceipt(sale.id)}
                                  title="Reprint Receipt"
                                >
                                  <i className="fas fa-receipt"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedRow === sale.id && sale.items && sale.items.length > 0 && (
                            <tr className="expanded-row">
                              <td colSpan="6" className="expanded-content">
                                <div className="sale-items-detail">
                                  <h5>Items Sold ({sale.items.length})</h5>
                                  <table className="items-table">
                                    <thead>
                                      <tr>
                                        <th>Product</th>
                                        <th>Qty</th>
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
                                      <tr className="items-total-row">
                                        <td colSpan="3" className="items-total-label">Total:</td>
                                        <td className="items-total-amount">{formatCurrency(sale.total_amount)}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  {sale.split_data && (
                                    <div className="split-payment-breakdown">
                                      <div className="split-payment-row">
                                        {Object.entries(sale.split_data).map(([method, amount]) => (
                                          <div key={method} className="split-payment-item">
                                            <span className="split-payment-label">{method.charAt(0).toUpperCase() + method.slice(1)}:</span>
                                            <span className="split-payment-amount">{formatCurrency(amount)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="6" className="summary-footer text-right">
                          Period: {shiftId ? `Shift ${shiftId}` : 'Current'} •
                          Total Records: {salesData.recent_sales.filter(sale => {
                            if (activeTab === 'overview') return true;
                            if (activeTab === 'mpesa') return sale.payment_method === 'mpesa';
                            if (activeTab === 'cash') return sale.payment_method === 'cash';
                            if (activeTab === 'split') return sale.payment_method === 'split';
                            return true;
                          }).length}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="no-data">
                No sales data available for the selected period.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesSummaryPage;