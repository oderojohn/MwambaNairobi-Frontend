// PosAdminPage.js - POS Administration Page
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import logo from '../../logo.png';
import { shiftsAPI, salesAPI, paymentsAPI, formatCurrency } from '../../services/ApiService/api';
import './PosAdminPage.css';

const PosAdminPage = () => {
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('current-shift');
  const [shifts, setShifts] = useState([]);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [currentShiftSales, setCurrentShiftSales] = useState([]);
  const [currentShiftItems, setCurrentShiftItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [showShiftDetails, setShowShiftDetails] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const loadCurrentShiftData = useCallback(async () => {
    if (!currentShift) return;

    try {
      // Load sales for current shift
      const shiftSales = await salesAPI.getSales({
        shift_id: currentShift.id
      });
      setCurrentShiftSales(shiftSales || []);

      // Aggregate items sold in current shift
      const itemsMap = new Map();
      shiftSales.forEach(sale => {
        sale.items?.forEach(item => {
          const key = item.product;
          if (itemsMap.has(key)) {
            const existing = itemsMap.get(key);
            existing.quantity += item.quantity;
            existing.total_amount += item.unit_price * item.quantity;
          } else {
            itemsMap.set(key, {
              product_id: item.product,
              product_name: item.product_name || item.name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_amount: item.unit_price * item.quantity
            });
          }
        });
      });
      setCurrentShiftItems(Array.from(itemsMap.values()));
    } catch (error) {
      console.error('Error loading current shift data:', error);
      setCurrentShiftSales([]);
      setCurrentShiftItems([]);
    }
  }, [currentShift]);

  const loadShifts = useCallback(async () => {
    try {
      const shiftsData = await shiftsAPI.getAllShifts({
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      setShifts(shiftsData || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
      setShifts([]);
    }
  }, [dateRange]);

  const loadSales = useCallback(async () => {
    try {
      const salesData = await salesAPI.getSales({
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      setSales(salesData || []);
    } catch (error) {
      console.error('Error loading sales:', error);
      setSales([]);
    }
  }, [dateRange]);

  const loadPayments = useCallback(async () => {
    try {
      const paymentsData = await paymentsAPI.getPayments({
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    }
  }, [dateRange]);

  const loadCurrentShift = useCallback(async () => {
    try {
      const shiftData = await shiftsAPI.getCurrentShift();
      if (shiftData) {
        setCurrentShift(shiftData);
        await loadCurrentShiftData();
      } else {
        setCurrentShift(null);
        setCurrentShiftSales([]);
        setCurrentShiftItems([]);
      }
    } catch (error) {
      console.error('Error loading current shift:', error);
      setCurrentShift(null);
    }
  }, [loadCurrentShiftData]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      switch (activeTab) {
        case 'current-shift':
          await loadCurrentShiftData();
          break;
        case 'shifts':
          await loadShifts();
          break;
        case 'sales':
          await loadSales();
          break;
        case 'payments':
          await loadPayments();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Loading Error',
        text: 'Failed to load data. Please try again.',
        zIndex: 10000
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, loadCurrentShiftData, loadShifts, loadSales, loadPayments]);

  // Load data on component mount and when tab changes
  useEffect(() => {
    loadData();
  }, [activeTab, dateRange, loadData]);

  // Load current shift data on mount
  useEffect(() => {
    loadCurrentShift();
  }, [loadCurrentShift]);


  const handleViewShiftDetails = (shift) => {
    setSelectedShift(shift);
    setShowShiftDetails(true);
  };

  const handleVoidSale = (sale) => {
    setSelectedSale(sale);
    setVoidReason('');
    setShowVoidModal(true);
  };

  const confirmVoidSale = async () => {
    if (!selectedSale || !voidReason.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please provide a reason for voiding this sale.',
        zIndex: 10000
      });
      return;
    }

    try {
      setIsLoading(true);
      await salesAPI.voidSale(selectedSale.id, { reason: voidReason.trim() });

      Swal.fire({
        icon: 'success',
        title: 'Sale Voided',
        text: 'The sale has been successfully voided.',
        zIndex: 10000
      });

      setShowVoidModal(false);
      setSelectedSale(null);
      setVoidReason('');

      // Refresh current shift data
      await loadCurrentShiftData();
    } catch (error) {
      console.error('Error voiding sale:', error);
      Swal.fire({
        icon: 'error',
        title: 'Void Failed',
        text: 'Failed to void the sale. Please try again.',
        zIndex: 10000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getShiftStatus = (shift) => {
    if (shift.end_time) return 'Closed';
    return 'Active';
  };

  const getShiftStatusColor = (shift) => {
    return shift.end_time ? '#28a745' : '#ffc107';
  };

  const calculateShiftTotals = (shift) => {
    return {
      totalSales: shift.total_sales || 0,
      transactionCount: shift.transaction_count || 0,
      openingBalance: shift.opening_balance || 0,
      closingBalance: shift.closing_balance || 0
    };
  };

  const renderCurrentShiftTab = () => (
    <div className="pos-admin-tab-content">
      <div className="pos-admin-section-header">
        <h3>Current Shift Operations</h3>
        <div className="pos-admin-filters">
          <button
            className="btn btn-primary"
            onClick={loadCurrentShift}
            disabled={isLoading}
          >
            <i className="fas fa-refresh"></i> Refresh
          </button>
        </div>
      </div>

      {!currentShift ? (
        <div className="empty-state">
          <i className="fas fa-clock"></i>
          <h3>No Active Shift</h3>
          <p>No shift is currently active in the POS system.</p>
        </div>
      ) : (
        <div className="current-shift-overview">
          {/* Shift Info */}
          <div className="shift-info-card">
            <h4>Shift Information</h4>
            <div className="shift-details-grid">
              <div className="detail-item">
                <label>Shift ID:</label>
                <span>#{currentShift.id}</span>
              </div>
              <div className="detail-item">
                <label>User:</label>
                <span>{currentShift.user_name || 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <label>Start Time:</label>
                <span>{new Date(currentShift.start_time).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>Opening Balance:</label>
                <span>{formatCurrency(currentShift.opening_balance || 0)}</span>
              </div>
              <div className="detail-item">
                <label>Total Sales:</label>
                <span>{formatCurrency(currentShift.total_sales || 0)}</span>
              </div>
              <div className="detail-item">
                <label>Transactions:</label>
                <span>{currentShift.transaction_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Items Sold in Current Shift */}
          <div className="shift-items-section">
            <h4>Items Sold in Current Shift</h4>
            <div className="pos-admin-table-container">
              {currentShiftItems.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-shopping-cart"></i>
                  <h3>No Items Sold</h3>
                  <p>No items have been sold in the current shift yet.</p>
                </div>
              ) : (
                <table className="pos-admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity Sold</th>
                      <th>Unit Price</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentShiftItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>{formatCurrency(item.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="shift-sales-section">
            <h4>Recent Sales (Current Shift)</h4>
            <div className="pos-admin-table-container">
              {currentShiftSales.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-receipt"></i>
                  <h3>No Sales Yet</h3>
                  <p>No sales have been made in the current shift yet.</p>
                </div>
              ) : (
                <table className="pos-admin-table">
                  <thead>
                    <tr>
                      <th>Sale ID</th>
                      <th>Time</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentShiftSales.map(sale => (
                      <tr key={sale.id}>
                        <td>#{sale.id}</td>
                        <td>{new Date(sale.created_at).toLocaleTimeString()}</td>
                        <td>{sale.customer_name || 'Walk-in'}</td>
                        <td>{sale.items?.length || 0}</td>
                        <td>{formatCurrency(sale.total_amount || 0)}</td>
                        <td>{sale.payment_method || 'N/A'}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleVoidSale(sale)}
                            disabled={isLoading}
                          >
                            <i className="fas fa-ban"></i> Void
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderShiftsTab = () => (
    <div className="pos-admin-tab-content">
      <div className="pos-admin-section-header">
        <h3>Shift Management</h3>
        <div className="pos-admin-filters">
          <div className="filter-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pos-admin-table-container">
        {isLoading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading shifts...</p>
          </div>
        ) : shifts.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clock"></i>
            <h3>No Shifts Found</h3>
            <p>No shifts found for the selected date range.</p>
          </div>
        ) : (
          <table className="pos-admin-table">
            <thead>
              <tr>
                <th>Shift ID</th>
                <th>User</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
                <th>Total Sales</th>
                <th>Transactions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(shift => {
                const totals = calculateShiftTotals(shift);
                return (
                  <tr key={shift.id}>
                    <td>#{shift.id}</td>
                    <td>{shift.user_name || 'Unknown'}</td>
                    <td>{new Date(shift.start_time).toLocaleString()}</td>
                    <td>{shift.end_time ? new Date(shift.end_time).toLocaleString() : 'Active'}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getShiftStatusColor(shift) }}
                      >
                        {getShiftStatus(shift)}
                      </span>
                    </td>
                    <td>{formatCurrency(totals.totalSales)}</td>
                    <td>{totals.transactionCount}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewShiftDetails(shift)}
                      >
                        <i className="fas fa-eye"></i> Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderSalesTab = () => (
    <div className="pos-admin-tab-content">
      <div className="pos-admin-section-header">
        <h3>Sales Overview</h3>
        <div className="pos-admin-filters">
          <div className="filter-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pos-admin-table-container">
        {isLoading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading sales...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-shopping-cart"></i>
            <h3>No Sales Found</h3>
            <p>No sales found for the selected date range.</p>
          </div>
        ) : (
          <table className="pos-admin-table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id}>
                  <td>#{sale.id}</td>
                  <td>{new Date(sale.created_at).toLocaleString()}</td>
                  <td>{sale.customer_name || 'Walk-in'}</td>
                  <td>{sale.items?.length || 0}</td>
                  <td>{formatCurrency(sale.total_amount || 0)}</td>
                  <td>{sale.payment_method || 'N/A'}</td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: '#28a745' }}>
                      {sale.status || 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="pos-admin-tab-content">
      <div className="pos-admin-section-header">
        <h3>Payment Records</h3>
        <div className="pos-admin-filters">
          <div className="filter-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pos-admin-table-container">
        {isLoading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-credit-card"></i>
            <h3>No Payments Found</h3>
            <p>No payments found for the selected date range.</p>
          </div>
        ) : (
          <table className="pos-admin-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Sale ID</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>#{payment.id}</td>
                  <td>{new Date(payment.created_at).toLocaleString()}</td>
                  <td>#{payment.sale}</td>
                  <td>{formatCurrency(payment.amount || 0)}</td>
                  <td>{payment.payment_type || 'N/A'}</td>
                  <td>{payment.reference_number || 'N/A'}</td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: '#28a745' }}>
                      {payment.status || 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderVoidModal = () => {
    if (!showVoidModal || !selectedSale) return null;

    return (
      <div className="modal active">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Void Sale #{selectedSale.id}</h3>
            <span className="close" onClick={() => setShowVoidModal(false)}>&times;</span>
          </div>
          <div className="modal-body">
            <div className="void-sale-info">
              <p><strong>Sale ID:</strong> #{selectedSale.id}</p>
              <p><strong>Customer:</strong> {selectedSale.customer_name || 'Walk-in'}</p>
              <p><strong>Total Amount:</strong> {formatCurrency(selectedSale.total_amount || 0)}</p>
              <p><strong>Time:</strong> {new Date(selectedSale.created_at).toLocaleString()}</p>
            </div>
            <div className="form-group">
              <label htmlFor="voidReason">Reason for voiding this sale: *</label>
              <textarea
                id="voidReason"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Please provide a reason for voiding this sale..."
                rows="4"
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-warning" onClick={() => setShowVoidModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={confirmVoidSale}
              disabled={isLoading || !voidReason.trim()}
            >
              {isLoading ? 'Voiding...' : 'Void Sale'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderShiftDetailsModal = () => {
    if (!showShiftDetails || !selectedShift) return null;

    const totals = calculateShiftTotals(selectedShift);

    return (
      <div className="modal active">
        <div className="modal-content modal-large">
          <div className="modal-header">
            <h3>Shift Details #{selectedShift.id}</h3>
            <span className="close" onClick={() => setShowShiftDetails(false)}>&times;</span>
          </div>
          <div className="modal-body">
            <div className="shift-details-grid">
              <div className="detail-item">
                <label>User:</label>
                <span>{selectedShift.user_name || 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <label>Start Time:</label>
                <span>{new Date(selectedShift.start_time).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>End Time:</label>
                <span>{selectedShift.end_time ? new Date(selectedShift.end_time).toLocaleString() : 'Active'}</span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span className={`status-badge ${getShiftStatus(selectedShift).toLowerCase()}`}
                      style={{ backgroundColor: getShiftStatusColor(selectedShift) }}>
                  {getShiftStatus(selectedShift)}
                </span>
              </div>
              <div className="detail-item">
                <label>Opening Balance:</label>
                <span>{formatCurrency(totals.openingBalance)}</span>
              </div>
              <div className="detail-item">
                <label>Closing Balance:</label>
                <span>{selectedShift.end_time ? formatCurrency(totals.closingBalance) : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Total Sales:</label>
                <span>{formatCurrency(totals.totalSales)}</span>
              </div>
              <div className="detail-item">
                <label>Transaction Count:</label>
                <span>{totals.transactionCount}</span>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-warning" onClick={() => setShowShiftDetails(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pos-admin-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/inventory/dashboard')}>
          <i className="fas fa-arrow-left"></i> Back to Inventory
        </button>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={loadData}
            disabled={isLoading}
          >
            <i className="fas fa-refresh"></i> Refresh
          </button>
        </div>
        <h1>
          <img src={logo} alt="Logo" className="pos-admin-logo" />
          POS Administration
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="pos-admin-tabs">
        <button
          className={`tab-button ${activeTab === 'current-shift' ? 'active' : ''}`}
          onClick={() => setActiveTab('current-shift')}
        >
          <i className="fas fa-play-circle"></i> Current Shift
        </button>
        <button
          className={`tab-button ${activeTab === 'shifts' ? 'active' : ''}`}
          onClick={() => setActiveTab('shifts')}
        >
          <i className="fas fa-clock"></i> All Shifts
        </button>
        <button
          className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <i className="fas fa-shopping-cart"></i> Sales
        </button>
        <button
          className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <i className="fas fa-credit-card"></i> Payments
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'current-shift' && renderCurrentShiftTab()}
      {activeTab === 'shifts' && renderShiftsTab()}
      {activeTab === 'sales' && renderSalesTab()}
      {activeTab === 'payments' && renderPaymentsTab()}

      {/* Modals */}
      {renderVoidModal()}
      {renderShiftDetailsModal()}
    </div>
  );
};

export default PosAdminPage;