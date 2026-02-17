import React, { useState, useEffect } from 'react';
import { salesAPI, returnsAPI, productsAPI } from '../../../services/ApiService/api';
import { formatCurrency } from '../../../services/ApiService/api';
import './SuperReturnServices.css';

const SuperReturnServices = ({ isLoading, onReturnComplete }) => {
  const [step, setStep] = useState(1); // 1: Search, 2: Select Items, 3: Confirm
  const [searchType, setSearchType] = useState('receipt'); // 'receipt' or 'product'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [products, setProducts] = useState([]);

  // Helper function to safely format amounts
  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num === null || amount === undefined) {
      return formatCurrency(0);
    }
    return formatCurrency(num);
  };

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const returnReasons = [
    'Defective Product',
    'Wrong Item Sold',
    'Customer Changed Mind',
    'Product Expired',
    'Damaged Packaging',
    'Price Discrepancy',
    'Other'
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await productsAPI.getProducts();
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      if (searchType === 'receipt') {
        // Search by receipt number
        const sale = await salesAPI.searchByReceipt(searchQuery.trim());
        if (sale) {
          setSearchResults([sale]);
        } else {
          setSearchResults([]);
          setError('No sale found with this receipt number');
        }
      } else {
        // Search by product name - get all sales containing this product
        const sales = await salesAPI.getSales({ product_search: searchQuery.trim() });
        setSearchResults(sales || []);
        if (!sales || sales.length === 0) {
          setError('No sales found with this product');
        }
      }
    } catch (error) {
      console.error('Error searching:', error);
      setError('Error searching for sales. Please try again.');
      setSearchResults([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    setSelectedItems([]);
    setStep(2);
  };

  const handleItemToggle = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, { ...item, returnQuantity: item.quantity }];
      }
    });
  };

  const handleQuantityChange = (itemId, quantity) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, returnQuantity: Math.min(quantity, item.quantity) }
          : item
      )
    );
  };

  const calculateReturnTotal = () => {
    return selectedItems.reduce((total, item) => {
      const price = parseFloat(item.unit_price) || 0;
      const qty = parseInt(item.returnQuantity) || 0;
      return total + (price * qty);
    }, 0);
  };

  const handleProceedToConfirm = () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to return');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleConfirmReturn = async () => {
    const reason = returnReason === 'Other' ? customReason : returnReason;
    if (!reason.trim()) {
      setError('Please provide a reason for the return');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create return record - use original_sale_id for backend
      const returnData = {
        original_sale_id: selectedSale.id,
        items: selectedItems.map(item => ({
          sale_item_id: item.id,  // Use sale_item_id, not product_id
          quantity: item.returnQuantity,
          reason: reason,
          unit_price: item.unit_price
        })),
        reason: reason,
        return_type: 'super_return'
      };

      await returnsAPI.createReturn(returnData);

      setSuccess(`Return processed successfully! Total refund: ${formatAmount(calculateReturnTotal())}`);
      
      // Reset after success
      setTimeout(() => {
        resetForm();
        if (onReturnComplete) {
          onReturnComplete();
        }
      }, 2000);

    } catch (error) {
      console.error('Error processing return:', error);
      setError('Failed to process return. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSale(null);
    setSelectedItems([]);
    setReturnReason('');
    setCustomReason('');
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="super-return-services">
      <div className="return-header">
        <h2><i className="fas fa-undo-alt"></i> Super Return Services</h2>
        <p>Process product returns without shift requirement. Returns will be added back to stock and deducted from total sales.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      {/* Step 1: Search */}
      {step === 1 && (
        <div className="search-section">
          <div className="search-type-selector">
            <button 
              className={`search-type-btn ${searchType === 'receipt' ? 'active' : ''}`}
              onClick={() => setSearchType('receipt')}
            >
              <i className="fas fa-receipt"></i> Search by Receipt
            </button>
            <button 
              className={`search-type-btn ${searchType === 'product' ? 'active' : ''}`}
              onClick={() => setSearchType('product')}
            >
              <i className="fas fa-box"></i> Search by Product
            </button>
          </div>

          <div className="search-input-group">
            <input
              type="text"
              placeholder={searchType === 'receipt' ? 'Enter receipt number...' : 'Enter product name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              className="search-btn"
              onClick={handleSearch}
              disabled={isProcessing}
            >
              {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results ({searchResults.length})</h3>
              <div className="results-list">
                {searchResults.map(sale => (
                  <div key={sale.id} className="sale-card" onClick={() => handleSelectSale(sale)}>
                    <div className="sale-info">
                      <span className="receipt-number">
                        <i className="fas fa-receipt"></i> {sale.receipt_number || 'N/A'}
                      </span>
                      <span className="sale-date">
                        <i className="fas fa-calendar"></i> {formatDate(sale.created_at)}
                      </span>
                    </div>
                    <div className="sale-details">
                      <span className="sale-total">{formatAmount(sale.total_amount)}</span>
                      <span className="sale-items">{sale.items?.length || 0} items</span>
                    </div>
                    <div className="sale-customer">
                      {sale.customer_name || 'Walk-in Customer'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Items */}
      {step === 2 && selectedSale && (
        <div className="select-items-section">
          <div className="selected-sale-info">
            <button className="back-btn" onClick={() => setStep(1)}>
              <i className="fas fa-arrow-left"></i> Back to Search
            </button>
            <h3>Receipt: {selectedSale.receipt_number || 'N/A'}</h3>
            <span className="sale-total">Original Total: {formatAmount(selectedSale.total_amount)}</span>
          </div>

          <div className="items-list">
            <h4>Select items to return:</h4>
            {selectedSale.items?.map(item => (
              <div key={item.id} className={`item-row ${selectedItems.find(i => i.id === item.id) ? 'selected' : ''}`}>
                <div className="item-checkbox">
                  <input
                    type="checkbox"
                    checked={!!selectedItems.find(i => i.id === item.id)}
                    onChange={() => handleItemToggle(item)}
                  />
                </div>
                <div className="item-details">
                  <span className="item-name">{item.product_name || item.name || 'Unknown Product'}</span>
                  <span className="item-price">{formatAmount(item.unit_price)} each</span>
                </div>
                <div className="item-quantity">
                  <span>Original: {item.quantity || 0}</span>
                  {selectedItems.find(i => i.id === item.id) && (
                    <div className="return-quantity">
                      <label>Return Qty:</label>
                      <input
                        type="number"
                        min="1"
                        max={item.quantity || 1}
                        value={selectedItems.find(i => i.id === item.id)?.returnQuantity || 1}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      />
                    </div>
                  )}
                </div>
                <div className="item-total">
                  {formatAmount((item.unit_price || 0) * (item.quantity || 0))}
                </div>
              </div>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <div className="return-summary">
              <h4>Return Summary</h4>
              <div className="summary-row">
                <span>Items to Return:</span>
                <span>{selectedItems.length}</span>
              </div>
              <div className="summary-row total">
                <span>Total Refund:</span>
                <span>{formatAmount(calculateReturnTotal())}</span>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleProceedToConfirm}
              disabled={selectedItems.length === 0}
            >
              Proceed to Confirm
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm Return */}
      {step === 3 && (
        <div className="confirm-section">
          <div className="confirm-header">
            <button className="back-btn" onClick={() => setStep(2)}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <h3>Confirm Return</h3>
          </div>

          <div className="return-details-card">
            <div className="detail-row">
              <label>Receipt Number:</label>
              <span>{selectedSale?.receipt_number || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <label>Original Sale Date:</label>
              <span>{formatDate(selectedSale?.created_at)}</span>
            </div>
            <div className="detail-row">
              <label>Customer:</label>
              <span>{selectedSale?.customer_name || 'Walk-in Customer'}</span>
            </div>
          </div>

          <div className="items-to-return">
            <h4>Items to Return:</h4>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.product_name || item.name || 'Unknown Product'}</td>
                    <td>{item.returnQuantity || 0}</td>
                    <td>{formatAmount(item.unit_price)}</td>
                    <td>{formatAmount((item.unit_price || 0) * (item.returnQuantity || 0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3"><strong>Total Refund Amount:</strong></td>
                  <td><strong>{formatAmount(calculateReturnTotal())}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="reason-section">
            <h4>Return Reason:</h4>
            <div className="reason-options">
              {returnReasons.map(reason => (
                <label key={reason} className="reason-option">
                  <input
                    type="radio"
                    name="returnReason"
                    value={reason}
                    checked={returnReason === reason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />
                  {reason}
                </label>
              ))}
            </div>
            {returnReason === 'Other' && (
              <textarea
                placeholder="Please specify the reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            )}
          </div>

          <div className="stock-info">
            <i className="fas fa-info-circle"></i>
            <p>Items will be returned to stock and the total sales amount will be reduced by the refund amount.</p>
          </div>

          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleConfirmReturn}
              disabled={isProcessing || (!returnReason || (returnReason === 'Other' && !customReason))}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-undo"></i> Confirm Return
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperReturnServices;