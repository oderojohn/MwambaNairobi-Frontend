import React, { useState } from 'react';
import { formatCurrency } from '../../services/ApiService/api';
import { salesAPI } from '../../services/ApiService/api';
import './HeldOrderDetailsModal.css';

const HeldOrderDetailsModal = ({ 
  isOpen, 
  onClose, 
  onProceedToPayment, 
  heldOrder, 
  products, 
  categories,
  onOrderVoided,
  onOrderUpdated 
}) => {
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);
  // editing existing items is locked in this module
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);

  if (!isOpen || !heldOrder) return null;

  const handleAddProduct = async (product) => {
    try {
      const payload = {
        items_to_add: [{
          product: product.id,
          quantity: 1,
          unit_price: product.selling_price,
        }],
        items_to_remove: [],
        update_quantities: {}
      };
      const result = await salesAPI.updateHeldOrder(heldOrder.id, payload);
      setShowAddProduct(false);
      setProductSearch('');
      if (onOrderUpdated) onOrderUpdated(result);
    } catch (error) {
      console.error('Error adding product to held order:', error);
      alert('Could not add product. Please try again.');
    }
  };

  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0));
    }, 0);
  };

  const handleIncreaseQuantity = async (item) => {
    setIsUpdatingItem(true);
    try {
      const newQty = (item.quantity || 0) + 1;
      const result = await salesAPI.updateHeldOrder(heldOrder.id, {
        items_to_add: [],
        items_to_remove: [],
        update_quantities: { [item.id]: newQty }
      });
      if (onOrderUpdated) onOrderUpdated(result);
    } catch (error) {
      console.error('Error increasing quantity:', error);
      alert('Could not update quantity. Please try again.');
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const handleVoidOrder = async () => {
    if (!voidReason.trim()) {
      alert('Please enter a reason for voiding the order');
      return;
    }

    setIsVoiding(true);
    try {
      await salesAPI.voidHeldOrder(heldOrder.id, { void_reason: voidReason.trim() });
      alert('Order voided successfully');
      setShowVoidModal(false);
      setVoidReason('');
      onClose();
      if (onOrderVoided) {
        onOrderVoided();
      }
    } catch (error) {
      console.error('Error voiding order:', error);
      alert('Failed to void order. Please try again.');
    } finally {
      setIsVoiding(false);
    }
  };

  const displayItems = heldOrder.items || [];
  const displayTotal = calculateTotal(displayItems);

  // Get all products for adding - show both stock and out of stock
  let availableProducts = products ? products.filter(p => 
    p.is_active !== false
  ) : [];

  // Filter by category if selected
  if (selectedCategory) {
    availableProducts = availableProducts.filter(p => 
      p.category && (p.category.id === parseInt(selectedCategory) || p.category === parseInt(selectedCategory))
    );
  }

  // Separate in-stock and out-of-stock products
  const inStockProducts = availableProducts.filter(p => p.stock_quantity > 0);
  const outOfStockProducts = availableProducts.filter(p => !p.stock_quantity || p.stock_quantity <= 0);

  // Filter products for search (if user types)
  const filteredInStock = productSearch 
    ? inStockProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : inStockProducts;

  const filteredOutOfStock = productSearch 
    ? outOfStockProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : outOfStockProducts;

  const getProductName = (item) => {
    return item.product_name || `Product ${item.product}`;
  };

  const renderVoidModal = () => (
    <div className="held-order-modal-overlay" style={{ zIndex: 1100 }}>
      <div className="held-order-modal-content">
        <div className="modal-header">
          <h3>
            <i className="fas fa-exclamation-triangle"></i>
            Void Held Order
          </h3>
          <span className="close" onClick={() => setShowVoidModal(false)}>&times;</span>
        </div>

        <div className="held-order-modal-body">
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-circle"></i>
            <div>
              <strong>Warning: Destructive Action</strong>
              <div>This pending order will be permanently voided and cannot be recovered.</div>
            </div>
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-edit"></i>
              Reason for Voiding
            </label>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Please provide a detailed reason for voiding this order..."
              rows="4"
              className="form-control"
              required
              disabled={isVoiding}
            />
            <small className="text-muted">This reason will be recorded in the system logs.</small>
          </div>
        </div>

        <div className="held-order-modal-footer">
          <button
            className="held-order-modal-btn held-order-modal-btn-secondary"
            onClick={() => setShowVoidModal(false)}
            disabled={isVoiding}
          >
            <i className="fas fa-arrow-left"></i>
            Go Back
          </button>
          <button
            className="held-order-modal-btn held-order-modal-btn-danger"
            onClick={handleVoidOrder}
            disabled={isVoiding || !voidReason.trim()}
          >
            {isVoiding ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Voiding...
              </>
            ) : (
              <>
                <i className="fas fa-ban"></i>
                Confirm Void
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (showVoidModal) {
    return renderVoidModal();
  }

  return (
    <div className="held-order-modal-overlay">
      <div className="held-order-modal-content held-order-modal-large">
        <div className="modal-header held-order-modal-hero">
          <div className="held-order-modal-hero__title-wrap">
            <div className="held-order-modal-hero__icon">
              <i className="fas fa-receipt"></i>
            </div>
            <div className="held-order-modal-hero__copy">
              <span className="held-order-modal-hero__eyebrow">Pending Order Workspace</span>
              <h3 className="held-order-modal-hero__title">Held Order Details</h3>
              <div className="held-order-modal-hero__meta">
                <span className="held-order-modal-hero__order-badge">Order #{heldOrder.id}</span>
                <span className="held-order-modal-hero__timestamp">{new Date(heldOrder.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button type="button" className="held-order-modal-hero__close" onClick={onClose} aria-label="Close held order details">&times;</button>
        </div>

        <div className="held-order-modal-body">
          <div className="order-info-cards">
            <div className="info-card">
              <div className="info-card__icon">
                <i className="fas fa-calendar"></i>
              </div>
              <div className="info-card__content">
                <div className="info-card__label">Date & Time</div>
                <div className="info-card__value">
                  {new Date(heldOrder.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            {heldOrder.customer_name && (
              <div className="info-card">
                <div className="info-card__icon">
                  <i className="fas fa-user"></i>
                </div>
                <div className="info-card__content">
                  <div className="info-card__label">Customer</div>
                  <div className="info-card__value">{heldOrder.customer_name}</div>
                </div>
              </div>
            )}

            <div className="info-card info-card--total" style={{ display: 'none' }}>
              <div className="info-card__icon">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <div className="info-card__content">
                <div className="info-card__label">Total Amount</div>
                <div className="info-card__value info-card__value--total">
                  {formatCurrency(displayTotal)}
                </div>
              </div>
            </div>
          </div>

          <div className="order-items-section">
            <div className="section-header">
              <h4 className="section-title">
                <i className="fas fa-list-ul"></i>
                Order Items ({displayItems?.length || 0})
              </h4>
              <div className="held-edit-locked">
                Editing locked. Add similar items or increase quantities only.
              </div>
            </div>
            
            {/* Add Product Section */}
            <div className="add-product-section">
              <div className="add-product-header">
                <button 
                  className="btn-add-product-toggle"
                  onClick={() => setShowAddProduct(!showAddProduct)}
                >
                    <i className="fas fa-plus"></i> Add Product
                  </button>
                  
                  {/* Category Filter */}
                  {categories && categories.length > 0 && (
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="category-filter-select"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                {showAddProduct && (
                  <div className="product-search-container">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="product-search-input"
                    />
                    {/* When user types, show search results */}
                    {productSearch && (
                      <div className="product-search-results">
                        {filteredInStock.length > 0 && (
                          <>
                            <div className="product-list-header">In Stock ({filteredInStock.length})</div>
                            {filteredInStock.map(product => (
                              <div
                                key={product.id}
                                className="product-search-item"
                                onClick={() => handleAddProduct(product)}
                              >
                                <span className="product-name">{product.name}</span>
                                <span className="product-price">{formatCurrency(product.selling_price)}</span>
                              </div>
                            ))}
                          </>
                        )}
                        {filteredOutOfStock.length > 0 && (
                          <>
                            <div className="product-list-header out-of-stock-header">Out of Stock ({filteredOutOfStock.length})</div>
                            {filteredOutOfStock.map(product => (
                              <div
                                key={product.id}
                                className="product-search-item product-out-of-stock"
                              >
                                <span className="product-name">{product.name}</span>
                                <span className="product-price out-of-stock-price">Out of Stock</span>
                              </div>
                            ))}
                          </>
                        )}
                        {filteredInStock.length === 0 && filteredOutOfStock.length === 0 && (
                          <div className="product-no-results">No products found</div>
                        )}
                      </div>
                    )}
                    {!productSearch && availableProducts.length > 0 && (
                      <div className="product-search-results product-list-show-all">
                        <div className="product-list-header">In Stock Products ({inStockProducts.length})</div>
                        {inStockProducts.slice(0, 50).map(product => (
                          <div
                            key={product.id}
                            className="product-search-item"
                            onClick={() => handleAddProduct(product)}
                          >
                            <span className="product-name">{product.name}</span>
                            <span className="product-price">{formatCurrency(product.selling_price)}</span>
                          </div>
                        ))}
                        {outOfStockProducts.length > 0 && (
                          <>
                            <div className="product-list-header out-of-stock-header">Out of Stock ({outOfStockProducts.length})</div>
                            {outOfStockProducts.slice(0, 20).map(product => (
                              <div
                                key={product.id}
                                className="product-search-item product-out-of-stock"
                              >
                                <span className="product-name">{product.name}</span>
                                <span className="product-price out-of-stock-price">Out of Stock</span>
                              </div>
                            ))}
                          </>
                        )}
                        {availableProducts.length > 50 && (
                          <div className="product-list-more">
                            Type to search for more products...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="held-order-modal-table-responsive">
              <table className="held-order-modal-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Total</th>
                    <th style={{ width: '72px' }}>Add</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems && displayItems.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{index + 1}</td>
                      <td>{getProductName(item)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(parseFloat(item.unit_price || 0))}</td>
                      <td>{formatCurrency(parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0))}</td>
                      <td>
                        <button
                          className="btn-qty-increase"
                          onClick={() => handleIncreaseQuantity(item)}
                          disabled={isUpdatingItem}
                          title="Add one more"
                        >
                          <i className={`fas ${isUpdatingItem ? 'fa-spinner fa-spin' : 'fa-plus'}`}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="held-order-modal-footer">
          <button className="held-order-modal-btn held-order-modal-btn-danger" onClick={() => setShowVoidModal(true)}>
            <i className="fas fa-ban"></i>
            Void Order
          </button>
          <button className="held-order-modal-btn held-order-modal-btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i>
            Cancel
          </button>
          <button className="held-order-modal-btn held-order-modal-btn-primary" onClick={() => onProceedToPayment(heldOrder)}>
            <i className="fas fa-credit-card"></i>
            Proceed to Payment
          </button>
        </div>
      </div>
   
  );
};

export default HeldOrderDetailsModal;
