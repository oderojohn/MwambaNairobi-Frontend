import React from 'react';
import { formatCurrency } from '../../services/ApiService/api';

const HeldOrdersModal = ({ isOpen, onClose, heldOrders, onLoadHeldOrder }) => {
  if (!isOpen) return null;

  const handleLoadOrder = (heldOrder) => {
    onLoadHeldOrder(heldOrder);
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Held Orders</h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          {heldOrders.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-clock fa-3x text-muted"></i>
              <p>No held orders found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {heldOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.id}</strong>
                      </td>
                      <td>
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td>
                        {order.customer_name || 'Walk-in'}
                      </td>
                      <td>
                        <div className="items-summary">
                          {order.items?.slice(0, 2).map((item, index) => (
                            <div key={index} className="item-summary">
                              <span className="item-name">{item.product_name || `Product ${item.product}`}</span>
                              <span className="item-qty">x{item.quantity}</span>
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <div className="more-items">
                              +{order.items.length - 2} more items
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong className="total-amount">
                          {formatCurrency(order.items?.reduce((sum, item) =>
                            sum + (item.unit_price * item.quantity), 0) || 0)}
                        </strong>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleLoadOrder(order)}
                        >
                          <i className="fas fa-shopping-cart"></i>
                          Load Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeldOrdersModal;