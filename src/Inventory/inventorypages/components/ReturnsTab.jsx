import React, { useState, useEffect, useCallback } from 'react';
import { returnsAPI } from '../../../services/ApiService/api';
import { formatCurrency } from '../../../services/ApiService/api';
import './ReturnsTab.css';

const ReturnsTab = ({ isLoading, dateRange, handleDateRangeChange }) => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [expandedReturn, setExpandedReturn] = useState(null);  // For inline expansion
  const [summary, setSummary] = useState({
    totalReturns: 0,
    totalAmount: 0,
    todayReturns: 0,
    todayAmount: 0
  });
  const [filter, setFilter] = useState('all'); // all, today, this_week, this_month

  const loadReturns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start_date: dateRange.start,
        end_date: dateRange.end
      };
      
      const returnsData = await returnsAPI.getReturns(params);
      console.log('Returns data loaded:', returnsData);
      
      // Handle paginated response from backend
      const returnsList = returnsData.results || returnsData || [];
      setReturns(returnsList || []);
      
      // Calculate summary - use total_amount (alias for total_refund_amount) and created_at (alias for return_date)
      const today = new Date().toISOString().split('T')[0];
      const todayReturns = returnsList.filter(r => {
        const dateField = r.created_at || r.return_date;
        return dateField?.startsWith(today);
      });
      
      setSummary({
        totalReturns: returnsData.count || returnsList.length,
        totalAmount: returnsList.reduce((sum, r) => {
          const amount = parseFloat(r.total_amount) || parseFloat(r.total_refund_amount) || 0;
          return sum + amount;
        }, 0),
        todayReturns: todayReturns.length,
        todayAmount: todayReturns.reduce((sum, r) => {
          const amount = parseFloat(r.total_amount) || parseFloat(r.total_refund_amount) || 0;
          return sum + amount;
        }, 0)
      });
    } catch (error) {
      console.error('Error loading returns:', error);
      setError('Failed to load returns. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const handleViewDetails = (returnRecord) => {
    // Toggle inline expansion instead of modal
    setExpandedReturn(expandedReturn === returnRecord.id ? null : returnRecord.id);
  };

  const getFilteredReturns = () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (filter) {
      case 'today':
        return returns.filter(r => {
          const dateField = r.created_at || r.return_date;
          return dateField?.startsWith(today);
        });
      case 'this_week':
        return returns.filter(r => {
          const dateField = r.created_at || r.return_date;
          return dateField >= weekAgo;
        });
      case 'this_month':
        return returns.filter(r => {
          const dateField = r.created_at || r.return_date;
          return dateField >= monthAgo;
        });
      default:
        return returns;
    }
  };

  const filteredReturns = getFilteredReturns();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      // Format as Excel-like date: YYYY-MM-DD HH:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num === null || amount === undefined) {
      return formatCurrency(0);
    }
    return formatCurrency(num);
  };

  const getReturnTypeBadge = (type) => {
    const types = {
      'full_return': { label: 'Full Return', class: 'badge-full' },
      'partial_return': { label: 'Partial Return', class: 'badge-partial' },
      'exchange': { label: 'Exchange', class: 'badge-exchange' },
      'super_return': { label: 'Super Return', class: 'badge-super' },
      'standard': { label: 'Standard', class: 'badge-standard' },
      'refund': { label: 'Refund', class: 'badge-refund' }
    };
    const typeInfo = types[type] || { label: type || 'Return', class: 'badge-default' };
    return <span className={`badge ${typeInfo.class}`}>{typeInfo.label}</span>;
  };

  // eslint-disable-next-line no-unused-vars
  const getItemNames = (items) => {
    if (!items || items.length === 0) return 'N/A';
    return items.map(item => item.product_name || 'Unknown').join(', ');
  };

  return (
    <div className="returns-tab">
      <div className="returns-header">
        <h2><i className="fas fa-history"></i> Returns History</h2>
        <p>View all processed returns with details and totals</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon total">
            <i className="fas fa-undo"></i>
          </div>
          <div className="card-content">
            <span className="card-value">{summary.totalReturns}</span>
            <span className="card-label">Total Returns</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon amount">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="card-content">
            <span className="card-value">{formatAmount(summary.totalAmount)}</span>
            <span className="card-label">Total Refunded</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon today">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="card-content">
            <span className="card-value">{summary.todayReturns}</span>
            <span className="card-label">Today's Returns</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon today-amount">
            <i className="fas fa-coins"></i>
          </div>
          <div className="card-content">
            <span className="card-value">{formatAmount(summary.todayAmount)}</span>
            <span className="card-label">Today's Refunded</span>
          </div>
        </div>
      </div>

      {/* Filters and Date Range */}
      <div className="filters-section">
        <div className="date-range">
          <div className="date-input">
            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
          </div>
          <div className="date-input">
            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button 
            className={`filter-btn ${filter === 'this_week' ? 'active' : ''}`}
            onClick={() => setFilter('this_week')}
          >
            This Week
          </button>
          <button 
            className={`filter-btn ${filter === 'this_month' ? 'active' : ''}`}
            onClick={() => setFilter('this_month')}
          >
            This Month
          </button>
        </div>

        <button className="refresh-btn" onClick={loadReturns} disabled={loading}>
          {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Returns Table - Excel-like structure */}
      <div className="returns-table-container">
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading returns...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <p>No returns found for the selected period</p>
          </div>
        ) : (
          <div className="excel-table-wrapper">
            <table className="returns-table excel-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th className="col-receipt">Receipt #</th>
                  <th className="col-date">Date</th>
                  <th className="col-items">Items</th>
                  <th className="col-amount">Amount</th>
                  <th className="col-reason">Reason</th>
                  <th className="col-type">Type</th>
                  <th className="col-processed">Processed By</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((returnRecord, index) => {
                  const amount = parseFloat(returnRecord.total_amount) || parseFloat(returnRecord.total_refund_amount) || 0;
                  const dateField = returnRecord.created_at || returnRecord.return_date;
                  const receiptNum = returnRecord.receipt_number || returnRecord.sale_receipt || returnRecord.sale?.receipt_number || 'N/A';
                  const processedBy = returnRecord.returned_by_name || returnRecord.processed_by_name || returnRecord.returned_by || 'Admin';
                  
                  return (
                    <React.Fragment key={returnRecord.id}>
                      <tr 
                        key={returnRecord.id} 
                        className={`${index % 2 === 0 ? 'row-even' : 'row-odd'} ${expandedReturn === returnRecord.id ? 'expanded' : ''}`}
                      >
                        <td className="col-id">#{returnRecord.id}</td>
                        <td className="col-receipt">{receiptNum}</td>
                        <td className="col-date">{formatDate(dateField)}</td>
                        <td className="col-items">{returnRecord.items?.length || 0} items</td>
                        <td className="col-amount amount-cell">{formatAmount(amount)}</td>
                        <td className="col-reason reason-cell">
                          <span className="reason-text" title={returnRecord.reason}>
                            {returnRecord.reason?.length > 30 
                              ? `${returnRecord.reason.substring(0, 30)}...` 
                              : returnRecord.reason || 'N/A'}
                          </span>
                        </td>
                        <td className="col-type">{getReturnTypeBadge(returnRecord.return_type)}</td>
                        <td className="col-processed">{processedBy}</td>
                        <td className="col-actions">
                          <button 
                            className={`view-btn ${expandedReturn === returnRecord.id ? 'expanded' : ''}`}
                            onClick={() => handleViewDetails(returnRecord)}
                          >
                            <i className={`fas fa-${expandedReturn === returnRecord.id ? 'chevron-up' : 'chevron-down'}`}></i>
                          </button>
                        </td>
                      </tr>
                      {expandedReturn === returnRecord.id && (
                        <tr className="expanded-row">
                          <td colSpan="9" className="expanded-content">
                            <div className="return-items-detail">
                              <table className="shift-items-table">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {returnRecord.items && returnRecord.items.length > 0 ? (
                                    returnRecord.items.map((item, idx) => {
                                      const unitPrice = parseFloat(item.unit_price) || parseFloat(item.sale_item?.unit_price) || 0;
                                      const qty = parseInt(item.quantity) || 0;
                                      return (
                                        <tr key={idx}>
                                          <td className="item-name">{item.product_name || 'Unknown Product'}</td>
                                          <td className="item-qty">{qty}</td>
                                          <td className="item-price">{formatAmount(unitPrice)}</td>
                                          <td className="item-total">{formatAmount(unitPrice * qty)}</td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan="4" style={{textAlign: 'center', color: '#666'}}>No items found</td>
                                    </tr>
                                  )}
                                </tbody>
                                <tfoot>
                                  <tr>
                                    <td colSpan="3"><strong>Total Refund:</strong></td>
                                    <td className="amount-cell"><strong>{formatAmount(amount)}</strong></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="4" className="total-label"><strong>Total ({filteredReturns.length} returns):</strong></td>
                  <td className="amount-cell total-amount">
                    <strong>{formatAmount(filteredReturns.reduce((sum, r) => {
                      const amount = parseFloat(r.total_amount) || parseFloat(r.total_refund_amount) || 0;
                      return sum + amount;
                    }, 0))}</strong>
                  </td>
                  <td colSpan="4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsTab;