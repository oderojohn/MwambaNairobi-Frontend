import React, { useEffect, useRef, useCallback } from 'react';
import { toNumber, formatCurrency } from '../../services/ApiService/api';
import '../data/ShoppingCart.css';

const ShoppingCart = ({ 
  cart, 
  categories = [], 
  onUpdateQuantity, 
  onRemoveItem, 
  onProcessPayment, 
  onCreatePendingBill,
  onClearCart,
  primaryActionLabel = 'PAY',
  heldOrderId = null,
  heldOrderNeedsSave = false,
  onExitHeldOrderEditing = () => {},
  disabled = false, 
  selectedCustomer, 
  mode, 
  onCustomerClear,
  canReduceItem = () => true,
  canRemoveItem = () => true,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const itemsRef = useRef(null);
  const prevCartLengthRef = useRef(cart.length);

  // Auto-scroll to bottom when items change
  useEffect(() => {
    if (cart.length !== prevCartLengthRef.current) {
      if (itemsRef.current) {
        itemsRef.current.scrollTop = itemsRef.current.scrollHeight;
      }
      prevCartLengthRef.current = cart.length;
    }
  }, [cart.length]);

  // Keyboard shortcut for PAY button (Enter key)
  const handleKeyPress = useCallback((e) => {
    // Only trigger if Enter is pressed and cart has items and not disabled
    if (e.key === 'Enter' && cart.length > 0 && !disabled) {
      // Don't trigger if user is typing in an input field
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }
      e.preventDefault();
      onProcessPayment();
    }
  }, [cart.length, disabled, onProcessPayment]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
  // Professional color palette
  const colorPalette = [
    { primary: '#2563eb', background: '#dbeafe', hover: '#1d4ed8' }, // Professional Blue
    { primary: '#059669', background: '#d1fae5', hover: '#047857' }, // Professional Green
    { primary: '#dc2626', background: '#fee2e2', hover: '#b91c1c' }, // Professional Red
    { primary: '#d97706', background: '#fef3c7', hover: '#b45309' }, // Professional Amber

    { primary: '#7c3aed', background: '#ede9fe', hover: '#6d28d9' }, // Professional Purple
    { primary: '#0d9488', background: '#ccfbf1', hover: '#0f766e' }, // Professional Teal
    { primary: '#ea580c', background: '#ffedd5', hover: '#c2410c' }, // Professional Orange
    { primary: '#475569', background: '#f1f5f9', hover: '#334155' }, // Professional Slate
  ];

  // Function to get color for category ID
  const getCategoryColor = (categoryId) => {
    const colorIndex = (categoryId - 1) % colorPalette.length;
    return colorPalette[colorIndex];
  };

  // Get category color for a product
  const getProductColor = (product) => {
    const categoryId = product.category;
    if (categoryId) {
      return getCategoryColor(categoryId);
    }
    return { primary: '#64748b', background: '#f8fafc', hover: '#475569' }; // Default professional gray
  };

  const total = cart.reduce((sum, item) => {
    return sum + (toNumber(item.price) * toNumber(item.quantity));
  }, 0);

  const itemCount = cart.reduce((sum, item) => sum + toNumber(item.quantity), 0);

  return (
    <section
      className={`pos-shopping-cart ${isMobileOpen ? 'pos-shopping-cart--mobile-open pos-shopping-cart--overlay' : 'pos-shopping-cart--mobile-closed'}`}
    >
      {/* Cart Header */}
      <div className="pos-shopping-cart__header">
        <div className="pos-shopping-cart__title-section">
          <div className="pos-shopping-cart__title-group">
            <h2 className="pos-shopping-cart__title">Shopping Cart</h2>
            <div className="pos-shopping-cart__item-count">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </div>
          </div>
          {mode === 'wholesale' && (
            <div className="pos-shopping-cart__mode-badge">
              {mode.toUpperCase()}
            </div>
          )}
        </div>
        <div className="pos-shopping-cart__total-display">
          <span className="pos-shopping-cart__total-label">Total:</span>
          <span className="pos-shopping-cart__total-amount">{formatCurrency(total)}</span>
        </div>
        {onCloseMobile && (
          <button
            className="pos-shopping-cart__mobile-close"
            onClick={onCloseMobile}
            aria-label="Close cart"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {heldOrderId && (
        <div
          style={{
            margin: '12px 16px 0',
            padding: '12px 14px',
            borderRadius: '12px',
            background: heldOrderNeedsSave ? '#fff7ed' : '#eff6ff',
            border: `1px solid ${heldOrderNeedsSave ? '#fdba74' : '#93c5fd'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>
              Editing held order #{heldOrderId}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#475569' }}>
              {heldOrderNeedsSave
                ? 'You have unsaved changes. Save first, then pay when the customer is ready.'
                : 'No changes yet. You can pay now or exit editing and come back later.'}
            </div>
          </div>
          <button
            type="button"
            className="pos-shopping-cart__quick-btn pos-shopping-cart__quick-btn--secondary"
            onClick={() => !disabled && onExitHeldOrderEditing()}
            disabled={disabled}
            title="Exit held order editing"
          >
            <i className="fas fa-sign-out-alt"></i>
            EXIT
          </button>
        </div>
      )}

      {/* Cart Items */}
      <div className="pos-shopping-cart__items" ref={itemsRef}>
        {cart.length === 0 && !selectedCustomer ? (
          <div className="pos-shopping-cart__empty">
            <div className="pos-shopping-cart__empty-icon">
              <i className="fas fa-receipt"></i>
            </div>
            <h3 className="pos-shopping-cart__empty-title">No Items in Cart</h3>
            <p className="pos-shopping-cart__empty-message">
              Select products from the catalog to begin order
            </p>
          </div>
        ) : (
          <div className="pos-shopping-cart__items-list">
            {/* Customer Badge as First Item */}
            {selectedCustomer && (
              <div className="pos-shopping-cart__item pos-shopping-cart__item--customer">
                <div 
                  className="pos-shopping-cart__item-badge"
                  style={{ 
                    backgroundColor: '#3b82f6',
                    border: '2px solid #3b82f6'
                  }}
                >
                  <i className="fas fa-user"></i>
                </div>

                <div className="pos-shopping-cart__item-content">
                  <div className="pos-shopping-cart__item-details">
                    <h4 className="pos-shopping-cart__item-name" title={selectedCustomer.name}>
                      {selectedCustomer.name}
                    </h4>
                    <div className="pos-shopping-cart__item-meta">
                      <span className="pos-shopping-cart__item-price">
                        {selectedCustomer.phone || 'No phone'}
                      </span>
                      <span className="pos-shopping-cart__item-stock">
                        {mode === 'wholesale' ? 'Wholesale Customer' : 'Retail Customer'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pos-shopping-cart__item-total">
                    {/* Empty total space for alignment */}
                  </div>
                </div>

                <div className="pos-shopping-cart__item-controls">
                  <button
                    className="pos-shopping-cart__remove-btn"
                    onClick={() => {
                      if (!disabled && window.confirm('Remove customer from order?')) {
                        onCustomerClear();
                      }
                    }}
                    disabled={disabled}
                    title="Remove customer from order"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Regular Cart Items */}
            {cart.map((item, index) => {
              const productColor = getProductColor(item);
              const itemTotal = toNumber(item.price) * toNumber(item.quantity);
              const allowReduce = canReduceItem(item);
              const allowRemove = canRemoveItem(item);
              
              return (
                <div 
                  key={`${item.id}-${index}`} 
                  className={`pos-shopping-cart__item ${disabled ? 'pos-shopping-cart__item--disabled' : ''}`}
                  style={{
                    '--item-color': productColor.primary,
                    '--item-bg': productColor.background,
                    '--item-hover': productColor.hover
                  }}
                >
                  <div 
                    className="pos-shopping-cart__item-badge"
                    style={{ 
                      backgroundColor: productColor.primary,
                      border: `2px solid ${productColor.primary}`
                    }}
                  >
                    {item.category_name ? item.category_name.charAt(0).toUpperCase() : 'P'}
                  </div>

                  <div className="pos-shopping-cart__item-content">
                    <div className="pos-shopping-cart__item-details">
                      <h4 className="pos-shopping-cart__item-name" title={item.name}>
                        {item.name}
                      </h4>
                      <div className="pos-shopping-cart__item-meta">
                        <span className="pos-shopping-cart__item-price">
                          {formatCurrency(item.price)} each
                        </span>
                        {item.stock_quantity !== undefined && (
                          <span className="pos-shopping-cart__item-stock">
                            Stock: {item.stock_quantity}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="pos-shopping-cart__item-total">
                      {formatCurrency(itemTotal)}
                    </div>
                  </div>

                  <div className="pos-shopping-cart__item-controls">
                    <div className="pos-shopping-cart__quantity-section">
                      <div className="pos-shopping-cart__quantity-controls">
                        <button
                          className="pos-shopping-cart__quantity-btn pos-shopping-cart__quantity-btn--decrease"
                          onClick={() => !disabled && allowReduce && onUpdateQuantity(item.id, -1)}
                          disabled={disabled || !allowReduce}
                          title={allowReduce ? 'Decrease quantity' : 'Original held-order items cannot be reduced'}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <input
                          type="number"
                          className="pos-shopping-cart__quantity-input"
                          value={item.quantity}
                          onChange={(e) => {
                            if (!disabled) {
                              const value = e.target.value;
                              // Allow empty input for deletion
                              if (value === '') {
                                return;
                              }
                              const newQty = parseInt(value) || 0;
                              if (newQty >= 0 && (newQty >= item.quantity || allowReduce)) {
                                const diff = newQty - item.quantity;
                                onUpdateQuantity(item.id, diff);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            // If user leaves field empty or at 0, remove the item
                            if (!disabled && allowRemove && (e.target.value === '' || parseInt(e.target.value) === 0)) {
                              onRemoveItem(item.id);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          disabled={disabled}
                          min="0"
                          title={allowReduce ? 'Enter quantity (0 to remove)' : 'Only quantity increases are allowed for original held-order items'}
                        />
                        <button
                          className="pos-shopping-cart__quantity-btn pos-shopping-cart__quantity-btn--increase"
                          onClick={() => !disabled && onUpdateQuantity(item.id, 1)}
                          disabled={disabled}
                          title="Increase quantity"
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      
                      <button
                        className="pos-shopping-cart__remove-btn"
                        onClick={() => {
                          if (!disabled && allowRemove) {
                            onRemoveItem(item.id);
                          }
                        }}
                        disabled={disabled || !allowRemove}
                        title={allowRemove ? 'Remove item from cart' : 'Original held-order items cannot be removed'}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      <div className="pos-shopping-cart__footer">
        <div className="pos-shopping-cart__quick-actions">
          <button 
            className="pos-shopping-cart__quick-btn pos-shopping-cart__quick-btn--secondary"
            onClick={() => !disabled && onCreatePendingBill()} 
            disabled={disabled || cart.length === 0}
            title="Create Pending Bill"
          >
            <i className="fas fa-pause"></i>
            PENDING
          </button>
          <button 
            className="pos-shopping-cart__quick-btn pos-shopping-cart__quick-btn--danger"
            onClick={() => {
              if (!disabled && cart.length > 0) {
                import('sweetalert2').then(Swal => {
                  Swal.default.fire({
                    title: 'Clear Cart?',
                    text: 'This will remove all items from the cart.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Clear',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#dc2626',
                    cancelButtonColor: '#6b7280',
                    zIndex: 10000
                  }).then((result) => {
                    if (result.isConfirmed) {
                      onClearCart();
                    }
                  });
                });
              }
            }} 
            disabled={disabled || cart.length === 0}
            title="Clear Cart"
          >
            <i className="fas fa-trash"></i>
            CLEAR
          </button>
          <button 
            className="pos-shopping-cart__quick-btn pos-shopping-cart__quick-btn--info"
            title="Quick Add"
          >
            <i className="fas fa-plus"></i>
            ADD
          </button>
          <button 
            className="pos-shopping-cart__quick-btn pos-shopping-cart__quick-btn--primary"
            onClick={() => !disabled && onProcessPayment()} 
            disabled={cart.length === 0 || disabled}
            title={primaryActionLabel === 'SAVE' ? 'Save Held Order' : 'Process Payment (Enter)'}
          >
            <i className={`fas ${primaryActionLabel === 'SAVE' ? 'fa-save' : 'fa-credit-card'}`}></i>
            {primaryActionLabel}
            {primaryActionLabel !== 'SAVE' && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>[Enter]</span>}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ShoppingCart;
