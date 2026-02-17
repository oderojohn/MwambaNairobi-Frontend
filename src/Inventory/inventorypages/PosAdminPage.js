
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../logo.png';
import PosManagerDashboard from './components/PosManagerDashboard';
import CurrentShiftTab from './components/CurrentShiftTab';
import SuperReturnServices from './components/SuperReturnServices';
import ReturnsTab from './components/ReturnsTab';
import VoidModal from './components/modals/VoidModal';
import RefundModal from './components/modals/RefundModal';
import EditTransactionModal from './components/modals/EditTransactionModal';
import ShiftManager from './components/ShiftManager';
import { shiftsAPI, salesAPI } from '../../services/ApiService/api';
import './PosAdminPage.css';

const PosAdminPage = () => {
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('pos-manager');
  const [currentShift, setCurrentShift] = useState(null);
  const [currentShiftSales, setCurrentShiftSales] = useState([]);
  const [currentShiftItems, setCurrentShiftItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [showShiftManager, setShowShiftManager] = useState(false);
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

  const loadCurrentShift = useCallback(async () => {
    try {
      const shiftData = await shiftsAPI.getCurrentShift();
      if (shiftData) {
        setCurrentShift(shiftData);
        
        // Load shift sales data inline (avoiding circular dependency)
        try {
          const shiftSales = await salesAPI.getSales({ shift_id: shiftData.id });
          setCurrentShiftSales(shiftSales || []);

          // Aggregate items
          const itemsMap = new Map();
          shiftSales?.forEach(sale => {
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
        } catch (salesError) {
          console.error('Error loading shift sales data:', salesError);
          setCurrentShiftSales([]);
          setCurrentShiftItems([]);
        }
      } else {
        setCurrentShift(null);
        setCurrentShiftSales([]);
        setCurrentShiftItems([]);
      }
    } catch (error) {
      console.error('Error loading current shift:', error);
      setCurrentShift(null);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'current-shift') {
        await loadCurrentShiftData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, loadCurrentShiftData]);

  useEffect(() => {
    loadData();
  }, [activeTab, dateRange, loadData]);

  // Handler functions
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

  return (
    <div className="pos-admin-page excel-style">
      {/* Single Top Bar */}
      <div className="excel-header">
        <div className="excel-header-left">
          <button className="back-btn-mini" onClick={() => navigate('/inventory/dashboard')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>
            <img src={logo} alt="Logo" className="pos-admin-logo-mini" />
            POS Manager
          </h1>
        </div>
        <div className="excel-header-right">
          <div className="excel-tab-buttons">
            <button
              className={`excel-tab ${activeTab === 'pos-manager' ? 'active' : ''}`}
              onClick={() => setActiveTab('pos-manager')}
            >
              Dashboard
            </button>
            <button
              className={`excel-tab ${activeTab === 'current-shift' || showShiftManager ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('current-shift');
                setShowShiftManager(true);
              }}
            >
              Shift
            </button>
            <button
              className={`excel-tab ${activeTab === 'super-returns' ? 'active' : ''}`}
              onClick={() => setActiveTab('super-returns')}
            >
              New Return
            </button>
            <button
              className={`excel-tab ${activeTab === 'returns' ? 'active' : ''}`}
              onClick={() => setActiveTab('returns')}
            >
              All Returns
            </button>
          </div>
          <button
            className="btn-refresh"
            onClick={loadData}
            disabled={isLoading}
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
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
      {activeTab === 'super-returns' && (
        <SuperReturnServices
          isLoading={isLoading}
          onReturnComplete={loadData}
        />
      )}
      {activeTab === 'returns' && (
        <ReturnsTab
          isLoading={isLoading}
          dateRange={dateRange}
          handleDateRangeChange={handleDateRangeChange}
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

      <ShiftManager
        show={showShiftManager}
        onClose={() => setShowShiftManager(false)}
        currentShift={currentShift}
        onShiftUpdated={loadCurrentShift}
      />
    </div>
  );
};

export default PosAdminPage;