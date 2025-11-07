import React, { useState } from 'react';
import { reportsAPI, formatCurrency } from '../../services/ApiService/api';
import '../data/Modal.css';

const ShiftModal = ({ isOpen, onClose, onStartShift, onEndShift, currentShift }) => {
  const [startingCash, setStartingCash] = useState('');
  const [showEndShiftConfirm, setShowEndShiftConfirm] = useState(false);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [loadingSummary] = useState(false); // setLoadingSummary is not used, so removed

  const handleRunEndOfDayReport = async () => {
    try {
      if (!currentShift || !currentShift.id) {
        alert('No active shift found. Please start a shift first.');
        return;
      }

      // Get sales data for the current shift
      const salesData = await reportsAPI.getSalesReport({ shift_id: currentShift.id });

      console.log('Shift sales data received:', salesData);

      if (salesData && salesData.recent_sales && salesData.recent_sales.length > 0) {
        // Filter out voided sales
        const filteredSales = salesData.recent_sales.filter(sale => !sale.voided);

        console.log('Filtered sales for shift:', filteredSales.length, 'out of', salesData.recent_sales.length);

        if (filteredSales.length > 0) {
          // Generate and print the end of day report for current shift
          const reportContent = generateEndOfDayReport({ ...salesData, recent_sales: filteredSales });
          printEndOfDayReport(reportContent);
        } else {
          alert('No valid sales data found for this shift (all sales may be voided).');
        }
      } else {
        alert('No sales data found for this shift.');
      }
    } catch (error) {
      console.error('Error generating end of day report:', error);
      alert('Failed to generate end of day report. Please try again.');
    }
  };

  const generateEndOfDayReport = (salesData) => {
    const sales = salesData.recent_sales || [];
    const today = new Date().toLocaleDateString();

    let content = `
      <div style="font-family: monospace; font-size: 8px; max-width: 280px; margin: 0 auto; line-height: 1.1;">
        <div style="text-align: center; margin-bottom: 4px;">
          <h2 style="margin: 0; font-size: 10px;">END OF DAY REPORT</h2>
          <p style="margin: 1px 0;">${today}</p>
        </div>

        <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 0; margin: 3px 0;">
          <div><strong>Total:</strong> Ksh ${formatCurrency(salesData.total_sales || 0)}</div>
          <div><strong>Trans:</strong> ${salesData.total_transactions || 0}</div>
          <div><strong>Avg:</strong> Ksh ${formatCurrency(salesData.average_sale || 0)}</div>
        </div>`;

    if (salesData.sales_by_payment_method) {
      content += `<div style="margin: 3px 0;"><strong>Payments:</strong>`;
      Object.entries(salesData.sales_by_payment_method).forEach(([method, amount]) => {
        content += `<div>${method.charAt(0).toUpperCase()}: Ksh ${formatCurrency(amount)}</div>`;
      });
      content += `</div>`;
    }

    content += `<div style="margin: 4px 0;"><strong>Transaction Details:</strong>`;

    sales.forEach((sale) => {
      const receiptNum = sale.receipt_number ? sale.receipt_number.replace('POS-', '').split('-')[0] : 'N/A';
      const time = new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const payment = sale.payment_method?.charAt(0).toUpperCase() || 'N';

      content += `
        <div style="margin: 3px 0; padding: 2px; border: 1px solid #ccc; border-radius: 2px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 2px;">
            <span>Rcpt: ${receiptNum}</span>
            <span>${time}</span>
            <span>${payment}</span>
            <span>Ksh ${formatCurrency(sale.total_amount)}</span>
          </div>`;

      // Add items if available
      if (sale.items && sale.items.length > 0) {
        content += `<div style="margin-top: 2px; padding-top: 2px; border-top: 1px dotted #999;">`;
        sale.items.forEach((item) => {
          content += `
            <div style="display: flex; justify-content: space-between; font-size: 7px; margin-bottom: 1px;">
              <span style="flex: 1;">${item.product_name || item.name}</span>
              <span style="width: 20px; text-align: center;">${item.quantity}</span>
              <span style="width: 40px; text-align: right;">Ksh ${formatCurrency(item.unit_price * item.quantity)}</span>
            </div>`;
        });
        content += `</div>`;
      }

      content += `</div>`;
    });


    content += `
        </div>

        <div style="text-align: center; margin-top: 6px; font-size: 7px;">
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
      </div>`;

    return content;
  };

  const printEndOfDayReport = (content) => {
    // Create PDF content directly using browser's print to PDF functionality
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website to generate reports.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

    printWindow.document.write(`
      <html>
        <head>
          <title>End of Day Report - ${dateStr} ${timeStr}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              background: white;
            }
            @media print {
              body { margin: 0; padding: 10mm; }
              @page {
                size: A4;
                margin: 10mm;
              }
            }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { border: 1px solid #000; padding: 10px; margin: 10px 0; }
            .transactions { margin-top: 20px; }
            .transaction { border: 1px solid #ccc; margin: 5px 0; padding: 8px; }
            .items { margin-left: 10px; font-size: 10px; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      // Auto-trigger print dialog for PDF generation
      printWindow.print();

      // Close window after a delay
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  };

  const handleClose = () => {
    if (currentShift) {
      onClose();
    }
  };

  const handleStartShift = () => {
    if (startingCash && parseFloat(startingCash) >= 0) {
      onStartShift(parseFloat(startingCash) || 0);
      setStartingCash('');
    }
  };

  const handleEndShift = () => {
    setShowEndShiftConfirm(false);
    setShiftSummary(null);
    onEndShift();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Shift Modal */}
      <div className={`shift-modal-overlay ${!currentShift ? 'shift-modal-required' : ''}`}>
        <div className="shift-modal-container">
          <div className="shift-modal-header">
            <div className="shift-modal-title">
              <i className={`shift-modal-icon ${currentShift ? 'shift-icon-cog' : 'shift-icon-start'}`}></i>
              <h3>{currentShift ? 'Shift Management' : 'Start Your Shift'}</h3>
            </div>
            {currentShift && (
              <button className="shift-modal-close" onClick={handleClose}>&times;</button>
            )}
          </div>
          
          <div className="shift-modal-body">
            {!currentShift ? (
              <div className="shift-start-section">
                <div className="shift-alert shift-alert-warning">
                  <i className="shift-alert-icon"></i>
                  <strong>Shift Required</strong>
                </div>
                <p className="shift-description">You must start a shift before you can process any orders or perform POS operations.</p>
                
                <div className="shift-input-group">
                  <label className="shift-input-label">Starting Cash Amount (KSh)</label>
                  <input
                    type="number"
                    className="shift-input-field"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    placeholder="Enter starting cash amount"
                    min="0"
                    step="0.01"
                    onKeyPress={(e) => e.key === 'Enter' && handleStartShift()}
                  />
                </div>
                
                <div className="shift-modal-actions">
                  <button
                    className="shift-btn shift-btn-primary"
                    onClick={handleStartShift}
                    disabled={!startingCash || parseFloat(startingCash) < 0}
                  >
                    <i className="shift-btn-icon"></i>
                    Start Shift
                  </button>
                </div>
              </div>
            ) : (
              <div className="shift-active-section">
                <h4 className="shift-section-title">Shift Information</h4>
                
                <div className="shift-stats-grid">
                  <div className="shift-stat-item">
                    <label className="shift-stat-label">Started</label>
                    <span className="shift-stat-value">{currentShift.startTime}</span>
                  </div>
                  <div className="shift-stat-item">
                    <label className="shift-stat-label">Starting Cash</label>
                    <span className="shift-stat-value">Ksh {currentShift.startingCash.toFixed(2)}</span>
                  </div>
                  <div className="shift-stat-item">
                    <label className="shift-stat-label">Cash Sales</label>
                    <span className="shift-stat-value">Ksh {((currentShift.cash_sales || 0) + (currentShift.sales_by_payment_method?.cash || 0)).toFixed(2)}</span>
                  </div>
                  <div className="shift-stat-item">
                    <label className="shift-stat-label">M-Pesa Sales</label>
                    <span className="shift-stat-value">Ksh {((currentShift.mpesa_sales || 0) + (currentShift.sales_by_payment_method?.mpesa || 0)).toFixed(2)}</span>
                  </div>
                  <div className="shift-stat-item">
                    <label className="shift-stat-label">Card Sales</label>
                    <span className="shift-stat-value">Ksh {((currentShift.card_sales || 0) + (currentShift.sales_by_payment_method?.card || 0)).toFixed(2)}</span>
                  </div>
                  <div className="shift-stat-item">
                    <label className="shift-stat-label">Total Sales</label>
                    <span className="shift-stat-value">Ksh {(currentShift.total_sales || currentShift.totalSales || 0).toFixed(2)}</span>
                  </div>
                  <div className="shift-stat-item">
                    <label className="shift-stat-label">Total Transactions</label>
                    <span className="shift-stat-value">{currentShift.transaction_count || currentShift.transactionCount || 0}</span>
                  </div>
                </div>

                {/* Show reconciliation if shift is closed */}
                {currentShift.end_time && (
                  <div className="shift-reconciliation">
                    <h5 className="shift-reconciliation-title">
                      <i className="shift-reconciliation-icon"></i>
                      Cash Reconciliation
                    </h5>
                    <div className="shift-reconciliation-item">
                      <span className="shift-reconciliation-label">Expected Cash:</span>
                      <span className="shift-reconciliation-value">Ksh {(currentShift.opening_balance + (currentShift.cash_sales || 0) + (currentShift.sales_by_payment_method?.cash || 0)).toFixed(2)}</span>
                    </div>
                    <div className="shift-reconciliation-item">
                      <span className="shift-reconciliation-label">Actual Cash:</span>
                      <span className="shift-reconciliation-value">Ksh {(currentShift.closing_balance || 0).toFixed(2)}</span>
                    </div>
                    <div className="shift-reconciliation-item">
                      <span className="shift-reconciliation-label">Discrepancy:</span>
                      <span className={`shift-reconciliation-value ${
                        (currentShift.discrepancy || 0) < 0 ? 'shift-discrepancy-shortage' : 
                        (currentShift.discrepancy || 0) > 0 ? 'shift-discrepancy-overage' : 'shift-discrepancy-balanced'
                      }`}>
                        {(currentShift.discrepancy || 0) < 0 ? 'Shortage' : 
                         (currentShift.discrepancy || 0) > 0 ? 'Overage' : 'Balanced'}: 
                        Ksh {Math.abs(currentShift.discrepancy || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="shift-modal-actions">
                  <button
                    className="shift-btn shift-btn-info"
                    onClick={handleRunEndOfDayReport}
                  >
                    <i className="shift-btn-icon"></i>
                    Generate End of Day Report
                  </button>

                  {!currentShift.end_time && (
                    <button
                      className="shift-btn shift-btn-danger"
                      onClick={handleEndShift}
                    >
                      <i className="shift-btn-icon"></i>
                      End Shift
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* End Shift Confirmation Modal */}
      {showEndShiftConfirm && (
        <div className="shift-modal-overlay">
          <div className="shift-modal-container shift-confirm-modal">
            <div className="shift-modal-header">
              <div className="shift-modal-title">
                <i className="shift-modal-icon shift-icon-end"></i>
                <h3>Confirm End Shift</h3>
              </div>
              <button 
                className="shift-modal-close" 
                onClick={() => { 
                  setShowEndShiftConfirm(false); 
                  setShiftSummary(null); 
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="shift-modal-body">
              {loadingSummary ? (
                <div className="shift-loading">
                  <i className="shift-loading-spinner"></i>
                  Loading shift summary...
                </div>
              ) : shiftSummary ? (
                <div className="shift-summary-confirm">
                  <h4 className="shift-summary-title">Shift Summary</h4>
                  
                  <div className="shift-summary-details">
                    <div className="shift-summary-row">
                      <span className="shift-summary-label">Starting Cash:</span>
                      <span className="shift-summary-value">Ksh {currentShift.startingCash.toFixed(2)}</span>
                    </div>
                    
                    <div className="shift-summary-row">
                      <span className="shift-summary-label">Total Sales:</span>
                      <span className="shift-summary-value">Ksh {(shiftSummary.total_sales || 0).toFixed(2)}</span>
                    </div>
                    
                    {shiftSummary.sales_by_payment_method && Object.keys(shiftSummary.sales_by_payment_method).length > 0 ? (
                      Object.entries(shiftSummary.sales_by_payment_method).map(([method, amount]) => (
                        <div key={method} className="shift-summary-row">
                          <span className="shift-summary-label">
                            {method.charAt(0).toUpperCase() + method.slice(1)} Sales:
                          </span>
                          <span className="shift-summary-value">Ksh {(amount || 0).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="shift-summary-row">
                          <span className="shift-summary-label">Cash Sales:</span>
                          <span className="shift-summary-value">Ksh 0.00</span>
                        </div>
                        <div className="shift-summary-row">
                          <span className="shift-summary-label">M-Pesa Sales:</span>
                          <span className="shift-summary-value">Ksh 0.00</span>
                        </div>
                        <div className="shift-summary-row">
                          <span className="shift-summary-label">Card Sales:</span>
                          <span className="shift-summary-value">Ksh 0.00</span>
                        </div>
                      </>
                    )}
                    
                    <div className="shift-summary-row">
                      <span className="shift-summary-label">Total Transactions:</span>
                      <span className="shift-summary-value">{shiftSummary.total_transactions || 0}</span>
                    </div>
                  </div>
                  
                  <div className="shift-alert shift-alert-warning">
                    <i className="shift-alert-icon"></i>
                    Are you sure you want to end this shift? You will be prompted to enter the ending cash amount.
                  </div>
                </div>
              ) : (
                <div className="shift-error">
                  <i className="shift-error-icon"></i>
                  Failed to load shift summary. Please try again.
                </div>
              )}
            </div>
            
            <div className="shift-modal-actions">
              <button 
                className="shift-btn shift-btn-outline" 
                onClick={() => { 
                  setShowEndShiftConfirm(false); 
                  setShiftSummary(null); 
                }}
                disabled={loadingSummary}
              >
                Cancel
              </button>
              
              <button 
                className="shift-btn shift-btn-danger" 
                onClick={handleEndShift}
                disabled={loadingSummary}
              >
                <i className="shift-btn-icon"></i>
                Proceed to End Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShiftModal;