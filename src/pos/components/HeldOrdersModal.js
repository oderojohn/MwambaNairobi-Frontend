import React, { useState } from 'react';
import { formatCurrency } from '../../services/ApiService/api';
import '../heldorders.css';
const HeldOrdersModal = ({ isOpen, onClose, heldOrders, voidedHeldOrders = [], onLoadHeldOrder, onPrintReceipt }) => {
  const [activeView, setActiveView] = useState('held');
  if (!isOpen) return null;

  const handleLoadOrder = (heldOrder) => {
    onLoadHeldOrder(heldOrder);
  };

  const totalPending = heldOrders.reduce((sum, order) => {
    const amount = order.total_amount || order.items?.reduce((s, item) => s + (item.unit_price * item.quantity), 0) || 0;
    return sum + amount;
  }, 0);

  const totalVoided = voidedHeldOrders.reduce((sum, order) => {
    const amount = order.total_amount || order.items?.reduce((s, item) => s + (item.unit_price * item.quantity), 0) || 0;
    return sum + amount;
  }, 0);

  const ordersToRender = activeView === 'held' ? heldOrders : voidedHeldOrders;

  return (
    <div className="held-orders-modal active">
      <div className="held-orders-modal-content">
        <div className="held-orders-modal-header">
          <h3>
            <i className="fas fa-pause-circle"></i>
            Pending Orders
          </h3>
          <span className="held-orders-close" onClick={onClose}>&times;</span>
        </div>
        <div className="held-orders-modal-body">
          <div className="held-orders-summary">
            <div className="held-summary-card">
              <span className="held-summary-label">Pending</span>
              <span className="held-summary-value">{heldOrders.length}</span>
            </div>
            <div className="held-summary-card">
              <span className="held-summary-label">Voided</span>
              <span className="held-summary-value">{voidedHeldOrders.length}</span>
            </div>
            <div className="held-summary-card">
              <span className="held-summary-label">{activeView === 'held' ? 'Total Pending' : 'Total Voided'}</span>
              <span className="held-summary-value">{formatCurrency(activeView === 'held' ? totalPending : totalVoided)}</span>
            </div>
          </div>

          <div className="pos-ssp-scope-tabs" style={{ marginBottom: '16px' }}>
            <button
              type="button"
              className={`pos-ssp-scope-tab ${activeView === 'held' ? 'is-active' : ''}`}
              onClick={() => setActiveView('held')}
            >
              Active Holds
            </button>
            <button
              type="button"
              className={`pos-ssp-scope-tab ${activeView === 'voided' ? 'is-active' : ''}`}
              onClick={() => setActiveView('voided')}
            >
              Voided Holds
            </button>
          </div>

          {ordersToRender.length === 0 ? (
            <div className="held-orders-empty-state">
              <i className={`fas ${activeView === 'held' ? 'fa-clock' : 'fa-ban'} held-orders-empty-icon`}></i>
              <h4>{activeView === 'held' ? 'No Pending Orders' : 'No Voided Held Orders'}</h4>
              <p>{activeView === 'held' ? 'There are no pending orders' : 'There are no voided held orders yet'}</p>
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
                  {ordersToRender.map((order) => (
                    <tr key={order.id} className="held-order-row">
                      <td className="held-order-id" data-label="Order #">
                        <strong>#{order.id}</strong>
                      </td>
                      <td className="held-order-date" data-label="Date & Time">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="held-order-customer" data-label="Customer">
                        <span className={`customer-tag ${!order.customer_name ? 'walk-in-customer' : ''}`}>
                          <i className="fas fa-user"></i>
                          {order.customer_name || 'Walk-in'}
                        </span>
                      </td>
                      <td className="held-order-items" data-label="Items">
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
                      <td className="held-order-total" data-label="Total">
                        <strong className="held-total-amount">
                          {formatCurrency(order.total_amount || order.items?.reduce((sum, item) =>
                            sum + (item.unit_price * item.quantity), 0) || 0)}
                        </strong>
                      </td>
                      <td className="held-order-actions" data-label="Actions">
                        {activeView === 'held' ? (
                          <>
                            <button
                              className="held-order-print-btn"
                              onClick={() => onPrintReceipt && onPrintReceipt(order)}
                              title="Print Receipt"
                            >
                              <i className="fas fa-print"></i>
                            </button>
                            <button
                              className="held-order-load-btn"
                              onClick={() => handleLoadOrder(order)}
                            >
                              <i className="fas fa-shopping-cart"></i>
                              Load Order
                            </button>
                          </>
                        ) : (
                          <div className="held-more-items" title={order.void_reason || 'No reason recorded'}>
                            {order.void_reason || 'No reason recorded'}
                          </div>
                        )}
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
