// pages/ProductHistoryPage.js
import React, { useState, useEffect } from 'react';
import {
  FiFilter,
  FiDownload,
  FiPrinter,
  FiSearch,
  FiClock,
  FiX
} from 'react-icons/fi';
import { inventoryAPI } from '../../../services/ApiService/api';
import '../../../pos/pages/OrderManagementPage.css';

const ProductHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('export');

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.productHistory.getAll();
      setHistory(response || []);
    } catch (err) {
      setError('Failed to fetch product history');
      console.error('Error fetching product history:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await inventoryAPI.products.getAll();
      setProducts(response || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const filteredHistory = history.filter(item => {
    const matchesSearch = (item.product_name && item.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (item.field_changed && item.field_changed.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProduct = !selectedProduct || item.product === selectedProduct.id;
    const matchesField = !fieldFilter || item.field_changed === fieldFilter;

    return matchesSearch && matchesProduct && matchesField;
  });

  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    // Load history if not loaded yet
    if (history.length === 0) {
      await fetchHistory();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeTypeColor = (changeType) => {
    switch (changeType) {
      case 'create': return 'success';
      case 'update': return 'info';
      case 'delete': return 'danger';
      default: return 'secondary';
    }
  };

  const getUniqueFields = () => {
    const fields = [...new Set(history.map(item => item.field_changed).filter(Boolean))];
    return fields;
  };

  const formatChange = (item) => {
    const field = item.field_changed;
    const oldVal = item.old_value;
    const newVal = item.new_value;

    if (field === 'stock_quantity') {
      const oldNum = parseFloat(oldVal) || 0;
      const newNum = parseFloat(newVal) || 0;
      const diff = newNum - oldNum;
      if (diff > 0) {
        return `Stock increased by ${diff} (Balance: ${newNum})`;
      } else if (diff < 0) {
        return `Stock decreased by ${Math.abs(diff)} (Balance: ${newNum})`;
      } else {
        return `Stock unchanged (Balance: ${newNum})`;
      }
    }
    return `${oldVal || 'N/A'} → ${newVal || 'N/A'}`;
  };

  if (loading) {
    return <div className="loading">L
    Nov 23, 2025, 11:28 AM
    Stock Quantity	UPDATE	Stock decreased by 3 (Balance: 5)	System	Updated stock_quantity
    Nov 23, 2025, 11:25 AM
    Stock Quantity	UPDATE	oading product history...</div>;
  }

  return (
    <div className="page-container">
      <style>
        {`
          .master-detail-container {
            display: flex;
            gap: 20px;
            height: calc(100vh - 200px);
          }
          .left-panel {
            flex: 0 0 300px;
            border-right: 1px solid #ddd;
            padding-right: 20px;
          }
          .right-panel {
            flex: 1;
            overflow: auto;
          }
          .products-table.small-font {
            font-size: 12px;
          }
          .products-table.small-font th,
          .products-table.small-font td,
          .orders-table.small-font th,
          .orders-table.small-font td {
            padding: 4px 8px;
            font-size: 12px;
          }
          .products-table tr.selected {
            background-color: #e3f2fd;
          }
          .products-table tr:hover {
            background-color: #f5f5f5;
            cursor: pointer;
          }
          .product-search {
            margin-bottom: 10px;
            position: relative;
          }
          .product-search input {
            width: 100%;
            padding: 8px 30px 8px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .product-search .search-icon {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            color: #666;
          }
          .products-table-container {
            max-height: 400px;
            overflow-y: auto;
          }
          .history-table-container {
            max-height: 600px;
            overflow-y: auto;
          }
          .change-value {
            font-weight: bold;
            color: #333;
          }
        `}
      </style>
      <div className="page-header">
        <h1>Product History</h1>
        <p>Track all changes made to products over time</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="page-actions">
        <div className="search-filter">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="search-icon" />
          </div>
          <div className="filter-dropdown">
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
            >
              <option value="">All Fields</option>
              {getUniqueFields().map(field => (
                <option key={field} value={field}>
                  {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            <FiFilter className="filter-icon" />
          </div>
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={() => setShowExportModal(true)}
          >
            <FiDownload /> Export
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowExportModal(true)}
          >
            <FiPrinter /> Print
          </button>
        </div>
      </div>

      <div className="master-detail-container">
        {/* Left Panel - Products List */}
        <div className="left-panel">
          <h3>Products</h3>
          <div className="product-search">
            <input
              type="text"
              placeholder="Search products..."
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
            />
            <FiSearch className="search-icon" />
          </div>
          <div className="products-table-container">
            <table className="products-table small-font">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr
                    key={product.id}
                    className={selectedProduct && selectedProduct.id === product.id ? 'selected' : ''}
                    onClick={() => handleProductSelect(product)}
                  >
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.stock_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - History Details */}
        <div className="right-panel">
          <h3>{selectedProduct ? `History for ${selectedProduct.name}` : 'Product History'}</h3>
          <div className="history-table-container">
            <table className="orders-table small-font">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Field Changed</th>
                  <th>Change Type</th>
                  <th>Change</th>
                  <th>User</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length > 0 ? filteredHistory.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="date-with-icon">
                        <FiClock className="date-icon" />
                        {formatDate(item.changed_at)}
                      </div>
                    </td>
                    <td>{item.product_name || 'N/A'}</td>
                    <td>
                      <span className="field-badge">
                        {item.field_changed.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getChangeTypeColor(item.change_type)}`}>
                        {item.change_type.charAt(0).toUpperCase() + item.change_type.slice(1)}
                      </span>
                    </td>
                    <td className="value-cell">
                      <span className="change-value">{formatChange(item)}</span>
                    </td>
                    <td>{(item.user_name && item.user_name !== 'N/A') ? item.user_name : 'System'}</td>
                    <td>{item.notes || 'N/A'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      {loading ? 'Loading history...' : 'No history found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="pagination-container">
        <div className="pagination-info">
          Showing 1 to {filteredHistory.length} of {history.length} entries
        </div>
        <div className="pagination-controls">
          <button className="btn-pagination" disabled>Previous</button>
          <button className="btn-pagination active">1</button>
          <button className="btn-pagination">Next</button>
        </div>
      </div>

      {/* Export/Print Modal */}
      {showExportModal && (
        <div className="modal-overlay active options-modal">
          <div className="modal-container form-animate">
            <div className="modal-header">
              <h3 className="modal-title">Export Options</h3>
              <button
                className="modal-close"
                onClick={() => setShowExportModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="options-tabs">
              <button
                className={`options-tab ${activeTab === 'export' ? 'active' : ''}`}
                onClick={() => setActiveTab('export')}
              >
                <FiDownload /> Export
              </button>
              <button
                className={`options-tab ${activeTab === 'print' ? 'active' : ''}`}
                onClick={() => setActiveTab('print')}
              >
                <FiPrinter /> Print
              </button>
            </div>

            <div className={`options-tab-content ${activeTab === 'export' ? 'active' : ''}`}>
              <div className="option-group">
                <h5>Export Format</h5>
                <div className="format-options">
                  <label className="format-option">
                    <input type="radio" name="exportFormat" defaultChecked />
                    CSV
                  </label>
                  <label className="format-option">
                    <input type="radio" name="exportFormat" />
                    Excel
                  </label>
                  <label className="format-option">
                    <input type="radio" name="exportFormat" />
                    JSON
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowExportModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowExportModal(false)}
                >
                  <FiDownload /> Export Data
                </button>
              </div>
            </div>

            <div className={`options-tab-content ${activeTab === 'print' ? 'active' : ''}`}>
              <div className="option-group">
                <h5>Print Options</h5>
                <div className="option-row">
                  <label className="option-label">Include Headers</label>
                  <div className="option-control">
                    <input type="checkbox" className="option-checkbox" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowExportModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowExportModal(false)}
                >
                  <FiPrinter /> Print Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductHistoryPage;