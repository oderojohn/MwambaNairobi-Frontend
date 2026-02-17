// OrderManagementPage.js - Purchase Order Management Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import logo from '../../logo.png';
import { formatCurrency, purchaseOrdersAPI } from '../../services/ApiService/api';
import './OrderManagementPage.css';

const OrderManagementPage = ({ suppliers }) => {
  const navigate = useNavigate();

  // State management
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receivingData, setReceivingData] = useState({});
  const [receiveComment, setReceiveComment] = useState('');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load orders on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const ordersData = await purchaseOrdersAPI.getPurchaseOrders();
      // Limit to 20 most recent orders
      setOrders((ordersData || []).slice(0, 20));
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setIsLoading(true);
      await purchaseOrdersAPI.updatePurchaseOrder(orderId, { status: newStatus });
      await loadOrders(); // Reload to reflect changes
      Swal.fire({
        icon: 'success',
        title: 'Status Updated!',
        text: `Order status updated to ${newStatus.replace('_', ' ')} successfully.`,
        timer: 2000,
        showConfirmButton: false,
        zIndex: 10000
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update order status. Please try again.',
        zIndex: 10000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiveOrder = (order) => {
    setSelectedOrder(order);
    setReceiveComment('');

    // Initialize receiving data
    const initialReceivingData = {};
    order.items.forEach(item => {
      initialReceivingData[item.id] = {
        batch_number: '',
        expiry_date: '',
        quantity_to_receive: Math.max(0, item.quantity - (item.received_quantity || 0))
      };
    });
    setReceivingData(initialReceivingData);
    setShowReceiveModal(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setEditFormData({
      supplier: order.supplier,
      expected_delivery_date: order.expected_delivery_date || '',
      notes: order.notes || '',
      items: order.items.map(item => ({
        ...item,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    });
    setShowEditModal(true);
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const copyOrderToWhatsApp = (order) => {
    const orderDetails = `
Order #${order.order_number || order.id}
Supplier: ${order.supplier_name}
Status: ${order.status?.replace('_', ' ')}
Order Date: ${order.order_date}
Expected Delivery: ${order.expected_delivery_date || 'Not set'}
Total Amount: ${formatCurrency(order.total_amount || 0)}

Items:
${order.items?.map(item =>
  `- ${item.product_name || item.name}: ${item.quantity} @ ${formatCurrency(item.unit_price)} = ${formatCurrency(item.unit_price * item.quantity)} (Received: ${item.received_quantity || 0})`
).join('\n')}

${order.notes ? `Notes: ${order.notes}` : ''}
    `.trim();

    navigator.clipboard.writeText(orderDetails).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Order details copied to clipboard! You can now paste it into WhatsApp.',
        timer: 2000,
        showConfirmButton: false,
        zIndex: 10000
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      Swal.fire({
        icon: 'error',
        title: 'Copy Failed',
        text: 'Failed to copy order details. Please try again.',
        zIndex: 10000
      });
    });
  };

  const updateEditFormData = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateEditItem = (itemId, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const saveEditedOrder = async () => {
    if (!editingOrder) return;

    try {
      setIsLoading(true);
      const orderData = {
        supplier: editFormData.supplier,
        expected_delivery_date: editFormData.expected_delivery_date || null,
        notes: editFormData.notes,
        items: editFormData.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      await purchaseOrdersAPI.updatePurchaseOrder(editingOrder.id, orderData);
      Swal.fire({
        icon: 'success',
        title: 'Order Updated!',
        text: 'Purchase order has been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
        zIndex: 10000
      });
      setShowEditModal(false);
      setEditingOrder(null);
      await loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update order. Please try again.',
        zIndex: 10000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReceiveOrder = async () => {
    if (!selectedOrder) return;

    try {
      setIsLoading(true);

      const itemsToReceive = selectedOrder.items.filter(item => {
        const receivingInfo = receivingData[item.id];
        return receivingInfo && receivingInfo.quantity_to_receive > 0;
      });

      if (itemsToReceive.length === 0) {
        alert('Please specify quantities to receive for at least one item.');
        return;
      }

      // Validate each item
      for (const item of itemsToReceive) {
        const receivingInfo = receivingData[item.id];
        if (!receivingInfo.batch_number?.trim()) {
          alert(`Please enter a batch number for ${item.product_name || item.name}.`);
          return;
        }
        if (receivingInfo.quantity_to_receive > (item.quantity - (item.received_quantity || 0))) {
          alert(`Quantity to receive for ${item.product_name || item.name} exceeds the remaining quantity.`);
          return;
        }
      }

      // Process receiving
      for (const item of itemsToReceive) {
        const receivingInfo = receivingData[item.id];
        await purchaseOrdersAPI.receiveBatch(selectedOrder.id, {
          item_id: item.id,
          batch_number: receivingInfo.batch_number.trim(),
          quantity: receivingInfo.quantity_to_receive,
          expiry_date: receivingInfo.expiry_date || null
        });
      }

      // Update order notes with receive comment if provided
      if (receiveComment.trim()) {
        await purchaseOrdersAPI.updatePurchaseOrder(selectedOrder.id, {
          notes: (selectedOrder.notes || '') + '\n\nReceive Comment: ' + receiveComment.trim()
        });
      }

      Swal.fire({
        icon: 'success',
        title: 'Order Received!',
        text: 'Order received successfully! Stock has been updated.',
        timer: 2000,
        showConfirmButton: false,
        zIndex: 10000
      });
      setShowReceiveModal(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch (error) {
      console.error('Error receiving order:', error);
      Swal.fire({
        icon: 'error',
        title: 'Receive Failed',
        text: 'Failed to receive order. Please try again.',
        zIndex: 10000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = !searchTerm ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'ordered': return '#17a2b8';
      case 'partially_received': return '#fd7e14';
      case 'received': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="order-management-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left"></i> Back to POS
        </button>
        
        {/* Filters in header */}
        <div className="header-filters">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="header-filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="ordered">Ordered</option>
            <option value="partially_received">Partial</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="header-filter-input"
          />
        </div>

        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/order-preparation')}
          >
            <i className="fas fa-plus"></i> New Order
          </button>
        </div>
        <h1>
          <img src={logo} alt="Logo" className="order-management-logo-png" />
          Purchase Orders
        </h1>
      </div>

      {/* Orders List */}
      <div className="orders-container">
        {isLoading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-list"></i>
            <h3>No Orders Found</h3>
            <p>
              {filterStatus !== 'all' || searchTerm
                ? 'Try adjusting your filters or search terms.'
                : 'No purchase orders have been created yet.'
              }
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/order-prep')}
            >
              Create Your First Order
            </button>
          </div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Expected Delivery</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} onClick={() => handleViewOrderDetails(order)} style={{ cursor: 'pointer' }}>
                    <td>
                      <strong>#{order.order_number || order.id}</strong>
                    </td>
                    <td>{order.supplier_name}</td>
                    <td>{order.items?.length || 0}</td>
                    <td>{formatCurrency(order.total_amount || 0)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{order.order_date}</td>
                    <td>{order.expected_delivery_date || 'Not set'}</td>
                    <td>
                      <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                        {order.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEditOrder(order)}
                              disabled={isLoading}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => updateOrderStatus(order.id, 'ordered')}
                              disabled={isLoading}
                            >
                              <i className="fas fa-paper-plane"></i> Submit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              disabled={isLoading}
                            >
                              <i className="fas fa-ban"></i> Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'ordered' && (
                          <>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => updateOrderStatus(order.id, 'pending')}
                              disabled={isLoading}
                            >
                              <i className="fas fa-pause"></i> Hold
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleReceiveOrder(order)}
                              disabled={isLoading}
                            >
                              <i className="fas fa-truck"></i> Receive
                            </button>
                          </>
                        )}
                        {order.status === 'partially_received' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleReceiveOrder(order)}
                            disabled={isLoading}
                          >
                            <i className="fas fa-truck"></i> Receive More
                          </button>
                        )}
                        {order.status === 'received' && (
                          <div className="status-completed">
                            <i className="fas fa-check-circle"></i>
                            Completed
                          </div>
                        )}
                        {order.status === 'cancelled' && (
                          <div className="status-cancelled">
                            <i className="fas fa-ban"></i>
                            Cancelled
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div className="modal active">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>Edit Order #{editingOrder.order_number || editingOrder.id}</h3>
              <span className="close" onClick={() => setShowEditModal(false)}>&times;</span>
            </div>
            <div className="modal-body">
              <div className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Supplier *</label>
                    <select
                      value={editFormData.supplier || ''}
                      onChange={(e) => updateEditFormData('supplier', parseInt(e.target.value))}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers?.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Expected Delivery Date</label>
                    <input
                      type="date"
                      value={editFormData.expected_delivery_date || ''}
                      onChange={(e) => updateEditFormData('expected_delivery_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={editFormData.notes || ''}
                    onChange={(e) => updateEditFormData('notes', e.target.value)}
                    placeholder="Add any notes or special instructions..."
                    rows="3"
                  />
                </div>

                <div className="edit-items-section">
                  <h4>Order Items</h4>
                  <table className="edit-items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editFormData.items?.map(item => (
                        <tr key={item.id}>
                          <td>{item.product_name || item.name}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateEditItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="quantity-input"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateEditItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="price-input"
                            />
                          </td>
                          <td>{formatCurrency((item.unit_price || 0) * (item.quantity || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-warning" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={saveEditedOrder}
                disabled={isLoading || !editFormData.supplier}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal active">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>Order Details #{selectedOrder.order_number || selectedOrder.id}</h3>
              <span className="close" onClick={() => setShowDetailsModal(false)}>&times;</span>
            </div>
            <div className="modal-body">
              <div className="order-details-header">
                <div className="order-info-grid">
                  <div className="info-item">
                    <label>Supplier:</label>
                    <span>{selectedOrder.supplier_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedOrder.status?.toLowerCase()}`} style={{ backgroundColor: getStatusColor(selectedOrder.status) }}>
                      {selectedOrder.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Order Date:</label>
                    <span>{selectedOrder.order_date}</span>
                  </div>
                  <div className="info-item">
                    <label>Expected Delivery:</label>
                    <span>{selectedOrder.expected_delivery_date || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <label>Total Amount:</label>
                    <span className="total-amount">{formatCurrency(selectedOrder.total_amount || 0)}</span>
                  </div>
                  <div className="info-item">
                    <label>Items:</label>
                    <span>{selectedOrder.items?.length || 0} items</span>
                  </div>
                </div>
              </div>

              <div className="order-items-section">
                <h4>Order Items</h4>
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                      <th>Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map(item => (
                      <tr key={item.id}>
                        <td className="product-name">{item.product_name || item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>{formatCurrency(item.unit_price * item.quantity)}</td>
                        <td>{item.received_quantity || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedOrder.notes && (
                <div className="order-notes-section">
                  <h4>Notes</h4>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => copyOrderToWhatsApp(selectedOrder)}>
                <i className="fab fa-whatsapp"></i> Copy to WhatsApp
              </button>
              <button className="btn btn-warning" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Order Modal */}
      {showReceiveModal && selectedOrder && (
        <div className="modal active">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>Receive Order #{selectedOrder.order_number || selectedOrder.id}</h3>
              <span className="close" onClick={() => setShowReceiveModal(false)}>&times;</span>
            </div>
            <div className="modal-body">
              <div className="supplier-info">
                <h4>Supplier: {selectedOrder.supplier_name}</h4>
                <p>Order Date: {selectedOrder.order_date}</p>
              </div>

              <div className="receiving-items">
                <h4>Items to Receive</h4>
                <table className="receiving-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Ordered</th>
                      <th>Received</th>
                      <th>To Receive</th>
                      <th>Batch #</th>
                      <th>Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map(item => (
                      <tr key={item.id}>
                        <td className="product-name">{item.product_name || item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.received_quantity || 0}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity - (item.received_quantity || 0)}
                            value={receivingData[item.id]?.quantity_to_receive || 0}
                            onChange={(e) => setReceivingData(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                quantity_to_receive: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="quantity-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={receivingData[item.id]?.batch_number || ''}
                            onChange={(e) => setReceivingData(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                batch_number: e.target.value
                              }
                            }))}
                            placeholder="Required"
                            className="batch-input"
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={receivingData[item.id]?.expiry_date || ''}
                            onChange={(e) => setReceivingData(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                expiry_date: e.target.value
                              }
                            }))}
                            className="expiry-input"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="receive-comment">
                <label>Receive Comment (Optional):</label>
                <textarea
                  value={receiveComment}
                  onChange={(e) => setReceiveComment(e.target.value)}
                  placeholder="Add any comments about the received items..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-warning" onClick={() => setShowReceiveModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={confirmReceiveOrder}
                disabled={isLoading}
              >
                {isLoading ? 'Receiving...' : 'Confirm Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagementPage;