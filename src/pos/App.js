import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import ShoppingCart from './components/ShoppingCart';
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
import { inventoryAPI, salesAPI, shiftsAPI, chitsAPI, paymentsAPI, customersAPI, suppliersAPI, toNumber, formatCurrency } from '../services/ApiService/api';
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChitModal, setShowChitModal] = useState(false);
  const [salesSummaryData, setSalesSummaryData] = useState({ shiftId: null, isOpen: false });
  const [showCustomerLookupModal, setShowCustomerLookupModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('cash');
  const [chits, setChits] = useState([]);
  const [heldOrders, setHeldOrders] = useState([]);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [showHeldOrderDetailsModal, setShowHeldOrderDetailsModal] = useState(false);
  const [selectedHeldOrder, setSelectedHeldOrder] = useState(null);
  const [currentHeldOrderId, setCurrentHeldOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('retail');
  const [showErrorModal, setShowErrorModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [errorDetails, setErrorDetails] = useState({ title: '', message: '', details: '', errors: [] });
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Function to refresh shift data
  const refreshShiftData = async () => {
    try {
      const currentShiftRes = await shiftsAPI.getCurrentShift().catch(() => null);
      if (currentShiftRes) {
        console.log('Refreshed shift data:', currentShiftRes);

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
          startingCash: parseFloat(currentShiftRes.opening_balance),
          total_sales: parseFloat(currentShiftRes.total_sales || 0),
          transaction_count: currentShiftRes.transaction_count || 0
        });
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
      const [productsRes, categoriesRes, customersRes, suppliersRes, chitsRes, currentShiftRes] = await Promise.all([
        inventoryAPI.products.getAll({ mode: currentMode }),
        inventoryAPI.categories.getAll(),
        customersAPI.getCustomers({ mode: currentMode }),
        suppliersAPI.getSuppliers(),
        chitsAPI.getChits(),
        shiftsAPI.getCurrentShift().catch(() => null)
      ]);

      setProducts(productsRes || []);
      setCategories(categoriesRes || []);
      setCustomers(customersRes || []);
      setSuppliers(suppliersRes || []);
      setChits(chitsRes || []);

      if (currentShiftRes) {
        console.log('Active shift found:', currentShiftRes);

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
          startingCash: parseFloat(currentShiftRes.opening_balance),
          total_sales: parseFloat(currentShiftRes.total_sales || 0),
          transaction_count: currentShiftRes.transaction_count || 0
        });
        setShowShiftModal(false);
      } else {
        console.log('No active shift found - showing modal');
        setCurrentShift(null);
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

  // Handle mode changes
  const handleModeChange = async (newMode) => {
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

  const addToCart = (product) => {
    // Strict shift check - no operations allowed without active shift
    if (!currentShift) {
      setShowShiftModal(true);
      showError('Shift Required', 'You must start a shift before adding items to cart.');
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
  };

  const updateQuantity = (productId, change) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item.id === productId);
      if (!item) return prevCart;

      const newQuantity = item.quantity + change;
      
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
  };

  const removeItem = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const newSale = () => {
    if (cart.length > 0) {
      const confirmNew = window.confirm('Start a new sale? This will clear the current cart.');
      if (!confirmNew) return;
    }
    setCart([]);
    setSelectedCustomer(null);
    setCurrentHeldOrderId(null);
  };

  const startShift = async (startingCash) => {
    try {
      const shiftData = {
        starting_cash: startingCash
      };
      await shiftsAPI.startShift(shiftData);

      // Refresh shift data to get accurate information from backend
      await refreshShiftData();

      setShowShiftModal(false);
    } catch (error) {
      console.error('Error starting shift:', error);
      Swal.fire({
        icon: 'error',
        title: 'Shift Start Failed',
        text: 'Failed to start shift. Please try again.',
        zIndex: 10000
      });
    }
  };

  const endShift = async () => {
    try {
      // Ask for ending cash amount
      const endingCash = prompt('Enter ending cash amount (KSh):', '0');
      if (endingCash === null) return;

      const endingCashAmount = parseFloat(endingCash) || 0;
      if (isNaN(endingCashAmount)) {
        showError('Invalid Amount', 'Please enter a valid number for ending cash.');
        return;
      }

      const response = await shiftsAPI.endShift({ ending_cash: endingCashAmount });

      // Refresh shift data to confirm shift is ended
      await refreshShiftData();

      setShowShiftModal(false);

      // Display detailed reconciliation information
      const recon = response.reconciliation;
      const discrepancyType = recon.discrepancy_type;
      const discrepancyAmount = Math.abs(recon.discrepancy);

      let message = `🧾 Shift Closed Successfully!\n\n`;
      message += `📊 Shift Summary:\n`;
      message += `• Opening Balance: KSh ${recon.opening_balance.toFixed(2)}\n`;
      message += `• Cash Sales: KSh ${recon.cash_sales.toFixed(2)}\n`;
      message += `• Card Sales: KSh ${recon.card_sales.toFixed(2)}\n`;
      message += `• Mobile Sales: KSh ${recon.mobile_sales.toFixed(2)}\n`;
      message += `• Total Sales: KSh ${recon.total_sales.toFixed(2)}\n\n`;

      message += `💰 Cash Reconciliation:\n`;
      message += `• Expected Cash: KSh ${recon.expected_closing_balance.toFixed(2)}\n`;
      message += `• Actual Cash: KSh ${recon.actual_closing_balance.toFixed(2)}\n`;
      message += `• ${recon.discrepancy_description}\n`;

      if (discrepancyType === 'shortage') {
        message += `\n⚠️ SHORTAGE DETECTED: KSh ${discrepancyAmount.toFixed(2)}\n`;
        message += `Please investigate the missing amount.`;
      } else if (discrepancyType === 'overage') {
        message += `\n✅ OVERAGE DETECTED: KSh ${discrepancyAmount.toFixed(2)}\n`;
        message += `Additional cash found in register.`;
      } else {
        message += `\n✅ PERFECT BALANCE: Register is balanced!`;
      }

      alert(message);
    } catch (error) {
      console.error('Error ending shift:', error);
      Swal.fire({
        icon: 'error',
        title: 'Shift End Failed',
        text: 'Failed to end shift. Please try again.',
        zIndex: 10000
      });
    }
  };

  const processPayment = async (paymentData) => {
    try {
      console.log('Processing payment with data:', paymentData);

      // Validate cart
      const cartErrors = validateCartForSale(cart, mode, selectedCustomer);
      if (cartErrors.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Cart Validation Failed',
          text: 'Please fix the following issues before proceeding:\n\n' + cartErrors.join('\n'),
          zIndex: 10000
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

      // Show loading Swal in upper left
      const loadingSwal = Swal.fire({
        title: 'Processing Payment...',
        text: 'Please wait while we process your payment',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        zIndex: 99999,
        position: 'top-start',
        toast: true,
        showClass: {
          popup: 'animate__animated animate__fadeInLeft'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutLeft'
        },
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Check if this is a held order being completed
      if (currentHeldOrderId) {
        await completeHeldOrder(currentHeldOrderId, paymentData);
        loadingSwal.close();
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
        payment_method: paymentData.splitPayment ? 'split' : paymentData.method,
        customer: selectedCustomer ? selectedCustomer.id : null,
        receipt_number: `POS-${Date.now()}`,
        sale_type: mode
      };

      // Add split data if split payment
      if (paymentData.splitPayment) {
        cartData.split_data = {
          cash: Number(paymentData.cashAmount || 0),
          mpesa: Number(paymentData.mpesaAmount || 0),
          card: Number(paymentData.cardAmount || 0)
        };
      }

      console.log('Sending cart data to backend:', cartData);

      // Send to backend
      const sale = await salesAPI.createSale(cartData);
      console.log('Sale created successfully:', sale);

      // Create payment record
      const paymentRecord = {
        sale: sale.id,
        payment_type: paymentData.method.toLowerCase(),
        amount: Number(total),
        reference_number: paymentData.transactionId || null,
        status: 'completed'
      };

      // Add payment method specific data if available
      if (paymentData.mpesaNumber) {
        paymentRecord.mpesa_number = paymentData.mpesaNumber;
      }

      console.log('Creating payment record:', paymentRecord);

      // Validate sale ID
      if (!sale.id) {
        loadingSwal.close();
        Swal.fire({
          icon: 'error',
          title: 'Invalid Sale',
          text: 'Sale was created but no sale ID was returned.',
          zIndex: 10000
        });
        return;
      }

      // Create payment record
      await paymentsAPI.createPayment(paymentRecord);

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

      loadingSwal.close();

      // Prepare receipt data
      const receiptInfo = {
        sale: sale,
        cart: [...cart], // Copy current cart
        total: total,
        paymentMethod: paymentData.method,
        change: paymentData.cashReceived ? paymentData.cashReceived - total : 0,
        customer: selectedCustomer,
        transactionId: paymentData.transactionId
      };

      setReceiptData(receiptInfo);
      setShowReceiptModal(true);

      // Clear cart and close modal
      setCart([]);
      setCurrentHeldOrderId(null);
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

  const holdOrder = async () => {
    try {
      console.log('Attempting to hold order with cart:', cart);

      // Validate cart before holding
      const cartErrors = validateCartForSale(cart, mode, selectedCustomer);
      if (cartErrors.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Cannot Hold Order',
          text: 'Please fix the following issues before holding the order:\n\n' + cartErrors.join('\n'),
          zIndex: 10000
        });
        return;
      }

      // Show loading Swal
      const loadingSwal = Swal.fire({
        title: 'Holding Order...',
        text: 'Please wait while we save your order',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        zIndex: 10000,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Prepare cart data for backend with hold_order flag
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
        receipt_number: `HOLD-${Date.now()}`,
        sale_type: mode,
        hold_order: true
      };

      console.log('Holding order with data:', cartData);

      // Send to backend to create held cart
      const heldCart = await salesAPI.createSale(cartData);
      console.log('Order held successfully:', heldCart);

      loadingSwal.close();

      // Clear cart and customer
      setCart([]);
      setSelectedCustomer(null);
      setCurrentHeldOrderId(null);

      Swal.fire({
        icon: 'success',
        title: 'Order Held',
        text: 'Order held successfully! You can retrieve it later to complete payment.',
        timer: 2000,
        showConfirmButton: false,
        zIndex: 10000
      });
    } catch (error) {
      console.error('Error holding order:', error);

      // Close loading if it's still open
      Swal.close();

      if (error.response?.data) {
        let errorMessage = 'Failed to hold order.';
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
          title: 'Hold Order Failed',
          text: errorMessage + (errorList.length > 0 ? '\n\nDetails:\n' + errorList.join('\n') : ''),
          zIndex: 10000
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Hold Order Error',
          text: error.message || 'Error holding order. Please try again.',
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

  const fetchHeldOrders = async () => {
    try {
      const response = await salesAPI.getHeldOrders();
      setHeldOrders(response || []);
    } catch (error) {
      console.error('Error fetching held orders:', error);
      setHeldOrders([]);
      Swal.fire({
        icon: 'error',
        title: 'Held Orders Error',
        text: 'Failed to load held orders. Please try again.',
        zIndex: 10000
      });
    }
  };

  const loadHeldOrder = (heldOrder) => {
    setSelectedHeldOrder(heldOrder);
    setShowHeldOrdersModal(false);
    setShowHeldOrderDetailsModal(true);
  };

  const proceedToPayment = async (heldOrder) => {
    try {
      console.log('Loading held order to cart for payment:', heldOrder);

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
            updated_at: null
          };
        }
      });

      console.log('Setting cart items:', cartItems);
      setCart(cartItems);

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
      console.log('Set currentHeldOrderId to:', heldOrder.id);


      console.log('Closing held order details modal');
      setShowHeldOrderDetailsModal(false);

      // Small delay to ensure state updates before opening payment modal
      setTimeout(() => {
        console.log('Opening payment modal with total:', total, 'cart length:', cart.length);
        setShowPaymentModal(true);
      }, 100);
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

  const completeHeldOrder = async (heldOrderId, paymentData) => {
    try {
      console.log('Completing held order:', heldOrderId, 'with payment:', paymentData);

      // Validate cart for held order completion
      const cartErrors = validateCartForSale(cart, mode, selectedCustomer);
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

      // Calculate totals from current cart
      const cartData = {
        tax_amount: 0,
        discount_amount: 0,
        total_amount: total,
        payment_method: paymentData.method,
        receipt_number: `POS-${Date.now()}`,
        sale_type: mode
      };

      console.log('Completing held order with data:', cartData);

      // Complete the held order
      const sale = await salesAPI.completeHeldOrder(heldOrderId, cartData);
      console.log('Held order completed successfully:', sale);

      // Create payment record
      const paymentRecord = {
        sale: sale.id,
        payment_type: paymentData.method,
        amount: Number(total),
        reference_number: paymentData.transactionId || null,
        status: 'completed'
      };

      if (paymentData.mpesaNumber) {
        paymentRecord.mpesa_number = paymentData.mpesaNumber;
      }

      await paymentsAPI.createPayment(paymentRecord);

      // Refresh shift data to update totals
      await refreshShiftData();

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
        transactionId: paymentData.transactionId
      };

      setReceiptData(receiptInfo);
      setShowReceiptModal(true);

      // Clear cart and close modals
      setCart([]);
      setSelectedCustomer(null);
      setCurrentHeldOrderId(null);
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
  const validateCartForSale = (cartItems, mode, selectedCustomer) => {
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

      // Check stock availability
      if (item.stock_quantity !== undefined && item.stock_quantity < quantity) {
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
      const validMethods = ['cash', 'mpesa'];
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
    if (paymentData.splitPayment) {
      const splitTotal = (paymentData.cashAmount || 0) + (paymentData.mpesaAmount || 0) + (paymentData.cardAmount || 0);
      if (Math.abs(splitTotal - totalAmount) > 0.01) { // Allow for floating point precision
        errors.push(`Split payment total (${formatCurrency(splitTotal)}) does not match sale total (${formatCurrency(totalAmount)})`);
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
  const total = Math.round(Number(subtotal));

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
        onPrint={() => window.print()}
        onLogout={logout}
        onOpenOrderPreparation={openOrderPreparation}
        currentShift={currentShift}
        mode={mode}
        onModeChange={handleModeChange}
        onCustomerLookup={() => setShowCustomerLookupModal(true)}
        onCustomerClear={handleCustomerClear}
        selectedCustomer={selectedCustomer}
      />

      {!currentShift && !showShiftModal && (
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
      )}

      <ProductGrid
        products={products}
        categories={categories}
        onAddToCart={currentShift ? addToCart : () => {}}
        loading={loading}
        disabled={!currentShift}
      />

      <ShoppingCart
        cart={cart}
        categories={categories}
        onUpdateQuantity={currentShift ? updateQuantity : () => {}}
        onRemoveItem={currentShift ? removeItem : () => {}}
        onProcessPayment={currentShift ? () => setShowPaymentModal(true) : () => {}}
        onHoldOrder={currentShift ? holdOrder : () => {}}
        disabled={!currentShift}
        selectedCustomer={selectedCustomer}
        mode={mode}
        onCustomerClear={handleCustomerClear}
      />

      <ShiftModal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        onStartShift={startShift}
        onEndShift={endShift}
        onViewSalesSummary={(shiftId) => setSalesSummaryData({ shiftId, isOpen: true })}
        currentShift={currentShift}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
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
        chits={chits}
        onLoadChit={loadChit}
      />

      <HeldOrdersModal
        isOpen={showHeldOrdersModal}
        onClose={() => setShowHeldOrdersModal(false)}
        heldOrders={heldOrders}
        onLoadHeldOrder={loadHeldOrder}
      />

      <HeldOrderDetailsModal
        isOpen={showHeldOrderDetailsModal}
        onClose={() => {
          setShowHeldOrderDetailsModal(false);
          setCart([]);
          setSelectedCustomer(null);
          setCurrentHeldOrderId(null);
        }}
        onProceedToPayment={proceedToPayment}
        heldOrder={selectedHeldOrder}
        products={products}
        onOrderVoided={() => fetchHeldOrders()}
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
        onClose={() => setShowReceiptModal(false)}
        saleData={receiptData?.sale}
        cart={receiptData?.cart || []}
        total={receiptData?.total || 0}
        paymentMethod={receiptData?.paymentMethod || 'cash'}
        change={receiptData?.change || 0}
        customer={receiptData?.customer}
      />
    </div>
  );
}

export default PosApp;