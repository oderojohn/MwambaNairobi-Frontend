// api.js
const API_BASE_URL = 'https://pos-iota-five.vercel.app';
// const API_BASE_URL = 'http://localhost:8000';


// Utility function to safely convert values to numbers
export const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Utility function to safely format numbers as currency
export const formatCurrency = (amount) => {
  const numericAmount = toNumber(amount);
  return `Ksh ${numericAmount.toFixed(2)}`;
};

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pos_access_token',
  REFRESH_TOKEN: 'pos_refresh_token',
  USER_DATA: 'pos_user_data',
  ACCESS_TOKEN_TIMESTAMP: 'pos_access_token_timestamp',
  REFRESH_TOKEN_TIMESTAMP: 'pos_refresh_token_timestamp'
};

// Token expiration times in milliseconds
const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours to match Django
const REFRESH_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 1 day to match Django
const REFRESH_THRESHOLD = 1 * 60 * 1000;

const apiRequest = async (endpoint, method = 'GET', body = null, headers = {}, isRetry = false, queryParams = {}) => {
   try {
     // Only exempt login and refresh endpoints from authentication
     const authExemptEndpoints = ['/api/auth/login/', '/api/auth/refresh/'];
     const isAuthExempt = authExemptEndpoints.some(exempt => endpoint.startsWith(exempt));
     
     if (tokenService.isAuthenticated() && !isAuthExempt && !isRetry) {
       try {
         await tokenService.ensureValidAccessToken();
         headers.Authorization = `Bearer ${tokenService.getAccessToken()}`;
       } catch (error) {
         authService.logout();
         throw new Error('Session expired. Please login again.');
       }
     }

    // Build URL with query parameters
    let url = `${API_BASE_URL}${endpoint}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryString = new URLSearchParams(queryParams).toString();
      url += `?${queryString}`;
    }

    const config = { method, headers: { 'Content-Type': 'application/json', ...headers } };
    if (body) {
      config.body = JSON.stringify(body);
      console.log('Sending request body:', config.body);
    }

    let response;
    try {
      response = await fetch(url, config);
    } catch (networkError) {
      console.error('Network Error:', networkError);
      throw new Error('Cannot connect to server. Please check your internet connection and ensure the backend server is running.');
    }

    if (!response.ok) {
      if (response.status === 401 && !isRetry && tokenService.isAuthenticated()) {
        try {
          await tokenService.refreshIfNeeded();
          return apiRequest(endpoint, method, body, {
            ...headers,
            Authorization: `Bearer ${tokenService.getAccessToken()}`
          }, true);
        } catch (refreshError) {
          // Instead of throwing error, logout and navigate to login
          authService.logout();
          return; // Don't throw, let logout handle navigation
        }
      }
      let errorData = {};
      let errorMessage = '';

      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorData.detail || `Request failed with status ${response.status}`;
      } catch (parseError) {
        // If response is not JSON, provide status-based error message
        if (response.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please check the URL.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage = `Client error: ${response.status} ${response.statusText}`;
        } else if (response.status >= 500) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        } else {
          errorMessage = `Request failed with status ${response.status}`;
        }
      }

      console.error('API Error Response:', errorData);
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log('API Response:', responseData);
    return responseData;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const authService = {
  login: async (username, password) => {
    const response = await apiRequest('/api/auth/login/', 'POST', { username, password });
    tokenService.setTokens(response.access, response.refresh);
    userService.setUserData({ 
      username: response.username,
      name: response.name,
      roles: response.roles,
      user_id: response.user_id,
      shift_status: response.shift_status,
      current_shift: response.current_shift,
      branch: response.branch,
      branch_id: response.branch_id
    });
    return response;
  },

  refreshToken: async () => {
    if (tokenService.isRefreshTokenExpired()) throw new Error('Refresh token expired');
    const refreshToken = tokenService.getRefreshToken();
    const response = await apiRequest('/api/auth/refresh/', 'POST', { refresh: refreshToken });
    tokenService.setAccessToken(response.access);
    console.log('Token refreshed:', response.access);

    return response;
  },

  logout: async () => {
    console.log('Starting logout process...');

    try {
      const isAuthenticated = tokenService.isAuthenticated();
      console.log('Current authentication status:', isAuthenticated);

      if (isAuthenticated) {
        const accessToken = tokenService.getAccessToken();
        const refreshToken = tokenService.getRefreshToken();
        console.log('Attempting server logout with access token and refresh token');

        try {
          // ✅ Send refresh token in request body, access token in Authorization header
          const response = await apiRequest('/api/auth/logout/', 'POST', { refresh: refreshToken }, {
            Authorization: `Bearer ${accessToken}`
          });
          console.log('Server logout successful:', response);
          return response;
        } catch (serverError) {
          console.error('Server logout failed, proceeding with client cleanup:', {
            error: serverError,
            message: serverError.message,
            stack: serverError.stack
          });
        }
      } else {
        console.log('No active session found, proceeding with client cleanup');
      }
    } catch (error) {
      console.error('Unexpected error during logout process:', {
        error: error,
        message: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      try {
        console.log('Clearing client-side authentication data...');
        tokenService.clearTokens();
        userService.clearUserData();
        console.log('Logout process completed');

        // Refresh the page to show login
        window.location.reload();
      } catch (cleanupError) {
        console.error('Error during client cleanup:', {
          error: cleanupError,
          message: cleanupError.message,
          stack: cleanupError.stack
        });
        throw cleanupError;
      }
    }
  }
  
};

export const userService = {
  getUserData: () => {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },
  setUserData: (userData) => localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)),
  clearUserData: () => localStorage.removeItem(STORAGE_KEYS.USER_DATA),
  getUserRole: () => userService.getUserData()?.roles?.[0] || null,
  getShiftStatus: () => userService.getUserData()?.shift_status || null,
  getCurrentShift: () => userService.getUserData()?.current_shift || null
};

export const tokenService = {
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    const now = Date.now().toString();
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_TIMESTAMP, now);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_TIMESTAMP, now);
  },
  setAccessToken: (accessToken) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_TIMESTAMP, Date.now().toString());
  },
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  getAccessTokenTimestamp: () => parseInt(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_TIMESTAMP) || '0', 10),
  getRefreshTokenTimestamp: () => parseInt(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_TIMESTAMP) || '0', 10),
  clearTokens: () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
  isAuthenticated: () => Boolean(tokenService.getAccessToken()) && !tokenService.isAccessTokenExpired(),
  isAccessTokenExpired: () => (Date.now() - tokenService.getAccessTokenTimestamp()) > ACCESS_TOKEN_EXPIRY,
  isRefreshTokenExpired: () => (Date.now() - tokenService.getRefreshTokenTimestamp()) > REFRESH_TOKEN_EXPIRY,
  shouldRefreshAccessToken: () => {
    if (tokenService.isRefreshTokenExpired()) return false;
    return (Date.now() - tokenService.getAccessTokenTimestamp()) > (ACCESS_TOKEN_EXPIRY - REFRESH_THRESHOLD);
  },
  ensureValidAccessToken: async () => {
    if (tokenService.isRefreshTokenExpired()) throw new Error('Refresh token expired');
    if (tokenService.shouldRefreshAccessToken()) await tokenService.refreshIfNeeded();
    if (tokenService.isAccessTokenExpired()) throw new Error('Access token expired');
    return tokenService.getAccessToken();
  },
  refreshIfNeeded: async () => {
    if (!tokenService.shouldRefreshAccessToken()) return tokenService.getAccessToken();
    if (tokenService.isRefreshTokenExpired()) throw new Error('Refresh token expired');
    try {
      await authService.refreshToken();
      return tokenService.getAccessToken();
    } catch (error) {
      authService.logout();
      throw error;
    }
  }
};
export const initializeAuth = () => {
  const refreshToken = tokenService.getRefreshToken();
  if (refreshToken && tokenService.isRefreshTokenExpired()) {
    authService.logout();
    return { isAuthenticated: false, user: null, role: null };
  }
  return {
    isAuthenticated: tokenService.isAuthenticated(),
    user: userService.getUserData(),
    role: userService.getUserRole()
  };
};

export const authAPI = {
  login: (credentials) => apiRequest('/api/auth/login/', 'POST', credentials),
  logout: () => apiRequest('/api/auth/logout/', 'POST'),
  refresh: () => apiRequest('/api/auth/refresh/', 'POST'),
};

export const usersAPI = {
  getUsers: () => apiRequest('/api/users/'),
  createUser: (user) => apiRequest('/api/users/', 'POST', user),
  updateUser: (id, user) => apiRequest(`/api/users/${id}/`, 'PUT', user),
  deleteUser: (id) => apiRequest(`/api/users/${id}/`, 'DELETE'),
};

export const productsAPI = {
  getProducts: () => apiRequest('/api/products/'),
  createProduct: (product) => apiRequest('/api/products/', 'POST', product),
  updateProduct: (id, product) => apiRequest(`/api/products/${id}/`, 'PUT', product),
  deleteProduct: (id) => apiRequest(`/api/products/${id}/`, 'DELETE'),
  getLowStock: () => apiRequest('/api/products/low-stock/'),
};

export const suppliersAPI = {
  getSuppliers: () => apiRequest('/api/suppliers/'),
  createSupplier: (supplier) => apiRequest('/api/suppliers/', 'POST', supplier),
  updateSupplier: (id, supplier) => apiRequest(`/api/suppliers/${id}/`, 'PUT', supplier),
  deleteSupplier: (id) => apiRequest(`/api/suppliers/${id}/`, 'DELETE'),
};

export const purchaseOrdersAPI = {
  getPurchaseOrders: () => apiRequest('/api/purchase-orders/'),
  createPurchaseOrder: (order) => apiRequest('/api/purchase-orders/', 'POST', order),
  getPurchaseOrder: (id) => apiRequest(`/api/purchase-orders/${id}/`),
  updatePurchaseOrder: (id, order) => {
    // Use PATCH for partial updates (like status changes), PUT for full updates
    const method = (Object.keys(order).length === 1 && 'status' in order) ? 'PATCH' : 'PUT';
    return apiRequest(`/api/purchase-orders/${id}/`, method, order);
  },
  deletePurchaseOrder: (id) => apiRequest(`/api/purchase-orders/${id}/`, 'DELETE'),
  receiveBatch: (id, data) => apiRequest(`/api/purchase-orders/${id}/receive_batch/`, 'POST', data),
};

export const salesAPI = {
  getSales: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/sales/?${queryString}` : '/api/sales/';
    return apiRequest(url);
  },
  getSale: (id) => apiRequest(`/api/sales/${id}/`),
  searchByReceipt: (receiptNumber) => apiRequest(`/api/sales/by_receipt/?receipt_number=${receiptNumber}`),
  createSale: async (sale) => {
    try {
      console.log('Creating sale with data:', sale);
      return await apiRequest('/api/sales/', 'POST', sale);
    } catch (error) {
      console.error('Error in salesAPI.createSale:', error);
      throw error;
    }
  },
  updateSale: (id, sale) => apiRequest(`/api/sales/${id}/admin_edit_sale/`, 'PATCH', sale),
  deleteSale: (id) => apiRequest(`/api/sales/${id}/`, 'DELETE'),
  voidSale: (id, data) => apiRequest(`/api/sales/${id}/void_sale/`, 'POST', data),
  adminVoidSale: (id, data) => apiRequest(`/api/sales/${id}/admin_void_sale/`, 'POST', data),
  voidItems: (id, data) => apiRequest(`/api/sales/${id}/void_items/`, 'POST', data),
  getHeldOrders: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/sales/held_orders/?${queryString}` : '/api/sales/held_orders/';
    return apiRequest(url);
  },
  completeHeldOrder: (id, data) => apiRequest(`/api/sales/${id}/complete_held_order/`, 'POST', data),
  updateHeldOrder: (id, data) => apiRequest(`/api/sales/${id}/update_held_order/`, 'POST', data),
  voidHeldOrder: async (id, data) => {
    console.log('Calling voidHeldOrder API:', id, data);
    try {
      const result = await apiRequest(`/api/sales/${id}/void_held_order/`, 'POST', data);
      console.log('voidHeldOrder API response:', result);
      return result;
    } catch (error) {
      console.error('Error in salesAPI.voidHeldOrder:', error);
      throw error;
    }
  },
  getSalesSummary: (params = {}) => apiRequest('/api/reports/sales-summary/', 'GET', null, {}, false, params),
  getSaleChitDetails: (saleId) => apiRequest(`/api/reports/sales-chit/${saleId}/`, 'GET'),
  reprintReceipt: (saleId) => apiRequest(`/api/reports/sales-chit/${saleId}/`, 'GET'),
};

export const cartsAPI = {
  getCarts: () => apiRequest('/api/carts/'),
  getCart: (id) => apiRequest(`/api/carts/${id}/`),
  createCart: (cart) => apiRequest('/api/carts/', 'POST', cart),
  updateCart: (id, cart) => apiRequest(`/api/carts/${id}/`, 'PUT', cart),
  deleteCart: (id) => apiRequest(`/api/carts/${id}/`, 'DELETE'),

  // Cart items management (using separate endpoints)
  getCartItems: () => apiRequest('/api/cart-items/'),
  getCartItem: (id) => apiRequest(`/api/cart-items/${id}/`),
  createCartItem: async (item) => {
    try {
      return await apiRequest('/api/cart-items/', 'POST', item);
    } catch (error) {
      console.error('Error creating cart item:', error, 'Item data:', item);
      throw error;
    }
  },
  updateCartItem: (id, item) => apiRequest(`/api/cart-items/${id}/`, 'PUT', item),
  deleteCartItem: (id) => apiRequest(`/api/cart-items/${id}/`, 'DELETE'),

  // Helper functions for cart management
  getCartWithItems: async (cartId) => {
    try {
      const [cart, allCartItems] = await Promise.all([
        apiRequest(`/api/carts/${cartId}/`),
        apiRequest('/api/cart-items/')
      ]);

      // Filter items for this specific cart
      const cartItems = allCartItems.filter(item => item.cart === parseInt(cartId));

      return { ...cart, items: cartItems };
    } catch (error) {
      console.error('Error loading cart with items:', error);
      throw error;
    }
  },

  addItemToCart: async (cartId, product) => {
    return apiRequest('/api/cart-items/', 'POST', {
      cart: cartId,
      product: product.id,
      quantity: 1,
      unit_price: product.selling_price || product.price,
      discount: 0
    });
  },

  updateCartItemQuantity: async (itemId, quantity) => {
    try {
      return await apiRequest(`/api/cart-items/${itemId}/`, 'PUT', { quantity });
    } catch (error) {
      console.error(`Error updating cart item ${itemId} quantity to ${quantity}:`, error);
      throw error;
    }
  },

  removeCartItem: (id) => apiRequest(`/api/cart-items/${id}/`, 'DELETE'),
};

export const returnsAPI = {
  getReturns: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/returns/?${queryString}` : '/api/returns/';
    return apiRequest(url);
  },
  createReturn: (returnData) => apiRequest('/api/returns/', 'POST', returnData),
  getReturnsSummary: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/reports/returns-summary/?${queryString}` : '/api/reports/returns-summary/';
    return apiRequest(url);
  },
  
  // Return Codes API
  generateReturnCode: (returnRecordId, refundAmount) => 
    apiRequest('/api/returns/return-codes/generate/', 'POST', { 
      return_record_id: returnRecordId, 
      refund_amount: refundAmount 
    }),
  
  validateReturnCode: (code, expectedAmount = null) => {
    const body = { code };
    if (expectedAmount !== null) {
      body.expected_amount = expectedAmount;
    }
    return apiRequest('/api/returns/return-codes/validate/', 'POST', body);
  },
  
  useReturnCode: (code, saleId) => 
    apiRequest('/api/returns/return-codes/use/', 'POST', { 
      code, 
      sale_id: saleId 
    }),
  
  getReturnCodesByReceipt: (receiptNumber) => 
    apiRequest(`/api/returns/return-codes/by_receipt/?receipt_number=${receiptNumber}`),
};

export const invoicesAPI = {
  getInvoices: () => apiRequest('/api/invoices/'),
  createInvoice: (invoice) => apiRequest('/api/invoices/', 'POST', invoice),
  getInvoice: (id) => apiRequest(`/api/invoices/${id}/`),
  updateInvoice: (id, invoice) => apiRequest(`/api/invoices/${id}/`, 'PUT', invoice),
  deleteInvoice: (id) => apiRequest(`/api/invoices/${id}/`, 'DELETE'),
  markPaid: (id) => apiRequest(`/api/invoices/${id}/mark_paid/`, 'POST'),
  sendInvoice: (id) => apiRequest(`/api/invoices/${id}/send_invoice/`, 'POST'),
  generateFromSale: (data) => apiRequest('/api/invoices/generate_from_sale/', 'POST', data),
};

export const paymentsAPI = {
  getPayments: () => apiRequest('/api/payments/'),
  createPayment: async (payment) => {
    try {
      console.log('Creating payment with data:', payment);
      return await apiRequest('/api/payments/', 'POST', payment);
    } catch (error) {
      console.error('Error in paymentsAPI.createPayment:', error);
      throw error;
    }
  },
  getPayment: (id) => apiRequest(`/api/payments/${id}/`),
};

export const installmentsAPI = {
  getInstallments: () => apiRequest('/api/payments/installments/'),
  createInstallment: (installment) => apiRequest('/api/payments/installments/', 'POST', installment),
};

export const customersAPI = {
  getCustomers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/customers/?${queryString}` : '/api/customers/';
    return apiRequest(url);
  },
  lookupCustomer: (phone) => apiRequest(`/api/customers/lookup/?phone=${phone}`),
  createCustomer: (customer) => apiRequest('/api/customers/', 'POST', customer),
  updateCustomer: (id, customer) => apiRequest(`/api/customers/${id}/`, 'PUT', customer),
  deleteCustomer: (id) => apiRequest(`/api/customers/${id}/`, 'DELETE'),
  getLoyalty: (id) => apiRequest(`/api/customers/${id}/loyalty/`),
  updateLoyalty: (id, data) => apiRequest(`/api/customers/${id}/loyalty/`, 'POST', data),
  getCustomerSummary: () => apiRequest('/api/reports/customer-summary/'),
};

export const repairsAPI = {
  getRepairs: () => apiRequest('/api/repairs/'),
  createRepair: (repair) => apiRequest('/api/repairs/', 'POST', repair),
  updateRepair: (id, repair) => apiRequest(`/api/repairs/${id}/`, 'PUT', repair),
  deleteRepair: (id) => apiRequest(`/api/repairs/${id}/`, 'DELETE'),
  getRepairParts: (id) => apiRequest(`/api/repairs/${id}/parts/`),
  addRepairPart: (id, part) => apiRequest(`/api/repairs/${id}/parts/`, 'POST', part),
};

export const preordersAPI = {
  getPreorders: () => apiRequest('/api/preorders/'),
  createPreorder: (preorder) => apiRequest('/api/preorders/', 'POST', preorder),
  updatePreorder: (id, preorder) => apiRequest(`/api/preorders/${id}/`, 'PUT', preorder),
  deletePreorder: (id) => apiRequest(`/api/preorders/${id}/`, 'DELETE'),
};

export const supplierPricesAPI = {
  getPrices: () => apiRequest('/api/supplier-prices/'),
  addPrice: (price) => apiRequest('/api/supplier-prices/', 'POST', price),
};

export const chitsAPI = {
  getChits: () => apiRequest('/api/chits/'),
  createChit: (chit) => apiRequest('/api/chits/', 'POST', chit),
  updateChit: (id, chit) => apiRequest(`/api/chits/${id}/`, 'PUT', chit),
  deleteChit: (id) => apiRequest(`/api/chits/${id}/`, 'DELETE'),
};

export const shiftsAPI = {
  getShifts: (limit = null) => {
    const params = limit ? { limit } : {};
    return apiRequest('/api/shifts/', 'GET', null, {}, false, params);
  },
  getCurrentShift: (userId = null) => {
    const queryParams = userId ? { user_id: userId } : {};
    return apiRequest('/api/shifts/current/', 'GET', null, {}, false, queryParams);
  },
  startShift: (data) => apiRequest('/api/shifts/start/', 'POST', data),
  endShift: (data) => apiRequest('/api/shifts/end/', 'POST', data),
  getAllShifts: (params = {}) => apiRequest('/api/shifts/all/', 'GET', null, {}, false, params),
  getShift: (shiftId) => apiRequest(`/api/shifts/${shiftId}/`),
  getShiftsSummary: () => apiRequest('/api/shifts/summary/'),
  getShiftSummary: () => apiRequest('/api/reports/shift-summary/'),
  // Admin shift management
  reopenShift: (shiftId, data) => apiRequest(`/api/shifts/${shiftId}/reopen/`, 'POST', data),
  forceCloseShift: (shiftId, data) => apiRequest(`/api/shifts/${shiftId}/force_close/`, 'POST', data),
};

export const reportsAPI = {
  // Summary endpoints for dashboard and reports
  getSalesSummary: (params = {}) => apiRequest('/api/reports/sales-summary/', 'GET', null, {}, false, params),
  getInventorySummary: () => apiRequest('/api/reports/inventory-summary/'),
  getCustomerSummary: () => apiRequest('/api/reports/customer-summary/'),
  getShiftSummary: () => apiRequest('/api/reports/shift-summary/?report=detailed'),
  getTodaySummary: () => apiRequest('/api/reports/sales-summary/?today_summary=true'),
  getProfitLossSummary: (params = {}) => apiRequest('/api/reports/profitloss-summary/', 'GET', null, {}, false, params),

  // PDF generation endpoints
  generateProductPriceListPDF: async (priceType = 'both') => {
    const url = `/api/reports/product-price-list-pdf/?price_type=${priceType}`;

    // Special handling for PDF downloads (blob response)
    if (tokenService.isAuthenticated()) {
      await tokenService.ensureValidAccessToken();
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: tokenService.isAuthenticated() ? {
        'Authorization': `Bearer ${tokenService.getAccessToken()}`,
      } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.status}`);
    }

    return response.blob();
  },

  // Report data endpoints (using summary data for now)
  generateSalesReport: (data, queryParams) => apiRequest('/api/reports/sales-summary/', 'GET', null, {}, false, queryParams),
  generateInventoryReport: (queryParams = {}) => apiRequest('/api/reports/inventory-summary/', 'GET', null, {}, false, queryParams),
  generateCustomerReport: (queryParams = {}) => apiRequest('/api/reports/customer-summary/', 'GET', null, {}, false, queryParams),
  generateProfitLossReport: (data) => apiRequest('/api/reports/sales-summary/'), // Will be enhanced later

  // Legacy report endpoints (if needed)
  getSalesReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/reports/sales-summary/?${queryString}` : '/api/reports/sales-summary/';
    return apiRequest(url);
  },
  getInventoryReport: () => apiRequest('/api/reports/inventory/'),
  getFinanceReport: () => apiRequest('/api/reports/finance/'),
  getRepairsReport: () => apiRequest('/api/reports/repairs/'),
  getPreordersReport: () => apiRequest('/api/reports/preorders/'),
  getShiftsReport: () => apiRequest('/api/reports/shifts/'),
};

export const branchesAPI = {
  getBranches: () => apiRequest('/api/branches/'),
  createBranch: (branch) => apiRequest('/api/branches/', 'POST', branch),
  updateBranch: (id, branch) => apiRequest(`/api/branches/${id}/`, 'PUT', branch),
  deleteBranch: (id) => apiRequest(`/api/branches/${id}/`, 'DELETE'),
};

export const settingsAPI = {
  // General settings
  getGeneralSettings: () => apiRequest('/api/settings/settings/general/'),
  updateGeneralSettings: (data) => apiRequest('/api/settings/settings/general/', 'PATCH', data),

  // Business settings
  getBusinessSettings: () => apiRequest('/api/settings/settings/business/'),
  updateBusinessSettings: (data) => apiRequest('/api/settings/settings/business/', 'PATCH', data),

  // Inventory settings
  getInventorySettings: () => apiRequest('/api/settings/settings/inventory/'),
  updateInventorySettings: (data) => apiRequest('/api/settings/settings/inventory/', 'PATCH', data),

  // POS settings
  getPOSSettings: () => apiRequest('/api/settings/settings/pos/'),
  updatePOSSettings: (data) => apiRequest('/api/settings/settings/pos/', 'PATCH', data),

  // User settings
  getUserSettings: () => apiRequest('/api/settings/settings/users/'),
  updateUserSettings: (data) => apiRequest('/api/settings/settings/users/', 'PATCH', data),

  // System settings
  getSystemSettings: () => apiRequest('/api/settings/settings/system/'),
  updateSystemSettings: (data) => apiRequest('/api/settings/settings/system/', 'PATCH', data),

  // Full settings
  getAllSettings: () => apiRequest('/api/settings/settings/'),
  updateAllSettings: (data) => apiRequest('/api/settings/settings/', 'PATCH', data),

  // Utility endpoints
  resetToDefaults: () => apiRequest('/api/settings/settings/reset_to_defaults/', 'POST'),
  getSettingsSummary: () => apiRequest('/api/settings/settings/summary/'),
};

export const inventoryAPI = {
  categories: {
    getAll: () => apiRequest('/api/inventory/categories/'),
    create: (category) => apiRequest('/api/inventory/categories/', 'POST', category),
    update: (id, category) => apiRequest(`/api/inventory/categories/${id}/`, 'PUT', category),
    delete: (id) => apiRequest(`/api/inventory/categories/${id}/`, 'DELETE'),
  },
  products: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/api/inventory/products/?${queryString}` : '/api/inventory/products/';
      return apiRequest(url);
    },
    getPosProducts: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/api/inventory/products/pos_products/?${queryString}` : '/api/inventory/products/pos_products/';
      return apiRequest(url);
    },
    recalculateStock: () => apiRequest('/api/inventory/products/recalculate_stock/', 'POST'),
    syncStock: (productId) => apiRequest(`/api/inventory/products/${productId}/sync_stock/`, 'POST'),
    create: (product) => apiRequest('/api/inventory/products/', 'POST', product),
    update: (id, product) => apiRequest(`/api/inventory/products/${id}/`, 'PUT', product),
    delete: (id) => apiRequest(`/api/inventory/products/${id}/`, 'DELETE'),
  },
  batches: {
    getAll: () => apiRequest('/api/inventory/batches/'),
    create: (batch) => apiRequest('/api/inventory/batches/', 'POST', batch),
    update: (id, batch) => apiRequest(`/api/inventory/batches/${id}/`, 'PUT', batch),
    delete: (id) => apiRequest(`/api/inventory/batches/${id}/`, 'DELETE'),
    receive: (id, data = {}) => apiRequest(`/api/inventory/batches/${id}/receive/`, 'POST', data),
  },
  stockMovements: {
    getAll: () => apiRequest('/api/inventory/stock-movements/'),
    create: (movement) => apiRequest('/api/inventory/stock-movements/', 'POST', movement),
    update: (id, movement) => apiRequest(`/api/inventory/stock-movements/${id}/`, 'PUT', movement),
    delete: (id) => apiRequest(`/api/inventory/stock-movements/${id}/`, 'DELETE'),
  },
  suppliers: {
    getAll: () => apiRequest('/api/inventory/suppliers/'),
    create: (supplier) => apiRequest('/api/inventory/suppliers/', 'POST', supplier),
    update: (id, supplier) => apiRequest(`/api/inventory/suppliers/${id}/`, 'PUT', supplier),
    delete: (id) => apiRequest(`/api/inventory/suppliers/${id}/`, 'DELETE'),
  },
  purchases: {
    getAll: () => apiRequest('/api/inventory/purchases/'),
    create: (purchase) => apiRequest('/api/inventory/purchases/', 'POST', purchase),
    update: (id, purchase) => apiRequest(`/api/inventory/purchases/${id}/`, 'PUT', purchase),
    delete: (id) => apiRequest(`/api/inventory/purchases/${id}/`, 'DELETE'),
  },
  priceHistory: {
    getAll: () => apiRequest('/api/inventory/price-history/'),
    create: (history) => apiRequest('/api/inventory/price-history/', 'POST', history),
    update: (id, history) => apiRequest(`/api/inventory/price-history/${id}/`, 'PUT', history),
    delete: (id) => apiRequest(`/api/inventory/price-history/${id}/`, 'DELETE'),
    byProduct: (productId) => apiRequest(`/api/inventory/price-history/product/${productId}/`),
    bySupplier: (supplierId) => apiRequest(`/api/inventory/price-history/supplier/${supplierId}/`),
  },
  salesHistory: {
    getAll: () => apiRequest('/api/inventory/sales-history/'),
    create: (history) => apiRequest('/api/inventory/sales-history/', 'POST', history),
    update: (id, history) => apiRequest(`/api/inventory/sales-history/${id}/`, 'PUT', history),
    delete: (id) => apiRequest(`/api/inventory/sales-history/${id}/`, 'DELETE'),
    byProduct: (productId) => apiRequest(`/api/inventory/sales-history/product/${productId}/`),
    byCustomer: (customerId) => apiRequest(`/api/inventory/sales-history/customer/${customerId}/`),
    byDateRange: (params) => apiRequest('/api/inventory/sales-history/date/', 'GET', null, {}, false, params),
  },
  productHistory: {
    getAll: () => apiRequest('/api/inventory/product-history/'),
    create: (history) => apiRequest('/api/inventory/product-history/', 'POST', history),
    update: (id, history) => apiRequest(`/api/inventory/product-history/${id}/`, 'PUT', history),
    delete: (id) => apiRequest(`/api/inventory/product-history/${id}/`, 'DELETE'),
    byProduct: (productId) => apiRequest(`/api/inventory/product-history/product/${productId}/`),
  },
  timeline: {
    getProductTimeline: (productId, params = {}) => apiRequest(`/api/inventory/products/${productId}/timeline/`, 'GET', null, {}, false, params),
  },
  endOfDayStock: {
    getReport: (params = {}) => apiRequest('/api/inventory/reports/end-of-day-stock/', 'GET', null, {}, false, params),
  },
  reports: {
    stock: () => apiRequest('/api/inventory/reports/stock/'),
    purchases: () => apiRequest('/api/inventory/reports/purchases/'),
    supplierPerformance: () => apiRequest('/api/inventory/reports/supplier/'),
    valuation: () => apiRequest('/api/inventory/reports/valuation/'),
  },
  // Legacy methods for backward compatibility
  getCategories: () => apiRequest('/api/inventory/categories/'),
  createCategory: (category) => apiRequest('/api/inventory/categories/', 'POST', category),
  updateCategory: (id, category) => apiRequest(`/api/inventory/categories/${id}/`, 'PUT', category),
  deleteCategory: (id) => apiRequest(`/api/inventory/categories/${id}/`, 'DELETE'),
  getProducts: (queryParams = {}) => apiRequest('/api/inventory/products/', 'GET', null, {}, false, queryParams),
  getProductHistory: (queryParams = {}) => apiRequest('/api/inventory/product-history/', 'GET', null, {}, false, queryParams),
  createProduct: (product) => apiRequest('/api/inventory/products/', 'POST', product),
  updateProduct: (id, product) => apiRequest(`/api/inventory/products/${id}/`, 'PUT', product),
  deleteProduct: (id) => apiRequest(`/api/inventory/products/${id}/`, 'DELETE'),
  getLowStock: () => apiRequest('/api/inventory/products/low-stock/'),
  getStockMovements: () => apiRequest('/api/inventory/stock-movements/'),
  createStockMovement: (movement) => apiRequest('/api/inventory/stock-movements/', 'POST', movement),
  getInventorySummary: () => apiRequest('/api/reports/inventory-summary/'),
};

// KRA eTIMS Integration API
export const etimsAPI = {
  // Configuration
  getConfigs: () => apiRequest('/api/etims/config/'),
  getConfig: (id) => apiRequest(`/api/etims/config/${id}/`),
  createConfig: (data) => apiRequest('/api/etims/config/', 'POST', data),
  updateConfig: (id, data) => apiRequest(`/api/etims/config/${id}/`, 'PUT', data),
  deleteConfig: (id) => apiRequest(`/api/etims/config/${id}/`, 'DELETE'),
  getActiveConfig: () => apiRequest('/api/etims/config/active/'),
  setActiveConfig: (id) => apiRequest('/api/etims/config/set_active/', 'POST', { id }),

  // Fiscal Receipts
  getReceipts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/etims/receipts/?${queryString}`);
  },
  getReceipt: (id) => apiRequest(`/api/etims/receipts/${id}/`),
  registerReceipt: (id) => apiRequest(`/api/etims/receipts/${id}/register/`, 'POST'),
  registerAllPending: () => apiRequest('/api/etims/receipts/register_all_pending/', 'POST'),
  voidReceipt: (id, reason) => apiRequest(`/api/etims/receipts/${id}/void/`, 'POST', { reason }),

  // Offline Queue
  getOfflineQueue: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/etims/offline/?${queryString}`);
  },
  syncOfflineTransactions: () => apiRequest('/api/etims/offline/sync/', 'POST'),

  // API Logs
  getApiLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/etims/logs/?${queryString}`);
  },
  getRecentLogs: (limit = 50) => apiRequest(`/api/etims/logs/recent/?limit=${limit}`),

  // Status
  checkConnection: () => apiRequest('/api/etims/status/check/'),
  getSummary: () => apiRequest('/api/etims/status/summary/'),
};


