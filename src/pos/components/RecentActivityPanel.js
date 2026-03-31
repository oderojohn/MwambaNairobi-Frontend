import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency, salesAPI, returnsAPI, shiftsAPI, toNumber, userService } from '../../services/ApiService/api';
import './RecentActivityPanel.css';

const RecentActivityPanel = ({
  heldOrders = [],
  voidedHeldOrders = [],
  onLoadHeldOrder,
  currentShift,
  refreshKey = 0
}) => {
  const [recentSales, setRecentSales] = useState([]);
  const [recentReturns, setRecentReturns] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [supervisorOrders, setSupervisorOrders] = useState([]);
  const [supervisorShifts, setSupervisorShifts] = useState([]);
  const palette = ['#f0f9ff', '#fef9c3', '#ecfdf3', '#f5f3ff', '#fff1f2', '#f0fdfa', '#fff7ed'];
  const getWaiterColor = (key) => {
    if (!key) return '#fafbff';
    const sum = key.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return palette[sum % palette.length];
  };
  const getPersonName = (entry) => (
    entry?.cashier_name ||
    entry?.waiter_name ||
    entry?.created_by_name ||
    entry?.cashier_username ||
    'Waiter'
  );
  const getPersonKey = (entry) => `${entry?.cashier || entry?.created_by || getPersonName(entry)}`;
  const getItemsTotal = (items = []) => items.reduce(
    (sum, item) => sum + (toNumber(item.unit_price || item.price) * toNumber(item.quantity || 0)),
    0
  );
  const getOrderTotal = (order) => toNumber(order?.total_amount || order?.total || getItemsTotal(order?.items || []));
  const getProductSummary = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    return items.map((item, index) => ({
      id: item.id || `${item.product || item.product_name || 'item'}-${index}`,
      name: item.product_name || item.name || `Item ${index + 1}`,
      quantity: toNumber(item.quantity || 0),
      price: toNumber(item.unit_price || item.price || 0)
    }));
  };
  const formatReceiptLabel = (sale) => sale?.receipt_number || `Sale #${sale?.id || '—'}`;
  const formatHeldLabel = (order) => order?.receipt_number || `Held #${order?.id || '—'}`;
  const isWaiterEntry = (entry) => {
    const role = (entry?.cashier_role || entry?.role || '').toLowerCase();
    return !role || role === 'waiter';
  };

  const supervisorRoster = (() => {
    const groups = new Map();

    const ensureGroup = (entry) => {
      const key = getPersonKey(entry);
      if (!groups.has(key)) {
        const name = getPersonName(entry);
        groups.set(key, {
          key,
          name,
          tint: getWaiterColor(name),
          heldOrders: [],
          completedSales: [],
          shift: null,
          heldTotal: 0,
          completedTotal: 0,
          heldItems: 0,
          completedItems: 0
        });
      }
      return groups.get(key);
    };

    supervisorOrders.filter(isWaiterEntry).forEach((order) => {
      const group = ensureGroup(order);
      const items = getProductSummary(order.items || []);
      const total = getOrderTotal(order);
      group.heldOrders.push({
        ...order,
        items,
        total
      });
      group.heldTotal += total;
      group.heldItems += items.reduce((sum, item) => sum + item.quantity, 0);
    });

    supervisorShifts.filter(isWaiterEntry).forEach((shift) => {
      const group = ensureGroup(shift);
      const sales = (shift.sales || [])
        .filter((sale) => !sale.voided)
        .map((sale) => {
          const items = getProductSummary(sale.items || []);
          const total = toNumber(sale.total_amount || sale.final_amount || getItemsTotal(items));
          return {
            ...sale,
            items,
            total
          };
        })
        .sort((a, b) => new Date(b.sale_date || 0) - new Date(a.sale_date || 0));

      group.shift = shift;
      group.completedSales = sales;
      group.completedTotal = sales.reduce((sum, sale) => sum + sale.total, 0);
      group.completedItems = sales.reduce(
        (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      );
    });

    return Array.from(groups.values())
      .sort((a, b) => {
        const totalA = a.completedTotal + a.heldTotal;
        const totalB = b.completedTotal + b.heldTotal;
        return totalB - totalA;
      });
  })();

  const supervisorMetrics = supervisorRoster.reduce((acc, waiter) => ({
    waiters: acc.waiters + 1,
    heldOrders: acc.heldOrders + waiter.heldOrders.length,
    completedSales: acc.completedSales + waiter.completedSales.length,
    heldValue: acc.heldValue + waiter.heldTotal,
    completedValue: acc.completedValue + waiter.completedTotal
  }), {
    waiters: 0,
    heldOrders: 0,
    completedSales: 0,
    heldValue: 0,
    completedValue: 0
  });

  // System info
  const systemInfo = {
    version: '1.0.0',
    supportEmail: 'gbstdo@gmail.com',
    supportPhone: '+254 792 455 501',
    companyName: 'DECODEX POS'
  };

  useEffect(() => {
    setSupervisorOrders(heldOrders || []);
  }, [heldOrders]);

  useEffect(() => {
    const roles = userService.getUserData()?.roles || [];
    const isSupervisor = roles.includes('supervisor') || userService.getUserRole() === 'supervisor';
    if (!isSupervisor) {
      setSupervisorShifts([]);
      return;
    }
    (async () => {
      try {
        const res = await shiftsAPI.getAllShifts({ status: 'open', role: 'waiter', limit: 50 });
        setSupervisorShifts(res?.results || res || []);
      } catch (e) {
        console.warn('Failed to load shifts for supervisor', e);
        setSupervisorShifts([]);
      }
    })();
  }, [refreshKey]);


  const fetchRecentActivity = useCallback(async () => {
    if (!currentShift?.has_active_shift || !currentShift?.id) {
      // Clear data when no active shift
      setRecentSales([]);
      setRecentReturns([]);
      setTotalSales(0);
      setTotalReturns(0);
      return;
    }
    
    setLoading(true);
    // Clear previous data before fetching new
    setRecentSales([]);
    setRecentReturns([]);
    try {
      // Fetch all sales for current shift
      const salesRes = await salesAPI.getSales({
        shift_id: currentShift.id,
        limit: 1000, // Fetch all sales for the shift
        offset: 0
      }).catch(() => ({ results: [] }));
      
      // Filter to only completed sales (not held orders)
      const salesList = (salesRes.results || salesRes || []).filter(sale => !sale.is_held_order);
      setRecentSales(salesList.slice(0, 10));
      
      // Calculate total sales from all sales in this shift
      const salesTotal = salesList.reduce((sum, sale) => sum + toNumber(sale.total_amount), 0);
      setTotalSales(salesTotal);

      // Fetch all returns for current shift
      const returnsRes = await returnsAPI.getReturns({
        shift_id: currentShift.id,
        limit: 1000, // Fetch all returns for the shift
        offset: 0
      }).catch(() => ({ results: [] }));
      
      const returnsList = (returnsRes.results || returnsRes || []);
      setRecentReturns(returnsList.slice(0, 10));
      
      // Calculate total returns from all returns in this shift
      const returnsTotal = returnsList.reduce((sum, ret) => sum + toNumber(ret.total_refund_amount || ret.refund_amount || ret.total_amount), 0);
      setTotalReturns(returnsTotal);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  }, [currentShift?.id, currentShift?.has_active_shift]);

  // Event-driven: fetch when shift changes or when refreshKey changes
  useEffect(() => {
    // Clear data when shift changes
    setRecentSales([]);
    setRecentReturns([]);
    setTotalSales(0);
    setTotalReturns(0);
    fetchRecentActivity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentShift?.id, refreshKey]);

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '--:--';
    }
  };

  const getPaymentBadgeClass = (method) => {
    const methodMap = {
      'cash': 'payment-badge--cash',
      'card': 'payment-badge--card',
      'mpesa': 'payment-badge--mpesa',
      'credit': 'payment-badge--credit',
      'split': 'payment-badge--split'
    };
    return methodMap[method?.toLowerCase()] || 'payment-badge--default';
  };

  return (
    <div className="recent-activity-panel">
      <div className="recent-activity-panel__header">
        <h2 className="recent-activity-panel__title">Recent Activity</h2>
        <div className="recent-activity-panel__tabs">
          <button 
            className={`recent-activity-panel__tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <i className="fas fa-home"></i>
            Home
          </button>
          <button 
            className={`recent-activity-panel__tab ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Sales
            {activeTab === 'sales' && totalSales > 0 && (
              <span className="recent-activity-panel__total-display">
                {formatCurrency(totalSales)}
              </span>
            )}
          </button>
          <button 
            className={`recent-activity-panel__tab ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            Returns
            {activeTab === 'returns' && totalReturns > 0 && (
              <span className="recent-activity-panel__total-display recent-activity-panel__total-display--negative">
                -{formatCurrency(totalReturns)}
              </span>
            )}
          </button>
          <button 
            className={`recent-activity-panel__tab ${activeTab === 'held' ? 'active' : ''}`}
            onClick={() => setActiveTab('held')}
          >
            Held
            {heldOrders.length > 0 && (
              <span className="recent-activity-panel__badge">{heldOrders.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="recent-activity-panel__content">
        {/* Home Tab - Calculator and System Info */}
        {activeTab === 'home' && (
          <div className="recent-activity-panel__home">
            {(() => {
              const roles = userService.getUserData()?.roles || [];
              const isSupervisor = roles.includes('supervisor') || userService.getUserRole() === 'supervisor';
              return isSupervisor;
            })() && (
              <>
                <div className="sv-overview">
                  <div className="sv-overview__hero">
                    <span className="sv-overview__eyebrow">Supervisor Console</span>
                    <h3>Waiter Activity Board</h3>
                    <p>Each waiter’s held orders and completed sales with totals and product lines in one place.</p>
                  </div>
                  <div className="sv-overview__stats">
                    <div className="sv-stat-card">
                      <span className="sv-stat-card__label">Active Waiters</span>
                      <strong className="sv-stat-card__value">{supervisorMetrics.waiters}</strong>
                    </div>
                    <div className="sv-stat-card">
                      <span className="sv-stat-card__label">Completed Sales</span>
                      <strong className="sv-stat-card__value">{supervisorMetrics.completedSales}</strong>
                      <span className="sv-stat-card__meta">{formatCurrency(supervisorMetrics.completedValue)}</span>
                    </div>
                    <div className="sv-stat-card">
                      <span className="sv-stat-card__label">Held Orders</span>
                      <strong className="sv-stat-card__value">{supervisorMetrics.heldOrders}</strong>
                      <span className="sv-stat-card__meta">{formatCurrency(supervisorMetrics.heldValue)}</span>
                    </div>
                  </div>
                </div>

                <div className="sv-board">
                  <div className="sv-board__header">
                    <div>
                      <h3>Waiter Activity</h3>
                      <p>Held and completed sales grouped per waiter.</p>
                    </div>
                    <span className="badge">{supervisorMetrics.waiters}</span>
                  </div>
                  <div className="sv-board__list">
                    {supervisorRoster.length === 0 && (
                      <div className="muted-text">No waiter activity available right now.</div>
                    )}
                    {supervisorRoster.map((waiter) => (
                      <div key={waiter.key} className="sv-waiter-card" style={{ '--sv-accent': waiter.tint }}>
                        <div className="sv-waiter-card__header">
                          <div>
                            <div className="sv-waiter-card__name">
                              <i className="fas fa-user-circle"></i>
                              {waiter.name}
                            </div>
                            <div className="sv-waiter-card__subline">
                              {waiter.shift ? `Shift #${waiter.shift.id}` : 'No active shift'}
                              {waiter.shift?.start_time ? ` • Started ${formatTime(waiter.shift.start_time)}` : ''}
                            </div>
                          </div>
                          <div className="sv-waiter-card__totals">
                            <span>{formatCurrency(waiter.completedTotal + waiter.heldTotal)}</span>
                            <small>combined value</small>
                          </div>
                        </div>

                        <div className="sv-waiter-card__stats">
                          <div className="sv-mini-stat">
                            <strong>{waiter.completedSales.length}</strong>
                            <span>completed</span>
                            <small>{formatCurrency(waiter.completedTotal)}</small>
                          </div>
                          <div className="sv-mini-stat">
                            <strong>{waiter.heldOrders.length}</strong>
                            <span>held</span>
                            <small>{formatCurrency(waiter.heldTotal)}</small>
                          </div>
                          <div className="sv-mini-stat">
                            <strong>{waiter.completedItems + waiter.heldItems}</strong>
                            <span>items</span>
                            <small>{waiter.shift ? `Txns ${waiter.shift.transaction_count ?? waiter.completedSales.length}` : 'Orders only'}</small>
                          </div>
                        </div>

                        <div className="sv-waiter-card__streams">
                          <div className="sv-stream sv-stream--completed">
                            <div className="sv-stream__header">
                              <span>Completed Sales</span>
                              <strong>{waiter.completedSales.length}</strong>
                            </div>
                            <div className="sv-stream__list">
                              {waiter.completedSales.length === 0 && (
                                <div className="sv-stream__empty">No completed sales yet.</div>
                              )}
                              {waiter.completedSales.map((sale) => (
                                <div key={sale.id} className="sv-sale-card sv-sale-card--completed">
                                  <div className="sv-sale-card__header">
                                    <span className="sv-sale-card__title">{formatReceiptLabel(sale)}</span>
                                    <span className="sv-sale-card__time">{formatTime(sale.sale_date)}</span>
                                  </div>
                                  <div className="sv-sale-card__meta">
                                    <span className={`pill pill--status ${sale.payment_method === 'split' ? 'pill--paid' : 'pill--status-info'}`}>
                                      {(sale.payment_method || 'cash').toUpperCase()}
                                    </span>
                                    <span className="pill pill--total">{formatCurrency(sale.total)}</span>
                                  </div>
                                  <div className="sv-sale-card__items">
                                    {sale.items.map((item) => (
                                      <div key={item.id} className="sv-sale-card__item">
                                        <span>{item.name}</span>
                                        <span>x{item.quantity}</span>
                                        <span>{formatCurrency(item.price)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="sv-stream sv-stream--held">
                            <div className="sv-stream__header">
                              <span>Held Orders</span>
                              <strong>{waiter.heldOrders.length}</strong>
                            </div>
                            <div className="sv-stream__list">
                              {waiter.heldOrders.length === 0 && (
                                <div className="sv-stream__empty">No held orders waiting.</div>
                              )}
                              {waiter.heldOrders.map((order) => (
                                <div key={order.id} className="sv-sale-card sv-sale-card--held">
                                  <div className="sv-sale-card__header">
                                    <span className="sv-sale-card__title">{formatHeldLabel(order)}</span>
                                    <span className="sv-sale-card__time">{formatTime(order.created_at)}</span>
                                  </div>
                                  <div className="sv-sale-card__meta">
                                    <span className={`pill pill--status ${order.payment_status === 'paid' ? 'pill--paid' : 'pill--hold'}`}>
                                      {(order.payment_status || order.status || 'held').toUpperCase()}
                                    </span>
                                    <span className="pill">{order.items?.length || order.item_count || 0} items</span>
                                    <span className="pill pill--total">{formatCurrency(order.total)}</span>
                                  </div>
                                  <div className="sv-sale-card__items">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="sv-sale-card__item">
                                        <span>{item.name}</span>
                                        <span>x{item.quantity}</span>
                                        <span>{formatCurrency(item.price)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* System Info */}
            <div className="system-info">
              <h3 className="system-info__title">
                <i className="fas fa-info-circle"></i>
                System Information
              </h3>
              <div className="system-info__content">
                <div className="system-info__item">
                  <i className="fas fa-building"></i>
                  <span className="system-info__label">Company:</span>
                  <span className="system-info__value">{systemInfo.companyName}</span>
                </div>
                <div className="system-info__item">
                  <i className="fas fa-code-branch"></i>
                  <span className="system-info__label">Version:</span>
                  <span className="system-info__value">{systemInfo.version}</span>
                </div>
                <div className="system-info__item">
                  <i className="fas fa-envelope"></i>
                  <span className="system-info__label">Support Email:</span>
                  <a href={`mailto:${systemInfo.supportEmail}`} className="system-info__link">
                    {systemInfo.supportEmail}
                  </a>
                </div>
                <div className="system-info__item">
                  <i className="fas fa-phone"></i>
                  <span className="system-info__label">Support Phone:</span>
                  <a href={`tel:${systemInfo.supportPhone}`} className="system-info__link">
                    {systemInfo.supportPhone}
                  </a>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="system-info user-info">
              <h3 className="system-info__title">
                <i className="fas fa-user-circle"></i>
                User Information
              </h3>
              <div className="system-info__content">
                {(() => {
                  const roles = userService.getUserData()?.roles || [];
                  const rawRole = roles[0] || userService.getUserRole() || 'Staff';
                  const prettyRole = rawRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <>
                <div className="system-info__item">
                  <i className="fas fa-user"></i>
                  <span className="system-info__label">Logged in as:</span>
                  <span className="system-info__value system-info__value--highlight">
                    {userService.getUserData()?.username || userService.getUserData()?.name || 'Unknown User'}
                  </span>
                </div>
                <div className="system-info__item">
                  <i className="fas fa-user-tag"></i>
                  <span className="system-info__label">Role:</span>
                  <span className="system-info__value">
                    {roles.length > 1 ? roles.join(', ') : prettyRole}
                  </span>
                </div>
                    </>
                  );
                })()}
                <div className="system-info__item">
                  <i className={`fas ${currentShift?.has_active_shift ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                  <span className="system-info__label">Shift Status:</span>
                  <span className={`system-info__value ${currentShift?.has_active_shift ? 'system-info__value--active' : 'system-info__value--inactive'}`}>
                    {currentShift?.has_active_shift ? 'Active' : 'Not Started'}
                  </span>
                </div>
                {currentShift?.has_active_shift && currentShift?.id && (
                  <div className="system-info__item">
                    <i className="fas fa-hashtag"></i>
                    <span className="system-info__label">Shift ID:</span>
                    <span className="system-info__value">#{currentShift.id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {loading && activeTab !== 'held' && activeTab !== 'home' ? (
          <div className="recent-activity-panel__list">
            {/* Skeleton Loading Placeholders */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="recent-activity-panel__skeleton-item">
                <div className="recent-activity-panel__skeleton-row">
                  <div className="recent-activity-panel__skeleton-text recent-activity-panel__skeleton-text--long recent-activity-panel__skeleton"></div>
                  <div className="recent-activity-panel__skeleton-text recent-activity-panel__skeleton-text--short recent-activity-panel__skeleton"></div>
                </div>
                <div className="recent-activity-panel__skeleton-row">
                  <div className="recent-activity-panel__skeleton-badge recent-activity-panel__skeleton"></div>
                  <div className="recent-activity-panel__skeleton-amount recent-activity-panel__skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Recent Sales Tab */}
            {activeTab === 'sales' && (
              <div className="recent-activity-panel__list">
                {recentSales.length === 0 ? (
                  <div className="recent-activity-panel__empty">
                    <i className="fas fa-receipt"></i>
                    <p>No recent sales</p>
                  </div>
                ) : (
                  recentSales.map((sale) => (
                    <div key={sale.id} className="recent-activity-panel__item recent-activity-panel__item--sale">
                      <div className="recent-activity-panel__item-header">
                        <span className="recent-activity-panel__receipt">{sale.receipt_number}</span>
                        <span className="recent-activity-panel__time">{formatTime(sale.created_at)}</span>
                      </div>
                      <div className="recent-activity-panel__item-body">
                        <span className={`recent-activity-panel__payment-badge ${getPaymentBadgeClass(sale.payment_method)}`}>
                          {sale.payment_method?.toUpperCase() || 'CASH'}
                        </span>
                        <span className="recent-activity-panel__amount">{formatCurrency(sale.total_amount)}</span>
                      </div>
                      {sale.customer_name && (
                        <div className="recent-activity-panel__item-footer">
                          <i className="fas fa-user"></i>
                          <span>{sale.customer_name}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Recent Returns Tab */}
            {activeTab === 'returns' && (
              <div className="recent-activity-panel__list">
                {recentReturns.length === 0 ? (
                  <div className="recent-activity-panel__empty">
                    <i className="fas fa-undo"></i>
                    <p>No recent returns</p>
                  </div>
                ) : (
                  recentReturns.map((returnItem) => (
                    <div key={returnItem.id} className="recent-activity-panel__item recent-activity-panel__item--return">
                      <div className="recent-activity-panel__item-header">
                        <span className="recent-activity-panel__receipt">RET-{returnItem.id}</span>
                        <span className="recent-activity-panel__time">{formatTime(returnItem.created_at)}</span>
                      </div>
                      <div className="recent-activity-panel__item-body">
                        <span className="recent-activity-panel__refund-badge">
                          <i className="fas fa-undo"></i>
                          REFUND
                        </span>
                        <span className="recent-activity-panel__amount recent-activity-panel__amount--negative">
                          -{formatCurrency(returnItem.total_refund_amount || returnItem.refund_amount || returnItem.total_amount)}
                        </span>
                      </div>
                      {returnItem.receipt_number && (
                        <div className="recent-activity-panel__item-footer">
                          <i className="fas fa-link"></i>
                          <span>{returnItem.receipt_number}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Held Orders Tab */}
            {activeTab === 'held' && (
              <div className="recent-activity-panel__list">
                {heldOrders.length === 0 && voidedHeldOrders.length === 0 ? (
                  <div className="recent-activity-panel__empty">
                    <i className="fas fa-clock"></i>
                    <p>No held orders</p>
                  </div>
                ) : (
                  <>
                    {heldOrders.length > 0 && (
                      <>
                        <div className="recent-activity-panel__item-footer" style={{ fontWeight: 700 }}>
                          <i className="fas fa-clock"></i>
                          <span>Active Held Orders</span>
                        </div>
                        {heldOrders.map((order) => (
                          <div 
                            key={`held-${order.id}`} 
                            className="recent-activity-panel__item recent-activity-panel__item--held"
                            onClick={() => onLoadHeldOrder && onLoadHeldOrder(order)}
                          >
                            <div className="recent-activity-panel__item-header">
                              <span className="recent-activity-panel__receipt">HELD-{order.id}</span>
                              <span className="recent-activity-panel__time">{formatTime(order.created_at)}</span>
                            </div>
                            <div className="recent-activity-panel__item-body">
                              <span className="recent-activity-panel__items-count">
                                <i className="fas fa-box"></i>
                                {order.item_count || order.items?.length || 0}
                              </span>
                              <span className="recent-activity-panel__amount">{formatCurrency(order.total_amount || order.items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0)}</span>
                            </div>
                            {order.customer_name && (
                              <div className="recent-activity-panel__item-footer">
                                <i className="fas fa-user"></i>
                                <span>{order.customer_name}</span>
                              </div>
                            )}
                            <div className="recent-activity-panel__item-actions">
                              <button className="recent-activity-panel__action-btn recent-activity-panel__action-btn--load">
                                <i className="fas fa-play"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {voidedHeldOrders.length > 0 && (
                      <>
                        <div className="recent-activity-panel__item-footer" style={{ fontWeight: 700, marginTop: heldOrders.length > 0 ? '8px' : 0 }}>
                          <i className="fas fa-ban"></i>
                          <span>Voided Held Orders</span>
                        </div>
                        {voidedHeldOrders.map((order) => (
                          <div 
                            key={`voided-${order.id}`} 
                            className="recent-activity-panel__item recent-activity-panel__item--return"
                          >
                            <div className="recent-activity-panel__item-header">
                              <span className="recent-activity-panel__receipt">VOID-HOLD-{order.id}</span>
                              <span className="recent-activity-panel__time">{formatTime(order.updated_at || order.created_at)}</span>
                            </div>
                            <div className="recent-activity-panel__item-body">
                              <span className="recent-activity-panel__refund-badge">
                                <i className="fas fa-ban"></i>
                                VOIDED
                              </span>
                              <span className="recent-activity-panel__amount">{formatCurrency(order.total_amount || order.items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0)}</span>
                            </div>
                            <div className="recent-activity-panel__item-footer">
                              <i className="fas fa-comment-alt"></i>
                              <span>{order.void_reason || 'No reason recorded'}</span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="recent-activity-panel__footer">
        <button className="recent-activity-panel__refresh-btn" onClick={fetchRecentActivity}>
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>
  );
};

export default RecentActivityPanel;
