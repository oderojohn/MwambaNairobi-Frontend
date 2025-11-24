// pages/EndOfDayStockPage.js
import React, { useState, useEffect } from 'react';
import {
  FiDownload,
  FiPrinter,
  FiPackage,
  FiX
} from 'react-icons/fi';
import { inventoryAPI } from '../../../services/ApiService/api';
import './EndOfDayStockPage.css';

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
    // Set default date range (last 10 days)
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);

    setToDate(today.toISOString().split('T')[0]);
    setFromDate(tenDaysAgo.toISOString().split('T')[0]);
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
            (() => {
              const allDates = [...new Set(reportData.products.flatMap(p => p.daily_stock.map(d => d.date)))].sort((a, b) => new Date(b) - new Date(a));
              return (
                <table className="end-of-day-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      {allDates.map(date => <th key={date}>{formatDate(date)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.products.map(product => {
                      const stockMap = new Map(product.daily_stock.map(d => [d.date, d.end_of_day_stock]));
                      return (
                        <tr key={product.product_id}>
                          <td>{product.product_name} (SKU: {product.product_sku})</td>
                          {allDates.map(date => <td key={date}>{stockMap.get(date) ?? '-'}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()
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