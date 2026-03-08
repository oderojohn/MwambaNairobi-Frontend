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
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !heldOrder) return null;

  // Initialize edited items when modal opens or edit mode starts
  const initializeEditItems = () => {
    if (heldOrder.items && Array.isArray(heldOrder.items)) {
      setEditedItems([...heldOrder.items]);
    }
  };

  const handleStartEdit = () => {
    initializeEditItems();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedItems([]);
    setShowAddProduct(false);
    setProductSearch('');
  };

  const handleRemoveItem = (index) => {
    const newItems = [...editedItems];
    newItems.splice(index, 1);
    setEditedItems(newItems);
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    if (qty <= 0) {
      handleRemoveItem(index);
    } else {
      const newItems = [...editedItems];
      newItems[index] = { ...newItems[index], quantity: qty };
      setEditedItems(newItems);
    }
  };

  const handleAddProduct = (product) => {
    // Check if product already exists in items
    const existingIndex = editedItems.findIndex(item => item.product === product.id);
    if (existingIndex >= 0) {
      // Update quantity
      const newItems = [...editedItems];
      newItems[existingIndex] = { 
        ...newItems[existingIndex], 
        quantity: newItems[existingIndex].quantity + 1 
      };
      setEditedItems(newItems);
    } else {
      // Add new item
      const newItem = {
        id: `new_${Date.now()}_${product.id}`,
        product: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.selling_price,
        is_new: true
      };
      setEditedItems([...editedItems, newItem]);
    }
    setShowAddProduct(false);
    setProductSearch('');
  };

  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0));
    }, 0);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Separate new items and existing items
      const newItems = editedItems.filter(item => item.is_new).map(item => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));
      
      // Get items to remove (items in original but not in edited)
      const originalIds = (heldOrder.items || []).map(item => item.id);
      const editedIds = editedItems.map(item => item.id).filter(id => !String(id).startsWith('new_'));
      const itemsToRemove = originalIds.filter(id => !editedIds.includes(id));
      
      // Get quantity updates
      const updateQuantities = {};
      editedItems.forEach(item => {
        if (!item.is_new) {
          const original = heldOrder.items.find(i => i.id === item.id);
          if (original && original.quantity !== item.quantity) {
            updateQuantities[item.id] = item.quantity;
          }
        }
      });

      const result = await salesAPI.updateHeldOrder(heldOrder.id, {
        items_to_add: newItems,
        items_to_remove: itemsToRemove,
        update_quantities: updateQuantities
      });

      if (onOrderUpdated) {
        onOrderUpdated(result);
      }
      
      setIsEditing(false);
      setShowAddProduct(false);
      setEditedItems([]);
      
      // Show success
      alert('Held order updated successfully!');
    } catch (error) {
      console.error('Error updating held order:', error);
      alert('Failed to update held order. Please try again.');
    } finally {
      setIsSaving(false);
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

  const displayItems = isEditing ? editedItems : heldOrder.items;
  const displayTotal = isEditing ? calculateTotal(editedItems) : calculateTotal(heldOrder.items);

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

  const mainModal = (
    <div className="held-order-modal-overlay">
      <div className="held-order-modal-content held-order-modal-large">
        <div className="modal-header">
          <h3>
            <i className="fas fa-receipt"></i>
            Held Order Details - Order #{heldOrder.id}
            {isEditing && <span className="edit-badge">Editing</span>}
          </h3>
          <span className="close" onClick={onClose}>&times;</span>
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

            <div className="info-card info-card--total">
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
              {!isEditing && (
                <button className="btn-edit-items" onClick={handleStartEdit}>
                  <i className="fas fa-edit"></i> Edit Items
                </button>
              )}
            </div>
            
            {/* Add Product Section */}
            {isEditing && (
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
            )}
            
            <div className="held-order-modal-table-responsive">
              <table className="held-order-modal-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    {isEditing && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayItems && displayItems.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{index + 1}</td>
                      <td>{getProductName(item)}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(index, e.target.value)}
                            className="quantity-input"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td>{formatCurrency(parseFloat(item.unit_price || 0))}</td>
                      <td>{formatCurrency(parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0))}</td>
                      {isEditing && (
                        <td>
                          <button
                            className="btn-remove-item"
                            onClick={() => handleRemoveItem(index)}
                            title="Remove item"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="held-order-modal-footer">
          {isEditing ? (
            <>
              <button 
                className="held-order-modal-btn held-order-modal-btn-secondary" 
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className="held-order-modal-btn held-order-modal-btn-primary" 
                onClick={handleSaveChanges}
                disabled={isSaving || displayItems.length === 0}
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );

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
              <div>This held order will be permanently voided and cannot be recovered.</div>
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

  return mainModal;
};

export default HeldOrderDetailsModal;
