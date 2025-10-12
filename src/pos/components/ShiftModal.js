import React, { useState } from 'react';
import { reportsAPI } from '../../services/ApiService/api';
import '../data/Modal.css';

const ShiftModal = ({ isOpen, onClose, onStartShift, onEndShift, currentShift, onViewSalesSummary }) => {
  const [startingCash, setStartingCash] = useState('');
  const [showEndShiftConfirm, setShowEndShiftConfirm] = useState(false);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleViewSalesSummary = () => {
    if (currentShift && currentShift.id) {
      onViewSalesSummary(currentShift.id);
    }
  };

  const fetchShiftSummary = async () => {
    if (!currentShift || !currentShift.id) return;
    setLoadingSummary(true);
    try {
      const data = await reportsAPI.getSalesReport({ shift_id: currentShift.id });
      setShiftSummary(data);
    } catch (error) {
      console.error('Error fetching shift summary:', error);
      setShiftSummary(null);
    } finally {
      setLoadingSummary(false);
    }
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
                    <span className="shift-stat-value">Ksh {(currentShift.cash_sales || 0).toFixed(2)}</span>
                  </div>
                  <div className="shift-stat-item">
                    <label className="shift-stat-label">Card Sales</label>
                    <span className="shift-stat-value">Ksh {(currentShift.card_sales || 0).toFixed(2)}</span>
                  </div>
                  <div className="shift-stat-item">
                    <label className="shift-stat-label">Mobile Sales</label>
                    <span className="shift-stat-value">Ksh {(currentShift.mobile_sales || 0).toFixed(2)}</span>
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
                      <span className="shift-reconciliation-value">Ksh {(currentShift.opening_balance + (currentShift.cash_sales || 0)).toFixed(2)}</span>
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
                    onClick={handleViewSalesSummary}
                  >
                    <i className="shift-btn-icon"></i>
                    View Sales Summary
                  </button>
                  
                  <button className="shift-btn shift-btn-secondary" onClick={() => window.print()}>
                    <i className="shift-btn-icon"></i>
                    Print Report
                  </button>
                  
                  {!currentShift.end_time && (
                    <button 
                      className="shift-btn shift-btn-danger" 
                      onClick={() => { 
                        setShowEndShiftConfirm(true); 
                        fetchShiftSummary(); 
                      }}
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