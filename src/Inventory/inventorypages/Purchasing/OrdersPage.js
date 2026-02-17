import React, { useState, useEffect } from 'react';
import {
  FiPlus, FiSearch,
   FiTrash2, FiX, FiSave, FiCheck, FiXCircle, FiChevronDown, FiChevronRight
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { purchaseOrdersAPI, suppliersAPI, inventoryAPI } from '../../../services/ApiService/api';
import '../../../assets/pagesStyles/orders.css';

const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [currentItemIndex, setCurrentItemIndex] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    supplier: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: []
  });

  // Load orders, suppliers, and products
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading purchase orders data...');

      const [suppliersData, ordersData, productsData] = await Promise.all([
        suppliersAPI.getSuppliers().catch(err => {
          console.error('Error loading suppliers:', err);
          return [];
        }),
        purchaseOrdersAPI.getPurchaseOrders().catch(err => {
          console.error('Error loading purchase orders:', err);
          return [];
        }),
        inventoryAPI.products.getAll().catch(err => {
          console.error('Error loading products:', err);
          return [];
        })
      ]);

      // Handle paginated responses - ensure products is always an array
      const productsArray = Array.isArray(productsData)
        ? productsData
        : (productsData?.results || productsData?.data || []);

      console.log('Loaded data:', {
        suppliers: suppliersData?.length || 0,
        orders: ordersData?.length || 0,
        products: productsArray.length || 0
      });

      setOrders(ordersData || []);
      setSuppliers(suppliersData || []);
      setProducts(productsArray);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load purchase orders: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Load orders, suppliers, and products on component mount
  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.supplier_name && order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          order.id.toString().includes(searchTerm) ||
                          (order.order_number && order.order_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProducts = (products || []).filter(product =>
    product.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // eslint-disable-next-line no-unused-vars
  const handleAddItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, {
        product: '',
        product_name: '',
        quantity: 1,
        unit_price: 0,
        cost_price: 0,
        notes: ''
      }]
    }));
  };

  const handleRemoveItem = (index) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setNewOrder(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      return { ...prev, items: updatedItems };
    });
  };

  const handleProductSelect = (index, product) => {
    if (!product || !product.id) return;
    setNewOrder(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        product: product.id,
        product_name: product.name,
        unit_price: product.selling_price || 0,
        cost_price: product.cost_price || 0
      };
      return { ...prev, items: updatedItems };
    });
    setShowProductModal(false);
    setCurrentItemIndex(null);
  };

  const calculateItemTotal = (item) => {
    return (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  };

  const calculateOrderTotal = () => {
    return newOrder.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleSaveOrder = async () => {
    if (!newOrder.supplier) {
      alert('Please select a supplier');
      return;
    }
    if (newOrder.items.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    try {
      const orderData = {
        ...newOrder,
        items: newOrder.items.map(item => ({
          product: item.product,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          notes: item.notes
        }))
      };

      await purchaseOrdersAPI.createPurchaseOrder(orderData);
      setShowAddModal(false);
      setNewOrder({
        supplier: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        items: []
      });
      loadData();
    } catch (err) {
      console.error('Error creating purchase order:', err);
      alert('Failed to create purchase order: ' + (err.message || 'Unknown error'));
    }
  };

  const handleReceiveOrder = async (order) => {
    try {
      await purchaseOrdersAPI.receivePurchaseOrder(order.id);
      loadData();
    } catch (err) {
      console.error('Error receiving purchase order:', err);
      alert('Failed to receive purchase order: ' + (err.message || 'Unknown error'));
    }
  };

  const toggleOrderExpansion = (order) => {
    setExpandedOrder(expandedOrder === order.id ? null : order.id);
  };

  const handleCancelOrder = async (order) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await purchaseOrdersAPI.updatePurchaseOrder(order.id, { status: 'cancelled' });
        loadData();
      } catch (err) {
        console.error('Error cancelling purchase order:', err);
        alert('Failed to cancel purchase order: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'status-pending',
      approved: 'status-approved',
      ordered: 'status-ordered',
      partially_received: 'status-partial',
      received: 'status-received',
      cancelled: 'status-cancelled'
    };
    return statusColors[status] || 'status-default';
  };

  if (loading) return (
    <div className="orders-page-container">
      <div className="orders-loading-container">
        <div className="orders-spinner"></div>
        <p>Loading purchase orders...</p>
      </div>
    </div>
  );
  if (error) return <div className="orders-error-message">{error}</div>;

  return (
    <div className="orders-page-container">
      <div className="orders-page-header">
        {/* <h1>Purchase Orders</h1> */}
        <div className="orders-breadcrumbs">
          <Link to="/">Home</Link> / <span>Purchasing</span> / <span>Orders</span>
        </div>
      </div>

      {!loading && !error && (
        <div className="orders-stats">
          <div className="orders-stat-card">
            <div className="orders-stat-value">{orders.length}</div>
            <div className="orders-stat-label">Total Orders</div>
          </div>
          <div className="orders-stat-card">
            <div className="orders-stat-value">{orders.filter(o => o.status === 'pending').length}</div>
            <div className="orders-stat-label">Pending</div>
          </div>
          <div className="orders-stat-card">
            <div className="orders-stat-value">{orders.filter(o => o.status === 'received').length}</div>
            <div className="orders-stat-label">Received</div>
          </div>
        </div>
      )}

      <div className="orders-page-content">
        <div className="orders-page-actions">
          <div className="orders-search-filter-group">
            <FiSearch className="orders-search-icon" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="orders-search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="orders-filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="ordered">Ordered</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            className="orders-btn orders-btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <FiPlus /> New Order
          </button>
        </div>

        <div className="orders-table-container">
          <table className="orders-data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="orders-empty-message">No orders found</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <React.Fragment key={order.id}>
                    <tr key={order.id} className={expandedOrder === order.id ? 'orders-expanded-row' : ''} onClick={() => toggleOrderExpansion(order)} style={{cursor: 'pointer'}}>
                      <td>
                        {expandedOrder === order.id ? <FiChevronDown /> : <FiChevronRight />}
                        #{order.id}
                      </td>
                      <td>{order.supplier_name || 'N/A'}</td>
                      <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td>{order.items?.length || 0}</td>
                      <td>{parseFloat(order.total_amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' })}</td>
                      <td>
                        <span className={`orders-status-badge ${getStatusBadge(order.status)}`}>
                          {order.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="orders-action-buttons" onClick={(e) => e.stopPropagation()}>
                          {order.status !== 'received' && order.status !== 'cancelled' && (
                            <>
                              <button
                                className="orders-btn-icon success"
                                onClick={() => handleReceiveOrder(order)}
                                title="Receive Order"
                              >
                                <FiCheck />
                              </button>
                              <button
                                className="orders-btn-icon danger"
                                onClick={() => handleCancelOrder(order)}
                                title="Cancel Order"
                              >
                                <FiXCircle />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr className="orders-details-row">
                        <td colSpan="7">
                          <div className="orders-inline-details">
                            <div className="orders-detail-section">
                              <h4>Order Items</h4>
                              <table className="orders-data-table orders-sub-table">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items && order.items.length > 0 ? (
                                    order.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td>{item.product_name || 'N/A'}</td>
                                        <td>{item.quantity}</td>
                                        <td>{parseFloat(item.unit_price || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' })}</td>
                                        <td>{parseFloat(item.line_total || (item.quantity * item.unit_price) || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' })}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="4" className="orders-empty-message">No items</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            <div className="orders-detail-info">
                              <p><strong>Order Date:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
                              <p><strong>Expected Delivery:</strong> {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
                              <p><strong>Notes:</strong> {order.notes || 'None'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="orders-modal-overlay">
          <div className="orders-modal-container">
            <div className="orders-modal-header">
              <h3>Create Purchase Order</h3>
              <button className="orders-modal-close-btn" onClick={() => setShowAddModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="orders-modal-body">
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label>Supplier *</label>
                  <select
                    value={newOrder.supplier}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, supplier: e.target.value }))}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="orders-form-group">
                  <label>Order Date</label>
                  <input
                    type="date"
                    value={newOrder.order_date}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, order_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label>Expected Delivery Date</label>
                  <input
                    type="date"
                    value={newOrder.expected_delivery_date}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="orders-form-group">
                <label>Notes</label>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                  rows="2"
                />
              </div>

              <div className="orders-items-section">
                <div className="orders-section-header">
                  <h4>Order Items</h4>
                  <button className="orders-btn orders-btn-sm" onClick={() => setShowProductModal(true)}>
                    <FiPlus /> Add Product
                  </button>
                </div>

                <div className="orders-items-list">
                  {newOrder.items.length === 0 ? (
                    <div className="orders-empty-message">No items added yet</div>
                  ) : (
                    newOrder.items.map((item, index) => (
                      <div key={index} className="orders-item-row">
                        <div className="orders-item-info">
                          <span className="orders-item-name">{item.product_name || 'Select Product'}</span>
                          <span className="orders-item-price">
                            {parseFloat(item.unit_price || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' })}
                          </span>
                        </div>
                        <div className="orders-item-quantity">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="orders-item-total">
                          {calculateItemTotal(item).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>
                        <button
                          className="orders-btn-icon danger"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="orders-order-total">
                  <strong>Order Total: </strong>
                  {calculateOrderTotal().toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
              </div>
            </div>

            <div className="orders-modal-footer">
              <button className="orders-btn orders-btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="orders-btn orders-btn-primary" onClick={handleSaveOrder}>
                <FiSave /> Save Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="orders-modal-overlay">
          <div className="orders-modal-container orders-modal-sm">
            <div className="orders-modal-header">
              <h3>Select Product</h3>
              <button className="orders-modal-close-btn" onClick={() => {
                setShowProductModal(false);
                setCurrentItemIndex(null);
              }}>
                <FiX />
              </button>
            </div>

            <div className="orders-modal-body">
              <div className="orders-search-filter-group">
                <FiSearch className="orders-search-icon" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="orders-search-input"
                />
              </div>

              <div className="orders-products-list">
                {filteredProducts.length === 0 ? (
                  <div className="orders-empty-message">No products found</div>
                ) : (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className="orders-product-item"
                      onClick={() => handleProductSelect(currentItemIndex, product)}
                    >
                      <div className="orders-product-info">
                        <span className="orders-product-name">{product.name}</span>
                        <span className="orders-product-sku">SKU: {product.sku}</span>
                      </div>
                      <div className="orders-product-price">
                        {parseFloat(product.selling_price || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
