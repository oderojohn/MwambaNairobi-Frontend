// pages/StockLevelsPage.js
import React, { useState, useEffect } from 'react';
import {  FiFilter, FiAlertCircle, FiDownload, FiPrinter,FiSearch} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { inventoryAPI } from '../../../services/ApiService/api';

const StockLevelsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [stockTakes, setStockTakes] = useState({});

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.products.getAll();
      setProducts(response.results || []);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStockTakeChange = (productId, value) => {
    const count = parseFloat(value) || 0;
    setStockTakes(prev => ({ ...prev, [productId]: count }));
  };

  const getStockStatus = (product) => {
    if (product.stock_quantity <= 0) return 'Out of Stock';
    if (product.is_low_stock) return 'Low Stock';
    return 'In Stock';
  };

  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    if (stockFilter === 'low') {
      matchesFilter = product.is_low_stock;
    } else if (stockFilter === 'out') {
      matchesFilter = product.stock_quantity <= 0;
    }

    return matchesSearch && matchesFilter;
  });

  const handleExport = async () => {
    try {
      const response = await inventoryAPI.reports.stock();
      // Convert to CSV and trigger download
      const csvContent = convertToCSV(response || []);
      downloadCSV(csvContent, 'stock_levels.csv');
    } catch (err) {
      setError('Failed to export stock levels');
      console.error('Error exporting:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '';

    const headers = ['ID', 'Name', 'SKU', 'Category', 'Stock Quantity', 'Low Stock Threshold', 'Stock Take', 'Variance', 'Status'];
    const csvRows = [headers.join(',')];

    data.forEach(item => {
      const status = getStockStatus(item);
      const stockTake = stockTakes[item.id] || 0;
      const variance = (item.stock_quantity || 0) - stockTake;
      const row = [
        item.id || '',
        `"${(item.name || '').replace(/"/g, '""')}"`,
        item.sku || '',
        `"${(item.category_name || '').replace(/"/g, '""')}"`,
        item.stock_quantity || 0,
        item.low_stock_threshold || 0,
        stockTake,
        variance,
        status
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="loading">Loading stock levels...</div>;
  }

  return (
    <div className="page-container">
      <style>
        {`
          .stock-take-input {
            width: 80px;
            padding: 4px;
            border: 1px solid #ddd;
            border-radius: 4px;
            text-align: center;
          }
          .variance-cell {
            font-weight: bold;
          }
          .variance-cell.positive {
            color: #388e3c;
          }
          .variance-cell.negative {
            color: #d32f2f;
          }
        `}
      </style>
      <div className="page-header">
        <h1>Stock Levels</h1>
        <p>Monitor inventory stock levels and alerts</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stock-alerts">
        <div className="alert-card critical">
          <FiAlertCircle className="alert-icon" />
          <div className="alert-content">
            <h3>Out of Stock</h3>
            <p>{(products || []).filter(p => p.stock_quantity <= 0).length} products</p>
          </div>
        </div>
        <div className="alert-card warning">
          <FiAlertCircle className="alert-icon" />
          <div className="alert-content">
            <h3>Low Stock</h3>
            <p>{(products || []).filter(p => p.is_low_stock && p.stock_quantity > 0).length} products</p>
          </div>
        </div>
        <div className="alert-card info">
          <FiAlertCircle className="alert-icon" />
          <div className="alert-content">
            <h3>Total Products</h3>
            <p>{(products || []).length} products</p>
          </div>
        </div>
      </div>

      <div className="page-actions">
        <div className="search-filter">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="search-icon" />
          </div>
          <div className="filter-dropdown">
            <select 
              value={stockFilter} 
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            <FiFilter className="filter-icon" />
          </div>
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={loading}
          >
            <FiDownload /> Export
          </button>
          <button
            className="btn btn-secondary"
            onClick={handlePrint}
            disabled={loading}
          >
            <FiPrinter /> Print
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Low Stock Threshold</th>
              <th>Stock Take</th>
              <th>Variance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? filteredProducts.map(product => {
              const status = getStockStatus(product);
              const stockTake = stockTakes[product.id] || 0;
              const variance = (product.stock_quantity || 0) - stockTake;
              return (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>
                    <Link to={`/inventory/products/${product.id}`} className="product-link">
                      {product.name || 'N/A'}
                    </Link>
                  </td>
                  <td>{product.sku || 'N/A'}</td>
                  <td>{product.category_name || 'N/A'}</td>
                  <td>{product.stock_quantity || 0}</td>
                  <td>{product.low_stock_threshold || 0}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={stockTake}
                      onChange={(e) => handleStockTakeChange(product.id, e.target.value)}
                      className="stock-take-input"
                    />
                  </td>
                  <td className={`variance-cell ${variance > 0 ? 'positive' : variance < 0 ? 'negative' : ''}`}>
                    {variance !== 0 ? variance : ''}
                  </td>
                  <td>
                    <span className={`status-badge ${status.toLowerCase().replace(' ', '-')}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="9" className="no-data">
                  {loading ? 'Loading products...' : 'No products found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div className="pagination-info">
          Showing 1 to {filteredProducts.length} of {(products || []).length} entries
        </div>
        <div className="pagination-controls">
          <button className="btn-pagination" disabled>Previous</button>
          <button className="btn-pagination active">1</button>
          <button className="btn-pagination">Next</button>
        </div>
      </div>
    </div>
  );
};

export default StockLevelsPage;