// SalesSummaryPage.js - Compact Redesign
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { reportsAPI, returnsAPI, salesAPI, formatCurrency, shiftsAPI, userService } from '../../services/ApiService/api';
import { useAuth } from '../../services/context/authContext';
import './SalesSummaryPage.css';
import ReceiptModal from '../components/ReceiptModal';


const SalesSummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [salesData, setSalesData] = useState(null);
  const [returnsData, setReturnsData] = useState(null);
  const [shiftData, setShiftData] = useState([]);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedShiftId, setExpandedShiftId] = useState(null);
  const [expandedShiftSaleId, setExpandedShiftSaleId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [returnEditMode, setReturnEditMode] = useState(null); // Track which sale is being returned
  const [returnSelections, setReturnSelections] = useState({});
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [todayAllSales, setTodayAllSales] = useState(null);
  const [personalSalesData, setPersonalSalesData] = useState(null);
  const [expandedPersonalSaleId, setExpandedPersonalSaleId] = useState(null);
  
  // Reprint modal state
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [reprintData, setReprintData] = useState(null);
  const [voidModal, setVoidModal] = useState(null);
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidModalError, setVoidModalError] = useState('');

  // Get shiftId from URL query params
  const searchParams = new URLSearchParams(location.search);
  const shiftIdFromUrl = searchParams.get('shift_id');
  const scopeFromUrl = searchParams.get('scope') || 'mine';
  const [scope, setScope] = useState(scopeFromUrl);
  const shiftId = shiftIdFromUrl || null;
  const [dateRange, setDateRange] = useState({
    start: searchParams.get('start') || '',
    end: searchParams.get('end') || ''
  });
  const [userFilter, setUserFilter] = useState(searchParams.get('user') || '');
  const [shiftStatus, setShiftStatus] = useState(searchParams.get('shift_status') || 'open');
  const topbarPerms = user?.topbar_permissions || userService.getTopbarPermissions();
  const isSupervisor = user?.role === 'supervisor';
  const canProcessReturns = user?.role !== 'waiter';
  const allowAll = topbarPerms.global_sales || ['admin', 'manager', 'supervisor'].includes(user?.role);
  const leadLabel = isSupervisor ? 'User' : 'Cashier';
  const showScopeBar = isSupervisor;
  const useTeamView = allowAll && scope === 'all';
  const applyShiftFilter = shiftId && !useTeamView;

  const fetchSalesSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (applyShiftFilter) params.shift_id = shiftId;
      if (useTeamView) params.all_users = true;
      if (dateRange.start) params.date_from = dateRange.start;
      if (dateRange.end) params.date_to = dateRange.end;
      if (userFilter) params.user = userFilter;
      if (shiftStatus && shiftStatus !== 'all') params.status = shiftStatus;
      
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
  }, [applyShiftFilter, shiftId, useTeamView, dateRange.start, dateRange.end, userFilter, shiftStatus]);

  const fetchShiftData = useCallback(async () => {
    if (!useTeamView) {
      setShiftData([]);
      return;
    }
    try {
      setShiftLoading(true);
      const params = {};
      if (dateRange.start) params.start_date = dateRange.start;
      if (dateRange.end) params.end_date = dateRange.end;
      if (userFilter) params.user = userFilter;
      if (isSupervisor) params.role = 'waiter';
      if (shiftStatus === 'all') params.all_shifts = true;
      else if (shiftStatus) params.status = shiftStatus;
      params.page_size = 50;
      const res = await shiftsAPI.getAllShifts(params);
      let rows = res?.results || res || [];
      rows = rows.filter((row) => !isSupervisor || (row?.cashier_role || row?.cashier?.role || '').toLowerCase() === 'waiter');
      setShiftData(rows);
    } catch (err) {
      console.error('Error loading shift data:', err);
      setError('Failed to load shifts');
    } finally {
      setShiftLoading(false);
    }
  }, [useTeamView, dateRange.start, dateRange.end, userFilter, shiftStatus, isSupervisor]);

  const fetchTodayAllSales = useCallback(async () => {
    if (!isSupervisor) {
      setTodayAllSales(null);
      return;
    }
    try {
      const summary = await reportsAPI.getSalesSummary({ today_summary: true });
      setTodayAllSales(Number(summary?.today_sales || summary?.total_sales || 0));
    } catch (err) {
      console.error('Error loading all-user daily sales total:', err);
      setTodayAllSales(null);
    }
  }, [isSupervisor]);

  const fetchPersonalSalesSummary = useCallback(async () => {
    if (!isSupervisor) {
      setPersonalSalesData(null);
      return;
    }
    try {
      const params = {};
      if (dateRange.start) params.date_from = dateRange.start;
      if (dateRange.end) params.date_to = dateRange.end;
      const summary = await reportsAPI.getSalesReport(params);
      setPersonalSalesData(summary);
    } catch (err) {
      console.error('Error loading supervisor personal summary:', err);
      setPersonalSalesData(null);
    }
  }, [isSupervisor, dateRange.start, dateRange.end]);

  const getPaymentLabel = (sale) => {
    if (!sale || sale.is_return) return 'Refund';
    if (sale.is_voided || sale.voided) return 'Voided';
    if (sale.payment_method === 'mpesa') return 'M-Pesa';
    if (sale.payment_method === 'cash') return 'Cash';
    if (sale.payment_method === 'split') {
      if (sale.split_data && 'mpesa' in sale.split_data && 'cash' in sale.split_data) return 'M-Pesa & Cash';
      if (sale.split_data && 'mpesa' in sale.split_data) return 'M-Pesa';
      if (sale.split_data && 'cash' in sale.split_data) return 'Cash';
      return 'Split';
    }
    return sale.payment_method ? sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1) : 'N/A';
  };

  const toggleShiftExpansion = (shiftId) => {
    setExpandedShiftId((prev) => (prev === shiftId ? null : shiftId));
    setExpandedShiftSaleId(null);
  };

  const toggleShiftSaleExpansion = (saleId) => {
    setExpandedShiftSaleId((prev) => (prev === saleId ? null : saleId));
  };

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
    if (!canProcessReturns) {
      return;
    }
    if (scope === 'all' && user?.role && !['admin', 'manager', 'supervisor'].includes(user.role)) {
      alert('Returns across users are restricted to admin, manager, or supervisor.');
      return;
    }
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
    if (!canProcessReturns) {
      return;
    }
    if (scope === 'all' && user?.role && !['admin', 'manager', 'supervisor'].includes(user.role)) {
      alert('Returns across users are restricted to admin, manager, or supervisor.');
      return;
    }
    const saleDate = sale.sale_date ? new Date(sale.sale_date) : null;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (saleDate && saleDate < sevenDaysAgo) {
      alert('Returns are limited to sales from the past 7 days.');
      return;
    }
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

  const handleReprintReceipt = async (sale) => {
    try {
      console.log('Preparing receipt for reprint, sale:', sale);
      
      // Set the sale data for reprint
      setReprintData({
        saleData: sale,
        cart: sale.items || [],
        total: sale.total_amount || sale.final_amount || 0,
        paymentMethod: sale.payment_method || 'cash',
        change: sale.change || 0,
        customer: sale.customer || null,
        mode: sale.sale_type || 'retail',
        splitData: sale.split_data || null,
        isReprint: true
      });
      
      setShowReprintModal(true);
    } catch (error) {
      console.error('Error preparing reprint:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to prepare receipt: ${errorMessage}`);
    }
  };

  const closeVoidModal = useCallback(() => {
    if (voidSubmitting) return;
    setVoidModal(null);
    setVoidModalError('');
  }, [voidSubmitting]);

  const handleVoidSale = useCallback((sale) => {
    if (!isSupervisor || !sale || sale.is_return || sale.is_voided || sale.voided) return;
    setVoidModal({
      mode: 'sale',
      sale,
      item: null,
      quantity: '1',
      reason: ''
    });
    setVoidModalError('');
  }, [isSupervisor]);

  const handleVoidItem = useCallback((sale, item) => {
    if (!isSupervisor || !sale || !item || sale.is_return || sale.is_voided || sale.voided) return;
    const maxQty = Number(item.remaining_quantity ?? item.quantity_remaining ?? item.quantity ?? 0);
    if (!item.id) {
      setVoidModalError('');
      setError('This item cannot be voided because its sale item id is missing.');
      return;
    }
    if (!Number.isFinite(maxQty) || maxQty <= 0) {
      setVoidModalError('');
      setError('No remaining quantity available to void for this item.');
      return;
    }
    setVoidModal({
      mode: 'item',
      sale,
      item,
      quantity: '1',
      maxQuantity: maxQty,
      reason: ''
    });
    setVoidModalError('');
  }, [isSupervisor]);

  const submitVoidAction = useCallback(async () => {
    if (!voidModal || voidSubmitting) return;

    const reason = (voidModal.reason || '').trim();
    if (!reason) {
      setVoidModalError('Reason is required.');
      return;
    }

    try {
      setVoidSubmitting(true);
      setVoidModalError('');
      setError(null);

      if (voidModal.mode === 'item') {
        const quantity = Math.max(
          1,
          Math.min(
            Number(voidModal.maxQuantity || 0),
            Number(voidModal.quantity || 0)
          )
        );

        if (!voidModal.item?.id) {
          setVoidModalError('This item cannot be voided because its sale item id is missing.');
          return;
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
          setVoidModalError('Enter a valid quantity to void.');
          return;
        }

        await salesAPI.voidItems(voidModal.sale.id, {
          reason,
          items: [{ sale_item_id: voidModal.item.id, quantity }]
        });
      } else {
        await salesAPI.adminVoidSale(voidModal.sale.id, { reason });
      }

      await Promise.all([fetchSalesSummary(), fetchShiftData(), fetchPersonalSalesSummary()]);
      setVoidModal(null);
      setVoidModalError('');
    } catch (error) {
      console.error('Error processing void action:', error);
      setVoidModalError(error.message || 'Failed to process void action.');
    } finally {
      setVoidSubmitting(false);
    }
  }, [voidModal, voidSubmitting, fetchSalesSummary, fetchShiftData, fetchPersonalSalesSummary]);

  useEffect(() => {
    fetchSalesSummary();
  }, [shiftId, scope, dateRange.start, dateRange.end, userFilter, fetchSalesSummary]);

  useEffect(() => {
    fetchShiftData();
  }, [fetchShiftData]);

  useEffect(() => {
    if (isSupervisor && scope !== 'all') {
      setScope('all');
      const params = new URLSearchParams(location.search);
      params.set('scope', 'all');
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
      return;
    }
    if (!showScopeBar && scope === 'all') {
      setScope('mine');
      const params = new URLSearchParams(location.search);
      params.set('scope', 'mine');
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  }, [isSupervisor, showScopeBar, scope, navigate, location.pathname, location.search]);

  useEffect(() => {
    fetchTodayAllSales();
  }, [fetchTodayAllSales]);

  useEffect(() => {
    fetchPersonalSalesSummary();
  }, [fetchPersonalSalesSummary]);

  const voidedEntries = [
    ...(salesData?.voided_sales || []),
    ...(salesData?.voided_held_orders || []),
  ];
  const voidedSalesCount = voidedEntries.length;
  const voidedSalesAmount = voidedEntries.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );
  const personalVoidedEntries = [
    ...(personalSalesData?.voided_sales || []),
    ...(personalSalesData?.voided_held_orders || []),
  ];
  const personalNetSales = personalSalesData
    ? (personalSalesData.net_sales !== undefined
      ? personalSalesData.net_sales
      : (personalSalesData.total_sales || 0) - (personalSalesData.total_returns || 0))
    : 0;
  const openWaiterShifts = shiftData.filter((shift) => (shift?.status || '').toLowerCase() === 'open');
  const openWaiterSalesTotal = openWaiterShifts.reduce((sum, shift) => sum + Number(shift?.total_sales || 0), 0);
  const openWaiterTransactions = openWaiterShifts.reduce(
    (sum, shift) => sum + Number(shift?.transaction_count ?? shift?.sales_count ?? shift?.sales?.length ?? 0),
    0
  );
  const openWaiterNetSales = openWaiterShifts.reduce(
    (sum, shift) => sum + Number(shift?.net_sales ?? (Number(shift?.total_sales || 0) - Number(shift?.total_returns || 0))),
    0
  );
  const openWaiterVoidedBills = openWaiterShifts.reduce(
    (sum, shift) => sum + (Array.isArray(shift?.sales) ? shift.sales.filter((sale) => sale?.voided).length : 0),
    0
  );
  const supervisorQuickActions = [
    ...(personalSalesData?.recent_sales || []).map((sale) => ({
      ...sale,
      row_state: 'sale',
      sort_date: sale.created_at,
    })),
    ...personalVoidedEntries.map((sale) => ({
      ...sale,
      payment_method: sale.payment_method || 'voided',
      sale_type: 'voided',
      voided: true,
      is_voided: true,
      row_state: 'voided',
      sort_date: sale.voided_at || sale.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.sort_date || 0) - new Date(a.sort_date || 0))
    .slice(0, 6);

  useEffect(() => {
    document.body.classList.add('pos-ssp-scroll-unlock');
    document.documentElement.classList.add('pos-ssp-scroll-unlock');

    return () => {
      document.body.classList.remove('pos-ssp-scroll-unlock');
      document.documentElement.classList.remove('pos-ssp-scroll-unlock');
    };
  }, []);

  return (
    <div className="pos-ssp-sales-summary-page">
      <div className="pos-ssp-topbar-shell">
        <div className="pos-ssp-page-header">
          <div className="pos-ssp-page-header-copy">
            <span className="pos-ssp-page-header-eyebrow">
              {isSupervisor ? 'Supervisor Workspace' : 'Sales Workspace'}
            </span>
            <h2>Sales Summary</h2>
            <p>
              {isSupervisor
                ? 'Monitor your own sales, review every waiter shift, and handle operations like voiding without leaving this page.'
                : 'Review your sales, returns, and payment mix for the selected period.'}
            </p>
          </div>
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

        {isSupervisor && (
          <div className="pos-ssp-filters">
            <div className="pos-ssp-filter-row">
              {showScopeBar && (
                <div className="pos-ssp-scope-block">
                  <label>Scope</label>
                  <div className="pos-ssp-scope-tabs" role="tablist" aria-label="Sales summary scope">
                    <button
                      type="button"
                      className={`pos-ssp-scope-tab ${scope === 'all' ? 'is-active' : ''}`}
                      onClick={() => {
                        if (!allowAll) return;
                        setScope('all');
                        const params = new URLSearchParams(location.search);
                        params.set('scope', 'all');
                        navigate({ pathname: location.pathname, search: params.toString() });
                      }}
                      disabled={!allowAll}
                    >
                      Waiter Shift Summary
                    </button>
                  </div>
                  {!allowAll && <small className="pos-ssp-muted-text">Enable "Team Sales" permission to view all.</small>}
                  <small className="pos-ssp-muted-text">Supervisors see all waiter shifts here, collapsed until opened for detail.</small>
                </div>
              )}
              <div>
                <label>User</label>
                <input
                  type="text"
                  placeholder="username (optional)"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                />
              </div>
              <div>
                <label>Start</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <label>End</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
              <div>
                <label>Shift Status</label>
                <select
                  value={shiftStatus}
                  onChange={(e) => {
                    const val = e.target.value;
                    setShiftStatus(val);
                    const params = new URLSearchParams(location.search);
                    params.set('shift_status', val);
                    navigate({ pathname: location.pathname, search: params.toString() });
                  }}
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <button className="pos-ssp-inline-button pos-ssp-inline-button-primary" onClick={fetchSalesSummary} disabled={loading}>
                Apply
              </button>
            </div>
          </div>
        )}

        <div className="pos-ssp-payment-tabs">
          <button
            className={`pos-ssp-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`pos-ssp-tab-button ${activeTab === 'mpesa' ? 'active' : ''}`}
            onClick={() => setActiveTab('mpesa')}
          >
            M-Pesa
          </button>
          <button
            className={`pos-ssp-tab-button ${activeTab === 'cash' ? 'active' : ''}`}
            onClick={() => setActiveTab('cash')}
          >
            Cash
          </button>
          <button
            className={`pos-ssp-tab-button ${activeTab === 'split' ? 'active' : ''}`}
            onClick={() => setActiveTab('split')}
          >
            Split Payments
          </button>
        </div>
      </div>

      <div className="pos-ssp-page-content">
        {loading && <div className="pos-ssp-loading">Loading sales summary...</div>}

        {error && <div className="pos-ssp-error-message">{error}</div>}

        {salesData && (
          <div className="pos-ssp-sales-summary">
            {activeTab === 'overview' && isSupervisor && (
              <div className="pos-ssp-supervisor-shell pos-ssp-supervisor-shell--compact">
                <section className="pos-ssp-supervisor-strip">
                  <div className="pos-ssp-supervisor-strip__item">
                    <span>Your Net</span>
                    <strong>{formatCurrency(personalNetSales)}</strong>
                  </div>
                  <div className="pos-ssp-supervisor-strip__item">
                    <span>Your Sales</span>
                    <strong>{formatCurrency(personalSalesData?.total_sales || 0)}</strong>
                  </div>
                  <div className="pos-ssp-supervisor-strip__item">
                    <span>Waiter Sales</span>
                    <strong>{formatCurrency(salesData.total_sales || 0)}</strong>
                  </div>
                  <div className="pos-ssp-supervisor-strip__item">
                    <span>All Users Today</span>
                    <strong>{formatCurrency(todayAllSales || 0)}</strong>
                  </div>
                  <div className="pos-ssp-supervisor-strip__item">
                    <span>Voided</span>
                    <strong>{voidedSalesCount + personalVoidedEntries.length}</strong>
                  </div>
                </section>

                <div className="pos-ssp-supervisor-grid pos-ssp-supervisor-grid--tables">
                  <section className="pos-ssp-supervisor-table-panel">
                    <div className="pos-ssp-supervisor-table-panel__header">
                      <h4>Your Recent Sales</h4>
                      <p>Compact operations table for your own sales.</p>
                    </div>
                    <div className="pos-ssp-table-container pos-ssp-table-container--compact">
                      <table className="pos-ssp-shared-summary-table pos-ssp-shared-summary-table--compact">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Receipt</th>
                            <th>Payment</th>
                            <th>Total</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {supervisorQuickActions.length === 0 && (
                            <tr><td colSpan="5" className="pos-ssp-muted-text">No supervisor sales in this range.</td></tr>
                          )}
                          {supervisorQuickActions.map((sale) => (
                            <React.Fragment key={`personal-${sale.id}`}>
                              <tr>
                                <td>{(sale.voided_at || sale.created_at) ? new Date(sale.voided_at || sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                                <td className="pos-ssp-receipt-cell">{sale.receipt_number || `Sale #${sale.id}`}</td>
                                <td><span className={`pos-ssp-payment-badge ${(sale.voided ? 'voided' : sale.payment_method?.toLowerCase()) || 'unknown'}`}>{getPaymentLabel(sale)}</span></td>
                                <td className="pos-ssp-amount-cell">{formatCurrency(sale.total_amount || 0)}</td>
                                <td>
                                  <div className="pos-ssp-table-actions pos-ssp-table-actions--compact">
                                    <button
                                      className="pos-ssp-inline-button pos-ssp-inline-button-secondary pos-ssp-inline-button-sm"
                                      onClick={() => setExpandedPersonalSaleId((prev) => prev === sale.id ? null : sale.id)}
                                    >
                                      {expandedPersonalSaleId === sale.id ? 'Hide' : 'Details'}
                                    </button>
                                    {!sale.voided && (
                                      <>
                                        <button
                                          className="pos-ssp-inline-button pos-ssp-inline-button-secondary pos-ssp-inline-button-sm"
                                          onClick={() => handleReprintReceipt(sale)}
                                        >
                                          Reprint
                                        </button>
                                        <button
                                          className="pos-ssp-inline-button pos-ssp-inline-button-sm pos-ssp-inline-button-danger"
                                          onClick={() => handleVoidSale(sale)}
                                        >
                                          Void
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {expandedPersonalSaleId === sale.id && (
                                <tr className="pos-ssp-expanded-row">
                                  <td colSpan="5" className="pos-ssp-expanded-content">
                                    {sale.voided && (
                                      <div className="pos-ssp-muted-text" style={{ marginBottom: '10px' }}>
                                        Voided{sale.void_reason ? `: ${sale.void_reason}` : ''}.
                                      </div>
                                    )}
                                    <table className="pos-ssp-items-table">
                                      <thead>
                                        <tr>
                                          <th>Product</th>
                                          <th>Qty</th>
                                          <th>Unit</th>
                                          <th>Total</th>
                                          {isSupervisor && !sale.voided && <th></th>}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(sale.items || []).map((item, index) => (
                                          <tr key={`${sale.id}-${item.id || index}`}>
                                            <td>{item.product_name || item.name || `Item ${index + 1}`}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.unit_price || 0)}</td>
                                            <td>{formatCurrency((item.unit_price || 0) * (item.quantity || 0))}</td>
                                            {isSupervisor && !sale.voided && (
                                              <td>
                                                <button
                                                  type="button"
                                                  className="pos-ssp-inline-button pos-ssp-inline-button-sm pos-ssp-inline-button-danger"
                                                  onClick={() => handleVoidItem(sale, item)}
                                                >
                                                  Void Item
                                                </button>
                                              </td>
                                            )}
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
                  </section>

                  <section className="pos-ssp-supervisor-table-panel">
                    <div className="pos-ssp-supervisor-table-panel__header">
                      <h4>Waiter Totals</h4>
                      <p>Open waiter shifts only.</p>
                    </div>
                    <div className="pos-ssp-table-container pos-ssp-table-container--compact">
                      <table className="pos-ssp-shared-summary-table pos-ssp-shared-summary-table--compact">
                        <tbody>
                          <tr>
                            <th>Waiter Sales</th>
                            <td>{formatCurrency(openWaiterSalesTotal)}</td>
                            <th>Transactions</th>
                            <td>{openWaiterTransactions}</td>
                          </tr>
                          <tr>
                            <th>Net Sales</th>
                            <td>{formatCurrency(openWaiterNetSales)}</td>
                            <th>Voided Bills</th>
                            <td>{openWaiterVoidedBills}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'overview' && !isSupervisor && (
              <div className="pos-ssp-summary-grid">
                <div className="pos-ssp-summary-item">
                  <label>Total Sales:</label>
                  <span>{formatCurrency(salesData.total_sales || 0)}</span>
                </div>
                {isSupervisor && todayAllSales !== null && (
                  <div className="pos-ssp-summary-item">
                    <label>Today All Users:</label>
                    <span>{formatCurrency(todayAllSales)}</span>
                  </div>
                )}
                <div className="pos-ssp-summary-item">
                  <label>Transactions:</label>
                  <span>{salesData.total_transactions || 0}</span>
                </div>
                {(salesData.total_returns > 0 || salesData.return_transactions > 0) && (
                  <>
                    <div className="pos-ssp-summary-item">
                      <label>Refunds:</label>
                      <span>{formatCurrency(salesData.total_returns || 0)}</span>
                    </div>
                    <div className="pos-ssp-summary-item">
                      <label>Returns:</label>
                      <span>{salesData.return_transactions || 0}</span>
                    </div>
                  </>
                )}
                <div className="pos-ssp-summary-item">
                  <label>Net Sales:</label>
                  <span>{formatCurrency(
                    salesData.net_sales !== undefined 
                      ? salesData.net_sales 
                      : (salesData.total_sales || 0) - (salesData.total_returns || 0)
                  )}</span>
                </div>
                {voidedSalesCount > 0 && (
                  <>
                    <div className="pos-ssp-summary-item">
                      <label>Voided Bills:</label>
                      <span>{voidedSalesCount}</span>
                    </div>
                    <div className="pos-ssp-summary-item">
                      <label>Voided Amount:</label>
                      <span>{formatCurrency(voidedSalesAmount)}</span>
                    </div>
                  </>
                )}
              </div>
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

            {scope === 'all' && allowAll ? (
              <div className={`pos-ssp-recent-sales ${isSupervisor ? 'pos-ssp-team-board' : ''}`}>
                <div className={isSupervisor ? 'pos-ssp-team-board__header' : ''}>
                  <div>
                    <h4>{isSupervisor ? `Waiter Shift Summary (${shiftData.length})` : `Team Shift Summary (${shiftData.length})`}</h4>
                    {isSupervisor && <p className="pos-ssp-team-board__subtext">Open a shift to inspect products, payment types, and void any sale directly.</p>}
                  </div>
                </div>
                <div className="pos-ssp-table-container">
                  <table className="pos-ssp-shared-summary-table">
                    <thead>
                      <tr>
                        <th>{isSupervisor ? 'User' : leadLabel}</th>
                        <th>Shift</th>
                        <th>Status</th>
                        <th>Transactions</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftLoading && (
                        <tr><td colSpan="6" className="pos-ssp-muted-text">Loading shifts...</td></tr>
                      )}
                      {!shiftLoading && shiftData.length === 0 && (
                        <tr><td colSpan="6" className="pos-ssp-muted-text">No shifts found for this filter.</td></tr>
                      )}
                      {!shiftLoading && shiftData.map((shift) => {
                        const isShiftOpen = expandedShiftId === shift.id;
                        const shiftSales = shift.sales || [];
                        return (
                          <React.Fragment key={shift.id}>
                            <tr>
                              <td>
                                <div className="pos-ssp-user-stack">
                                  <strong>{shift.cashier_name || shift.cashier_username || '—'}</strong>
                                  <span className="pos-ssp-muted-text">{shift.branch_name || 'No branch'}</span>
                                </div>
                              </td>
                              <td>
                                <div className="pos-ssp-user-stack">
                                  <strong>{shift.start_time ? new Date(shift.start_time).toLocaleString() : '—'}</strong>
                                  <span className="pos-ssp-muted-text">{shift.end_time ? `End ${new Date(shift.end_time).toLocaleString()}` : 'Still open'}</span>
                                </div>
                              </td>
                              <td><span className={`pos-ssp-status-pill ${shift.status === 'open' ? 'is-open' : 'is-closed'}`}>{shift.status}</span></td>
                              <td>{shift.transaction_count ?? shift.sales_count ?? shiftSales.length}</td>
                              <td>{formatCurrency(shift.total_sales || shift.net_sales || 0)}</td>
                              <td>
                                <div className="pos-ssp-table-actions">
                                  <button
                                    type="button"
                                    className="pos-ssp-inline-button pos-ssp-inline-button-primary pos-ssp-inline-button-sm"
                                    onClick={() => toggleShiftExpansion(shift.id)}
                                  >
                                    {isShiftOpen ? 'Hide Transactions' : 'View Transactions'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isShiftOpen && (
                              <tr className="pos-ssp-expanded-row">
                                <td colSpan="6" className="pos-ssp-expanded-content">
                                  <div className="pos-ssp-nested-summary">
                                    <h5>Transactions for {shift.cashier_name || shift.cashier_username || 'this shift'}</h5>
                                    <table className="pos-ssp-shared-summary-table pos-ssp-shared-summary-table-nested">
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
                                        {shiftSales.length === 0 && (
                                          <tr><td colSpan="6" className="pos-ssp-muted-text">No transactions recorded in this shift.</td></tr>
                                        )}
                                        {shiftSales.map((sale) => {
                                          const isSaleOpen = expandedShiftSaleId === sale.id;
                                          return (
                                            <React.Fragment key={sale.id}>
                                              <tr>
                                                <td className="pos-ssp-date-cell">
                                                  {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : '—'}
                                                  <br />
                                                  <small>{sale.sale_date ? new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                                                </td>
                                                <td className="pos-ssp-receipt-cell">{sale.receipt_number || 'N/A'}</td>
                                                <td className="pos-ssp-amount-cell">{formatCurrency(sale.final_amount || sale.total_amount || 0)}</td>
                                                <td className="pos-ssp-payment-cell"><span className={`pos-ssp-payment-badge ${(sale.voided ? 'voided' : sale.payment_method?.toLowerCase()) || 'unknown'}`}>{getPaymentLabel(sale)}</span></td>
                                                <td className="pos-ssp-sale-type-cell"><span className={`pos-ssp-sale-type-badge ${(sale.voided ? 'voided' : sale.sale_type?.toLowerCase()) || 'unknown'}`}>{sale.voided ? 'Voided' : (sale.sale_type ? sale.sale_type.charAt(0).toUpperCase() + sale.sale_type.slice(1) : 'N/A')}</span></td>
                                                <td>
                                                  <div className="pos-ssp-table-actions">
                                                    <button
                                                      type="button"
                                                      className="pos-ssp-inline-button pos-ssp-inline-button-secondary pos-ssp-inline-button-sm"
                                                      onClick={() => toggleShiftSaleExpansion(sale.id)}
                                                    >
                                                      {isSaleOpen ? 'Hide Products' : 'View Products'}
                                                    </button>
                                                    {isSupervisor && !sale.voided && (
                                                      <button
                                                        type="button"
                                                        className="pos-ssp-inline-button pos-ssp-inline-button-sm"
                                                        style={{ backgroundColor: '#b91c1c', color: '#fff', borderColor: '#b91c1c' }}
                                                        onClick={() => handleVoidSale(sale)}
                                                      >
                                                        Void Sale
                                                      </button>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                              {isSaleOpen && (
                                                <tr className="pos-ssp-expanded-row">
                                                  <td colSpan="6" className="pos-ssp-expanded-content">
                                                    <div className="pos-ssp-sale-items-detail">
                                                      <h5>Products in receipt {sale.receipt_number || sale.id}</h5>
                                                      <table className="pos-ssp-items-table">
                                                        <thead>
                                                          <tr>
                                                            <th>Product</th>
                                                            <th>Qty</th>
                                                            <th>Unit Price</th>
                                                            <th>Total</th>
                                                            {isSupervisor && !sale.voided && <th></th>}
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {(sale.items || []).map((item, itemIndex) => (
                                                            <tr key={`${sale.id}-${item.id || itemIndex}`}>
                                                              <td>{item.product_name || item.name || 'Unknown product'}</td>
                                                              <td>{item.quantity}</td>
                                                              <td>{formatCurrency(item.unit_price || 0)}</td>
                                                              <td>{formatCurrency((Number(item.unit_price || 0) * Number(item.quantity || 0)))}</td>
                                                              {isSupervisor && !sale.voided && (
                                                                <td>
                                                                  <button
                                                                    type="button"
                                                                    className="pos-ssp-inline-button pos-ssp-inline-button-sm pos-ssp-inline-button-danger"
                                                                    onClick={() => handleVoidItem(sale, item)}
                                                                  >
                                                                    Void Item
                                                                  </button>
                                                                </td>
                                                              )}
                                                            </tr>
                                                          ))}
                                                          {(!sale.items || sale.items.length === 0) && (
                                                            <tr><td colSpan={isSupervisor && !sale.voided ? 5 : 4} className="pos-ssp-muted-text">No products found in this transaction.</td></tr>
                                                          )}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : ((salesData.recent_sales?.length || 0) > 0 || voidedEntries.length > 0 || (returnsData?.recent_returns?.length || 0) > 0) ? (
              <div className="pos-ssp-recent-sales">
                <h4>Recent Activity ({(salesData.recent_sales?.length || 0) + voidedEntries.length + (returnsData?.recent_returns?.length || 0)})</h4>
                <div className="pos-ssp-table-container">
                  <table className="pos-ssp-shared-summary-table">
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

                        const voidedTransactions = voidedEntries.map((sale) => ({
                          ...sale,
                          id: `voided-${sale.type || 'sale'}-${sale.id}`,
                          created_at: sale.voided_at || sale.created_at,
                          sale_type: 'voided',
                          is_voided: true,
                        }));
                        
                        // Combine sales and returns
                        const allTransactions = [
                          ...(salesData.recent_sales || []),
                          ...voidedTransactions,
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
                            <tr className={`pos-ssp-transaction-row ${sale.is_return ? 'pos-ssp-return-row' : sale.is_voided ? 'pos-ssp-return-row' : ''}`}>
                              <td className="pos-ssp-date-cell" data-label="Date & Time">
                                {new Date(sale.created_at).toLocaleDateString()}
                                <br />
                                <small>{new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                              </td>
                              <td className="pos-ssp-receipt-cell" data-label="Receipt #">
                                {sale.is_return ? (
                                  <span title={sale.original_sale ? `Original: ${sale.original_sale}` : ''}>
                                    {sale.receipt_number ? sale.receipt_number.split('-')[0] : 'RET-' + sale.id?.replace('return-', '')}
                                  </span>
                                ) : sale.is_voided ? (
                                  sale.receipt_number
                                    ? sale.receipt_number.replace('POS-', '').split('-')[0]
                                    : `HOLD-${String(sale.id).replace('voided-held_order-', '')}`
                                ) : (
                                  sale.receipt_number ? sale.receipt_number.replace('POS-', '').split('-')[0] : 'N/A'
                                )}
                              </td>
                              <td className="pos-ssp-amount-cell" data-label="Amount">
                                {sale.is_return ? (
                                  <span style={{ color: '#dc3545' }}>-{formatCurrency(Math.abs(sale.total_amount))}</span>
                                ) : sale.is_voided ? (
                                  <span style={{ color: '#b45309' }}>{formatCurrency(sale.total_amount)}</span>
                                ) : (
                                  formatCurrency(sale.total_amount)
                                )}
                              </td>
                              <td className="pos-ssp-payment-cell" data-label="Payment">
                                {sale.is_return ? (
                                  <span className="pos-ssp-payment-badge cash">
                                    Refund
                                  </span>
                                ) : sale.is_voided ? (
                                  <span className="pos-ssp-payment-badge unknown">
                                    Voided
                                  </span>
                                ) : (
                                  <span className={`pos-ssp-payment-badge ${sale.payment_method?.toLowerCase() || 'unknown'}`}>
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
                              <td className="pos-ssp-sale-type-cell" data-label="Type">
                                <span className={`pos-ssp-sale-type-badge ${sale.sale_type?.toLowerCase() || (sale.is_return ? 'return' : 'unknown')}`}>
                                  {sale.is_return ? 'Return' : sale.is_voided ? 'Voided' : (sale.sale_type ? sale.sale_type.charAt(0).toUpperCase() : 'N/A')}
                                </span>
                              </td>
                              <td className="pos-ssp-actions-cell" data-label="Actions">
                                <div className="pos-ssp-sales-summary-action-buttons">
                                  {sale.is_return || sale.is_voided ? (
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
                                        onClick={() => handleReprintReceipt(sale)}
                                        title="Reprint Receipt"
                                      >
                                        <i className="fas fa-receipt"></i>
                                      </button>
                                      {isSupervisor && (
                                        <button
                                          className="pos-ssp-btn-icon pos-ssp-btn-outline-danger"
                                          onClick={() => handleVoidSale(sale)}
                                          title="Void Entire Sale"
                                        >
                                          <i className="fas fa-ban"></i>
                                        </button>
                                      )}
                                      {canProcessReturns && (
                                        <button
                                          className="pos-ssp-btn-icon pos-ssp-btn-outline-danger"
                                          onClick={() => handleReturn(sale)}
                                          title="Process Return"
                                        >
                                          <i className="fas fa-undo"></i>
                                          <span style={{ marginLeft: '4px', fontSize: '10px' }}>Return</span>
                                        </button>
                                      )}
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
                                    ) : sale.is_voided ? (
                                      <>
                                        <h5>Voided Bill Details</h5>
                                        <div style={{ marginBottom: '10px' }}>
                                          <p><strong>{sale.receipt_number ? 'Receipt' : 'Held Order'}:</strong> {sale.receipt_number || `#${String(sale.id).replace('voided-held_order-', '')}`}</p>
                                          <p><strong>Voided At:</strong> {sale.voided_at ? new Date(sale.voided_at).toLocaleString() : 'N/A'}</p>
                                          <p><strong>Reason:</strong> {sale.void_reason || 'No reason recorded'}</p>
                                        </div>

                                        {sale.items && sale.items.length > 0 ? (
                                          <>
                                            <h6>Voided Items ({sale.items.length})</h6>
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
                                                    <td>{item.product_name || 'N/A'}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatCurrency(item.unit_price || 0)}</td>
                                                    <td>{formatCurrency(item.total || ((item.unit_price || 0) * (item.quantity || 0)))}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </>
                                        ) : (
                                          <p>No items available</p>
                                        )}

                                        <div style={{
                                          background: '#fff7ed',
                                          padding: '10px',
                                          borderRadius: '4px',
                                          border: '1px solid #fdba74',
                                          marginTop: '10px'
                                        }}>
                                          <p style={{ color: '#b45309', fontWeight: 'bold', margin: 0 }}>
                                            Voided Amount: {formatCurrency(sale.total_amount || 0)}
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
                                              {isSupervisor && <th></th>}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {sale.items.map((item, itemIndex) => (
                                              <tr key={itemIndex}>
                                                <td>{item.product_name || item.name}</td>
                                                <td>{item.quantity}</td>
                                                <td>{formatCurrency(item.unit_price)}</td>
                                                <td>{formatCurrency(item.unit_price * item.quantity)}</td>
                                                {isSupervisor && (
                                                  <td>
                                                    <button
                                                      type="button"
                                                      className="pos-ssp-inline-button pos-ssp-inline-button-sm pos-ssp-inline-button-danger"
                                                      onClick={() => handleVoidItem(sale, item)}
                                                    >
                                                      Void Item
                                                    </button>
                                                  </td>
                                                )}
                                              </tr>
                                            ))}
                                            <tr className="pos-ssp-items-total-row">
                                              <td colSpan={isSupervisor ? 4 : 3} className="pos-ssp-items-total-label">Total:</td>
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
                            const voidedCount = voidedEntries.length;
                            
                            if (activeTab === 'overview') return salesCount + returnsCount + voidedCount;
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

      {voidModal && (
        <div className="pos-ssp-void-modal-backdrop" onClick={closeVoidModal}>
          <div className="pos-ssp-void-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-ssp-void-modal__header">
              <div>
                <span className="pos-ssp-void-modal__eyebrow">
                  {voidModal.mode === 'item' ? 'Partial Void' : 'Full Sale Void'}
                </span>
                <h3>{voidModal.mode === 'item' ? 'Void Sale Item' : 'Void Entire Sale'}</h3>
                <p>
                  Receipt {voidModal.sale?.receipt_number || voidModal.sale?.id}
                  {voidModal.mode === 'item' && voidModal.item
                    ? ` • ${voidModal.item.product_name || voidModal.item.name}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                className="pos-ssp-void-modal__close"
                onClick={closeVoidModal}
                disabled={voidSubmitting}
                aria-label="Close void modal"
              >
                ×
              </button>
            </div>

            <div className="pos-ssp-void-modal__body">
              <div className="pos-ssp-void-modal__summary">
                <div>
                  <span>Amount</span>
                  <strong>{formatCurrency(voidModal.sale?.total_amount || voidModal.sale?.final_amount || 0)}</strong>
                </div>
                <div>
                  <span>Payment</span>
                  <strong>{getPaymentLabel(voidModal.sale)}</strong>
                </div>
                {voidModal.mode === 'item' && (
                  <div>
                    <span>Available Qty</span>
                    <strong>{voidModal.maxQuantity}</strong>
                  </div>
                )}
              </div>

              {voidModal.mode === 'item' && (
                <div className="pos-ssp-void-modal__field">
                  <label>Quantity to Void</label>
                  <input
                    type="number"
                    min="1"
                    max={voidModal.maxQuantity || 1}
                    value={voidModal.quantity}
                    onChange={(e) => setVoidModal((prev) => ({ ...prev, quantity: e.target.value }))}
                    disabled={voidSubmitting}
                  />
                </div>
              )}

              <div className="pos-ssp-void-modal__field">
                <label>Reason</label>
                <textarea
                  value={voidModal.reason}
                  onChange={(e) => setVoidModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder={voidModal.mode === 'item' ? 'Explain why this product is being voided...' : 'Explain why this entire sale is being voided...'}
                  disabled={voidSubmitting}
                />
              </div>

              {voidModalError && <div className="pos-ssp-void-modal__error">{voidModalError}</div>}
            </div>

            <div className="pos-ssp-void-modal__footer">
              <button
                type="button"
                className="pos-ssp-inline-button pos-ssp-inline-button-secondary"
                onClick={closeVoidModal}
                disabled={voidSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pos-ssp-inline-button pos-ssp-inline-button-danger"
                onClick={submitVoidAction}
                disabled={voidSubmitting}
              >
                {voidSubmitting
                  ? 'Processing...'
                  : (voidModal.mode === 'item' ? 'Void Item' : 'Void Sale')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reprint Receipt Modal */}
      {showReprintModal && reprintData && (
        <ReceiptModal
          isOpen={showReprintModal}
          onClose={() => {
            setShowReprintModal(false);
            setReprintData(null);
          }}
          saleData={reprintData.saleData}
          cart={reprintData.cart}
          total={reprintData.total}
          paymentMethod={reprintData.paymentMethod}
          change={reprintData.change}
          customer={reprintData.customer}
          mode={reprintData.mode}
          splitData={reprintData.splitData}
          isReprint={true}
          user={user}
        />
      )}
    </div>
  );
};

export default SalesSummaryPage;
