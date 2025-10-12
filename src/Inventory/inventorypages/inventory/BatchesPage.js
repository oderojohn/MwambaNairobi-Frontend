// pages/BatchesPage.js
import React, { useState, useEffect } from 'react';
import {
  FiFilter,
  FiAlertCircle,
  FiDownload,
  FiPrinter,
  FiSearch,
  FiCalendar,
  FiBox,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiSave,
  FiAlertTriangle,
  FiPackage
} from 'react-icons/fi';
import { inventoryAPI, suppliersAPI } from '../../../services/ApiService/api';

const BatchesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingBatch, setReceivingBatch] = useState(null);
  const [activeTab, setActiveTab] = useState('export');
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    fileName: 'batches_export',
    includeAll: true,
    selectedColumns: ['id', 'batch_number', 'product_name', 'supplier_name', 'quantity', 'purchase_date', 'expiry_date']
  });
  const [printOptions, setPrintOptions] = useState({
    orientation: 'portrait',
    includeHeaders: true,
    includeImages: false
  });

  const [formData, setFormData] = useState({
    product: '',
    batch_number: '',
    quantity: '',
    expiry_date: '',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchBatches();
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.batches.getAll();
      setBatches(response || []);
    } catch (err) {
      setError('Failed to fetch batches');
      console.error('Error fetching batches:', err);
      setBatches([]);
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

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getSuppliers();
      setSuppliers(response || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setSuppliers([]);
    }
  };

  // Helper function for expiry calculations
  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate batch statistics
  const batchStats = batches && Array.isArray(batches) ? {
    total: batches.length,
    active: batches.filter(b => getDaysUntilExpiry(b.expiry_date) > 30).length,
    expiringSoon: batches.filter(b => {
      const daysLeft = getDaysUntilExpiry(b.expiry_date);
      return daysLeft <= 30 && daysLeft > 0;
    }).length,
    expired: batches.filter(b => getDaysUntilExpiry(b.expiry_date) <= 0).length
  } : { total: 0, active: 0, expiringSoon: 0, expired: 0 };

  const filteredBatches = (batches && Array.isArray(batches) ? batches : []).filter(batch => {
    const matchesSearch = (batch.batch_number && batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (batch.product_name && batch.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (batch.supplier_name && batch.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const daysLeft = getDaysUntilExpiry(batch.expiry_date);
    let matchesFilter = true;

    if (statusFilter === 'active') {
      matchesFilter = daysLeft > 30;
    } else if (statusFilter === 'expiring') {
      matchesFilter = daysLeft <= 30 && daysLeft > 0;
    } else if (statusFilter === 'expired') {
      matchesFilter = daysLeft <= 0;
    }

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBatchStatus = (expiryDate) => {
    const daysLeft = getDaysUntilExpiry(expiryDate);
    if (daysLeft <= 0) return 'Expired';
    if (daysLeft <= 30) return 'Expiring Soon';
    return 'Active';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedBatch) {
        // Update existing batch
        await inventoryAPI.batches.update(selectedBatch.id, formData);
      } else {
        // Create new batch
        await inventoryAPI.batches.create(formData);
      }
      
      await fetchBatches();
      resetForm();
      setShowAddForm(false);
      setSelectedBatch(null);
    } catch (err) {
      setError('Failed to save batch');
      console.error('Error saving batch:', err);
    }
  };

  const handleEdit = (batch) => {
    setSelectedBatch(batch);
    setFormData({
      product: batch.product,
      batch_number: batch.batch_number,
      quantity: batch.quantity,
      expiry_date: batch.expiry_date,
      purchase_date: batch.purchase_date,
      supplier: batch.supplier
    });
    setShowAddForm(true);
  };

  const handleReceive = (batch) => {
    console.log('Opening receive modal for batch:', batch);
    setReceivingBatch(batch);
    setShowReceiveModal(true);
  };

  const handleReceiveSubmit = async (receiveData) => {
    try {
      // Call the receive API with additional data
      await inventoryAPI.batches.receive(receivingBatch.id, receiveData);
      await fetchBatches();
      alert('Batch received successfully!');
      setShowReceiveModal(false);
      setReceivingBatch(null);
    } catch (err) {
      setError('Failed to receive batch');
      console.error('Error receiving batch:', err);
    }
  };

  const handleDelete = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await inventoryAPI.batches.delete(batchId);
        await fetchBatches();
      } catch (err) {
        setError('Failed to delete batch');
        console.error('Error deleting batch:', err);
      }
    }
  };

  const handleViewDetails = (batch) => {
    setSelectedBatch(batch);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      product: '',
      batch_number: '',
      quantity: '',
      expiry_date: '',
      purchase_date: new Date().toISOString().split('T')[0],
      supplier: ''
    });
    setSelectedBatch(null);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedBatch(null);
  };

  const toggleColumnSelection = (column) => {
    setExportOptions(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(column)
        ? prev.selectedColumns.filter(c => c !== column)
        : [...prev.selectedColumns, column]
    }));
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting with options:', exportOptions);
    setShowExportModal(false);
  };

  const handlePrint = () => {
    // Implement print functionality
    window.print();
    setShowExportModal(false);
  };

  if (loading) {
    return <div className="loading">Loading batches...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Batch Management</h1>
        <p>Track and manage inventory batches</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stock-alerts">
        <div className="alert-card critical">
          <FiAlertCircle className="alert-icon" />
          <div className="alert-content">
            <h3>Expired Batches</h3>
            <p>{batchStats.expired} batches</p>
          </div>
        </div>
        <div className="alert-card warning">
          <FiAlertCircle className="alert-icon" />
          <div className="alert-content">
            <h3>Expiring Soon</h3>
            <p>{batchStats.expiringSoon} batches</p>
          </div>
        </div>
        <div className="alert-card info">
          <FiAlertCircle className="alert-icon" />
          <div className="alert-content">
            <h3>Active Batches</h3>
            <p>{batchStats.active} batches</p>
          </div>
        </div>
        <div className="alert-card success">
          <FiBox className="alert-icon" />
          <div className="alert-content">
            <h3>Total Batches</h3>
            <p>{batchStats.total} batches</p>
          </div>
        </div>
      </div>

      <div className="page-actions">
        <div className="search-filter">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search batches, products, or suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="search-icon" />
          </div>
          <div className="filter-dropdown">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
            <FiFilter className="filter-icon" />
          </div>
        </div>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            <FiPlus /> New Batch
          </button>
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

      {/* Add/Edit Batch Form Modal */}
      {showAddForm && (
        <div className="modal-overlay active options-modal">
          <div className="modal-container form-animate">
            <div className="modal-header">
              <h3 className="modal-title">{selectedBatch ? 'Edit Batch' : 'Add New Batch'}</h3>
              <button 
                className="modal-close" 
                onClick={() => { setShowAddForm(false); resetForm(); }}
              >
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="batch-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product *</label>
                  <select
                    name="product"
                    value={formData.product}
                    onChange={handleInputChange}
                    required
                    className="option-select"
                  >
                    <option value="">Select Product</option>
                    {(products || []).map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Batch Number *</label>
                  <input
                    type="text"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., BATCH-2024-001"
                    className="option-select"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="option-select"
                  />
                </div>
                <div className="form-group">
                  <label>Supplier *</label>
                  <select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    required
                    className="option-select"
                  >
                    <option value="">Select Supplier</option>
                    {(suppliers || []).map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Purchase Date *</label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleInputChange}
                    required
                    className="option-select"
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    required
                    className="option-select"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => { setShowAddForm(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FiSave /> {selectedBatch ? 'Update' : 'Save'} Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Details Modal */}
      {showDetailModal && selectedBatch && (
        <div className="modal-overlay active options-modal">
          <div className="modal-container form-animate">
            <div className="modal-header">
              <h3 className="modal-title">Batch Details - {selectedBatch.batch_number}</h3>
              <button className="modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            
            <div className="batch-details">
              <div className="option-group">
                <h5>Basic Information</h5>
                <div className="detail-grid">
                  <div className="option-row">
                    <label className="option-label">Batch Number:</label>
                    <div className="option-control">
                      <span>{selectedBatch.batch_number}</span>
                    </div>
                  </div>
                  <div className="option-row">
                    <label className="option-label">Product:</label>
                    <div className="option-control">
                      <span>{selectedBatch.product_name}</span>
                    </div>
                  </div>
                  <div className="option-row">
                    <label className="option-label">Supplier:</label>
                    <div className="option-control">
                      <span>{selectedBatch.supplier_name}</span>
                    </div>
                  </div>
                  <div className="option-row">
                    <label className="option-label">Quantity:</label>
                    <div className="option-control">
                      <span>{selectedBatch.quantity}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="option-group">
                <h5>Dates</h5>
                <div className="detail-grid">
                  <div className="option-row">
                    <label className="option-label">Purchase Date:</label>
                    <div className="option-control">
                      <span>{formatDate(selectedBatch.purchase_date)}</span>
                    </div>
                  </div>
                  <div className="option-row">
                    <label className="option-label">Expiry Date:</label>
                    <div className="option-control">
                      <span>{formatDate(selectedBatch.expiry_date)}</span>
                    </div>
                  </div>
                  <div className="option-row">
                    <label className="option-label">Days Until Expiry:</label>
                    <div className="option-control">
                      <span className={getDaysUntilExpiry(selectedBatch.expiry_date) <= 0 ? 'text-danger' : getDaysUntilExpiry(selectedBatch.expiry_date) <= 30 ? 'text-warning' : 'text-success'}>
                        {getDaysUntilExpiry(selectedBatch.expiry_date) <= 0 ? 'Expired' : `${getDaysUntilExpiry(selectedBatch.expiry_date)} days`}
                      </span>
                    </div>
                  </div>
                  <div className="option-row">
                    <label className="option-label">Status:</label>
                    <div className="option-control">
                      <span className={`status-badge ${getBatchStatus(selectedBatch.expiry_date).toLowerCase().replace(' ', '-')}`}>
                        {getBatchStatus(selectedBatch.expiry_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => handleEdit(selectedBatch)}>
                <FiEdit /> Edit Batch
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(selectedBatch.id)}>
                <FiTrash2 /> Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Batch Modal */}
      {showReceiveModal && receivingBatch && (
        <div className="modal-overlay active">
          {console.log('Rendering receive modal for batch:', receivingBatch)}
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Receive Batch - {receivingBatch.batch_number}</h3>
              <button
                className="modal-close"
                onClick={() => { setShowReceiveModal(false); setReceivingBatch(null); }}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <ReceiveBatchForm
                batch={receivingBatch}
                onSubmit={handleReceiveSubmit}
                onCancel={() => { setShowReceiveModal(false); setReceivingBatch(null); }}
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowReceiveModal(false); setReceivingBatch(null); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  // Trigger form submission
                  const form = document.querySelector('.batch-form');
                  if (form) form.requestSubmit();
                }}
              >
                <FiPackage /> Receive Batch
              </button>
            </div>
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
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      checked={exportOptions.format === 'csv'}
                      onChange={() => setExportOptions({...exportOptions, format: 'csv'})}
                    />
                    CSV
                  </label>
                  <label className="format-option">
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      checked={exportOptions.format === 'excel'}
                      onChange={() => setExportOptions({...exportOptions, format: 'excel'})}
                    />
                    Excel
                  </label>
                  <label className="format-option">
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      checked={exportOptions.format === 'json'}
                      onChange={() => setExportOptions({...exportOptions, format: 'json'})}
                    />
                    JSON
                  </label>
                </div>
              </div>
              
              <div className="option-group">
                <h5>File Name</h5>
                <input
                  type="text"
                  className="option-select"
                  value={exportOptions.fileName}
                  onChange={(e) => setExportOptions({...exportOptions, fileName: e.target.value})}
                />
              </div>
              
              <div className="option-group">
                <h5>Columns to Export</h5>
                {['id', 'batch_number', 'product_name', 'supplier_name', 'quantity', 'purchase_date', 'expiry_date', 'status'].map(column => (
                  <div className="option-row" key={column}>
                    <label className="option-label">
                      {column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </label>
                    <div className="option-control">
                      <input 
                        type="checkbox" 
                        className="option-checkbox"
                        checked={exportOptions.selectedColumns.includes(column)}
                        onChange={() => toggleColumnSelection(column)}
                      />
                    </div>
                  </div>
                ))}
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
                  onClick={handleExport}
                >
                  <FiDownload /> Export Data
                </button>
              </div>
            </div>
            
            <div className={`options-tab-content ${activeTab === 'print' ? 'active' : ''}`}>
              <div className="option-group">
                <h5>Print Options</h5>
                <div className="option-row">
                  <label className="option-label">Orientation</label>
                  <div className="option-control">
                    <select
                      className="option-select"
                      value={printOptions.orientation}
                      onChange={(e) => setPrintOptions({...printOptions, orientation: e.target.value})}
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>
                <div className="option-row">
                  <label className="option-label">Include Headers</label>
                  <div className="option-control">
                    <input 
                      type="checkbox" 
                      className="option-checkbox"
                      checked={printOptions.includeHeaders}
                      onChange={(e) => setPrintOptions({...printOptions, includeHeaders: e.target.checked})}
                    />
                  </div>
                </div>
                <div className="option-row">
                  <label className="option-label">Include Images</label>
                  <div className="option-control">
                    <input 
                      type="checkbox" 
                      className="option-checkbox"
                      checked={printOptions.includeImages}
                      onChange={(e) => setPrintOptions({...printOptions, includeImages: e.target.checked})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="danger-zone">
                <h5><FiAlertTriangle /> Warning</h5>
                <p style={{ fontSize: '13px', color: 'var(--danger-color)' }}>
                  Printing large datasets may affect performance. Consider exporting instead for better results.
                </p>
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
                  onClick={handlePrint}
                >
                  <FiPrinter /> Print Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch Number</th>
              <th>Product</th>
              <th>Supplier</th>
              <th>Quantity</th>
              <th>Purchase Date</th>
              <th>Expiry Date</th>
              <th>Days Left</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.length > 0 ? filteredBatches.map(batch => {
              const daysLeft = getDaysUntilExpiry(batch.expiry_date);
              const status = getBatchStatus(batch.expiry_date);

              return (
                <tr key={batch.id}>
                  <td>
                    <button
                      className="product-link"
                      onClick={() => handleViewDetails(batch)}
                    >
                      {batch.batch_number || 'N/A'}
                    </button>
                  </td>
                  <td>{batch.product_name || 'N/A'}</td>
                  <td>{batch.supplier_name || 'N/A'}</td>
                  <td>{batch.quantity || 0}</td>
                  <td>
                    <div className="date-with-icon">
                      <FiCalendar className="date-icon" />
                      {batch.purchase_date ? formatDate(batch.purchase_date) : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="date-with-icon">
                      <FiCalendar className="date-icon" />
                      {batch.expiry_date ? formatDate(batch.expiry_date) : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span className={daysLeft <= 0 ? 'text-danger' : daysLeft <= 30 ? 'text-warning' : 'text-success'}>
                      {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${status.toLowerCase().replace(' ', '-')}`}>
                      {status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-small">
                      {batch.status === 'ordered' && (
                        <button
                          className="btn-icon btn-success"
                          onClick={() => handleReceive(batch.id)}
                          title="Receive Batch"
                        >
                          <FiBox />
                        </button>
                      )}
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(batch)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(batch.id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="10" className="no-data">
                  {loading ? 'Loading batches...' : 'No batches found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div className="pagination-info">
          Showing 1 to {filteredBatches.length} of {(batches || []).length} entries
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

// Receive Batch Form Component
const ReceiveBatchForm = ({ batch, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    actual_quantity: batch.quantity || '',
    cost_price: batch.cost_price || '',
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    condition: 'good'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.actual_quantity || formData.actual_quantity <= 0) {
      alert('Please enter a valid quantity received');
      return;
    }

    if (formData.actual_quantity > batch.quantity) {
      alert('Received quantity cannot exceed ordered quantity');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="batch-form">
      {/* Batch Information Display */}
      <div className="option-group">
        <h5>Batch Information</h5>
        <div className="detail-grid">
          <div className="option-row">
            <label className="option-label">Product:</label>
            <div className="option-control">
              <span>{batch.product_name}</span>
            </div>
          </div>
          <div className="option-row">
            <label className="option-label">Batch Number:</label>
            <div className="option-control">
              <span>{batch.batch_number}</span>
            </div>
          </div>
          <div className="option-row">
            <label className="option-label">Supplier:</label>
            <div className="option-control">
              <span>{batch.supplier_name || 'N/A'}</span>
            </div>
          </div>
          <div className="option-row">
            <label className="option-label">Ordered Quantity:</label>
            <div className="option-control">
              <span>{batch.quantity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Receiving Details */}
      <div className="option-group">
        <h5>Receiving Details</h5>
        <div className="form-row">
          <div className="form-group">
            <label>Actual Quantity Received *</label>
            <input
              type="number"
              name="actual_quantity"
              value={formData.actual_quantity}
              onChange={handleInputChange}
              required
              min="1"
              max={batch.quantity}
              className="option-select"
            />
          </div>
          <div className="form-group">
            <label>Cost Price per Unit</label>
            <input
              type="number"
              name="cost_price"
              value={formData.cost_price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="option-select"
              placeholder="Enter actual cost price"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Received Date *</label>
            <input
              type="date"
              name="received_date"
              value={formData.received_date}
              onChange={handleInputChange}
              required
              className="option-select"
            />
          </div>
          <div className="form-group">
            <label>Condition</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="option-select"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            className="option-select"
            placeholder="Any additional notes about the delivery..."
          />
        </div>
      </div>

      {/* Summary */}
      <div className="option-group">
        <h5>Summary</h5>
        <div className="detail-grid">
          <div className="option-row">
            <label className="option-label">Stock to be Added:</label>
            <div className="option-control">
              <span className="text-success">{formData.actual_quantity || 0} units</span>
            </div>
          </div>
          <div className="option-row">
            <label className="option-label">Total Cost:</label>
            <div className="option-control">
              <span>Ksh {(formData.actual_quantity * formData.cost_price).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

    </form>
  );
};

export default BatchesPage;