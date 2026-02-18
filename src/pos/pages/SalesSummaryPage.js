// SalesSummaryPage.js - Compact Redesign
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { reportsAPI, returnsAPI, formatCurrency } from '../../services/ApiService/api';
import './SalesSummaryPage.css';


const SalesSummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [salesData, setSalesData] = useState(null);
  const [returnsData, setReturnsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [returnEditMode, setReturnEditMode] = useState(null); // Track which sale is being returned
  const [returnSelections, setReturnSelections] = useState({});
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  // Get shiftId from URL query params
  const searchParams = new URLSearchParams(location.search);
  const shiftIdFromUrl = searchParams.get('shift_id');
  const shiftId = shiftIdFromUrl || null;

  const fetchSalesSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = shiftId ? { shift_id: shiftId } : {};
      
      // Fetch both sales and returns data
      const [sales, returns] = await Promise.all([
        reportsAPI.getSalesReport(params),
        returnsAPI.getReturnsSummary(params)
      ]);
      
      setSalesData(sales);
      setReturnsData(returns);
    } catch (err) {
      console.error('Error fetching sales summary:', err);
      setError('Failed to load sales summary');
    } finally {
      setLoading(false);
    }
  }, [shiftId]);

  const toggleRowExpansion = (saleId) => {
    // If in return mode, cancel it
    if (returnEditMode === saleId) {
      setReturnEditMode(null);
      setReturnSelections({});
      setReturnReason('');
    }
    setExpandedRow(expandedRow === saleId ? null : saleId);
  };

  const handleReturn = (sale) => {
    // Expand the row and enter return mode
    setExpandedRow(sale.id);
    setReturnEditMode(sale.id);
    setReturnSelections({});
    setReturnReason('');
  };

  const handleReturnItemToggle = (saleId, itemId, maxQty) => {
    setReturnSelections(prev => {
      const saleSelections = prev[saleId] || {};
      const newSaleSelections = { ...saleSelections };
      if (newSaleSelections[itemId]) {
        delete newSaleSelections[itemId];
      } else {
        newSaleSelections[itemId] = 1; // Default to 1
      }
      return { ...prev, [saleId]: newSaleSelections };
    });
  };

  const handleReturnQtyChange = (saleId, itemId, qty, maxQty) => {
    setReturnSelections(prev => {
      const saleSelections = prev[saleId] || {};
      return {
        ...prev,
        [saleId]: {
          ...saleSelections,
          [itemId]: Math.max(0, Math.min(qty, maxQty))
        }
      };
    });
  };

  const calculateReturnTotal = (saleId, items) => {
    const saleSelections = returnSelections[saleId] || {};
    return items.reduce((sum, item) => {
      const qty = saleSelections[item.id] || 0;
      return sum + (qty * (item.unit_price || 0));
    }, 0);
  };

  const submitReturn = async (sale) => {
    const saleSelections = returnSelections[sale.id] || {};
    const selectedItemIds = Object.keys(saleSelections);
    
    if (selectedItemIds.length === 0) {
      alert('Please select an item to return');
      return;
    }
    
    if (!returnReason.trim()) {
      alert('Please enter a reason for the return');
      return;
    }
    
    setReturnLoading(true);
    
    try {
      // Build items array for the return, filtering out invalid entries
      const items = [];
      for (const itemIdStr of selectedItemIds) {
        const itemId = parseInt(itemIdStr);
        const quantity = saleSelections[itemId];
        if (quantity <= 0) continue; // Skip items with 0 quantity
        
        items.push({
          sale_item_id: itemId,
          quantity: quantity,
          reason: returnReason
        });
      }
      
      if (items.length === 0) {
        alert('No valid items selected for return');
        setReturnLoading(false);
        return;
      }
      
      console.log('Submitting return:', {
        original_sale_id: sale.id,
        saleReceipt: sale.receipt_number,
        items: items
      });
      
      await returnsAPI.createReturn({
        original_sale_id: sale.id,
        return_type: 'partial_return',
        items: items
      });
      
      // Reset return mode and refresh data
      setReturnEditMode(null);
      setReturnSelections({});
      setReturnReason('');
      fetchSalesSummary();
    } catch (err) {
      console.error('Error processing return:', err);
      alert(err.message || 'Failed to process return');
    } finally {
      setReturnLoading(false);
    }
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
    <div className="pos-ssp-sales-summary-page">
      <div className="pos-ssp-page-header">
        <h2>Sales Summary</h2>
        <div className="pos-ssp-page-header-actions">
          <button className="pos-ssp-btn pos-ssp-btn-secondary" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i> Back to POS
          </button>
          <button className="pos-ssp-btn pos-ssp-btn-primary" onClick={fetchSalesSummary} disabled={loading}>
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
            {loading ? ' Refreshing...' : ' Refresh Data'}
          </button>
        </div>
      </div>

      {/* Payment Method Tabs */}
      <div className="pos-ssp-payment-tabs">
        <button
          className={`pos-ssp-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
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

      <div className="pos-ssp-page-content">
        {loading && <div className="pos-ssp-loading">Loading sales summary...</div>}

        {error && <div className="pos-ssp-error-message">{error}</div>}

        {salesData && (
          <div className="pos-ssp-sales-summary">
            {activeTab === 'overview' && (
              <>
                <div className="pos-ssp-summary-grid">
                  <div className="pos-ssp-summary-item">
                    <label>Total Sales:</label>
                    <span>{formatCurrency(salesData.total_sales || 0)}</span>
                  </div>
                  <div className="pos-ssp-summary-item">
                    <label>Total Transactions:</label>
                    <span>{salesData.total_transactions || 0}</span>
                  </div>
                  <div className="pos-ssp-summary-item">
                    <label>Average Sale:</label>
                    <span>{formatCurrency(salesData.average_sale || 0)}</span>
                  </div>
                  <div className="pos-ssp-summary-item">
                    <label>Today's Sales:</label>
                    <span>{formatCurrency(salesData.today_sales || 0)}</span>
                  </div>
                </div>

                {/* Return Summary */}
                {(salesData.total_returns > 0 || salesData.return_transactions > 0) && (
                  <div className="pos-ssp-return-summary">
                    <h4>Returns Summary</h4>
                    <div className="pos-ssp-summary-grid">
                      <div className="pos-ssp-summary-item">
                        <label>Total Refunds:</label>
                        <span>{formatCurrency(returnsData?.summary?.total_refund_amount || 0)}</span>
                      </div>
                      <div className="pos-ssp-summary-item">
                        <label>Return Transactions:</label>
                        <span>{returnsData?.summary?.total_returns || 0}</span>
                      </div>
                      <div className="pos-ssp-summary-item">
                        <label>Net Sales:</label>
                        <span>{formatCurrency((salesData.total_sales || 0) - (returnsData?.summary?.total_refund_amount || 0))}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'mpesa' && (
              <div className="pos-ssp-payment-detail">
                <h4>M-Pesa Transactions</h4>
                <div className="pos-ssp-summary-grid">
                  <div className="pos-ssp-summary-item">
                    <label>Total M-Pesa:</label>
                    <span>{formatCurrency(salesData.sales_by_payment_method?.mpesa || 0)}</span>
                  </div>
                  <div className="pos-ssp-summary-item">
                    <label>M-Pesa Count:</label>
                    <span>{salesData.recent_sales?.filter(sale => sale.payment_method === 'mpesa' || (sale.payment_method === 'split' && sale.split_data?.mpesa)).length || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cash' && (
              <div className="pos-ssp-payment-detail">
                <h4>Cash Transactions</h4>
                <div className="pos-ssp-summary-grid">
                  <div className="pos-ssp-summary-item">
                    <label>Total Cash:</label>
                    <span>{formatCurrency(salesData.sales_by_payment_method?.cash || 0)}</span>
                  </div>
                  <div className="pos-ssp-summary-item">
                    <label>Cash Count:</label>
                    <span>{salesData.recent_sales?.filter(sale => sale.payment_method === 'cash' || (sale.payment_method === 'split' && sale.split_data?.cash)).length || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'split' && (
              <div className="pos-ssp-payment-detail">
                <h4>Split Payment Transactions</h4>
                <div className="pos-ssp-summary-grid">
                  <div className="pos-ssp-summary-item">
                    <label>Split Cash:</label>
                    <span>{formatCurrency(
                      salesData.recent_sales?.filter(sale => sale.payment_method === 'split')
                        .reduce((total, sale) => total + (sale.split_data?.cash || 0), 0) || 0
                    )}</span>
                  </div>
                  <div className="pos-ssp-summary-item">
                    <label>Split M-Pesa:</label>
                    <span>{formatCurrency(
                      salesData.recent_sales?.filter(sale => sale.payment_method === 'split')
                        .reduce((total, sale) => total + (sale.split_data?.mpesa || 0), 0) || 0
                    )}</span>
                  </div>
                  <div className="pos-ssp-summary-item">
                    <label>Split Count:</label>
                    <span>{salesData.recent_sales?.filter(sale => sale.payment_method === 'split').length || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {salesData.recent_sales && salesData.recent_sales.length > 0 ? (
              <div className="pos-ssp-recent-sales">
                <h4>Recent Sales ({salesData.recent_sales.length})</h4>
                <div className="pos-ssp-table-container">
                  <table className="pos-ssp-official-data-table">
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
                      {/* Transform returns into sale-like objects and merge with sales */}
                      {(() => {
                        // Transform returns to sale-like objects
                        const returnTransactions = returnsData?.recent_returns?.map(ret => ({
                          id: `return-${ret.id}`,
                          created_at: ret.date,
                          receipt_number: ret.receipt_number,
                          total_amount: -ret.refund_amount, // Negative for returns
                          payment_method: ret.payment_method || 'cash',
                          sale_type: 'return',
                          is_return: true,
                          return_type: ret.return_type,
                          original_sale: ret.original_sale,
                          reason: ret.reason,
                          processed_by: ret.processed_by,
                          items: ret.items || []
                        })) || [];
                        
                        // Combine sales and returns
                        const allTransactions = [
                          ...(salesData.recent_sales || []),
                          ...returnTransactions
                        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        
                        return allTransactions
                          .filter(sale => {
                            // Filter by tab - returns are shown in overview
                            if (activeTab === 'overview') return true; // Show both sales and returns in overview
                            if (activeTab === 'mpesa') return sale.payment_method === 'mpesa' || (sale.payment_method === 'split' && sale.split_data?.mpesa);
                            if (activeTab === 'cash') return sale.payment_method === 'cash' || (sale.payment_method === 'split' && sale.split_data?.cash);
                            if (activeTab === 'split') return sale.payment_method === 'split';
                            return false;
                          })
                          .map((sale, index) => (
                          <React.Fragment key={sale.id || index}>
                            <tr className={sale.is_return ? 'pos-ssp-return-row' : ''}>
                              <td className="pos-ssp-date-cell">
                                {new Date(sale.created_at).toLocaleDateString()}
                                <br />
                                <small>{new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                              </td>
                              <td className="pos-ssp-receipt-cell">
                                {sale.is_return ? (
                                  <span title={sale.original_sale ? `Original: ${sale.original_sale}` : ''}>
                                    {sale.receipt_number ? sale.receipt_number.split('-')[0] : 'RET-' + sale.id?.replace('return-', '')}
                                  </span>
                                ) : (
                                  sale.receipt_number ? sale.receipt_number.replace('POS-', '').split('-')[0] : 'N/A'
                                )}
                              </td>
                              <td className="pos-ssp-amount-cell">
                                {sale.is_return ? (
                                  <span style={{ color: '#dc3545' }}>-{formatCurrency(Math.abs(sale.total_amount))}</span>
                                ) : (
                                  formatCurrency(sale.total_amount)
                                )}
                              </td>
                              <td className="pos-ssp-payment-cell">
                                {sale.is_return ? (
                                  <span className="pos-ssp-payment-badge cash">
                                    Refund
                                  </span>
                                ) : (
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
                                )}
                              </td>
                              <td className="pos-ssp-sale-type-cell">
                                <span className={`pos-ssp-sale-type-badge ${sale.sale_type?.toLowerCase() || (sale.is_return ? 'return' : 'unknown')}`}>
                                  {sale.is_return ? 'Return' : (sale.sale_type ? sale.sale_type.charAt(0).toUpperCase() : 'N/A')}
                                </span>
                              </td>
                              <td className="pos-ssp-actions-cell">
                                <div className="pos-ssp-sales-summary-action-buttons">
                                  {sale.is_return ? (
                                    <button
                                      className="pos-ssp-btn-icon pos-ssp-btn-outline-secondary"
                                      onClick={() => toggleRowExpansion(sale.id)}
                                      title={expandedRow === sale.id ? "Hide items" : "Show items"}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        className={`btn btn-icon ${expandedRow === sale.id ? 'expanded' : 'btn-outline-primary'}`}
                                        onClick={() => toggleRowExpansion(sale.id)}
                                        title={expandedRow === sale.id ? "Hide items" : "Show items"}
                                      >
                                        <i className="fas fa-eye"></i>
                                      </button>
                                      <button
                                        className="pos-ssp-btn-icon pos-ssp-btn-outline-secondary"
                                        onClick={() => handleReprintReceipt(sale.id)}
                                        title="Reprint Receipt"
                                      >
                                        <i className="fas fa-receipt"></i>
                                      </button>
                                      <button
                                        className="pos-ssp-btn-icon pos-ssp-btn-outline-danger"
                                        onClick={() => handleReturn(sale)}
                                        title="Process Return"
                                      >
                                        <i className="fas fa-undo"></i>
                                        <span style={{ marginLeft: '4px', fontSize: '10px' }}>Return</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expandedRow === sale.id && (
                              <tr className="pos-ssp-expanded-row">
                                <td colSpan="6" className="pos-ssp-expanded-content">
                                  <div className="pos-ssp-sale-items-detail">
                                    {/* Return Edit Mode */}
                                    {returnEditMode === sale.id ? (
                                      <>
                                        <h5>Process Return</h5>
                                        <p><strong>Receipt:</strong> {sale.receipt_number} | <strong>Total:</strong> {formatCurrency(sale.total_amount)}</p>
                                        
                                        <h6>Select Items to Return</h6>
                                        {sale.items && sale.items.length > 0 ? (
                                          <table className="pos-ssp-items-table" style={{ marginBottom: '10px' }}>
                                            <thead>
                                              <tr>
                                                <th style={{ width: '30px' }}></th>
                                                <th>Product</th>
                                                <th style={{ width: '60px' }}>Qty</th>
                                                <th style={{ width: '80px', textAlign: 'right' }}>Price</th>
                                                <th style={{ width: '80px', textAlign: 'right' }}>Refund</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {sale.items.map((item, itemIndex) => {
                                                const isSelected = (returnSelections[sale.id] || {})[item.id];
                                                const hasItem = isSelected !== undefined && isSelected > 0;
                                                const returnedQty = item.returned_quantity || 0;
                                                const remainingQty = (item.quantity || 0) - returnedQty;
                                                const isFullyReturned = remainingQty <= 0;
                                                
                                                return (
                                                  <tr key={item.id || itemIndex} style={{ 
                                                    backgroundColor: isFullyReturned ? '#f5f5f5' : (hasItem ? '#fff5f5' : 'transparent'),
                                                    opacity: isFullyReturned ? 0.5 : (hasItem ? 1 : 0.6)
                                                  }}>
                                                    <td style={{ textAlign: 'center' }}>
                                                      <input
                                                        type="checkbox"
                                                        checked={hasItem}
                                                        disabled={isFullyReturned}
                                                        onChange={() => !isFullyReturned && handleReturnItemToggle(sale.id, item.id, remainingQty)}
                                                        title={isFullyReturned ? `Already returned (${returnedQty}/${item.quantity})` : ''}
                                                      />
                                                    </td>
                                                    <td>
                                                      {item.product_name || item.name}
                                                      {isFullyReturned && <span style={{ color: '#dc3545', fontSize: '11px', display: 'block' }}>(Returned)</span>}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                      {hasItem ? (
                                                        <input
                                                          type="number"
                                                          min="1"
                                                          max={remainingQty}
                                                          value={isSelected || ''}
                                                          onChange={(e) => handleReturnQtyChange(sale.id, item.id, parseInt(e.target.value) || 0, remainingQty)}
                                                          style={{ width: '50px', textAlign: 'center' }}
                                                        />
                                                      ) : (
                                                        <span style={{ color: isFullyReturned ? '#999' : '#666' }}>
                                                          {item.quantity}
                                                          {returnedQty > 0 && <span style={{ fontSize: '10px', color: '#dc3545' }}> ({returnedQty} ret)</span>}
                                                        </span>
                                                      )}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                                                    <td style={{ textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }}>
                                                      {hasItem ? formatCurrency(item.unit_price * isSelected) : '-'}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                              <tr className="pos-ssp-items-total-row">
                                                <td colSpan="4" className="pos-ssp-items-total-label">Selected Refund:</td>
                                                <td className="pos-ssp-items-total-amount" style={{ color: '#dc3545' }}>
                                                  -{formatCurrency(calculateReturnTotal(sale.id, sale.items))}
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        ) : (
                                          <p>No items available for this sale.</p>
                                        )}
                                        
                                        <div style={{ marginBottom: '10px' }}>
                                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Reason for Return:
                                          </label>
                                          <textarea
                                            value={returnReason}
                                            onChange={(e) => setReturnReason(e.target.value)}
                                            placeholder={(returnSelections[sale.id] && Object.keys(returnSelections[sale.id]).length > 0) ? 'Enter reason for return...' : 'Select items first...'}
                                            disabled={!returnSelections[sale.id] || Object.keys(returnSelections[sale.id]).length === 0}
                                            style={{
                                              width: '100%',
                                              padding: '8px',
                                              borderRadius: '4px',
                                              border: '1px solid #dee2e6',
                                              minHeight: '50px',
                                              fontFamily: 'inherit',
                                              opacity: (!returnSelections[sale.id] || Object.keys(returnSelections[sale.id]).length === 0) ? 0.5 : 1
                                            }}
                                          />
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                          <button
                                            className="pos-ssp-btn pos-ssp-btn-secondary"
                                            onClick={() => {
                                              setReturnEditMode(null);
                                              setReturnSelections({});
                                              setReturnReason('');
                                            }}
                                            disabled={returnLoading}
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            className="pos-ssp-btn"
                                            onClick={() => submitReturn(sale)}
                                            disabled={returnLoading || !returnSelections[sale.id] || Object.keys(returnSelections[sale.id]).length === 0 || !returnReason.trim()}
                                            style={{ 
                                              backgroundColor: '#dc3545',
                                              borderColor: '#dc3545',
                                              color: 'white'
                                            }}
                                          >
                                            {returnLoading ? 'Processing...' : 'Submit Return'}
                                          </button>
                                        </div>
                                      </>
                                    ) : sale.is_return ? (
                                      /* Existing return transaction display */
                                      <>
                                        <h5>Return Details</h5>
                                        <div style={{ marginBottom: '10px' }}>
                                          <p><strong>Original Sale:</strong> {sale.original_sale || 'N/A'}</p>
                                          <p><strong>Return Type:</strong> {sale.return_type || 'N/A'}</p>
                                          <p><strong>Processed By:</strong> {sale.processed_by || 'N/A'}</p>
                                        </div>
                                        
                                        {sale.items && sale.items.length > 0 ? (
                                          <>
                                            <h6>Returned Items ({sale.items.length})</h6>
                                            <table className="pos-ssp-items-table">
                                              <thead>
                                                <tr>
                                                  <th>Product</th>
                                                  <th>Qty</th>
                                                  <th>Reason</th>
                                                  <th>Refund</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {sale.items.map((item, itemIndex) => (
                                                  <tr key={itemIndex}>
                                                    <td>{item.product_name || 'N/A'}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{item.reason || 'N/A'}</td>
                                                    <td style={{ color: '#dc3545', fontWeight: 'bold' }}>-{formatCurrency(item.refund_amount || 0)}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </>
                                        ) : (
                                          <p>No return items available</p>
                                        )}
                                        
                                        <div style={{ 
                                          background: '#fff5f5', 
                                          padding: '10px', 
                                          borderRadius: '4px',
                                          border: '1px solid #f5c6cb',
                                          marginTop: '10px'
                                        }}>
                                          <p style={{ color: '#dc3545', fontWeight: 'bold', margin: 0 }}>
                                            Total Refund: -{formatCurrency(Math.abs(sale.total_amount))}
                                          </p>
                                        </div>
                                      </>
                                    ) : sale.items && sale.items.length > 0 ? (
                                      /* Normal sale items display */
                                      <>
                                        <h5>Items Sold ({sale.items.length})</h5>
                                        <table className="pos-ssp-items-table">
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
                                            <tr className="pos-ssp-items-total-row">
                                              <td colSpan="3" className="pos-ssp-items-total-label">Total:</td>
                                              <td className="pos-ssp-items-total-amount">{formatCurrency(sale.total_amount)}</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                        {sale.split_data && (
                                          <div className="pos-ssp-split-payment-breakdown">
                                            <div className="pos-ssp-split-payment-row">
                                              {Object.entries(sale.split_data).map(([method, amount]) => (
                                                <div key={method} className="pos-ssp-split-payment-item">
                                                  <span className="pos-ssp-split-payment-label">{method.charAt(0).toUpperCase() + method.slice(1)}:</span>
                                                  <span className="pos-ssp-split-payment-amount">{formatCurrency(amount)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <p>No items available</p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ));
                      })()}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="6" className="summary-footer text-right">
                          Period: {shiftId ? `Shift ${shiftId}` : 'Current'} •
                          Total Records: {(() => {
                            const salesCount = salesData.recent_sales?.filter(sale => {
                              if (activeTab === 'overview') return !sale.is_return;
                              if (activeTab === 'mpesa') return sale.payment_method === 'mpesa' || (sale.payment_method === 'split' && sale.split_data?.mpesa);
                              if (activeTab === 'cash') return sale.payment_method === 'cash' || (sale.payment_method === 'split' && sale.split_data?.cash);
                              if (activeTab === 'split') return sale.payment_method === 'split';
                              return !sale.is_return;
                            }).length || 0;
                            
                            const returnsCount = returnsData?.summary?.total_returns || 0;
                            
                            if (activeTab === 'overview') return salesCount + returnsCount;
                            return salesCount;
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="pos-ssp-no-data">
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