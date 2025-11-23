// pages/ProductHistoryPage.js
import React, { useState, useEffect } from 'react';
import {
  FiFilter,
  FiDownload,
  FiPrinter,
  FiSearch,
  FiPackage,
  FiClock,
  FiX
} from 'react-icons/fi';
import { inventoryAPI } from '../../../services/ApiService/api';
import '../../../pos/pages/OrderManagementPage.css';

const ProductHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('export');

  // Fetch data on component mount
  useEffect(() => {
    fetchHistory();
    fetchProducts();
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

  const filteredHistory = history.filter(item => {
    const matchesSearch = (item.product_name && item.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.field_changed && item.field_changed.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProduct = !productFilter || item.product === parseInt(productFilter);
    const matchesField = !fieldFilter || item.field_changed === fieldFilter;

    return matchesSearch && matchesProduct && matchesField;
  });

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

  if (loading) {
    return <div className="loading">Loading product history...</div>;
  }

  return (
    <div className="page-container">
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
              placeholder="Search history, products, or fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="search-icon" />
          </div>
          <div className="filter-dropdown">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <FiPackage className="filter-icon" />
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

      {/* Data Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Product</th>
              <th>Field Changed</th>
              <th>Change Type</th>
              <th>Old Value</th>
              <th>New Value</th>
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
                  <span className="old-value">{item.old_value || 'N/A'}</span>
                </td>
                <td className="value-cell">
                  <span className="new-value">{item.new_value || 'N/A'}</span>
                </td>
                <td>{item.user_name || 'System'}</td>
                <td>{item.notes || 'N/A'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="no-data">
                  {loading ? 'Loading product history...' : 'No product history found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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