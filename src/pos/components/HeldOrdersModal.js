import React from 'react';
import { formatCurrency } from '../../services/ApiService/api';
import '../heldorders.css';
const HeldOrdersModal = ({ isOpen, onClose, heldOrders, onLoadHeldOrder }) => {
  if (!isOpen) return null;

  const handleLoadOrder = (heldOrder) => {
    onLoadHeldOrder(heldOrder);
  };

  return (
    <div className="held-orders-modal active">
      <div className="held-orders-modal-content">
        <div className="held-orders-modal-header">
          <h3>
            <i className="fas fa-pause-circle"></i>
            Held Orders
          </h3>
          <span className="held-orders-close" onClick={onClose}>&times;</span>
        </div>
        <div className="held-orders-modal-body">
          {heldOrders.length === 0 ? (
            <div className="held-orders-empty-state">
              <i className="fas fa-clock held-orders-empty-icon"></i>
              <h4>No Held Orders</h4>
              <p>There are no orders currently on hold</p>
            </div>
          ) : (
            <div className="held-orders-table-container">
              <table className="held-orders-table">
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
                    <tr key={order.id} className="held-order-row">
                      <td className="held-order-id">
                        <strong>#{order.id}</strong>
                      </td>
                      <td className="held-order-date">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="held-order-customer">
                        <span className={`customer-tag ${!order.customer_name ? 'walk-in-customer' : ''}`}>
                          <i className="fas fa-user"></i>
                          {order.customer_name || 'Walk-in'}
                        </span>
                      </td>
                      <td className="held-order-items">
                        <div className="held-items-summary">
                          {order.items?.slice(0, 2).map((item, index) => (
                            <div key={index} className="held-item-summary">
                              <span className="held-item-name">
                                {item.product_name || `Product ${item.product}`}
                              </span>
                              <span className="held-item-quantity">
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <div className="held-more-items">
                              +{order.items.length - 2} more items
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="held-order-total">
                        <strong className="held-total-amount">
                          {formatCurrency(order.items?.reduce((sum, item) =>
                            sum + (item.unit_price * item.quantity), 0) || 0)}
                        </strong>
                      </td>
                      <td className="held-order-actions">
                        <button
                          className="held-order-load-btn"
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
        <div className="held-orders-modal-footer">
          <button className="held-orders-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeldOrdersModal;