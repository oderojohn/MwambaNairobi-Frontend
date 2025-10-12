import React, { useState, useEffect } from 'react';
import {
  FiPlus, FiFilter, FiDownload, FiPrinter, FiSearch,
  FiEdit, FiTrash2, FiX, FiSave, FiCheck, FiEye, FiXCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { purchaseOrdersAPI, suppliersAPI, inventoryAPI } from '../../../services/ApiService/api';

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
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    supplier: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: []
  });

  // Load orders, suppliers, and products on component mount
   useEffect(() => {
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

         console.log('Loaded data:', {
           suppliers: suppliersData?.length || 0,
           orders: ordersData?.length || 0,
           products: productsData?.length || 0
         });

         setOrders(ordersData || []);
         setSuppliers(suppliersData || []);
         setProducts(productsData || []);
         setError(null);
       } catch (err) {
         console.error('Error loading data:', err);
         setError('Failed to load purchase orders: ' + (err.message || 'Unknown error'));
       } finally {
         setLoading(false);
       }
     };

     loadData();
   }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.supplier_name && order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          order.id.toString().includes(searchTerm) ||
                          (order.order_number && order.order_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddOrder = async () => {
    if (!newOrder.supplier) {
      alert('Please select a supplier');
      return;
    }

    if (!newOrder.items || newOrder.items.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    try {
      const orderData = {
        supplier: newOrder.supplier,
        order_date: newOrder.order_date,
        expected_delivery_date: newOrder.expected_delivery_date,
        notes: newOrder.notes,
        items: newOrder.items
      };

      await purchaseOrdersAPI.createPurchaseOrder(orderData);

      // Refresh orders list
      const updatedOrders = await purchaseOrdersAPI.getPurchaseOrders();
      setOrders(updatedOrders);

      // Reset form
      setNewOrder({
        supplier: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        items: []
      });
      setProductSearchTerm('');
      setCurrentItemIndex(null);

      setShowAddModal(false);
      alert('Purchase order created successfully!');
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Failed to create purchase order. Please try again.');
    }
  };

  const handleApproveOrder = async (order) => {
    try {
      console.log('Approving order:', order.id, 'Status:', order.status);
      const result = await purchaseOrdersAPI.updatePurchaseOrder(order.id, { status: 'ordered' });
      console.log('Approval result:', result);

      // Refresh orders list
      const updatedOrders = await purchaseOrdersAPI.getPurchaseOrders();
      setOrders(updatedOrders);
      alert('Order approved successfully!');
    } catch (error) {
      console.error('Error approving order:', error);
      console.error('Error details:', error.message, error.response?.data);
      alert('Failed to approve order. Please try again.');
    }
  };

  const handleReceiveOrder = (order) => {
    // Navigate to order preparation page in receiving mode
    window.location.href = `/pos/order-prep?receive=${order.id}`;
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  const handleDeleteOrder = async (order) => {
    if (window.confirm(`Are you sure you want to delete order #${order.order_number || order.id}? This action cannot be undone.`)) {
      try {
        await purchaseOrdersAPI.deletePurchaseOrder(order.id);
        // Refresh orders list
        const updatedOrders = await purchaseOrdersAPI.getPurchaseOrders();
        setOrders(updatedOrders);
        alert('Order deleted successfully!');
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  const handleCancelOrder = async (order) => {
    if (window.confirm(`Are you sure you want to cancel order #${order.order_number || order.id}?`)) {
      try {
        await purchaseOrdersAPI.updatePurchaseOrder(order.id, { status: 'cancelled' });
        // Refresh orders list
        const updatedOrders = await purchaseOrdersAPI.getPurchaseOrders();
        setOrders(updatedOrders);
        alert('Order cancelled successfully!');
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel order. Please try again.');
      }
    }
  };

  const deleteOrder = (id) => {
    setOrders(orders.filter(order => order.id !== id));
  };

  const openProductModal = (itemIndex) => {
    setCurrentItemIndex(itemIndex);
    setShowProductModal(true);
    setProductSearchTerm('');
  };

  const selectProduct = (product) => {
    if (currentItemIndex !== null) {
      const updatedItems = [...newOrder.items];
      updatedItems[currentItemIndex] = {
        ...updatedItems[currentItemIndex],
        product: product.id,
        product_name: product.name,
        unit_price: product.cost_price || 0 // Use cost price as default unit price
      };
      setNewOrder(prev => ({ ...prev, items: updatedItems }));
    }
    setShowProductModal(false);
    setCurrentItemIndex(null);
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        {/* <h1>Purchase Orders</h1> */}
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <span>Purchasing</span> / <span>Orders</span>
        </div>
      </div>

      {!loading && !error && (
        <div className="order-stats">
          <div className="stat-card">
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">Ksh {orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0).toLocaleString()}</div>
            <div className="stat-label">Total Value</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      )}

      <div className="page-actions">
        <div className="search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-dropdown">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="ordered">Ordered</option>
              <option value="partially_received">Partially Received</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <FiFilter className="filter-icon" />
          </div>
        </div>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <FiPlus /> New Order
          </button>
          <button className="btn btn-secondary">
            <FiDownload /> Export
          </button>
          <button className="btn btn-secondary">
            <FiPrinter /> Print
          </button>
        </div>
      </div>

      <div className="data-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading purchase orders...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
            <p>{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
             <h3>No Purchase Orders Found</h3>
             <p>To get started:</p>
             <ol style={{ textAlign: 'left', display: 'inline-block', margin: '20px 0' }}>
               <li>Go to <strong>Purchasing → Suppliers</strong> and add some suppliers</li>
               <li>Click <strong>"New Order"</strong> to create your first purchase order</li>
               <li>Orders will appear here for approval and receiving</li>
             </ol>
             <button
               className="btn btn-primary"
               onClick={() => setShowAddModal(true)}
               disabled={suppliers.length === 0}
             >
               {suppliers.length === 0 ? 'Add Suppliers First' : 'Create First Order'}
             </button>
           </div>
         ) : (
           <table className="data-table">
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
               {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>
                    <Link to={`/suppliers/${order.supplier_name?.replace(/\s+/g, '-').toLowerCase()}`}>
                      {order.supplier_name}
                    </Link>
                  </td>
                  <td>{order.order_date}</td>
                  <td>{order.items?.length || 0}</td>
                  <td>Ksh {parseFloat(order.total_amount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {order.status === 'pending' && (
                        <>
                          <button
                            className="btn-icon info"
                            title="View Details"
                            onClick={() => handleViewOrderDetails(order)}
                          >
                            <FiEye />
                          </button>
                          <button
                            className="btn-icon success"
                            title="Approve Order"
                            onClick={() => handleApproveOrder(order)}
                          >
                            <FiCheck />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete Order"
                            onClick={() => handleDeleteOrder(order)}
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                      {(order.status === 'ordered' || order.status === 'partially_received') && (
                        <>
                          <button
                            className="btn-icon info"
                            title="View Details"
                            onClick={() => handleViewOrderDetails(order)}
                          >
                            <FiEye />
                          </button>
                          <button
                            className="btn-icon primary"
                            title="Receive Order"
                            onClick={() => handleReceiveOrder(order)}
                          >
                            <FiPlus />
                          </button>
                          <button
                            className="btn-icon warning"
                            title="Cancel Order"
                            onClick={() => handleCancelOrder(order)}
                          >
                            <FiXCircle />
                          </button>
                        </>
                      )}
                      {order.status === 'received' && (
                        <button
                          className="btn-icon info"
                          title="View Details"
                          onClick={() => handleViewOrderDetails(order)}
                        >
                          <FiEye />
                        </button>
                      )}
                      {order.status === 'cancelled' && (
                        <button
                          className="btn-icon info"
                          title="View Details"
                          onClick={() => handleViewOrderDetails(order)}
                        >
                          <FiEye />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing 1 to {filteredOrders.length} of {orders.length} orders
          </div>
          <div className="pagination-controls">
            <button className="btn-pagination" disabled>Previous</button>
            <button className="btn-pagination active">1</button>
            <button className="btn-pagination">Next</button>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="modal-overlay active">
          <div className="modal-container" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Purchase Order</h3>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier*</label>
                  <select
                    value={newOrder.supplier}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, supplier: e.target.value }))}
                    required
                  >
                    <option value="">
                      {suppliers.length === 0 ? 'No suppliers available - please add suppliers first' : 'Select a supplier...'}
                    </option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Order Date</label>
                  <input
                    type="date"
                    value={newOrder.order_date}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, order_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Expected Delivery Date</label>
                <input
                  type="date"
                  value={newOrder.expected_delivery_date}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Order notes..."
                  rows="3"
                />
              </div>

              <div style={{ marginTop: '20px' }}>
                <h4>Order Items</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                  {newOrder.items.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666' }}>No items added yet</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #ddd' }}>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Product</th>
                          <th style={{ textAlign: 'center', padding: '8px' }}>Quantity</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>Unit Price</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {newOrder.items.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>
                              {item.product_name ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>{item.product_name}</span>
                                  <button
                                    onClick={() => openProductModal(index)}
                                    style={{
                                      padding: '2px 6px',
                                      fontSize: '12px',
                                      background: '#007bff',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Change
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => openProductModal(index)}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    width: '100%'
                                  }}
                                >
                                  Select Product
                                </button>
                              )}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity || 1}
                                onChange={(e) => {
                                  const updatedItems = [...newOrder.items];
                                  updatedItems[index].quantity = parseInt(e.target.value) || 1;
                                  setNewOrder(prev => ({ ...prev, items: updatedItems }));
                                }}
                                style={{ width: '60px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px' }}
                              />
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price || 0}
                                onChange={(e) => {
                                  const updatedItems = [...newOrder.items];
                                  updatedItems[index].unit_price = parseFloat(e.target.value) || 0;
                                  setNewOrder(prev => ({ ...prev, items: updatedItems }));
                                }}
                                style={{ width: '80px', textAlign: 'right', border: '1px solid #ddd', borderRadius: '4px' }}
                              />
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                              Ksh {((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                            </td>
                            <td style={{ padding: '8px' }}>
                              <button
                                onClick={() => {
                                  const updatedItems = newOrder.items.filter((_, i) => i !== index);
                                  setNewOrder(prev => ({ ...prev, items: updatedItems }));
                                }}
                                style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={() => setNewOrder(prev => ({
                    ...prev,
                    items: [...prev.items, { product: '', product_name: '', quantity: 1, unit_price: 0 }]
                  }))}
                  style={{ marginTop: '10px' }}
                >
                  <FiPlus /> Add Item
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddOrder}
                disabled={!newOrder.supplier || newOrder.items.length === 0}
              >
                <FiSave /> Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="modal-overlay active">
          <div className="modal-container" style={{ maxWidth: '700px', maxHeight: '80vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">Select Product</h3>
              <button
                className="modal-close"
                onClick={() => setShowProductModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <div className="search-box" style={{ marginBottom: '10px' }}>
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px 35px 8px 35px' }}
                  />
                </div>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                {filteredProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    {products.length === 0 ? 'Loading products...' : 'No products found'}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>SKU</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product Name</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Cost Price</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Stock</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => (
                        <tr key={product.id} style={{ borderBottom: '1px solid #eee', hover: { background: '#f8f9fa' } }}>
                          <td style={{ padding: '12px' }}>{product.sku}</td>
                          <td style={{ padding: '12px' }}>{product.name}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>Ksh {parseFloat(product.cost_price || 0).toFixed(2)}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{product.stock_quantity || 0}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => selectProduct(product)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowProductModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
        <div className="modal-overlay active">
          <div className="modal-container" style={{ maxWidth: '900px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Order Details - #{selectedOrder.order_number || selectedOrder.id}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowOrderDetailsModal(false);
                  setSelectedOrder(null);
                }}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              {/* Order Header Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <h4>Order Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong>Order Number:</strong> {selectedOrder.order_number || selectedOrder.id}</div>
                    <div><strong>Status:</strong>
                      <span className={`status-badge ${selectedOrder.status?.toLowerCase()}`} style={{ marginLeft: '8px' }}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div><strong>Order Date:</strong> {selectedOrder.order_date}</div>
                    <div><strong>Expected Delivery:</strong> {selectedOrder.expected_delivery_date || 'Not specified'}</div>
                    <div><strong>Total Amount:</strong> Ksh {parseFloat(selectedOrder.total_amount || 0).toFixed(2)}</div>
                  </div>
                </div>

                <div>
                  <h4>Supplier Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong>Name:</strong> {selectedOrder.supplier_name}</div>
                    <div><strong>Items:</strong> {selectedOrder.items?.length || 0}</div>
                    {selectedOrder.notes && (
                      <div><strong>Notes:</strong> {selectedOrder.notes}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <h4>Order Items</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Quantity</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Unit Price</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{item.product_name || item.name}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>Ksh {parseFloat(item.unit_price || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>Ksh {parseFloat(item.total_price || (item.quantity * item.unit_price) || 0).toFixed(2)}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowOrderDetailsModal(false);
                  setSelectedOrder(null);
                }}
              >
                Close
              </button>
              {selectedOrder.status === 'pending' && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    setShowOrderDetailsModal(false);
                    handleApproveOrder(selectedOrder);
                  }}
                >
                  <FiCheck /> Approve Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;