import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { reportsAPI, salesAPI, formatCurrency } from '../../../services/ApiService/api';
import EditTransactionModal from './modals/EditTransactionModal';
import VoidModal from './modals/VoidModal';
import './SalesSummaryPage.css';

const PosManagerDashboard = ({ shiftId }) => {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedSale, setExpandedSale] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [shiftTab, setShiftTab] = useState('sales');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editTransactionData, setEditTransactionData] = useState({});
  const [voidReason, setVoidReason] = useState('');

  const summaryStats = useMemo(() => {
    if (!salesData) return {
      total_sales: 0,
      total_transactions: 0,
      average_sale: 0,
      today_sales: 0,
      sales_by_payment_method: {},
      total_returns: 0,
      total_return_count: 0,
    };
    return {
      total_sales: salesData.total_sales || 0,
      total_transactions: salesData.total_transactions || 0,
      average_sale: salesData.average_sale || 0,
      today_sales: salesData.today_sales || 0,
      sales_by_payment_method: salesData.sales_by_payment_method || {},
      total_returns: salesData.total_returns || 0,
      total_return_count: salesData.total_return_count || 0,
    };
  }, [salesData]);

  const fetchSalesSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { all_shifts: 'true' };
      const today = new Date().toISOString().split('T')[0];
      if (startDate !== today || endDate !== today) {
        params.date_from = startDate;
        params.date_to = endDate;
      }
      const data = await reportsAPI.getSalesReport(params);
      setSalesData(data);
    } catch (err) {
      console.error('Error fetching sales summary:', err);
      setError('Failed to load sales summary');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const toggleRowExpansion = (shiftId) => {
    setExpandedRow(expandedRow === shiftId ? null : shiftId);
    if (expandedRow === shiftId) {
      setExpandedSale(null);
      setShiftTab('sales');
    }
  };

  const toggleSaleExpansion = (saleId) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  const handleReprintReceipt = async (saleId) => {
    try {
      const chitDetails = await reportsAPI.getSaleChitDetails(saleId);
      const receiptContent = generateReceiptContent(chitDetails);
      printReceipt(receiptContent);
    } catch (error) {
      console.error('Error reprinting receipt:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to reprint receipt: ${errorMessage}`);
    }
  };

  const handleVoidSale = (sale) => {
    setSelectedTransaction(sale);
    setVoidReason('');
    setShowVoidModal(true);
  };

  const handleVoidConfirm = async () => {
    if (!voidReason || !voidReason.trim()) {
      alert('Void reason is required');
      return;
    }
    try {
      await salesAPI.adminVoidSale(selectedTransaction.id, { reason: voidReason });
      alert('Sale voided successfully');
      await fetchSalesSummary();
      setShowVoidModal(false);
      setSelectedTransaction(null);
      setVoidReason('');
    } catch (error) {
      console.error('Error voiding sale:', error);
      alert('Failed to void sale: ' + (error.message || 'Unknown error'));
    }
  };

  const handleVoidClose = () => {
    setShowVoidModal(false);
    setSelectedTransaction(null);
    setVoidReason('');
  };

  // eslint-disable-next-line no-unused-vars
  const handleEditSale = (sale) => {
    setSelectedTransaction(sale);
    setEditTransactionData({
      customer_name: sale.customer || '',
      tax: 0,
      discount: 0,
      notes: '',
      edit_reason: '',
      items: sale.items?.map(item => ({ id: item.id, quantity: item.quantity })) || []
    });
    setShowEditModal(true);
  };

  const handleEditConfirm = async () => {
    try {
      await fetchSalesSummary();
      setShowEditModal(false);
      setSelectedTransaction(null);
      setEditTransactionData({});
    } catch (error) {
      console.error('Error after edit:', error);
    }
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setSelectedTransaction(null);
    setEditTransactionData({});
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
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  };

  const renderReturnRows = (returnItem, returnIndex) => {
    const hasItems = returnItem.items && returnItem.items.length > 0;
    if (hasItems) {
      return returnItem.items.map((item, itemIdx) => (
        <tr key={`${returnItem.id || returnIndex}-${itemIdx}`} className="return-row">
          {itemIdx === 0 && (
            <>
              <td className="date-cell" rowSpan={returnItem.items.length}>
                {returnItem.return_date ? new Date(returnItem.return_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
              </td>
              <td className="receipt-cell" rowSpan={returnItem.items.length}>
                {returnItem.receipt_number || 'N/A'}
              </td>
            </>
          )}
          <td className="product-cell">{item.product_name || 'Unknown'}</td>
          <td className="quantity-cell">{item.quantity}</td>
          {itemIdx === 0 && (
            <>
              <td className="amount-cell negative" rowSpan={returnItem.items.length}>
                {formatCurrency(returnItem.total_refund_amount || 0)}
              </td>
              <td className="type-cell" rowSpan={returnItem.items.length}>
                <span className={`return-type-badge ${returnItem.return_type?.toLowerCase() || 'unknown'}`}>
                  {returnItem.return_type ? returnItem.return_type.charAt(0).toUpperCase() + returnItem.return_type.slice(1) : 'N/A'}
                </span>
              </td>
              <td className="reason-cell" rowSpan={returnItem.items.length}>
                {returnItem.reason || 'No reason provided'}
              </td>
              <td className="user-cell" rowSpan={returnItem.items.length}>
                {returnItem.processed_by_name || 'N/A'}
              </td>
            </>
          )}
        </tr>
      ));
    }
    return (
      <tr key={returnItem.id || returnIndex} className="return-row">
        <td className="date-cell">
          {returnItem.return_date ? new Date(returnItem.return_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
        </td>
        <td className="receipt-cell">
          {returnItem.receipt_number || 'N/A'}
        </td>
        <td className="product-cell">-</td>
        <td className="quantity-cell">-</td>
        <td className="amount-cell negative">{formatCurrency(returnItem.total_refund_amount || 0)}</td>
        <td className="type-cell">
          <span className={`return-type-badge ${returnItem.return_type?.toLowerCase() || 'unknown'}`}>
            {returnItem.return_type ? returnItem.return_type.charAt(0).toUpperCase() + returnItem.return_type.slice(1) : 'N/A'}
          </span>
        </td>
        <td className="reason-cell">{returnItem.reason || 'No reason provided'}</td>
        <td className="user-cell">{returnItem.processed_by_name || 'N/A'}</td>
      </tr>
    );
  };

  useEffect(() => {
    fetchSalesSummary();
  }, [fetchSalesSummary]);

  return (
    <div className="sales-summary-page">
      {/* Date Filter - Inline */}
      <div className="date-filter">
        <label>Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

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
          Split
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
                    <label>Total Sales (All Shifts):</label>
                    <span>{formatCurrency(summaryStats.total_sales)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Total Transactions:</label>
                    <span>{summaryStats.total_transactions}</span>
                  </div>
                  <div className="summary-item">
                    <label>Average Transaction:</label>
                    <span>{formatCurrency(summaryStats.average_sale)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Total Shifts:</label>
                    <span>{salesData?.shifts?.length || 0}</span>
                  </div>
                  <div className="summary-item return-total">
                    <label>Total Returns:</label>
                    <span className="negative">{formatCurrency(summaryStats.total_returns)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Return Count:</label>
                    <span>{summaryStats.total_return_count}</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'mpesa' && (
              <div className="payment-detail">
                <h4>M-Pesa Transactions</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Total M-Pesa:</label>
                    <span>{formatCurrency(summaryStats.sales_by_payment_method.mpesa || 0)}</span>
                  </div>
                  <div className="summary-item">
                    <label>M-Pesa Transactions:</label>
                    <span>{salesData?.shifts?.reduce((total, shift) =>
                      total + shift.sales.filter(sale =>
                        sale.payment_method === 'mpesa' || (sale.payment_method === 'split' && sale.split_data?.mpesa)
                      ).length, 0) || 0}</span>
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
                    <span>{formatCurrency(summaryStats.sales_by_payment_method.cash || 0)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Cash Transactions:</label>
                    <span>{salesData?.shifts?.reduce((total, shift) =>
                      total + shift.sales.filter(sale =>
                        sale.payment_method === 'cash' || (sale.payment_method === 'split' && sale.split_data?.cash)
                      ).length, 0) || 0}</span>
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
                    <span>{formatCurrency(
                      salesData?.shifts?.reduce((total, shift) =>
                        total + shift.sales.filter(sale => sale.payment_method === 'split')
                          .reduce((shiftTotal, sale) => shiftTotal + (sale.split_data?.cash || 0), 0), 0) || 0
                    )}</span>
                  </div>
                  <div className="summary-item">
                    <label>Split M-Pesa:</label>
                    <span>{formatCurrency(
                      salesData?.shifts?.reduce((total, shift) =>
                        total + shift.sales.filter(sale => sale.payment_method === 'split')
                          .reduce((shiftTotal, sale) => shiftTotal + (sale.split_data?.mpesa || 0), 0), 0) || 0
                    )}</span>
                  </div>
                  <div className="summary-item">
                    <label>Split Transactions:</label>
                    <span>{salesData?.shifts?.reduce((total, shift) =>
                      total + shift.sales.filter(sale => sale.payment_method === 'split').length, 0) || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {salesData?.shifts && salesData.shifts.length > 0 ? (
              <div className="recent-sales">
                <h4>Shift Summaries ({salesData.shifts.length})</h4>
                <div className="table-container">
                  <table className="official-data-table">
                    <thead>
                      <tr>
                        <th>Cashier</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Total Sales</th>
                        <th>Transactions</th>
                        <th>Open Shift Cash</th>
                        <th>Closing Cash</th>
                        <th>Variance</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.shifts.map((shift, index) => (
                        <React.Fragment key={shift.shift_id || index}>
                          <tr className={expandedRow === shift.shift_id ? 'expanded' : ''}>
                            <td className="cashier-cell">{shift.cashier}</td>
                            <td className="date-cell">
                              {new Date(shift.start_time).toLocaleDateString()}
                              <br />
                              <small>{new Date(shift.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </td>
                            <td className="date-cell">
                              {shift.end_time ? (
                                <>
                                  {new Date(shift.end_time).toLocaleDateString()}
                                  <br />
                                  <small>{new Date(shift.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                </>
                              ) : 'Ongoing'}
                            </td>
                            <td className="amount-cell">{formatCurrency(shift.total_sales)}</td>
                            <td className="transactions-cell">{shift.total_transactions}</td>
                            <td className="amount-cell">{formatCurrency(shift.opening_cash || 0)}</td>
                            <td className="amount-cell">{formatCurrency(shift.closing_cash || 0)}</td>
                            <td className="amount-cell">
                              {shift.status === 'closed' && shift.variance !== undefined ? formatCurrency(shift.variance) : '-'}
                            </td>
                            <td className="status-cell">
                              <span className={`status-badge ${shift.status?.toLowerCase() || 'unknown'}`}>
                                {shift.status ? shift.status.charAt(0).toUpperCase() + shift.status.slice(1) : 'Unknown'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <div className="sales-summary-action-buttons">
                                <button
                                  className={`btn btn-icon ${expandedRow === shift.shift_id ? 'expanded' : 'btn-outline-primary'}`}
                                  onClick={() => toggleRowExpansion(shift.shift_id)}
                                  title={expandedRow === shift.shift_id ? "Hide sales" : "Show sales"}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedRow === shift.shift_id && (
                            <tr className="expanded-row">
                              <td colSpan="10" className="expanded-content">
                                <div className="shift-detail-tabs">
                                  <div className="shift-tabs">
                                    <button
                                      className={`tab-button ${shiftTab === 'sales' ? 'active' : ''}`}
                                      onClick={() => setShiftTab('sales')}
                                    >
                                      Sales ({shift.sales?.length || 0})
                                    </button>
                                    <button
                                      className={`tab-button ${shiftTab === 'voided' ? 'active' : ''}`}
                                      onClick={() => setShiftTab('voided')}
                                    >
                                      Voided ({shift.voided_sales?.length || 0})
                                    </button>
                                    <button
                                      className={`tab-button ${shiftTab === 'held' ? 'active' : ''}`}
                                      onClick={() => setShiftTab('held')}
                                    >
                                      Held Orders ({shift.held_orders?.length || 0})
                                    </button>
                                    <button
                                      className={`tab-button ${shiftTab === 'returns' ? 'active' : ''}`}
                                      onClick={() => setShiftTab('returns')}
                                    >
                                      Returns ({shift.returns?.length || 0})
                                    </button>
                                  </div>

                                  {shiftTab === 'sales' && shift.sales && shift.sales.length > 0 && (
                                    <div className="shift-sales-detail">
                                      <table className="shift-items-table">
                                        <thead>
                                          <tr>
                                            <th>Time</th>
                                            <th>Receipt #</th>
                                            <th>Customer</th>
                                            <th>Amount</th>
                                            <th>Payment</th>
                                            <th>Type</th>
                                            <th>Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {shift.sales
                                            .filter(sale => {
                                              if (activeTab === 'overview') return true;
                                              if (activeTab === 'mpesa') return sale.payment_method === 'mpesa' || (sale.payment_method === 'split' && sale.split_data?.mpesa);
                                              if (activeTab === 'cash') return sale.payment_method === 'cash' || (sale.payment_method === 'split' && sale.split_data?.cash);
                                              if (activeTab === 'split') return sale.payment_method === 'split';
                                              return true;
                                            })
                                            .map((sale, saleIndex) => (
                                              <React.Fragment key={sale.id || saleIndex}>
                                                <tr>
                                                  <td className="date-cell">
                                                    {new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                  </td>
                                                  <td className="receipt-cell">
                                                    {sale.receipt_number ? sale.receipt_number.replace('POS-', '').split('-')[0] : 'N/A'}
                                                  </td>
                                                  <td className="customer-cell">{sale.customer}</td>
                                                  <td className="amount-cell">{formatCurrency(sale.total_amount)}</td>
                                                  <td className="payment-cell">
                                                    <span className={`payment-badge ${sale.payment_method?.toLowerCase() || 'unknown'}`}>
                                                      {activeTab === 'mpesa' ? 'M-Pesa' :
                                                       activeTab === 'cash' ? 'Cash' :
                                                       activeTab === 'split' ? 'Split' :
                                                       activeTab === 'overview' ? (
                                                         sale.payment_method === 'mpesa' ? 'M-Pesa' :
                                                         sale.payment_method === 'cash' ? 'Cash' :
                                                         sale.payment_method === 'split' ? (
                                                           sale.split_data && Object.keys(sale.split_data).length === 2 && 'mpesa' in sale.split_data && 'cash' in sale.split_data ? 'M-Pesa & Cash' :
                                                           sale.split_data && 'mpesa' in sale.split_data ? 'M-Pesa' :
                                                           sale.split_data && 'cash' in sale.split_data ? 'Cash' :
                                                           'Split'
                                                         ) :
                                                         sale.payment_method ? sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1) : 'N/A'
                                                       ) : 'N/A'}
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
                                                        className={`btn btn-icon ${expandedSale === sale.id ? 'expanded' : 'btn-outline-primary'}`}
                                                        onClick={() => toggleSaleExpansion(sale.id)}
                                                        title={expandedSale === sale.id ? "Hide items" : "Show items"}
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
                                                      <button
                                                        className="btn btn-icon btn-outline-danger"
                                                        onClick={() => handleVoidSale(sale)}
                                                        title="Void Sale"
                                                      >
                                                        <i className="fas fa-ban"></i>
                                                      </button>
                                                    </div>
                                                  </td>
                                                </tr>
                                                {expandedSale === sale.id && (
                                                  <tr className="expanded-row">
                                                    <td colSpan="8" className="expanded-content">
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
                                                          {sale.items?.map((item, itemIndex) => (
                                                            <tr key={item.id || itemIndex}>
                                                              <td>{item.product_name || item.name}</td>
                                                              <td>{item.quantity}</td>
                                                              <td>{formatCurrency(item.unit_price)}</td>
                                                              <td>{formatCurrency(item.line_total || (item.unit_price * item.quantity))}</td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {shiftTab === 'voided' && shift.voided_sales && shift.voided_sales.length > 0 && (
                                    <div className="shift-voided-detail">
                                      <table className="shift-items-table">
                                        <thead>
                                          <tr>
                                            <th>Time</th>
                                            <th>Receipt #</th>
                                            <th>Customer</th>
                                            <th>Amount</th>
                                            <th>Voided By</th>
                                            <th>Reason</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {shift.voided_sales.map((sale, saleIndex) => (
                                            <tr key={sale.id || saleIndex} className="voided-row">
                                              <td className="date-cell">
                                                {new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                              </td>
                                              <td className="receipt-cell">
                                                {sale.receipt_number ? sale.receipt_number.replace('POS-', '').split('-')[0] : 'N/A'}
                                              </td>
                                              <td className="customer-cell">{sale.customer}</td>
                                              <td className="amount-cell">{formatCurrency(sale.total_amount)}</td>
                                              <td className="user-cell">{sale.voided_by?.username || 'N/A'}</td>
                                              <td className="reason-cell">{sale.void_reason || 'No reason provided'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {shiftTab === 'held' && shift.held_orders && shift.held_orders.length > 0 && (
                                    <div className="shift-held-detail">
                                      <table className="shift-items-table">
                                        <thead>
                                          <tr>
                                            <th>Time</th>
                                            <th>Customer</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {shift.held_orders.map((order, orderIndex) => (
                                            <tr key={order.id || orderIndex}>
                                              <td className="date-cell">
                                                {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                              </td>
                                              <td className="customer-cell">{order.customer}</td>
                                              <td className="amount-cell">{formatCurrency(order.total_amount)}</td>
                                              <td className="status-cell">
                                                <span className={`status-badge ${order.status?.toLowerCase() || 'unknown'}`}>
                                                  {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                                                </span>
                                              </td>
                                              <td className="actions-cell">
                                                <div className="sales-summary-action-buttons">
                                                  <button
                                                    className="btn btn-icon btn-outline-info"
                                                    onClick={() => alert(`View held order ${order.id}`)}
                                                    title="View Order"
                                                  >
                                                    <i className="fas fa-eye"></i>
                                                  </button>
                                                  <button
                                                    className="btn btn-icon btn-outline-danger"
                                                    onClick={() => alert(`Void held order ${order.id}`)}
                                                    title="Void Order"
                                                  >
                                                    <i className="fas fa-ban"></i>
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {shiftTab === 'returns' && shift.returns && shift.returns.length > 0 && (
                                    <div className="shift-returns-detail">
                                      <div className="returns-summary">
                                        <span className="returns-total">Total Refunds: <strong>{formatCurrency(shift.total_returns || 0)}</strong></span>
                                        <span className="returns-count">Count: <strong>{shift.return_count || 0}</strong></span>
                                      </div>
                                      <table className="shift-items-table">
                                        <thead>
                                          <tr>
                                            <th>Time</th>
                                            <th>Receipt #</th>
                                            <th>Item Name</th>
                                            <th>Qty</th>
                                            <th>Refund Amount</th>
                                            <th>Type</th>
                                            <th>Reason</th>
                                            <th>Processed By</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {shift.returns.map((returnItem, returnIndex) => renderReturnRows(returnItem, returnIndex))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {shiftTab === 'sales' && (!shift.sales || shift.sales.length === 0) && (
                                    <div className="no-data">No completed sales in this shift.</div>
                                  )}
                                  {shiftTab === 'voided' && (!shift.voided_sales || shift.voided_sales.length === 0) && (
                                    <div className="no-data">No voided sales in this shift.</div>
                                  )}
                                  {shiftTab === 'held' && (!shift.held_orders || shift.held_orders.length === 0) && (
                                    <div className="no-data">No held orders in this shift.</div>
                                  )}
                                  {shiftTab === 'returns' && (!shift.returns || shift.returns.length === 0) && (
                                    <div className="no-data">No returns in this shift.</div>
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
                        <td colSpan="8" className="summary-footer text-right">
                          Period: {startDate} to {endDate} -
                          Total Shifts: {salesData.shifts.length}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="no-data">
                No shift data available for the selected period.
              </div>
            )}
          </div>
        )}
      </div>

      <EditTransactionModal
        show={showEditModal}
        selectedTransaction={selectedTransaction}
        editTransactionData={editTransactionData}
        setEditTransactionData={setEditTransactionData}
        onClose={handleEditClose}
        onConfirm={handleEditConfirm}
        isLoading={loading}
      />

      <VoidModal
        show={showVoidModal}
        selectedTransaction={selectedTransaction}
        voidReason={voidReason}
        setVoidReason={setVoidReason}
        onClose={handleVoidClose}
        onConfirm={handleVoidConfirm}
        isLoading={loading}
      />
    </div>
  );
};

export default PosManagerDashboard;
