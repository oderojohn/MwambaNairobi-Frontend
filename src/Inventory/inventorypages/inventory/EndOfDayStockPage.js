// pages/EndOfDayStockPage.js
import React, { useState, useEffect } from 'react';
import {
  FiDownload,
  FiPrinter,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiX
} from 'react-icons/fi';
import { inventoryAPI } from '../../../services/ApiService/api';
import '../../../pos/pages/OrderManagementPage.css';

const EndOfDayStockPage = () => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
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

  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both from and to dates');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const params = {
        from_date: fromDate,
        to_date: toDate
      };

      if (selectedProduct) {
        params.product_id = selectedProduct;
      }

      const response = await inventoryAPI.endOfDayStock.getReport(params);
      setReportData(response);
    } catch (err) {
      setError('Failed to fetch end of day stock report');
      console.error('Error fetching report:', err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStockChange = (currentStock, previousStock) => {
    if (!previousStock) return { change: 0, direction: 'neutral' };
    const change = currentStock - previousStock;
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const getStockChangeIcon = (direction) => {
    switch (direction) {
      case 'up': return <FiTrendingUp className="stock-up" />;
      case 'down': return <FiTrendingDown className="stock-down" />;
      default: return <FiBarChart2 />;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>End of Day Stock Report</h1>
        <p>Daily stock levels and changes over time</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Product (Optional - leave empty for all products)</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="filter-select"
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>From Date *</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="filter-input"
              required
            />
          </div>
          <div className="filter-group">
            <label>To Date *</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="filter-input"
              required
            />
          </div>
          <div className="filter-group">
            <button
              className="btn btn-primary"
              onClick={fetchReport}
              disabled={loading || !fromDate || !toDate}
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="report-container">
          <div className="report-header">
            <h3>End of Day Stock Report</h3>
            <p>Report Period: {reportData.date_range.from_date} to {reportData.date_range.to_date}</p>
            <p>Total Products: {reportData.products?.length || 0}</p>
          </div>

          {reportData.products && reportData.products.length > 0 ? (
            reportData.products.map((product, productIndex) => (
              <div key={product.product_id} className="product-stock-report">
                <div className="product-header">
                  <h4>{product.product_name}</h4>
                  <p>SKU: {product.product_sku}</p>
                </div>

                <div className="orders-table-container">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>End of Day Stock</th>
                        <th>Current Stock</th>
                        <th>Change</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.daily_stock.map((day, index) => {
                        const previousDay = product.daily_stock[index + 1];
                        const stockChange = getStockChange(day.end_of_day_stock, previousDay?.end_of_day_stock);

                        return (
                          <tr key={day.date}>
                            <td>{formatDate(day.date)}</td>
                            <td className="stock-value">{day.end_of_day_stock}</td>
                            <td className="current-stock">{day.current_stock}</td>
                            <td className={`stock-change ${stockChange.direction}`}>
                              {stockChange.change > 0 && (
                                <>
                                  {stockChange.direction === 'up' ? '+' : '-'}
                                  {stockChange.change}
                                </>
                              )}
                              {stockChange.change === 0 && 'No change'}
                            </td>
                            <td className="trend-indicator">
                              {getStockChangeIcon(stockChange.direction)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">
              <FiPackage className="no-data-icon" />
              <p>No stock data found for the selected period</p>
            </div>
          )}
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

export default EndOfDayStockPage;