
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../logo.png';
import PosManagerDashboard from './components/PosManagerDashboard';
import CurrentShiftTab from './components/CurrentShiftTab';
import ShiftsTab from './components/ShiftsTab';
import SalesTab from './components/SalesTab';
import PaymentsTab from './components/PaymentsTab';
import VoidModal from './components/modals/VoidModal';
import RefundModal from './components/modals/RefundModal';
import EditTransactionModal from './components/modals/EditTransactionModal';
import ShiftDetailsModal from './components/modals/ShiftDetailsModal';
import { shiftsAPI, salesAPI, paymentsAPI } from '../../services/ApiService/api';
import './PosAdminPage.css';

const PosAdminPage = () => {
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('pos-manager');
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
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [editTransactionData, setEditTransactionData] = useState({});
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [pagination, setPagination] = useState({
    shifts: { page: 1, limit: 20 },
    sales: { page: 1, limit: 20 },
    payments: { page: 1, limit: 20 }
  });

  // Data loading functions
  const loadCurrentShiftData = useCallback(async () => {
    if (!currentShift) return;

    try {
      const shiftSales = await salesAPI.getSales({ shift_id: currentShift.id });
      setCurrentShiftSales(shiftSales || []);

      // Aggregate items
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
        end_date: dateRange.end,
        page: pagination.shifts.page,
        page_size: pagination.shifts.limit
      });
      setShifts(shiftsData || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
      setShifts([]);
    }
  }, [dateRange, pagination.shifts]);

  const loadSales = useCallback(async () => {
    try {
      const salesData = await salesAPI.getSales({
        start_date: dateRange.start,
        end_date: dateRange.end,
        page: pagination.sales.page,
        page_size: pagination.sales.limit
      });
      setSales(salesData || []);
    } catch (error) {
      console.error('Error loading sales:', error);
      setSales([]);
    }
  }, [dateRange, pagination.sales]);

  const loadPayments = useCallback(async () => {
    try {
      const paymentsData = await paymentsAPI.getPayments({
        start_date: dateRange.start,
        end_date: dateRange.end,
        page: pagination.payments.page,
        page_size: pagination.payments.limit
      });
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    }
  }, [dateRange, pagination.payments]);

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
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, loadCurrentShiftData, loadShifts, loadSales, loadPayments]);

  useEffect(() => {
    loadData();
  }, [activeTab, dateRange, loadData]);

  useEffect(() => {
    setPagination({
      shifts: { page: 1, limit: 20 },
      sales: { page: 1, limit: 20 },
      payments: { page: 1, limit: 20 }
    });
  }, [dateRange]);

  useEffect(() => {
    loadCurrentShift();
  }, [loadCurrentShift]);

  // Handler functions
  const handleViewShiftDetails = (shift) => {
    setSelectedShift(shift);
    setShowShiftDetails(true);
  };

  const handleVoidSale = (sale) => {
    setSelectedSale(sale);
    setVoidReason('');
    setShowVoidModal(true);
  };

  const handleRefundSale = (sale) => {
    setSelectedSale(sale);
    setRefundReason('');
    setRefundAmount(sale.total_amount || 0);
    setShowRefundModal(true);
  };

  const handleViewTransactionDetails = async (sale) => {
    try {
      // Fetch full sale details including items
      const fullSaleData = await salesAPI.getSale(sale.id);
      setSelectedTransaction(fullSaleData);
      setEditTransactionData({
        customer_name: fullSaleData.customer_name || '',
        discount: fullSaleData.discount_amount || 0,
        tax: fullSaleData.tax_amount || 0,
        notes: fullSaleData.notes || ''
      });
      setShowEditTransactionModal(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      // Fallback to using the table data
      setSelectedTransaction(sale);
      setEditTransactionData({
        customer_name: sale.customer_name || '',
        discount: sale.discount_amount || 0,
        tax: sale.tax_amount || 0,
        notes: sale.notes || ''
      });
      setShowEditTransactionModal(true);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handlePaginationChange = (type, page) => {
    setPagination(prev => ({
      ...prev,
      [type]: { ...prev[type], page }
    }));
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
            <i className="fas fa-refresh"></i> Refresh All
          </button>
        </div>
        <h1>
          <img src={logo} alt="Logo" className="pos-admin-logo" />
          POS Manager & Administration
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="pos-admin-tabs">
        <button
          className={`tab-button ${activeTab === 'pos-manager' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos-manager')}
        >
          <i className="fas fa-chart-line"></i> POS Manager
        </button>
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
      {activeTab === 'pos-manager' && (
        <PosManagerDashboard
          isLoading={isLoading}
          handleViewTransactionDetails={handleViewTransactionDetails}
          handleVoidSale={handleVoidSale}
          handleRefundSale={handleRefundSale}
          handleDateRangeChange={handleDateRangeChange}
        />
      )}
      {activeTab === 'current-shift' && (
        <CurrentShiftTab
          currentShift={currentShift}
          currentShiftItems={currentShiftItems}
          currentShiftSales={currentShiftSales}
          isLoading={isLoading}
          handleVoidSale={handleVoidSale}
          handleViewTransactionDetails={handleViewTransactionDetails}
          loadCurrentShift={loadCurrentShift}
        />
      )}
      {activeTab === 'shifts' && (
        <ShiftsTab
          shifts={shifts}
          isLoading={isLoading}
          dateRange={dateRange}
          pagination={pagination.shifts}
          handleViewShiftDetails={handleViewShiftDetails}
          handleDateRangeChange={handleDateRangeChange}
          handlePaginationChange={() => handlePaginationChange('shifts', pagination.shifts.page + 1)}
        />
      )}
      {activeTab === 'sales' && (
        <SalesTab
          sales={sales}
          isLoading={isLoading}
          dateRange={dateRange}
          pagination={pagination.sales}
          handleDateRangeChange={handleDateRangeChange}
          handlePaginationChange={() => handlePaginationChange('sales', pagination.sales.page + 1)}
        />
      )}
      {activeTab === 'payments' && (
        <PaymentsTab
          payments={payments}
          isLoading={isLoading}
          dateRange={dateRange}
          pagination={pagination.payments}
          handleDateRangeChange={handleDateRangeChange}
          handlePaginationChange={() => handlePaginationChange('payments', pagination.payments.page + 1)}
        />
      )}

      {/* Modals */}
      <VoidModal
        show={showVoidModal}
        selectedSale={selectedSale}
        voidReason={voidReason}
        setVoidReason={setVoidReason}
        onClose={() => setShowVoidModal(false)}
        onConfirm={() => {
          setShowVoidModal(false);
          loadData();
          loadCurrentShift();
        }}
        isLoading={isLoading}
      />

      <RefundModal
        show={showRefundModal}
        selectedSale={selectedSale}
        refundReason={refundReason}
        setRefundReason={setRefundReason}
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        onClose={() => setShowRefundModal(false)}
        onConfirm={() => {
          setShowRefundModal(false);
          loadData();
          loadCurrentShift();
        }}
        isLoading={isLoading}
      />

      <EditTransactionModal
        show={showEditTransactionModal}
        selectedTransaction={selectedTransaction}
        editTransactionData={editTransactionData}
        setEditTransactionData={setEditTransactionData}
        onClose={() => setShowEditTransactionModal(false)}
        onConfirm={() => {
          setShowEditTransactionModal(false);
          loadData();
          loadCurrentShift();
        }}
        isLoading={isLoading}
      />

      <ShiftDetailsModal
        show={showShiftDetails}
        shift={selectedShift}
        onClose={() => setShowShiftDetails(false)}
      />
    </div>
  );
};

export default PosAdminPage;