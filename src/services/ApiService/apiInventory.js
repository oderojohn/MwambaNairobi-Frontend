// apiInventory.js
import { apiRequest } from './apiBase.js';

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

export const returnsAPI = {
  getReturns: () => apiRequest('/api/returns/'),
  createReturn: (returnData) => apiRequest('/api/returns/', 'POST', returnData),
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
  getProducts: () => apiRequest('/api/inventory/products/'),
  createProduct: (product) => apiRequest('/api/inventory/products/', 'POST', product),
  updateProduct: (id, product) => apiRequest(`/api/inventory/products/${id}/`, 'PUT', product),
  patchProduct: (id, product) => apiRequest(`/api/inventory/products/${id}/`, 'PATCH', product),
  deleteProduct: (id) => apiRequest(`/api/inventory/products/${id}/`, 'DELETE'),
  getLowStock: () => apiRequest('/api/inventory/products/low-stock/'),
  getStockMovements: () => apiRequest('/api/inventory/stock-movements/'),
  createStockMovement: (movement) => apiRequest('/api/inventory/stock-movements/', 'POST', movement),
  getInventorySummary: () => apiRequest('/api/reports/inventory-summary/'),

  // Price schedules
  getPriceSchedules: (params = {}) => apiRequest('/api/inventory/price-schedules/', 'GET', null, {}, false, params),
  createPriceSchedule: (schedule) => apiRequest('/api/inventory/price-schedules/', 'POST', schedule),
  updatePriceSchedule: (id, schedule) => apiRequest(`/api/inventory/price-schedules/${id}/`, 'PUT', schedule),
  deletePriceSchedule: (id) => apiRequest(`/api/inventory/price-schedules/${id}/`, 'DELETE'),
  applyPriceSchedule: (id) => apiRequest(`/api/inventory/price-schedules/${id}/apply_now/`, 'POST'),

  // Product logs and history
  getProductLogs: (productId) => apiRequest('/api/inventory/logs/', 'GET', null, {}, false, { object_type: 'product', object_id: productId }),
  getProductHistory: (productId) => apiRequest(`/api/inventory/product-history/product/${productId}/`),
  
  // Current user
  getCurrentUser: () => apiRequest('/api/auth/me/'),
};