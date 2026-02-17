import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency, salesAPI, returnsAPI, toNumber, userService } from '../../services/ApiService/api';
import './RecentActivityPanel.css';

const RecentActivityPanel = ({
  heldOrders = [],
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
  
  // Calculator state
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrevious, setCalcPrevious] = useState(null);
  const [calcOperator, setCalcOperator] = useState(null);
  const [calcWaitingForOperand, setCalcWaitingForOperand] = useState(false);

  // System info
  const systemInfo = {
    version: '1.0.0',
    supportEmail: 'gbstdo@gmail.com',
    supportPhone: '+254 792 455 501',
    companyName: 'DECODEX POS'
  };

  // Calculator functions
  const calcClear = () => {
    setCalcDisplay('0');
    setCalcPrevious(null);
    setCalcOperator(null);
    setCalcWaitingForOperand(false);
  };

  const calcInputDigit = (digit) => {
    if (calcWaitingForOperand) {
      setCalcDisplay(digit);
      setCalcWaitingForOperand(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? digit : calcDisplay + digit);
    }
  };

  const calcInputDecimal = () => {
    if (calcWaitingForOperand) {
      setCalcDisplay('0.');
      setCalcWaitingForOperand(false);
      return;
    }
    if (!calcDisplay.includes('.')) {
      setCalcDisplay(calcDisplay + '.');
    }
  };

  const calcPerformOperation = (nextOperator) => {
    const inputValue = parseFloat(calcDisplay);

    if (calcPrevious === null) {
      setCalcPrevious(inputValue);
    } else if (calcOperator) {
      const currentValue = calcPrevious || 0;
      let result;

      switch (calcOperator) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '×':
          result = currentValue * inputValue;
          break;
        case '÷':
          result = inputValue !== 0 ? currentValue / inputValue : 'Error';
          break;
        default:
          result = inputValue;
      }

      if (result === 'Error') {
        setCalcDisplay('Error');
        setCalcPrevious(null);
      } else {
        setCalcDisplay(String(result));
        setCalcPrevious(result);
      }
    }

    setCalcWaitingForOperand(true);
    setCalcOperator(nextOperator);
  };

  const calcEquals = () => {
    if (!calcOperator || calcPrevious === null) return;
    calcPerformOperation(null);
    setCalcOperator(null);
    setCalcPrevious(null);
  };

  const calcBackspace = () => {
    if (calcDisplay.length > 1) {
      setCalcDisplay(calcDisplay.slice(0, -1));
    } else {
      setCalcDisplay('0');
    }
  };

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
            {/* Calculator */}
            <div className="calculator">
              <div className="calculator__display">
                <span className="calculator__previous">
                  {calcPrevious !== null ? `${calcPrevious} ${calcOperator || ''}` : ''}
                </span>
                <span className="calculator__current">{calcDisplay}</span>
              </div>
              <div className="calculator__buttons">
                <button className="calculator__btn calculator__btn--clear" onClick={calcClear}>C</button>
                <button className="calculator__btn calculator__btn--operator" onClick={calcBackspace}>DEL</button>
                <button className="calculator__btn calculator__btn--operator" onClick={() => calcPerformOperation('÷')}>÷</button>
                <button className="calculator__btn calculator__btn--operator" onClick={() => calcPerformOperation('×')}>×</button>
                
                <button className="calculator__btn" onClick={() => calcInputDigit('7')}>7</button>
                <button className="calculator__btn" onClick={() => calcInputDigit('8')}>8</button>
                <button className="calculator__btn" onClick={() => calcInputDigit('9')}>9</button>
                <button className="calculator__btn calculator__btn--operator" onClick={() => calcPerformOperation('-')}>-</button>
                
                <button className="calculator__btn" onClick={() => calcInputDigit('4')}>4</button>
                <button className="calculator__btn" onClick={() => calcInputDigit('5')}>5</button>
                <button className="calculator__btn" onClick={() => calcInputDigit('6')}>6</button>
                <button className="calculator__btn calculator__btn--operator" onClick={() => calcPerformOperation('+')}>+</button>
                
                <button className="calculator__btn" onClick={() => calcInputDigit('1')}>1</button>
                <button className="calculator__btn" onClick={() => calcInputDigit('2')}>2</button>
                <button className="calculator__btn" onClick={() => calcInputDigit('3')}>3</button>
                <button className="calculator__btn calculator__btn--equals" onClick={calcEquals}>=</button>
                
                <button className="calculator__btn calculator__btn--zero" onClick={() => calcInputDigit('0')}>0</button>
                <button className="calculator__btn" onClick={calcInputDecimal}>.</button>
              </div>
            </div>

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
                    {userService.getUserRole() || 'Staff'}
                  </span>
                </div>
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
                {heldOrders.length === 0 ? (
                  <div className="recent-activity-panel__empty">
                    <i className="fas fa-clock"></i>
                    <p>No held orders</p>
                  </div>
                ) : (
                  heldOrders.map((order) => (
                    <div 
                      key={order.id} 
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
                        <span className="recent-activity-panel__amount">{formatCurrency(order.total_amount)}</span>
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
                  ))
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
