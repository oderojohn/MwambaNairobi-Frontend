import React, { useState, useEffect } from 'react';
import { toNumber, formatCurrency } from '../../services/ApiService/api';

const OrderPreparationModal = ({
  isOpen,
  onClose,
  products,
  categories,
  onSaveOrder,
  customers,
  mode
}) => {
  const [orderItems, setOrderItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isOpen) return null;

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const addToOrder = (product) => {
    setOrderItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const price = product.display_price || product.selling_price || product.price || 0;
        return [...prevItems, {
          ...product,
          quantity: 1,
          price: price,
          unit_price: price
        }];
      }
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromOrder(productId);
      return;
    }

    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromOrder = (productId) => {
    setOrderItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (toNumber(item.price) * toNumber(item.quantity)), 0);
  };

  const handleSaveOrder = () => {
    if (orderItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    const orderData = {
      items: orderItems.map(item => ({
        product: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        discount: 0
      })),
      customer: selectedCustomer ? selectedCustomer.id : null,
      notes: orderNotes,
      delivery_date: deliveryDate,
      total_amount: calculateTotal(),
      order_type: 'preparation',
      status: 'pending'
    };

    onSaveOrder(orderData);
  };

  const clearOrder = () => {
    setOrderItems([]);
    setSelectedCustomer(null);
    setOrderNotes('');
    setDeliveryDate('');
  };

  return (
    <div className="modal active">
      <div className="modal-content order-prep-modal">
        <div className="modal-header">
          <h3>
            <i className="fas fa-clipboard-list"></i>
            Order Preparation
          </h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>

        <div className="modal-body">
          <div className="order-prep-container">
            {/* Product Selection Section */}
            <div className="product-selection">
              <div className="search-filters">
                <div className="search-bar">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="category-filter">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="products-grid">
                {filteredProducts.map(product => (
                  <div key={product.id} className="product-card" onClick={() => addToOrder(product)}>
                    <div className="product-image">
                      <i className="fas fa-box"></i>
                    </div>
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <p className="product-price">{formatCurrency(product.display_price || product.selling_price || product.price)}</p>
                      <p className="product-stock">Stock: {product.stock_quantity || 0}</p>
                    </div>
                    <button className="add-btn">
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Section */}
            <div className="order-summary">
              <div className="order-header">
                <h4>Order Summary</h4>
                <span className="item-count">{orderItems.length} items</span>
              </div>

              <div className="customer-selection">
                <label>Customer (Optional):</label>
                <select
                  value={selectedCustomer ? selectedCustomer.id : ''}
                  onChange={(e) => {
                    const customerId = e.target.value;
                    const customer = customers.find(c => c.id === parseInt(customerId));
                    setSelectedCustomer(customer || null);
                  }}
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="order-items">
                {orderItems.length === 0 ? (
                  <div className="empty-order">
                    <i className="fas fa-shopping-cart"></i>
                    <p>No items in order</p>
                  </div>
                ) : (
                  orderItems.map(item => (
                    <div key={item.id} className="order-item">
                      <div className="item-info">
                        <h5>{item.name}</h5>
                        <p>{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="item-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          className="remove-btn"
                          onClick={() => removeFromOrder(item.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <div className="item-total">
                        {formatCurrency(toNumber(item.price) * toNumber(item.quantity))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="order-details">
                <div className="form-group">
                  <label>Delivery Date (Optional):</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Order Notes:</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Special instructions, delivery notes, etc."
                    rows="3"
                  />
                </div>
              </div>

              <div className="order-total">
                <div className="total-line">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={clearOrder}>
            <i className="fas fa-trash"></i> Clear Order
          </button>
          <button className="btn btn-warning" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={handleSaveOrder}
            disabled={orderItems.length === 0}
          >
            <i className="fas fa-save"></i> Save Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPreparationModal;