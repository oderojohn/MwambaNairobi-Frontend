// pages/ProductTimelinePage.js
import React, { useState, useEffect } from 'react';
import {
  FiDownload,
  FiPrinter,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiShoppingCart,
  FiEdit,
  FiBox,
  FiX
} from 'react-icons/fi';
import { inventoryAPI } from '../../../services/ApiService/api';

const ProductTimelinePage = () => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeline, setTimeline] = useState(null);
  const [products, setProducts] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('export');

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setToDate(today.toISOString().split('T')[0]);
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await inventoryAPI.products.getAll();
      setProducts(response || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  const fetchTimeline = async () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const response = await inventoryAPI.timeline.getProductTimeline(selectedProduct, params);
      setTimeline(response);
    } catch (err) {
      setError('Failed to fetch product timeline');
      console.error('Error fetching timeline:', err);
      setTimeline(null);
    } finally {
      setLoading(false);
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

  const getEventIcon = (type) => {
    switch (type) {
      case 'sale': return <FiShoppingCart />;
      case 'stock_movement': return <FiBox />;
      case 'product_change': return <FiEdit />;
      default: return <FiClock />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'sale': return 'danger';
      case 'stock_movement': return 'info';
      case 'product_change': return 'warning';
      default: return 'secondary';
    }
  };

  const getStockChangeIcon = (currentStock, previousStock) => {
    if (previousStock === undefined) return <FiMinus />;
    if (currentStock > previousStock) return <FiTrendingUp className="stock-up" />;
    if (currentStock < previousStock) return <FiTrendingDown className="stock-down" />;
    return <FiMinus />;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Product Timeline</h1>
        <p>Complete history of all events affecting a product's stock and changes</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Product *</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="filter-select"
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <button
              className="btn btn-primary"
              onClick={fetchTimeline}
              disabled={loading || !selectedProduct}
            >
              {loading ? 'Loading...' : 'View Timeline'}
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Display */}
      {timeline && (
        <div className="timeline-container">
          <div className="timeline-header">
            <h3>{timeline.product.name} (SKU: {timeline.product.sku})</h3>
            <p>Current Stock: <strong>{timeline.product.current_stock}</strong></p>
            <p>Period: {timeline.date_range.from_date} to {timeline.date_range.to_date}</p>
            <p>Total Events: {timeline.total_events}</p>
          </div>

          <div className="timeline-events">
            {timeline.events && timeline.events.length > 0 ? (
              timeline.events.map((event, index) => (
                <div key={event.id} className="timeline-event">
                  <div className="event-icon">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="event-content">
                    <div className="event-header">
                      <span className={`event-type ${getEventColor(event.type)}`}>
                        {event.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="event-time">{formatDate(event.timestamp)}</span>
                    </div>
                    <div className="event-description">
                      {event.description}
                    </div>
                    {event.details && (
                      <div className="event-details">
                        {Object.entries(event.details).map(([key, value]) => (
                          <div key={key} className="detail-item">
                            <span className="detail-label">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </span>
                            <span className="detail-value">{value || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="event-stock">
                      <span className="stock-label">Stock after event:</span>
                      <span className="stock-value">{event.stock_after}</span>
                      {index < timeline.events.length - 1 &&
                       getStockChangeIcon(event.stock_after, timeline.events[index + 1]?.stock_after)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-events">
                <FiClock className="no-events-icon" />
                <p>No events found for the selected period</p>
              </div>
            )}
          </div>
        </div>
      )}

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

export default ProductTimelinePage;