/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import ShoppingCart from './components/ShoppingCart';
import RecentActivityPanel from './components/RecentActivityPanel';
import ShiftModal from './components/ShiftModal';
import PaymentModal from './components/PaymentModal';
import ChitModal from './components/ChitModal';
import HeldOrdersModal from './components/HeldOrdersModal';
import HeldOrderDetailsModal from './components/HeldOrderDetailsModal';
import SalesSummaryModal from './components/SalesSummaryModal';
import CustomerLookupModal from './components/CustomerLookupModal';
import ErrorModal from './components/ErrorModal';
import OrderPreparationPage from './pages/OrderPreparationPage';
import OrderManagementPage from './pages/OrderManagementPage';
import ReceiptModal from './components/ReceiptModal';
import ReturnCodeModal from './components/ReturnCodeModal';
import { inventoryAPI, salesAPI, shiftsAPI, customersAPI, suppliersAPI, toNumber, formatCurrency, userService, usersAPI, normalizeTopbarPermissions, DEFAULT_TOPBAR_PERMISSIONS } from '../services/ApiService/api';
import { useAuth } from '../services/context/authContext';
import './data/pos.css';
import './data/Modal.css'

function PosApp() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showClosedShift, setShowClosedShift] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChitModal, setShowChitModal] = useState(false);
  const [salesSummaryData, setSalesSummaryData] = useState({ shiftId: null, isOpen: false });
  const [showCustomerLookupModal, setShowCustomerLookupModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('cash');
  const [heldOrders, setHeldOrders] = useState([]);
  const [voidedHeldOrders, setVoidedHeldOrders] = useState([]);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [showHeldOrderDetailsModal, setShowHeldOrderDetailsModal] = useState(false);
  const [selectedHeldOrder, setSelectedHeldOrder] = useState(null);
  const [currentHeldOrderId, setCurrentHeldOrderId] = useState(null);
  const [heldOrderNeedsSave, setHeldOrderNeedsSave] = useState(false);
  const [heldOrderOriginalQuantities, setHeldOrderOriginalQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('retail');
  const [showErrorModal, setShowErrorModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [errorDetails, setErrorDetails] = useState({ title: '', message: '', details: '', errors: [] });
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [topbarPermissions, setTopbarPermissions] = useState(DEFAULT_TOPBAR_PERMISSIONS);
  const [refreshingProducts, setRefreshingProducts] = useState(false);
  const currentRole = String(user?.role || user?.roles?.[0] || userService.getUserRole() || '').toLowerCase();
  const canUseWholesale = currentRole !== 'waiter';
  const showWaiterMobileRefresh = currentRole === 'waiter';
  
  const getHeldOrderLockedQuantity = (item) => {
    if (!currentHeldOrderId) {
      return 0;
    }

    return Number(item?.heldOrderOriginalQuantity ?? heldOrderOriginalQuantities[String(item?.id)] ?? 0);
  };

  const clearHeldOrderCart = ({ closePaymentModal = false } = {}) => {
    setCart([]);
    setSelectedCustomer(null);
    setSelectedHeldOrder(null);
    setCurrentHeldOrderId(null);
    setHeldOrderNeedsSave(false);
    setHeldOrderOriginalQuantities({});

    if (closePaymentModal) {
      setShowPaymentModal(false);
      setInitialPaymentMethod('cash');
    }
  };

  const exitHeldOrderEditing = () => {
    if (!currentHeldOrderId) {
      return;
    }

    if (heldOrderNeedsSave) {
      Swal.fire({
        icon: 'question',
        title: 'Exit Held Order Editing?',
        text: `Order #${currentHeldOrderId} has unsaved changes. Exit without saving?`,
        showCancelButton: true,
        confirmButtonText: 'Exit Without Saving',
        cancelButtonText: 'Stay Here',
        zIndex: 10000
      }).then((result) => {
        if (result.isConfirmed) {
          clearHeldOrderCart();
        }
      });
      return;
    }

    clearHeldOrderCart();
  };

  // Load top bar permissions from auth payload and refresh from API so admin changes apply immediately
  useEffect(() => {
    const stored = user?.topbar_permissions || userService.getTopbarPermissions();
    setTopbarPermissions(normalizeTopbarPermissions(stored));

    const userId = user?.user_id || userService.getUserData()?.user_id;
    if (userId) {
      usersAPI.getTopbarPermissions(userId)
        .then((res) => {
          const perms = res?.allowed_buttons || res?.topbar_permissions || res;
          setTopbarPermissions(normalizeTopbarPermissions(perms));
        })
        .catch((err) => console.warn('Top bar permission fetch failed:', err?.message || err));
    }
  }, [user]);

  const [showReturnCodeModal, setShowReturnCodeModal] = useState(false);
  const [appliedReturnCode, setAppliedReturnCode] = useState(null);

  // Function to refresh shift data
  const refreshShiftData = async () => {
    try {
      // Get user_id directly from userService to ensure it's always available
      const userData = userService.getUserData();
      const userId = userData?.user_id;
      
      if (!userId) {
        console.log('No user_id available, cannot refresh shift data');
        setCurrentShift(null);
        return;
      }
      
      const currentShiftRes = await shiftsAPI.getCurrentShift(userId).catch(() => null);
      if (currentShiftRes) {
        console.log('Refreshed shift data:', currentShiftRes);

        // Check if shift has valid data and is active
        if (currentShiftRes.has_active_shift && currentShiftRes.status === 'open') {
          let parsedDate = 'Unknown';
          if (currentShiftRes.start_time) {
            try {
              const dateObj = new Date(currentShiftRes.start_time);
              parsedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString() : 'Invalid Date';
            } catch (dateError) {
              console.error('Date parsing error:', dateError);
              parsedDate = 'Parse Error';
            }
          }

          setCurrentShift({
            id: currentShiftRes.id,
            startTime: parsedDate,
            startingCash: parseFloat(currentShiftRes.opening_balance || 0),
            total_sales: parseFloat(currentShiftRes.total_sales || 0),
            transaction_count: currentShiftRes.transaction_count || 0,
            status: currentShiftRes.status,
            has_active_shift: true,
            last_shift_info: null,
            // Include all sales data from API response
            cash_sales: parseFloat(currentShiftRes.cash_sales || 0),
            card_sales: parseFloat(currentShiftRes.card_sales || 0),
            mobile_sales: parseFloat(currentShiftRes.mobile_sales || 0),
            mpesa_sales: parseFloat(currentShiftRes.mobile_sales || 0),
            net_sales: parseFloat(currentShiftRes.net_sales || 0),
            returns: currentShiftRes.returns || [],
            return_count: currentShiftRes.return_count || 0,
            total_returns: parseFloat(currentShiftRes.total_returns || 0),
            sales: currentShiftRes.sales || [],
            sales_by_payment_method: currentShiftRes.sales_by_payment_method || {},
            opening_balance: parseFloat(currentShiftRes.opening_balance || 0),
            end_time: currentShiftRes.end_time || null,
            closing_balance: parseFloat(currentShiftRes.closing_balance || 0),
            discrepancy: parseFloat(currentShiftRes.discrepancy || 0),
            expected_cash: parseFloat(currentShiftRes.expected_cash || 0)
          });
        } else {
          // No active shift - set currentShift with last shift info
          console.log('No active shift, showing last shift info');
          setCurrentShift({
            id: null,
            status: 'closed',
            has_active_shift: false,
            last_shift_info: currentShiftRes.last_shift_info || null
          });
        }
      } else {
        console.log('No active shift after refresh');
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Error refreshing shift data:', error);
      setCurrentShift(null);
    }
  };

  // Function to fetch data based on current mode
  const fetchData = useCallback(async (currentMode = mode) => {
    try {
      setLoading(true);
      
      // First check if we have shift data from login response (no API call needed)
      const loginShift = userService.getCurrentShift();
      const loginShiftStatus = userService.getShiftStatus();
      
      console.log('Login shift data:', { loginShift, loginShiftStatus });
      
      const [productsRes, categoriesRes, customersRes, suppliersRes] = await Promise.all([
        inventoryAPI.products.getPosProducts({ mode: currentMode }),
        inventoryAPI.categories.getAll(),
        customersAPI.getCustomers({ mode: currentMode }),
        suppliersAPI.getSuppliers()
      ]);

      setProducts(productsRes || []);
      setCategories(categoriesRes || []);
      setCustomers(customersRes.results || customersRes || []);
      setSuppliers(suppliersRes.results || suppliersRes || []);
      // Chits will be loaded on-demand when ChitModal is opened

      // Use login shift data
      if (loginShiftStatus === 'open' && loginShift) {
        console.log('Using login shift data:', loginShift);

        let parsedDate = 'Unknown';
        if (loginShift.start_time) {
          try {
            const dateObj = new Date(loginShift.start_time);
            parsedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString() : 'Invalid Date';
          } catch (dateError) {
            console.error('Date parsing error:', dateError);
            parsedDate = 'Parse Error';
          }
        }

        setCurrentShift({
          id: loginShift.id,
          startTime: parsedDate,
          startingCash: parseFloat(loginShift.opening_balance || 0),
          total_sales: parseFloat(loginShift.total_sales || 0),
          transaction_count: loginShift.transaction_count || 0,
          status: loginShift.status || 'open',
          has_active_shift: true,
          cash_sales: parseFloat(loginShift.cash_sales || 0),
          card_sales: parseFloat(loginShift.card_sales || 0),
          mobile_sales: parseFloat(loginShift.mobile_sales || 0),
          mpesa_sales: parseFloat(loginShift.mobile_sales || 0),
          net_sales: parseFloat(loginShift.net_sales || 0),
          returns: loginShift.returns || [],
          return_count: loginShift.return_count || 0,
          total_returns: parseFloat(loginShift.total_returns || 0),
          sales: loginShift.sales || [],
          sales_by_payment_method: loginShift.sales_by_payment_method || {},
          opening_balance: parseFloat(loginShift.opening_balance || 0),
          end_time: loginShift.end_time || null,
          closing_balance: parseFloat(loginShift.closing_balance || 0),
          discrepancy: parseFloat(loginShift.discrepancy || 0),
          expected_cash: parseFloat(loginShift.expected_cash || 0)
        });
        
        // Fetch held orders when shift is active
        fetchHeldOrders(loginShift.id);
      } else {
        console.log('No active shift - showing start shift modal');
        setCurrentShift(null);
        fetchHeldOrders(null);
        setShowShiftModal(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Data Loading Error',
        text: 'Failed to load application data. Please refresh the page.',
        zIndex: 10000,
        confirmButtonText: 'Refresh',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    if (!canUseWholesale && mode === 'wholesale') {
      setMode('retail');
    }
  }, [canUseWholesale, mode]);

  // Handle mode changes
  const handleModeChange = async (newMode) => {
    if (newMode === 'wholesale' && !canUseWholesale) return;
    if (newMode === mode) return;

    // Clear cart when switching modes
    if (cart.length > 0) {
      const result = await Swal.fire({
        title: 'Switch Mode',
        text: `Switching to ${newMode} mode will clear your current cart. Continue?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, switch',
        cancelButtonText: 'Cancel',
        zIndex: 10000
      });

      if (!result.isConfirmed) return;
      setCart([]);
    }

    // Clear selected customer when switching modes
    setSelectedCustomer(null);
    setCurrentHeldOrderId(null);

    // Force refresh products data to ensure correct prices are loaded
    setProducts([]);
    setCategories([]);

    setMode(newMode);
    await fetchData(newMode);
  };

  // Handle customer selection from lookup modal
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerLookupModal(false);
  };

  // Handle customer clearing
  const handleCustomerClear = () => {
    setSelectedCustomer(null);
  };

  const refreshProductsOnly = useCallback(async () => {
    try {
      setRefreshingProducts(true);
      const [productsRes, categoriesRes] = await Promise.all([
        inventoryAPI.products.getPosProducts({ mode }),
        inventoryAPI.categories.getAll()
      ]);

      setProducts(productsRes || []);
      setCategories(categoriesRes || []);
    } catch (error) {
      console.error('Error refreshing products:', error);
      showError('Refresh Failed', error.message || 'Could not refresh products right now.');
    } finally {
      setRefreshingProducts(false);
    }
  }, [mode]);

  const addToCart = (product) => {
    // Strict shift check - no operations allowed without active shift
    if (!currentShift) {
      Swal.fire({
        icon: 'warning',
        title: 'Shift Required',
        text: 'You must start a shift before adding items to cart.',
        confirmButtonText: 'Start Shift',
        zIndex: 99999
      }).then((result) => {
        if (result.isConfirmed) {
          setShowShiftModal(true);
        }
      });
      return;
    }

    // Check product stock
    if (product.stock_quantity <= 0) {
      showError('Out of Stock', `"${product.name}" is currently out of stock.`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Check if adding more would exceed stock
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity > product.stock_quantity) {
          showError('Insufficient Stock', `Only ${product.stock_quantity} units of "${product.name}" available.`);
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // For new items, always use minimum quantity of 1
        let initialQuantity = 1;

        // Check if initial quantity exceeds stock
        if (initialQuantity > product.stock_quantity) {
          showError('Insufficient Stock', `Only ${product.stock_quantity} units of "${product.name}" available.`);
          return prevCart;
        }

        // Use display_price for the current mode, fallback to selling_price
        const price = product.display_price || product.selling_price || product.price || 0;
        return [...prevCart, { 
          ...product, 
          quantity: initialQuantity, 
          price,
          original_price: price // Store original price for reference
        }];
      }
    });
    if (currentHeldOrderId) {
      setHeldOrderNeedsSave(true);
    }
  };

  const updateQuantity = (productId, change) => {
    // Strict shift check - no operations allowed without active shift
    if (!currentShift) {
      Swal.fire({
        icon: 'warning',
        title: 'Shift Required',
        text: 'You must start a shift before modifying cart items.',
        confirmButtonText: 'Start Shift',
        zIndex: 99999
      }).then((result) => {
        if (result.isConfirmed) {
          setShowShiftModal(true);
        }
      });
      return;
    }

    setCart(prevCart => {
      const item = prevCart.find(item => item.id === productId);
      if (!item) return prevCart;

      const newQuantity = item.quantity + change;
      const lockedQuantity = getHeldOrderLockedQuantity(item);

      if (lockedQuantity > 0 && newQuantity < lockedQuantity) {
        showError(
          'Held Order Protected',
          `You cannot reduce "${item.name}" below the original held quantity of ${lockedQuantity}.`
        );
        return prevCart;
      }

      // Validate minimum quantity - always 1
      if (newQuantity < 1 && newQuantity > 0) {
        showError('Minimum Quantity', `Minimum quantity for "${item.name}" is 1.`);
        return prevCart;
      }

      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }

      // Check stock availability
      if (newQuantity > item.stock_quantity) {
        showError('Insufficient Stock', `Only ${item.stock_quantity} units of "${item.name}" available.`);
        return prevCart;
      }

      return prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
    if (currentHeldOrderId) {
      setHeldOrderNeedsSave(true);
    }
  };

  const removeItem = (productId) => {
    // Strict shift check - no operations allowed without active shift
    if (!currentShift) {
      Swal.fire({
        icon: 'warning',
        title: 'Shift Required',
        text: 'You must start a shift before removing items from cart.',
        confirmButtonText: 'Start Shift',
        zIndex: 99999
      }).then((result) => {
        if (result.isConfirmed) {
          setShowShiftModal(true);
        }
      });
      return;
    }

    setCart(prevCart => {
      const item = prevCart.find((cartItem) => cartItem.id === productId);
      if (!item) {
        return prevCart;
      }

      const lockedQuantity = getHeldOrderLockedQuantity(item);
      if (lockedQuantity > 0) {
        showError(
          'Held Order Protected',
          `You cannot remove "${item.name}" because it belongs to the original held order.`
        );
        return prevCart;
      }

      return prevCart.filter((cartItem) => cartItem.id !== productId);
    });
    if (currentHeldOrderId) {
      setHeldOrderNeedsSave(true);
    }
  };

  const handleClearCart = () => {
    if (currentHeldOrderId) {
      showError(
        'Held Order Protected',
        'You cannot clear a loaded held order. Cancel payment to exit this held order cart.'
      );
      return;
    }

    setCart([]);
  };

  const newSale = () => {
    // Strict shift check - no operations allowed without active shift
    if (!currentShift) {
      Swal.fire({
        icon: 'warning',
        title: 'Shift Required',
        text: 'You must start a shift before starting a new sale.',
        confirmButtonText: 'Start Shift',
        zIndex: 99999
      }).then((result) => {
        if (result.isConfirmed) {
          setShowShiftModal(true);
        }
      });
      return;
    }

    if (cart.length > 0) {
      Swal.fire({
        title: 'Start New Sale',
        text: 'This will clear the current cart. Continue?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, clear cart',
        cancelButtonText: 'Cancel',
        zIndex: 99999
      }).then((result) => {
        if (result.isConfirmed) {
          setCart([]);
          setSelectedCustomer(null);
          setCurrentHeldOrderId(null);
          setHeldOrderOriginalQuantities({});
        }
      });
    } else {
      setCart([]);
      setSelectedCustomer(null);
      setCurrentHeldOrderId(null);
      setHeldOrderOriginalQuantities({});
    }
  };

  // Handle opening return code modal
  const handleOpenReturnCodeModal = () => {
    setShowReturnCodeModal(true);
  };

  // Handle applying a return code to the cart (as a discount)
  const handleApplyReturnCode = (returnCode, refundAmount) => {
    setAppliedReturnCode({ code: returnCode, amount: refundAmount });
    
    // Show confirmation
    Swal.fire({
      icon: 'success',
      title: 'Return Code Applied',
      text: `Refund of ${formatCurrency(refundAmount)} will be applied to this sale.`,
      timer: 2000,
      showConfirmButton: false,
      zIndex: 99999
    });
  };

  // Clear applied return code
  const clearAppliedReturnCode = () => {
    setAppliedReturnCode(null);
  };

  const startShift = async (startingCash) => {
    try {
      // Show loading modal for starting shift
      const loadingSwal = Swal.fire({
        title: 'Starting Shift...',
        text: 'Please wait while we set up your shift',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const shiftData = {
        starting_cash: startingCash
      };
      const shiftResponse = await shiftsAPI.startShift(shiftData);

      // Close loading modal
      loadingSwal.close();

      // Update localStorage with new shift data so it persists on refresh
      const currentUserData = userService.getUserData() || {};
      const updatedUserData = {
        ...currentUserData,
        shift_status: 'open',
        current_shift: {
          id: shiftResponse.id,
          start_time: shiftResponse.start_time,
          opening_balance: shiftResponse.opening_balance,
          status: 'open'
        }
      };
      userService.setUserData(updatedUserData);

      // Refresh shift data to get accurate information from backend
      await refreshShiftData();
      setActivityRefreshKey(prev => prev + 1);

      setShowShiftModal(false);

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Shift Started Successfully!',
        text: `Your shift has started with KSh ${startingCash.toFixed(2)} in starting cash.`,
        timer: 2000,
        showConfirmButton: false,
        zIndex: 99999
      });
    } catch (error) {
      console.error('Error starting shift:', error);

      // Close any open loading modals
      Swal.close();

      Swal.fire({
        icon: 'error',
        title: 'Shift Start Failed',
        text: 'Failed to start shift. Please try again.',
        zIndex: 99999
      });
    }
  };

  const endShift = async () => {
    try {
      // Ask for ending cash amount using Swal with highest z-index
      const result = await Swal.fire({
        title: 'End Shift',
        text: 'Enter ending cash amount (KSh):',
        input: 'number',
        inputPlaceholder: '0.00',
        inputAttributes: {
          step: '0.01',
          min: '0'
        },
        showCancelButton: true,
        confirmButtonText: 'End Shift',
        cancelButtonText: 'Cancel',
        zIndex: 999999999,
        inputValidator: (value) => {
          if (!value || isNaN(parseFloat(value))) {
            return 'Please enter a valid number for ending cash.';
          }
        }
      });

      if (!result.isConfirmed) return;

      const endingCashAmount = parseFloat(result.value) || 0;

      // Show loading modal for ending shift
      const loadingSwal = Swal.fire({
        title: 'Ending Shift...',
        text: 'Please wait while we process the shift closure',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        zIndex: 99999,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await shiftsAPI.endShift({ 
        ending_cash: endingCashAmount,
        user_id: user?.user_id  // Include user_id in end shift request
      });

      // Close loading modal
      loadingSwal.close();

      // Check if shift is already closed
      if (response.shift_status === 'closed' && !response.reconciliation) {
        // Shift was already closed - show message and refresh data
        await refreshShiftData();
        setActivityRefreshKey(prev => prev + 1);
        setShowShiftModal(false);
        
        Swal.fire({
          title: 'Shift Already Closed',
          text: 'This shift has already been closed.',
          icon: 'info',
          confirmButtonText: 'OK',
          zIndex: 99999
        });
        return;
      }

      // Refresh shift data to confirm shift is ended
      await refreshShiftData();
      
      // Keep modal open to show closed shift details
      setCurrentShift({
        id: response.reconciliation?.shift_id || null,
        startTime: response.reconciliation?.start_time || 'Unknown',
        startingCash: parseFloat(response.reconciliation?.opening_balance || 0),
        total_sales: parseFloat(response.reconciliation?.total_sales || 0),
        transaction_count: response.reconciliation?.transaction_count || 0,
        status: 'closed',
        has_active_shift: false,
        // Closed shift details
        cash_sales: parseFloat(response.reconciliation?.cash_sales || 0),
        card_sales: parseFloat(response.reconciliation?.card_sales || 0),
        mobile_sales: parseFloat(response.reconciliation?.mobile_sales || 0),
        net_sales: parseFloat(response.reconciliation?.total_sales || 0),
        returns: response.reconciliation?.returns || [],
        return_count: response.reconciliation?.return_count || 0,
        total_returns: parseFloat(response.reconciliation?.total_returns || 0),
        opening_balance: parseFloat(response.reconciliation?.opening_balance || 0),
        end_time: response.reconciliation?.end_time || new Date().toISOString(),
        closing_balance: parseFloat(response.reconciliation?.actual_closing_balance || 0),
        discrepancy: parseFloat(response.reconciliation?.discrepancy || 0),
        expected_cash: parseFloat(response.reconciliation?.expected_closing_balance || 0)
      });

      // Update localStorage to reflect that shift is closed
      const currentUserData = userService.getUserData() || {};
      const updatedUserData = {
        ...currentUserData,
        shift_status: 'closed',
        current_shift: null
      };
      userService.setUserData(updatedUserData);
      
      // Show closed shift view in modal
      setShowClosedShift(true);
      
      // Display detailed reconciliation information using Swal
      const recon = response.reconciliation;
      const discrepancyType = recon.discrepancy_type;
      const discrepancyAmount = Math.abs(recon.discrepancy);

      let htmlContent = `
        <div style="text-align: left; font-family: monospace; font-size: 14px; line-height: 1.6;">
          <div style="margin-bottom: 15px;">
            <strong>📊 Shift Summary:</strong><br>
            • Opening Balance: KSh ${recon.opening_balance.toFixed(2)}<br>
            • Cash Sales: KSh ${recon.cash_sales.toFixed(2)}<br>
            • Returns: KSh ${(recon.total_returns || 0).toFixed(2)}<br>
            • Card Sales: KSh ${recon.card_sales.toFixed(2)}<br>
            • Mobile Sales: KSh ${recon.mobile_sales.toFixed(2)}<br>
            • Total Sales: KSh ${recon.total_sales.toFixed(2)}
          </div>

          <div style="margin-bottom: 15px;">
            <strong>💰 Cash Reconciliation:</strong><br>
            • Expected Cash: KSh ${recon.expected_closing_balance.toFixed(2)}<br>
            • Actual Cash: KSh ${recon.actual_closing_balance.toFixed(2)}<br>
            • ${recon.discrepancy_description}
          </div>
      `;

      if (discrepancyType === 'shortage') {
        htmlContent += `
          <div style="color: #dc3545; margin-top: 10px;">
            <strong>⚠️ SHORTAGE DETECTED: KSh ${discrepancyAmount.toFixed(2)}</strong><br>
            Please investigate the missing amount.
          </div>
        `;
      } else if (discrepancyType === 'overage') {
        htmlContent += `
          <div style="color: #28a745; margin-top: 10px;">
            <strong>✅ OVERAGE DETECTED: KSh ${discrepancyAmount.toFixed(2)}</strong><br>
            Additional cash found in register.
          </div>
        `;
      } else {
        htmlContent += `
          <div style="color: #28a745; margin-top: 10px;">
            <strong>✅ PERFECT BALANCE: Register is balanced!</strong>
          </div>
        `;
      }

      htmlContent += `</div>`;

      await Swal.fire({
        title: '🧾 Shift Closed Successfully!',
        html: htmlContent,
        icon: 'success',
        confirmButtonText: 'OK',
        zIndex: 99999,
        width: '600px',
        customClass: {
          popup: 'shift-closure-modal'
        }
      });
    } catch (error) {
      console.error('Error ending shift:', error);

      // Close any open loading modals
      Swal.close();

      Swal.fire({
        icon: 'error',
        title: 'Shift End Failed',
        text: 'Failed to end shift. Please try again.',
        zIndex: 99999
      });
    }
  };

  const processPayment = async (paymentData) => {
    // Strict shift check - no operations allowed without active shift
    if (!currentShift) {
      Swal.fire({
        icon: 'warning',
        title: 'Shift Required',
        text: 'You must start a shift before processing payments.',
        confirmButtonText: 'Start Shift',
        zIndex: 99999
      }).then((result) => {
        if (result.isConfirmed) {
          setShowShiftModal(true);
        }
      });
      return;
    }

    try {
      console.log('Processing payment with data:', paymentData);

      // Validate cart
      const cartErrors = validateCartForSale(cart, mode, selectedCustomer);
      if (cartErrors.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Cart Validation Failed',
          text: 'Please fix the following issues before proceeding:\n\n' + cartErrors.join('\n'),
          zIndex: 99999
        });
        return;
      }

      // Validate payment data
      const paymentErrors = validatePaymentData(paymentData, total);
      if (paymentErrors.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Payment Validation Failed',
          text: 'Please fix the following payment issues:\n\n' + paymentErrors.join('\n'),
          zIndex: 10000
        });
        return;
      }

      if (currentHeldOrderId && heldOrderNeedsSave) {
        Swal.fire({
          icon: 'info',
          title: 'Save Held Order First',
          text: 'Save your held order changes before proceeding to payment.',
          zIndex: 10000
        });
        return;
      }

      // Since PaymentModal has its own loading indicator, we don't need Swal here
      // Check if this is a held order being completed
      if (currentHeldOrderId) {
        await completeHeldOrder(currentHeldOrderId, paymentData);
        return;
      }

      // Prepare cart data for backend
      const cartData = {
        items: cart.map(item => ({
          product: item.id,
          quantity: Number(item.quantity),
          unit_price: Number(item.price),
          discount: Number(0)
        })),
        total_amount: Number(total),
        tax_amount: Number(0),
        discount_amount: Number(0),
        payment_method: paymentData.method,
        customer: selectedCustomer ? selectedCustomer.id : null,
        sale_type: mode
      };

      // Add split data if split payment
      if (paymentData.method === 'split') {
        cartData.split_data = {
          cash: Number(paymentData.split_data?.cash || 0),
          mpesa: Number(paymentData.split_data?.mpesa || 0)
        };
      }

      console.log('Sending cart data to backend:', cartData);

      // Send to backend (backend handles payment creation)
      const sale = await salesAPI.createSale(cartData);
      console.log('Sale created successfully:', sale);

      // Validate sale ID
      if (!sale.id) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Sale',
          text: 'Sale was created but no sale ID was returned.',
          zIndex: 10000
        });
        return;
      }

      // Update product stock quantities immediately
      setProducts(prevProducts => prevProducts.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
          return { ...product, stock_quantity: Math.max(0, product.stock_quantity - cartItem.quantity) };
        }
        return product;
      }));

      // Refresh shift data to update totals
      await refreshShiftData();
      setActivityRefreshKey(prev => prev + 1);

      // Prepare receipt data
      const receiptInfo = {
        sale: sale,
        cart: [...cart], // Copy current cart
        total: total,
        paymentMethod: paymentData.method,
        change: paymentData.cashReceived ? paymentData.cashReceived - total : 0,
        customer: selectedCustomer,
        transactionId: paymentData.transactionId,
        mode: mode,
        splitData: paymentData.method === 'split' ? paymentData.split_data : null
      };

      setReceiptData(receiptInfo);
      setShowReceiptModal(true);

      // Clear cart and close modal
      setCart([]);
      setCurrentHeldOrderId(null);
      setHeldOrderNeedsSave(false);
      setHeldOrderOriginalQuantities({});
      setShowPaymentModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error processing payment:', error);

      // Close loading if it's still open
      Swal.close();

      if (error.response?.data) {
        let errorMessage = 'Payment processing failed. Please try again.';
        let errorList = [];

        if (typeof error.response.data === 'object') {
          errorList = Object.entries(error.response.data).map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          });
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }

        Swal.fire({
          icon: 'error',
          title: 'Payment Failed',
          text: errorMessage + (errorList.length > 0 ? '\n\nDetails:\n' + errorList.join('\n') : ''),
          zIndex: 10000
        });
      } else if (error.message) {
        if (error.message.includes('Session expired')) {
          Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'Your session has expired. Please login again.',
            zIndex: 10000
          });
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Payment Error',
            text: error.message,
            zIndex: 10000
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Connection Error',
          text: 'Payment processing failed. Please check your connection and try again.',
          zIndex: 10000
        });
      }
    }
  };

  async function handlePrimaryCartAction() {
    if (!currentHeldOrderId || !heldOrderNeedsSave) {
      setShowPaymentModal(true);
      return;
    }

    try {
      await syncHeldOrderFromCart();
      await Swal.fire({
        icon: 'success',
        title: 'Held Order Saved',
        text: 'The bill is still held. You can keep adding items and complete payment when the customer is ready.',
        timer: 1800,
        showConfirmButton: false,
        zIndex: 10000
      });
    } catch (error) {
      console.error('Error saving held order from cart:', error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: error.message || 'Failed to save held order changes.',
        zIndex: 10000
      });
    }
  }

  // Create pending bill for bar - allows printing receipt before payment
  const createPendingBill = async () => {
    // Strict shift check - no operations allowed without active shift
    if (!currentShift) {
      Swal.fire({
        icon: 'warning',
        title: 'Shift Required',
        text: 'You must start a shift before creating pending bills.',
        confirmButtonText: 'Start Shift',
        zIndex: 99999
      }).then((result) => {
        if (result.isConfirmed) {
          setShowShiftModal(true);
        }
      });
      return;
    }

    try {
      console.log('Creating pending bill with cart:', cart);

      // Validate cart before creating pending bill
      const cartErrors = validateCartForSale(cart, mode, selectedCustomer);
      if (cartErrors.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Cannot Create Pending Bill',
          text: 'Please fix the following issues before creating the pending bill:\n\n' + cartErrors.join('\n'),
          zIndex: 99999
        });
        return;
      }

      if (currentHeldOrderId) {
        await syncHeldOrderFromCart();
        await fetchHeldOrders();
        await Swal.fire({
          icon: 'success',
          title: 'Held Order Updated',
          text: 'The held bill has been updated. You can continue adding items or complete it later.',
          timer: 1800,
          showConfirmButton: false,
          zIndex: 10000
        });
        return;
      }

      // Show countdown dialog with undo option
      const result = await Swal.fire({
        title: 'Creating Pending Bill...',
        text: 'Pending bill will be created in 5 seconds. Click "Undo" to cancel.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Create Now',
        cancelButtonText: 'Undo',
        timer: 5000,
        timerProgressBar: true,
        allowOutsideClick: false,
        zIndex: 10000
      });

      // Check if timer expired or user confirmed
      if (result.dismiss === Swal.DismissReason.cancel) {
        // User clicked Undo - just close without another dialog
        return;
      }

      // If timer expired (result.dismiss === Swal.DismissReason.timer) or confirmed, proceed

      // Show loading Swal
      Swal.fire({
        title: 'Creating Pending Bill...',
        text: 'Please wait while we save your pending bill',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        zIndex: 10000,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Prepare cart data for backend with pending_bill flag
      const cartData = {
        items: cart.map(item => ({
          product: item.id,
          quantity: Number(item.quantity),
          unit_price: Number(item.price),
          discount: Number(0)
        })),
        total_amount: Number(total),
        tax_amount: Number(0),
        discount_amount: Number(0),
        customer: selectedCustomer ? selectedCustomer.id : null,
        sale_type: mode,
        hold_order: true,
        is_pending_bill: true  // Mark as pending bill for bar
      };

      console.log('Creating pending bill with data:', cartData);

      // Send to backend to create pending bill
      const pendingBill = await salesAPI.createSale(cartData);
      console.log('Pending bill created successfully:', pendingBill);

      setHeldOrders((prev) => [
        {
          ...pendingBill,
          customer: selectedCustomer ? selectedCustomer.id : pendingBill.customer,
          customer_name: selectedCustomer ? selectedCustomer.name : pendingBill.customer_name
        },
        ...prev.filter((order) => order.id !== pendingBill.id)
      ]);

      // Clear cart and customer
      setCart([]);
      setSelectedCustomer(null);
      setSelectedHeldOrder(null);
      setCurrentHeldOrderId(null);
      setHeldOrderNeedsSave(false);

      // Refresh held orders to include the new pending bill
      await fetchHeldOrders();

      Swal.close();
    } catch (error) {
      console.error('Error creating pending bill:', error);

      // Close loading if it's still open
      Swal.close();

      if (error.response?.data) {
        let errorMessage = 'Failed to create pending bill.';
        let errorList = [];

        if (typeof error.response.data === 'object') {
          errorList = Object.entries(error.response.data).map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          });
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }

        Swal.fire({
          icon: 'error',
          title: 'Pending Bill Failed',
          text: errorMessage + (errorList.length > 0 ? '\n\nDetails:\n' + errorList.join('\n') : ''),
          zIndex: 10000
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Pending Bill Error',
          text: error.message || 'Error creating pending bill. Please try again.',
          zIndex: 10000
        });
      }
    }
  };

  const loadChit = (chit) => {
    try {
      console.log('Loading chit to cart:', chit);

      // Convert chit items to cart format
      if (chit.items && chit.items.length > 0) {
        const cartItems = chit.items.map(item => {
          const product = products.find(p => p.id === item.product);
          if (!product) {
            throw new Error(`Product with ID ${item.product} not found`);
          }
          return {
            ...product,
            quantity: item.quantity,
            price: item.unit_price,
            original_unit_price: item.unit_price
          };
        });

        setCart(cartItems);
        setSelectedCustomer(chit.customer || null);
      }

      setShowChitModal(false);
    } catch (error) {
      console.error('Error loading chit:', error);
      Swal.fire({
        icon: 'error',
        title: 'Chit Loading Failed',
        text: error.message || 'Error loading chit. Please try again.',
        zIndex: 10000
      });
    }
  };

  async function fetchHeldOrders(shiftOverride = undefined) {
    try {
      const roles = userService.getUserData()?.roles || [];
      const isSupervisor = roles.includes('supervisor') || userService.getUserRole() === 'supervisor';
      const shiftId = shiftOverride !== undefined ? shiftOverride : currentShift?.id;
      console.log('Fetching held orders with shift_id:', shiftId);
      const baseParams = isSupervisor ? { all_waiters: true } : (shiftId ? { shift_id: shiftId } : {});
      console.log('Fetch held orders params:', baseParams);
      const [activeOrders, voidedOrders] = await Promise.all([
        salesAPI.getHeldOrders(baseParams),
        salesAPI.getHeldOrders({ ...baseParams, status: 'voided' })
      ]);
      setHeldOrders(activeOrders || []);
      setVoidedHeldOrders(voidedOrders || []);
    } catch (error) {
      console.error('Error fetching held orders:', error);
      setHeldOrders([]);
      setVoidedHeldOrders([]);
      Swal.fire({
        icon: 'error',
        title: 'Held Orders Error',
        text: 'Failed to load held orders. Please try again.',
        zIndex: 10000
      });
    }
  }

  const loadHeldOrderIntoCart = async (heldOrder, { openPayment = false } = {}) => {
    try {
      console.log('Loading held order to cart:', heldOrder);

      // Validate held order data
      if (!heldOrder || !heldOrder.items || heldOrder.items.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Held Order',
          text: 'Held order has no items or is invalid.',
          zIndex: 10000
        });
        return;
      }

      // Convert held order items to cart format
      const cartItems = heldOrder.items.map(item => {
        const product = products.find(p => p.id === item.product);
        console.log('Found product for item:', item.product, product);

        if (product) {
          // Use the current product data but override price with held order price
          return {
            ...product,
            quantity: item.quantity,
            price: item.unit_price,
            heldOrderOriginalQuantity: Number(item.quantity || 0),
          };
        } else {
          // Product not found in current inventory, create a minimal product object
          console.warn(`Product ${item.product} not found in current inventory, using held order data`);
          return {
            id: item.product,
            name: item.product_name || `Product ${item.product}`,
            price: item.unit_price,
            unit_price: item.unit_price,
            quantity: item.quantity,
            stock_quantity: 999, // Assume sufficient stock for held orders
            wholesale_min_qty: 1,
            display_price: item.unit_price,
            selling_price: item.unit_price,
            // Add other required fields with defaults
            category: null,
            barcode: null,
            description: null,
            image: null,
            is_active: true,
            created_at: null,
            updated_at: null,
            heldOrderOriginalQuantity: Number(item.quantity || 0)
          };
        }
      });

      console.log('Setting cart items:', cartItems);
      setCart(cartItems);
      setHeldOrderOriginalQuantities(
        heldOrder.items.reduce((acc, item) => {
          acc[String(item.product)] = Number(item.quantity || 0);
          return acc;
        }, {})
      );

      // Set customer if available
      if (heldOrder.customer) {
        const customer = customers.find(c => c.id === heldOrder.customer);
        console.log('Found customer:', customer);
        if (customer) {
          setSelectedCustomer(customer);
        }
      }

      // Track that this cart came from a held order
      setCurrentHeldOrderId(heldOrder.id);
      setHeldOrderNeedsSave(false);
      console.log('Set currentHeldOrderId to:', heldOrder.id);


      console.log('Closing held order details modal');
      setShowHeldOrderDetailsModal(false);

      if (openPayment) {
        // Small delay to ensure state updates before opening payment modal
        setTimeout(() => {
          console.log('Opening payment modal for held order');
          setShowPaymentModal(true);
        }, 100);
      }
    } catch (error) {
      console.error('Error loading held order for payment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Held Order Loading Failed',
        text: error.message || 'Error loading held order. Please try again.',
        zIndex: 10000
      });
    }
  };

  const loadHeldOrder = (heldOrder) => {
    setShowHeldOrdersModal(false);
    setSelectedHeldOrder(heldOrder);
    loadHeldOrderIntoCart(heldOrder, { openPayment: false });
  };

  const proceedToPayment = async (heldOrder) => {
    setSelectedHeldOrder(heldOrder);
    await loadHeldOrderIntoCart(heldOrder, { openPayment: true });
  };

  async function syncHeldOrderFromCart() {
    if (!currentHeldOrderId || !selectedHeldOrder) {
      return null;
    }

    const originalItems = Array.isArray(selectedHeldOrder.items) ? selectedHeldOrder.items : [];
    const cartByProduct = new Map(cart.map((item) => [String(item.id), item]));
    const originalByProduct = new Map(originalItems.map((item) => [String(item.product), item]));

    const items_to_remove = [];
    const update_quantities = {};
    const items_to_add = [];

    originalItems.forEach((item) => {
      const cartItem = cartByProduct.get(String(item.product));
      if (!cartItem) {
        items_to_remove.push(item.id);
        return;
      }

      const nextQty = Number(cartItem.quantity || 0);
      if (nextQty !== Number(item.quantity || 0)) {
        update_quantities[item.id] = nextQty;
      }
    });

    cart.forEach((item) => {
      if (!originalByProduct.has(String(item.id))) {
        items_to_add.push({
          product: item.id,
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.price || item.unit_price || 0)
        });
      }
    });

    if (
      items_to_remove.length === 0 &&
      items_to_add.length === 0 &&
      Object.keys(update_quantities).length === 0 &&
      String(selectedHeldOrder.customer || '') === String(selectedCustomer?.id || '')
    ) {
      return null;
    }

    const payload = {
      items_to_add,
      items_to_remove,
      update_quantities,
      customer: selectedCustomer ? selectedCustomer.id : null
    };

    const updatedOrder = await salesAPI.updateHeldOrder(currentHeldOrderId, payload);
    setSelectedHeldOrder((prev) => prev ? ({
      ...prev,
      items: updatedOrder?.items || prev.items,
      customer: selectedCustomer ? selectedCustomer.id : prev.customer,
      customer_name: selectedCustomer ? selectedCustomer.name : prev.customer_name
    }) : prev);
    setHeldOrderNeedsSave(false);
    await fetchHeldOrders();
    return updatedOrder;
  }

  const completeHeldOrder = async (heldOrderId, paymentData) => {
    try {
      console.log('Completing held order:', heldOrderId, 'with payment:', paymentData);

      // Validate cart for held order completion (skip stock validation - held orders may have out-of-stock items)
      const cartErrors = validateCartForSale(cart, mode, selectedCustomer, true);
      if (cartErrors.length > 0) {
        showError('Held Order Validation Failed', 'Cannot complete held order due to validation errors:', cartErrors);
        return;
      }

      // Validate payment data
      const paymentErrors = validatePaymentData(paymentData, total);
      if (paymentErrors.length > 0) {
        showError('Payment Validation Failed', 'Please fix the following payment issues:', paymentErrors);
        return;
      }

      // Show countdown with undo option before completing
      const countdownResult = await Swal.fire({
        title: 'Completing Payment...',
        text: 'Payment will be completed in 4 seconds. Click "Undo" to cancel.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Complete Now',
        cancelButtonText: 'Undo',
        timer: 4000,
        timerProgressBar: true,
        allowOutsideClick: false,
        zIndex: 10000
      });

      // If timer expired (countdown completed) or user clicked "Complete Now"
      if (countdownResult.dismiss === Swal.DismissReason.timer || countdownResult.isConfirmed) {
        // User confirmed or timer expired - proceed with completion
      } else if (countdownResult.dismiss === Swal.DismissReason.cancel) {
        // User clicked Undo - cancel the operation
        Swal.fire({
          title: 'Payment Cancelled',
          text: 'The pending order has not been completed.',
          icon: 'info',
          zIndex: 10000
        });
        return;
      }

      await syncHeldOrderFromCart();

      // Calculate totals from current cart
      const cartData = {
        tax_amount: 0,
        discount_amount: 0,
        total_amount: total,
        payment_method: paymentData.method,
        sale_type: mode
      };

      // Add split payment data if applicable
      if (paymentData.method === 'split') {
        cartData.split_data = {
          cash: paymentData.split_data?.cash || 0,
          mpesa: paymentData.split_data?.mpesa || 0
        };
        cartData.mpesa_number = paymentData.mpesaNumber || '';
      } else if (paymentData.method === 'mpesa') {
        cartData.mpesa_number = paymentData.mpesaNumber || '';
      }

      console.log('Completing held order with data:', cartData);

      // Complete the held order (backend handles payment creation)
      const sale = await salesAPI.completeHeldOrder(heldOrderId, cartData);
      console.log('Held order completed successfully:', sale);

      // Refresh shift data to update totals
      await refreshShiftData();
      setActivityRefreshKey(prev => prev + 1);

      // Update product stock quantities immediately
      setProducts(prevProducts => prevProducts.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
          return { ...product, stock_quantity: Math.max(0, product.stock_quantity - cartItem.quantity) };
        }
        return product;
      }));

      // Prepare receipt data
      const receiptInfo = {
        sale: sale,
        cart: [...cart], // Copy current cart
        total: total,
        paymentMethod: paymentData.method,
        change: 0, // Held orders don't have change calculation
        customer: selectedCustomer,
        transactionId: paymentData.transactionId,
        mode: mode,
        splitData: paymentData.method === 'split' ? paymentData.split_data : null
      };

      setReceiptData(receiptInfo);
      setShowReceiptModal(true);

      // Clear cart and close modals
      clearHeldOrderCart();
      setShowPaymentModal(false);
      setShowHeldOrdersModal(false);

      // Refresh held orders list to remove the completed order
      fetchHeldOrders();
    } catch (error) {
      console.error('Error completing held order:', error);

      if (error.response?.data) {
        let errorMessage = 'Failed to complete held order.';
        let errorList = [];

        if (typeof error.response.data === 'object') {
          errorList = Object.entries(error.response.data).map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          });
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }

        showError('Held Order Completion Failed', errorMessage, errorList, error.response.data);
      } else {
        showError('Held Order Error', error.message || 'Error completing held order. Please try again.');
      }
    }
  };

  const openOrderPreparation = () => {
    navigate('/order-preparation');
  };

  const saveOrderPreparation = async (orderData) => {
    try {
      console.log('Saving order preparation:', orderData);
      Swal.fire({
        icon: 'success',
        title: 'Order Prepared Successfully!',
        text: `Items: ${orderData.items.length}\nTotal: ${formatCurrency(orderData.total_amount)}\nCustomer: ${orderData.customer ? 'Assigned' : 'Walk-in'}`,
        zIndex: 10000
      });
    } catch (error) {
      console.error('Error saving order preparation:', error);
      Swal.fire({
        icon: 'error',
        title: 'Order Preparation Failed',
        text: 'Failed to save order preparation. Please try again.',
        zIndex: 10000
      });
    }
  };

  // Validation functions
  const validateCartForSale = (cartItems, mode, selectedCustomer, skipStockCheck = false) => {
    const errors = [];

    if (!cartItems || cartItems.length === 0) {
      errors.push('Cart is empty');
      return errors;
    }

    // Validate each cart item
    cartItems.forEach((item, index) => {
      if (!item.id) {
        errors.push(`Item ${index + 1}: Invalid product ID`);
      }

      if (!item.name) {
        errors.push(`Item ${index + 1}: Product name is missing`);
      }

      const quantity = toNumber(item.quantity);
      if (quantity <= 0) {
        errors.push(`Item ${index + 1} (${item.name}): Quantity must be greater than 0`);
      }

      const price = toNumber(item.price);
      if (price <= 0) {
        errors.push(`Item ${index + 1} (${item.name}): Price must be greater than 0`);
      }

      // Check stock availability (skip for held orders that may have out-of-stock items)
      if (!skipStockCheck && item.stock_quantity !== undefined && item.stock_quantity < quantity) {
        errors.push(`Item ${index + 1} (${item.name}): Insufficient stock. Available: ${item.stock_quantity}, Requested: ${quantity}`);
      }

      // Wholesale validation
      if (mode === 'wholesale') {
        if (selectedCustomer) {
          // Registered customer - minimum 1 item
          if (quantity < 1) {
            errors.push(`Item ${index + 1} (${item.name}): Minimum quantity for registered customers is 1`);
          }
        } else {
          // Unregistered customer - check wholesale minimum
          const minQty = item.wholesale_min_qty || 10;
          if (quantity < minQty) {
            errors.push(`Item ${index + 1} (${item.name}): Minimum wholesale quantity is ${minQty}`);
          }
        }
      }
    });

    // No customer required for wholesale mode, but minimum quantities are enforced

    return errors;
  };

  const validatePaymentData = (paymentData, totalAmount) => {
    const errors = [];

    if (!paymentData) {
      errors.push('Payment data is missing');
      return errors;
    }

    if (!paymentData.method) {
      errors.push('Payment method is required');
    } else {
      const validMethods = ['cash', 'mpesa', 'split'];
      if (!validMethods.includes(paymentData.method.toLowerCase())) {
        errors.push(`Invalid payment method: ${paymentData.method}. Valid methods: ${validMethods.join(', ')}`);
      }
    }

    if (paymentData.method === 'mpesa' && !paymentData.mpesaNumber) {
      errors.push('M-Pesa phone number is required for M-Pesa payments');
    }

    if (paymentData.method === 'cash' && paymentData.cashReceived < totalAmount) {
      errors.push(`Cash received (${formatCurrency(paymentData.cashReceived)}) is less than total amount (${formatCurrency(totalAmount)})`);
    }

    // Validate split payment amounts
    if (paymentData.method === 'split') {
      const splitTotal = (paymentData.split_data?.cash || 0) + (paymentData.split_data?.mpesa || 0);
      if (Math.abs(splitTotal - totalAmount) > 0.01) { // Allow for floating point precision
        errors.push(`Split payment total (${formatCurrency(splitTotal)}) does not match sale total (${formatCurrency(totalAmount)})`);
      }
      if (!paymentData.mpesaNumber) {
        errors.push('M-Pesa phone number is required for split payments');
      }
    }

    return errors;
  };

  const showError = (title, message, errors = [], details = '') => {
    // Use Swal for all errors instead of the custom ErrorModal
    let fullMessage = message;
    if (errors && errors.length > 0) {
      fullMessage += '\n\nDetails:\n' + errors.join('\n');
    }
    if (details) {
      fullMessage += '\n\nTechnical Details: ' + (typeof details === 'string' ? details : JSON.stringify(details, null, 2));
    }

    Swal.fire({
      icon: 'error',
      title: title,
      text: fullMessage,
      zIndex: 10000,
      confirmButtonText: 'OK'
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (toNumber(item.price) * toNumber(item.quantity)), 0);
  const total = Math.round(subtotal * 100) / 100; // Round to 2 decimal places properly
  const itemCount = cart.reduce((sum, item) => sum + toNumber(item.quantity), 0);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileCartOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (itemCount === 0 && isMobileCartOpen) {
      setIsMobileCartOpen(false);
    }
  }, [itemCount, isMobileCartOpen]);

  // Check current path to determine which component to render
  const isOrderPreparationPage = location.pathname === '/order-preparation';
  const isOrderManagementPage = location.pathname === '/order-management';

  if (isOrderPreparationPage) {
    return (
      <OrderPreparationPage
        products={products}
        categories={categories}
        customers={customers}
        suppliers={suppliers}
        onSaveOrder={saveOrderPreparation}
        mode={mode}
      />
    );
  }

  if (isOrderManagementPage) {
    return (
      <OrderManagementPage
        suppliers={suppliers}
      />
    );
  }

  return (
    <div className="pos-container">
      <Header
        onNewSale={newSale}
        onOpenChits={() => setShowChitModal(true)}
        onOpenHeldOrders={() => {
          fetchHeldOrders();
          setShowHeldOrdersModal(true);
        }}
        onOpenSalesSummary={(shiftId) => setSalesSummaryData({ shiftId, isOpen: true })}
        onShiftManagement={() => setShowShiftModal(true)}
        onEndShift={() => setShowShiftModal(true)}
        onPrint={() => window.print()}
        onLogout={logout}
        onOpenOrderPreparation={openOrderPreparation}
        currentShift={currentShift}
        mode={mode}
        onModeChange={handleModeChange}
        canUseWholesale={canUseWholesale}
        showMobileRefreshButton={showWaiterMobileRefresh}
        onRefreshProducts={refreshProductsOnly}
        refreshingProducts={refreshingProducts}
        onCustomerLookup={() => setShowCustomerLookupModal(true)}
        onCustomerClear={handleCustomerClear}
        selectedCustomer={selectedCustomer}
        permissions={topbarPermissions}
      />

      {/* {!currentShift && !showShiftModal && (
        <div className="shift-required-overlay">
          <div className="shift-required-message">
            <h3>Shift Required</h3>
            <p>You must start a shift before processing sales.</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowShiftModal(true)}
            >
              Start Shift
            </button>
          </div>
        </div>
      )} */}

      <div className="pos-content">
        <ProductGrid
          products={products}
          categories={categories}
          onAddToCart={currentShift?.has_active_shift ? addToCart : () => {}}
          loading={loading}
          disabled={!currentShift?.has_active_shift}
        />

        <ShoppingCart
          cart={cart}
          categories={categories}
          onUpdateQuantity={currentShift?.has_active_shift ? updateQuantity : () => {}}
          onRemoveItem={currentShift?.has_active_shift ? removeItem : () => {}}
          onProcessPayment={currentShift?.has_active_shift ? handlePrimaryCartAction : () => {}}
          onCreatePendingBill={currentShift?.has_active_shift ? createPendingBill : () => {}}
          onClearCart={currentShift?.has_active_shift ? handleClearCart : () => {}}
          primaryActionLabel={currentHeldOrderId && heldOrderNeedsSave ? 'SAVE' : 'PAY'}
          heldOrderId={currentHeldOrderId}
          heldOrderNeedsSave={heldOrderNeedsSave}
          onExitHeldOrderEditing={currentShift?.has_active_shift ? exitHeldOrderEditing : () => {}}
          disabled={!currentShift?.has_active_shift}
          selectedCustomer={selectedCustomer}
          mode={mode}
          onCustomerClear={handleCustomerClear}
          canReduceItem={(item) => getHeldOrderLockedQuantity(item) === 0 || Number(item.quantity) > getHeldOrderLockedQuantity(item)}
          canRemoveItem={(item) => getHeldOrderLockedQuantity(item) === 0}
          onOpenReturnCodeModal={handleOpenReturnCodeModal}
          appliedReturnCode={appliedReturnCode}
          onClearAppliedReturnCode={clearAppliedReturnCode}
          isMobileOpen={isMobileCartOpen}
          onCloseMobile={() => setIsMobileCartOpen(false)}
        />

        <RecentActivityPanel
          heldOrders={heldOrders}
          voidedHeldOrders={voidedHeldOrders}
          onLoadHeldOrder={loadHeldOrder}
          currentShift={currentShift}
          refreshKey={activityRefreshKey}
        />
      </div>

      {isMobileCartOpen && (
        <div
          className="pos-mobile-cart-backdrop"
          onClick={() => setIsMobileCartOpen(false)}
        />
      )}

      <button
        className={`pos-mobile-cart-toggle ${isMobileCartOpen ? 'pos-mobile-cart-toggle--hidden' : ''}`}
        onClick={() => setIsMobileCartOpen(true)}
        aria-label="Open cart"
      >
        <span className="pos-mobile-cart-toggle__label">Cart</span>
        <span className="pos-mobile-cart-toggle__count">{itemCount}</span>
        <span className="pos-mobile-cart-toggle__total">{formatCurrency(total)}</span>
      </button>

      <ShiftModal
        isOpen={showShiftModal}
        showClosedShift={showClosedShift}
        onClose={() => {
          setShowShiftModal(false);
          setShowClosedShift(false);
        }}
        onViewStartShift={() => setShowClosedShift(false)}
        onStartShift={startShift}
        onEndShift={endShift}
        onViewSalesSummary={(shiftId) => setSalesSummaryData({ shiftId, isOpen: true })}
        currentShift={currentShift}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          if (currentHeldOrderId) {
            clearHeldOrderCart({ closePaymentModal: true });
            return;
          }
          setShowPaymentModal(false);
          setInitialPaymentMethod('cash');
        }}
        onProcessPayment={processPayment}
        totalAmount={total}
        selectedCustomer={selectedCustomer}
        mode={mode}
        initialMethod={initialPaymentMethod}
        key={showPaymentModal ? 'payment-modal-open' : 'payment-modal-closed'}
      />

      <ChitModal
        isOpen={showChitModal}
        onClose={() => setShowChitModal(false)}
        onLoadChit={loadChit}
      />

      <HeldOrdersModal
        isOpen={showHeldOrdersModal}
        onClose={() => setShowHeldOrdersModal(false)}
        heldOrders={heldOrders}
        voidedHeldOrders={voidedHeldOrders}
        onLoadHeldOrder={loadHeldOrder}
        onPrintReceipt={(order) => {
          // Close held orders modal first
          setShowHeldOrdersModal(false);
          
          // Prepare receipt data for printing
          const receiptInfo = {
            sale: order,
            cart: order.items || [],
            total: order.total_amount || order.items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0,
            paymentMethod: 'pending',
            change: 0,
            customer: order.customer_name ? { name: order.customer_name } : null,
            transactionId: order.id,
            mode: order.sale_type || 'retail',
            isPendingBill: true,
            splitData: null
          };
          setReceiptData(receiptInfo);
          setShowReceiptModal(true);
        }}
      />

      <HeldOrderDetailsModal
        isOpen={showHeldOrderDetailsModal}
        onClose={() => {
          setShowHeldOrderDetailsModal(false);
          clearHeldOrderCart();
        }}
        onProceedToPayment={proceedToPayment}
        heldOrder={selectedHeldOrder}
        products={products}
        categories={categories}
        onOrderVoided={() => fetchHeldOrders()}
        onOrderUpdated={(updatedOrder) => {
          setSelectedHeldOrder({
            ...selectedHeldOrder,
            items: updatedOrder.items,
            total: updatedOrder.total
          });
          fetchHeldOrders();
        }}
      />


      <SalesSummaryModal
        isOpen={salesSummaryData.isOpen}
        onClose={() => setSalesSummaryData({ shiftId: null, isOpen: false })}
        shiftId={salesSummaryData.shiftId}
      />

      <CustomerLookupModal
        isOpen={showCustomerLookupModal}
        onClose={() => setShowCustomerLookupModal(false)}
        onCustomerSelect={handleCustomerSelect}
        mode={mode}
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorDetails.title}
        message={errorDetails.message}
        errors={errorDetails.errors}
        details={errorDetails.details}
      />

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
        }}
        saleData={receiptData?.sale}
        cart={receiptData?.cart || []}
        total={receiptData?.total || 0}
        paymentMethod={receiptData?.paymentMethod || 'cash'}
        change={receiptData?.change || 0}
        customer={receiptData?.customer}
        mode={receiptData?.mode || 'retail'}
        splitData={receiptData?.splitData}
        vatRate={0.16}
        user={user}
        isPendingBill={receiptData?.isPendingBill || false}
      />

      <ReturnCodeModal
        isOpen={showReturnCodeModal}
        onClose={() => setShowReturnCodeModal(false)}
        onApply={handleApplyReturnCode}
      />
    </div>
  );
}

export default PosApp;
