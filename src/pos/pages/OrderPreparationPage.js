// OrderPreparationPage.js - Purchase Order Creation Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import logo from '../../logo.png';
import { toNumber, formatCurrency, purchaseOrdersAPI, reportsAPI } from '../../services/ApiService/api';
import './OrderPreparationPage.css';

const OrderPreparationPage = ({ products, categories, suppliers }) => {
  const navigate = useNavigate();

  // State management
  const [orderItems, setOrderItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToOrder, setIsAddingToOrder] = useState(false);
  const [isClearingOrder, setIsClearingOrder] = useState(false);
  const [isCopyingToWhatsApp, setIsCopyingToWhatsApp] = useState(false);
  const [sortBy, setSortBy] = useState('stock');
  const [savedOrder, setSavedOrder] = useState(null);
  const [orderSaved, setOrderSaved] = useState(false);

  // Check for edit parameter in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editOrderId = urlParams.get('edit');

    if (editOrderId) {
      loadOrderForEditing(editOrderId);
    }
  }, []);


  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === parseInt(selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const stockA = a.stock_quantity || 0;
      const stockB = b.stock_quantity || 0;
      
      // Always sort by stock level first (low stock first)
      if (stockA !== stockB) {
        return stockA - stockB;
      }
      
      // Then apply secondary sort
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return (a.cost_price || 0) - (b.cost_price || 0);
        default:
          return 0;
      }
    });

  const getStockStatus = (stock) => {
    if (stock === 0) return 'out';
    if (stock <= 5) return 'critical';
    if (stock <= 10) return 'low';
    if (stock <= 20) return 'medium';
    return 'good';
  };

  const getStockStatusText = (stock) => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 5) return 'Critical';
    if (stock <= 10) return 'Low';
    if (stock <= 20) return 'Medium';
    return 'Good';
  };

  const addToOrder = async (product) => {
    if (isAddingToOrder) return; // Prevent multiple clicks

    setIsAddingToOrder(true);

    // Show loading Swal
    const loadingSwal = Swal.fire({
      title: 'Adding to Order...',
      text: 'Please wait',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      zIndex: 10000,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      setOrderItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === product.id);
        if (existingItem) {
          return prevItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          const price = product.cost_price || 0; // Use cost_price as buying price
          return [...prevItems, {
            ...product,
            quantity: 1,
            price: price,
            unit_price: price
          }];
        }
      });

      loadingSwal.close();

      // Show success message briefly
      Swal.fire({
        icon: 'success',
        title: 'Added!',
        text: `${product.name} added to order`,
        timer: 800,
        showConfirmButton: false,
        zIndex: 10000
      });

    } catch (error) {
      console.error('Error adding to order:', error);
      loadingSwal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add item to order',
        zIndex: 10000
      });
    } finally {
      setIsAddingToOrder(false);
    }
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
    return orderItems.reduce((total, item) => total + (toNumber(item.unit_price) * toNumber(item.quantity)), 0);
  };

  const handleSaveOrder = async () => {
    if (orderItems.length === 0) {
      alert('Please add at least one item to the purchase order');
      return;
    }

    if (!selectedSupplier) {
      alert('Please select a supplier');
      return;
    }

    // Show loading Swal
    const loadingSwal = Swal.fire({
      title: 'Creating Purchase Order...',
      text: 'Please wait while we process your order',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      zIndex: 10000,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      setIsLoading(true);
      const orderData = {
        supplier: selectedSupplier.id,
        expected_delivery_date: deliveryDate || null,
        notes: orderNotes,
        items: orderItems.map(item => ({
          product: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      let savedOrder;
      if (editingOrderId) {
        savedOrder = await purchaseOrdersAPI.updatePurchaseOrder(editingOrderId, orderData);
        loadingSwal.close();
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Order Updated!',
          text: 'Purchase order has been updated successfully.',
          timer: 2000,
          showConfirmButton: false,
          zIndex: 10000
        });
      } else {
        savedOrder = await purchaseOrdersAPI.createPurchaseOrder(orderData);
        loadingSwal.close();
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Order Created!',
          text: 'Purchase order has been created successfully.',
          timer: 2000,
          showConfirmButton: false,
          zIndex: 10000
        });
      }

      // Store the saved order for viewing
      setSavedOrder(savedOrder);
      setOrderSaved(true);
    } catch (error) {
      console.error('Error saving purchase order:', error);
      loadingSwal.close();
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save purchase order. Please try again.',
        zIndex: 10000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearOrder = async () => {
    if (isClearingOrder) return; // Prevent multiple clicks

    setIsClearingOrder(true);

    // Show loading Swal
    const loadingSwal = Swal.fire({
      title: 'Clearing Order...',
      text: 'Please wait',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      zIndex: 10000,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      setOrderItems([]);
      setSelectedSupplier(null);
      setOrderNotes('');
      setDeliveryDate('');
      setEditingOrderId(null);
      setSavedOrder(null);
      setOrderSaved(false);

      loadingSwal.close();

      // Show success message briefly
      Swal.fire({
        icon: 'success',
        title: 'Cleared!',
        text: 'Order has been cleared',
        timer: 800,
        showConfirmButton: false,
        zIndex: 10000
      });

    } catch (error) {
      console.error('Error clearing order:', error);
      loadingSwal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to clear order',
        zIndex: 10000
      });
    } finally {
      setIsClearingOrder(false);
    }
  };

  const copyOrderToWhatsApp = async (useSavedOrder = false) => {
    if (isCopyingToWhatsApp) return; // Prevent multiple clicks

    setIsCopyingToWhatsApp(true);

    // Show loading Swal
    const loadingSwal = Swal.fire({
      title: 'Copying to WhatsApp...',
      text: 'Please wait',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      zIndex: 10000,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const items = useSavedOrder && savedOrder ? savedOrder.items : orderItems;
      const supplier = useSavedOrder && savedOrder ? savedOrder.supplier : selectedSupplier;
      const notes = useSavedOrder && savedOrder ? savedOrder.notes : orderNotes;
      const delivery = useSavedOrder && savedOrder ? savedOrder.expected_delivery_date : deliveryDate;
      const orderNumber = useSavedOrder && savedOrder ? savedOrder.order_number : null;

      if (items.length === 0) {
        loadingSwal.close();
        Swal.fire({
          icon: 'warning',
          title: 'No Items',
          text: 'No items in the order to copy',
          zIndex: 10000
        });
        return;
      }

      if (!supplier) {
        loadingSwal.close();
        Swal.fire({
          icon: 'warning',
          title: 'No Supplier',
          text: 'Please select a supplier first',
          zIndex: 10000
        });
        return;
      }

      let message = `*Purchase Order`;
      if (orderNumber) message += ` #${orderNumber}`;
      message += ` for ${supplier.name}*\n\n`;
      message += `*Order Items:*\n`;

      items.forEach((item, index) => {
        message += `${index + 1}. ${item.product_name || item.name}\n`;
        message += `   Quantity: ${item.quantity}\n`;
        message += `   Unit Price: ${formatCurrency(item.unit_price)}\n`;
        message += `   Total: ${formatCurrency(item.unit_price * item.quantity)}\n\n`;
      });

      const total = items.reduce((sum, item) => sum + (toNumber(item.unit_price) * toNumber(item.quantity)), 0);
      message += `*Total Amount: ${formatCurrency(total)}*\n`;

      if (delivery) {
        message += `*Expected Delivery: ${new Date(delivery).toLocaleDateString()}*\n`;
      }

      if (notes) {
        message += `*Notes: ${notes}*\n`;
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));

      // Copy to clipboard
      await navigator.clipboard.writeText(message);

      loadingSwal.close();

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Order details copied to clipboard! You can now paste it in WhatsApp.',
        timer: 2000,
        showConfirmButton: false,
        zIndex: 10000
      });

    } catch (error) {
      console.error('Error copying to WhatsApp:', error);
      loadingSwal.close();

      // Try fallback method
      try {
        const items = useSavedOrder && savedOrder ? savedOrder.items : orderItems;
        const supplier = useSavedOrder && savedOrder ? savedOrder.supplier : selectedSupplier;
        const notes = useSavedOrder && savedOrder ? savedOrder.notes : orderNotes;
        const delivery = useSavedOrder && savedOrder ? savedOrder.expected_delivery_date : deliveryDate;
        const orderNumber = useSavedOrder && savedOrder ? savedOrder.order_number : null;

        let message = `*Purchase Order`;
        if (orderNumber) message += ` #${orderNumber}`;
        message += ` for ${supplier.name}*\n\n`;
        message += `*Order Items:*\n`;

        items.forEach((item, index) => {
          message += `${index + 1}. ${item.product_name || item.name}\n`;
          message += `   Quantity: ${item.quantity}\n`;
          message += `   Unit Price: ${formatCurrency(item.unit_price)}\n`;
          message += `   Total: ${formatCurrency(item.unit_price * item.quantity)}\n\n`;
        });

        const total = items.reduce((sum, item) => sum + (toNumber(item.unit_price) * toNumber(item.quantity)), 0);
        message += `*Total Amount: ${formatCurrency(total)}*\n`;

        if (delivery) {
          message += `*Expected Delivery: ${new Date(delivery).toLocaleDateString()}*\n`;
        }

        if (notes) {
          message += `*Notes: ${notes}*\n`;
        }

        // Fallback: create a temporary textarea to copy from
        const textArea = document.createElement('textarea');
        textArea.value = message;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        Swal.fire({
          icon: 'success',
          title: 'Copied!',
          text: 'Order details copied to clipboard using fallback method!',
          timer: 2000,
          showConfirmButton: false,
          zIndex: 10000
        });

      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to copy order details. Please try again.',
          zIndex: 10000
        });
      }
    } finally {
      setIsCopyingToWhatsApp(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const loadOrderForEditing = async (orderId) => {
    try {
      setIsLoading(true);
      const order = await purchaseOrdersAPI.getPurchaseOrder(orderId);
      setEditingOrderId(order.id);
      setSelectedSupplier(order.supplier);
      setOrderNotes(order.notes || '');
      setDeliveryDate(order.expected_delivery_date || '');
      setOrderItems(order.items?.map(item => ({
        ...item,
        quantity: item.quantity,
        unit_price: item.unit_price,
        price: item.unit_price
      })) || []);
    } catch (error) {
      console.error('Error loading order for editing:', error);
      alert('Failed to load order for editing');
    } finally {
      setIsLoading(false);
    }
  };


  const handleDownloadPDF = async () => {
    const result = await Swal.fire({
      title: 'Download Product Price List',
      text: 'Select the price types to include in the PDF:',
      input: 'radio',
      inputOptions: {
        retail: 'Retail Price Only',
        wholesale: 'Wholesale Price Only',
        both: 'Both Retail and Wholesale Prices'
      },
      inputValue: 'both',
      showCancelButton: true,
      confirmButtonText: 'Download PDF',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a price type!';
        }
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        // Show loading
        const loadingSwal = Swal.fire({
          title: 'Generating PDF...',
          text: 'Please wait while we generate your PDF',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Call backend API to generate PDF
        const response = await reportsAPI.generateProductPriceListPDF(result.value);

        // The API returns a blob directly
        const pdfBlob = response;

        // Create download link
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `product_price_list_${result.value}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Close loading and show success
        loadingSwal.close();
        Swal.fire({
          icon: 'success',
          title: 'PDF Downloaded!',
          text: 'Product price list has been downloaded successfully.',
          timer: 2000,
          showConfirmButton: false,
        });

      } catch (error) {
        console.error('Error downloading PDF:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to download PDF. Please try again.',
        });
      }
    }
  };



  const renderProductsTable = () => (
    <div className="order-prep-products-panel">
      <div className="order-prep-panel-header">
        <h3>Product Catalog</h3>
        <div className="order-prep-products-controls">
          <div className="order-prep-search">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="order-prep-category-filter"
          >
            <option value="all">All Categories</option>
            {categories?.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="order-prep-sort-filter"
          >
            <option value="stock">Sort by Stock</option>
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
          </select>
        </div>
      </div>

      <div className="order-prep-products-table">
        {filteredProducts.length === 0 ? (
          <div className="order-prep-empty">
            <i className="fas fa-search"></i>
            <h3>No Products Found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <table className="order-prep-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const stock = product.stock_quantity || 0;
                const stockStatus = getStockStatus(stock);
                const statusText = getStockStatusText(stock);

                return (
                  <tr key={product.id}>
                    <td>
                      <div>
                        <strong>{product.name}</strong>
                        {product.description && (
                          <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
                            {product.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {categories?.find(cat => cat.id === product.category)?.name || 'Uncategorized'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(product.cost_price || 0)}
                    </td>
                    <td>
                      <div className="order-prep-stock-info">
                        <span className="order-prep-stock-quantity">{stock}</span>
                        <div className="order-prep-stock-bar">
                          <div
                            className={`order-prep-stock-fill ${stockStatus}`}
                            style={{
                              width: `${stockStatus === 'out' ? 0 : Math.min(100, (stock / 50) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`order-prep-status-tag ${stockStatus}`}>
                        {statusText}
                      </span>
                    </td>
                    <td>
                      <button
                          className="order-prep-btn order-prep-btn-primary"
                          onClick={() => addToOrder(product)}
                          disabled={isAddingToOrder}
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                        >
                          <i className="fas fa-plus"></i> {isAddingToOrder ? 'Adding...' : 'Add'}
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderOrderItemsTable = () => (
    <div className="order-prep-summary-panel">
      <div className="order-prep-panel-header">
        <h3>
          Order Items
          <span className="order-prep-items-count">({orderItems.length})</span>
        </h3>
      </div>

      {!selectedSupplier && (
        <div className="order-prep-supplier-section">
          <label>Select Supplier *</label>
          <select
            value={selectedSupplier?.id || ''}
            onChange={(e) => {
              const supplierId = e.target.value;
              const supplier = suppliers.find(s => s.id === parseInt(supplierId));
              setSelectedSupplier(supplier || null);
            }}
            className="order-prep-supplier-select"
          >
            <option value="">Choose a supplier...</option>
            {suppliers?.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedSupplier && (
        <div className="order-prep-supplier-section">
          <label>Supplier</label>
          <div className="order-prep-supplier-info">
            <h4>
              <i className="fas fa-truck"></i>
              {selectedSupplier.name}
            </h4>
            <p>{selectedSupplier.contact_info || 'No contact information'}</p>
          </div>
        </div>
      )}

      <div className="order-prep-items-section">
        {orderItems.length === 0 ? (
          <div className="order-prep-empty">
            <i className="fas fa-shopping-cart"></i>
            <h3>No Items Added</h3>
            <p>Add products from the catalog to create your purchase order</p>
          </div>
        ) : (
          <table className="order-prep-table order-prep-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map(item => (
                <tr key={item.id}>
                  <td className="order-prep-item-name">
                    <strong>{item.product_name || item.name}</strong>
                  </td>

                  <td className="order-prep-item-price">
                    {formatCurrency(item.unit_price || item.price)}
                  </td>

                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="order-prep-quantity-input"
                      style={{ width: '60px', textAlign: 'center' }}
                    />
                  </td>

                  <td className="order-prep-item-total">
                    {formatCurrency((item.unit_price || item.price) * item.quantity)}
                  </td>

                  <td>
                    <button
                      className="order-prep-remove-btn"
                      onClick={() => removeFromOrder(item.id)}
                      title="Remove item"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {orderItems.length > 0 && (
        <>
          <div className="order-prep-details">
            <div className="order-prep-detail-group">
              <label>Expected Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="order-prep-detail-group">
              <label>Notes</label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add any notes or special instructions..."
                rows="3"
              />
            </div>
          </div>

          <div className="order-prep-total-section">
            <div className="order-prep-total-line">
              <span>Total Amount:</span>
              <span className="order-prep-total-amount">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderSavedOrderDetails = () => {
    if (!savedOrder) return null;

    return (
      <div className="order-prep-saved-order-panel">
        <div className="order-prep-panel-header">
          <h3>
            <i className="fas fa-check-circle"></i>
            Order Saved Successfully
          </h3>
          <div className="order-prep-saved-actions">
            <button
              className="order-prep-btn order-prep-btn-secondary"
              onClick={() => copyOrderToWhatsApp(true)}
            >
              <i className="fab fa-whatsapp"></i>
              Copy to WhatsApp
            </button>
            <button
              className="order-prep-btn order-prep-btn-outline"
              onClick={() => navigate('/order-management')}
            >
              <i className="fas fa-list"></i>
              View All Orders
            </button>
          </div>
        </div>

        <div className="order-prep-saved-order-info">
          <div className="order-prep-saved-order-header">
            <div className="order-prep-saved-order-meta">
              <h4>Order #{savedOrder.order_number || savedOrder.id}</h4>
              <p>Supplier: {savedOrder.supplier?.name || 'N/A'}</p>
              <p>Status: <span className={`status-badge ${savedOrder.status?.toLowerCase()}`}>{savedOrder.status}</span></p>
              <p>Date: {new Date(savedOrder.order_date || savedOrder.created_at).toLocaleDateString()}</p>
              {savedOrder.expected_delivery_date && (
                <p>Expected Delivery: {new Date(savedOrder.expected_delivery_date).toLocaleDateString()}</p>
              )}
            </div>
            <div className="order-prep-saved-order-total">
              <h4>Total: {formatCurrency(savedOrder.total_amount || 0)}</h4>
            </div>
          </div>

          <div className="order-prep-saved-order-items">
            <h4>Order Items</h4>
            <table className="order-prep-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {savedOrder.items?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product_name || item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td>{formatCurrency(item.unit_price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {savedOrder.notes && (
            <div className="order-prep-saved-order-notes">
              <h4>Notes</h4>
              <p>{savedOrder.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };




  return (
    <div className="order-prep-page">
      {/* Header */}
      <header className="order-prep-header">
        <div className="order-prep-header-content">
          <button className="order-prep-back-btn" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
            Back to POS
          </button>

          <div className="order-prep-header-title">
            <img src={logo} alt="Logo" className="order-prep-logo-png" />
            <h1>Create Purchase Order</h1>
          </div>
        </div>

        <div className="order-prep-mode-selector">
          <button
            className="order-prep-mode-btn order-prep-mode-active"
          >
            <i className="fas fa-plus-circle"></i>
            Create Order
          </button>
          <button
            className="order-prep-mode-btn"
            onClick={handleDownloadPDF}
          >
            <i className="fas fa-download"></i>
            Download PDF
          </button>
          <button
            className="order-prep-mode-btn"
            onClick={() => navigate('/order-management')}
          >
            <i className="fas fa-list"></i>
            Manage Orders
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="order-prep-main-content" style={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        <div className="order-prep-layout">
          {renderProductsTable()}
          {renderOrderItemsTable()}
          {orderSaved && savedOrder && renderSavedOrderDetails()}
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="order-prep-actions-footer">
        <div className="order-prep-actions-container">
          <button
            className="order-prep-btn order-prep-btn-secondary"
            onClick={clearOrder}
            disabled={orderItems.length === 0 || isClearingOrder}
          >
            <i className="fas fa-times"></i>
            {isClearingOrder ? 'Clearing...' : 'Clear All'}
          </button>
          <button
            className="order-prep-btn order-prep-btn-secondary"
            onClick={copyOrderToWhatsApp}
            disabled={orderItems.length === 0 || !selectedSupplier || isCopyingToWhatsApp}
          >
            <i className="fab fa-whatsapp"></i>
            {isCopyingToWhatsApp ? 'Copying...' : 'Copy to WhatsApp'}
          </button>
          <button
            className="order-prep-btn order-prep-btn-primary"
            onClick={handleSaveOrder}
            disabled={orderItems.length === 0 || !selectedSupplier || isLoading}
          >
            <i className="fas fa-save"></i>
            {isLoading ? 'Saving...' : (editingOrderId ? 'Update Order' : 'Create Purchase Order')}
          </button>
        </div>
      </footer>

    </div>
  );


};

export default OrderPreparationPage;