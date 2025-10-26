import React, { useState, useEffect } from 'react';
import {
  FiPlus, FiFilter, FiEdit, FiTrash2, FiPrinter, FiDownload,
  FiSearch, FiSave, FiX, FiCheck, FiAlertTriangle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { inventoryAPI } from '../../../services/ApiService/api';

const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState('single'); // 'single' or 'bulk'
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([
    { 
      id: 6, 
      name: 'Whiskey - Jack Daniels', 
      sku: 'ALC-001', 
      category: 'Whiskey', 
      price: 45.00, 
      cost: 30.00,
      stock: 25, 
      status: 'In Stock',
      supplier: 'Premium Liquor Distributors',
      batchNumber: 'BATCH-2023-001',
      expiryDate: '2025-12-31',
      barcode: '123456789012',
      description: 'Premium Tennessee whiskey aged in charred oak barrels',
      taxRate: 16,
      unit: '750ml bottle',
      reorderLevel: 5
    },
    { 
      id: 7, 
      name: 'Vodka - Absolut', 
      sku: 'ALC-002', 
      category: 'Vodka', 
      price: 35.00, 
      cost: 22.50,
      stock: 8, 
      status: 'Low Stock',
      supplier: 'Global Spirits Ltd',
      batchNumber: 'BATCH-2023-002',
      expiryDate: '2024-06-30',
      barcode: '234567890123',
      description: 'Premium Swedish vodka made from winter wheat',
      taxRate: 16,
      unit: '1L bottle',
      reorderLevel: 3
    },
    { 
      id: 8, 
      name: 'Rum - Bacardi', 
      sku: 'ALC-003', 
      category: 'Rum', 
      price: 30.00, 
      cost: 18.00,
      stock: 15, 
      status: 'In Stock',
      supplier: 'Caribbean Imports',
      batchNumber: 'BATCH-2023-003',
      expiryDate: '2026-03-15',
      barcode: '345678901234',
      description: 'White rum distilled from molasses',
      taxRate: 16,
      unit: '700ml bottle',
      reorderLevel: 4
    },
  ]);

  const [bulkProducts, setBulkProducts] = useState([
    { 
      id: 1, 
      name: '', 
      sku: '', 
      category: '', 
      price: 0, 
      cost: 0,
      stock: 0, 
      status: 'In Stock',
      supplier: '',
      batchNumber: '',
      expiryDate: '',
      barcode: '',
      description: '',
      taxRate: 16,
      unit: '',
      reorderLevel: 0
    }
  ]);

  const [singleProduct, setSingleProduct] = useState({
    sku: '',
    name: '',
    serial_number: '',
    category: '',
    cost_price: '',
    selling_price: '',
    wholesale_price: '',
    wholesale_min_qty: 10,
    stock_quantity: '',
    low_stock_threshold: 10,
    barcode: '',
    description: '',
    is_active: true
  });

  const [editProduct, setEditProduct] = useState({
    sku: '',
    name: '',
    serial_number: '',
    category: '',
    cost_price: 0,
    selling_price: 0,
    wholesale_price: 0,
    wholesale_min_qty: 10,
    stock_quantity: 0,
    low_stock_threshold: 10,
    barcode: '',
    description: '',
    is_active: true
  });

  const [categories, setCategories] = useState([]);
  const statusOptions = ['In Stock', 'Low Stock', 'Out of Stock'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [productsResponse, categoriesResponse] = await Promise.all([
          inventoryAPI.getProducts(),
          inventoryAPI.getCategories()
        ]);
        setProducts(productsResponse || []);
        // Store categories as objects with id and name, plus 'All' option
        // Create categories array with 'All' option plus actual categories
        const allCategories = [{ id: 'all', name: 'All' }];
        if (categoriesResponse && categoriesResponse.length > 0) {
          categoriesResponse.forEach(cat => {
            allCategories.push({ id: cat.id, name: cat.name });
          });
        }
        setCategories(allCategories);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
                           product.category_name === selectedCategory ||
                           (product.category_name === 'N/A' && selectedCategory === '');
    return matchesSearch && matchesCategory;
  });

  const handleSingleInputChange = (e) => {
    const { name, value } = e.target;
    setSingleProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditProduct(prev => ({ ...prev, [name]: value }));
  };

  const addSingleProduct = async () => {
    if (!singleProduct.name || !singleProduct.sku) return;

    try {
      const productData = {
        name: singleProduct.name,
        sku: singleProduct.sku,
        serial_number: singleProduct.serial_number || '',
        category: singleProduct.category ? categories.find(cat => cat.name === singleProduct.category && cat.id !== 'all')?.id : null,
        cost_price: parseFloat(singleProduct.cost_price) || 0,
        selling_price: parseFloat(singleProduct.selling_price) || 0,
        wholesale_price: singleProduct.wholesale_price ? parseFloat(singleProduct.wholesale_price) : null,
        wholesale_min_qty: parseInt(singleProduct.wholesale_min_qty) || 10,
        stock_quantity: parseInt(singleProduct.stock_quantity) || 0,
        low_stock_threshold: parseInt(singleProduct.low_stock_threshold) || 10,
        barcode: singleProduct.barcode || '',
        description: singleProduct.description || '',
        is_active: singleProduct.is_active
      };

      await inventoryAPI.createProduct(productData);

      // Refresh products
      const response = await inventoryAPI.getProducts();
      setProducts(response || []);

      setSingleProduct({
        sku: '',
        name: '',
        serial_number: '',
        category: '',
        cost_price: '',
        selling_price: '',
        wholesale_price: '',
        wholesale_min_qty: 10,
        stock_quantity: '',
        low_stock_threshold: 10,
        barcode: '',
        description: '',
        is_active: true
      });
      setShowAddForm(false);

      // Show success message
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Product created successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        alert('Product created successfully!');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product');
      // Show error message
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create product. Please try again.'
        });
      } else {
        alert('Failed to create product. Please try again.');
      }
    }
  };

  const addNewRow = () => {
    setBulkProducts([...bulkProducts, { 
      id: bulkProducts.length + 1, 
      name: '', 
      sku: '', 
      category: '', 
      price: 0, 
      cost: 0,
      stock: 0, 
      status: 'In Stock',
      supplier: '',
      batchNumber: '',
      expiryDate: '',
      barcode: '',
      description: '',
      taxRate: 16,
      unit: '',
      reorderLevel: 0
    }]);
  };

  const removeRow = (id) => {
    if (bulkProducts.length > 1) {
      setBulkProducts(bulkProducts.filter(product => product.id !== id));
    }
  };

  const handleBulkChange = (id, field, value) => {
    setBulkProducts(bulkProducts.map(product => {
      if (product.id === id) {
        return { 
          ...product, 
          [field]: field === 'name' || field === 'sku' || field === 'category' || 
                  field === 'status' || field === 'supplier' || field === 'batchNumber' ||
                  field === 'expiryDate' || field === 'barcode' || field === 'description' ||
                  field === 'unit'
            ? value 
            : Number(value) 
        };
      }
      return product;
    }));
  };

  const saveBulkProducts = () => {
    const validProducts = bulkProducts.filter(p => p.name && p.sku);
    if (validProducts.length === 0) return;

    const newProducts = validProducts.map(product => ({
      ...product,
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + product.id : product.id,
      price: parseFloat(product.price) || 0,
      cost: parseFloat(product.cost) || 0,
      stock: parseInt(product.stock) || 0,
      taxRate: parseInt(product.taxRate) || 0,
      reorderLevel: parseInt(product.reorderLevel) || 0
    }));

    setProducts([...products, ...newProducts]);
    setBulkProducts([{ 
      id: 1, 
      name: '', 
      sku: '', 
      category: '', 
      price: 0, 
      cost: 0,
      stock: 0, 
      status: 'In Stock',
      supplier: '',
      batchNumber: '',
      expiryDate: '',
      barcode: '',
      description: '',
      taxRate: 16,
      unit: '',
      reorderLevel: 0
    }]);
    setShowAddForm(false);
  };

  const startEditing = (product) => {
    setEditingId(product.id);
    setEditProduct({
      sku: product.sku,
      name: product.name,
      serial_number: product.serial_number,
      category: product.category_name || '',
      cost_price: product.cost_price || 0,
      selling_price: product.selling_price || 0,
      wholesale_price: product.wholesale_price || 0,
      wholesale_min_qty: product.wholesale_min_qty || 10,
      stock_quantity: product.stock_quantity || 0,
      low_stock_threshold: product.low_stock_threshold || 10,
      barcode: product.barcode || '',
      description: product.description || '',
      is_active: product.is_active !== undefined ? product.is_active : true
    });
    setShowEditModal(true);
  };

  // eslint-disable-next-line no-unused-vars
  const cancelEditing = () => {
    setEditingId(null);
    setShowEditModal(false);
  };

  const saveEditedProduct = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const productData = {
        name: editProduct.name,
        sku: editProduct.sku,
        serial_number: editProduct.serial_number || '',
        category: editProduct.category ? categories.find(cat => cat.name === editProduct.category && cat.id !== 'all')?.id : null,
        cost_price: parseFloat(editProduct.cost_price) || 0,
        selling_price: parseFloat(editProduct.selling_price) || 0,
        wholesale_price: editProduct.wholesale_price ? parseFloat(editProduct.wholesale_price) : null,
        wholesale_min_qty: parseInt(editProduct.wholesale_min_qty) || 10,
        stock_quantity: parseInt(editProduct.stock_quantity) || 0,
        low_stock_threshold: parseInt(editProduct.low_stock_threshold) || 10,
        barcode: editProduct.barcode || '',
        description: editProduct.description || '',
        is_active: editProduct.is_active
      };

      await inventoryAPI.updateProduct(editingId, productData);

      // Refresh products
      const response = await inventoryAPI.getProducts();
      setProducts(response || []);
      setEditingId(null);
      setShowEditModal(false);
      setEditProduct({
        sku: '',
        name: '',
        serial_number: '',
        category: '',
        cost_price: 0,
        selling_price: 0,
        wholesale_price: 0,
        wholesale_min_qty: 10,
        stock_quantity: 0,
        low_stock_threshold: 10,
        barcode: '',
        description: '',
        is_active: true
      });
      // Show success message
      if (typeof window.Swal !== 'undefined') {
        window.Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Product updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Fallback to console.log if Swal is not available
        console.log('Product updated successfully!');
      }
    } catch (err) {
      // Use Swal if available, fallback to alert
      if (typeof window.Swal !== 'undefined') {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update product. Please try again.'
        });
      } else {
        // Fallback to console.error if Swal is not available
        console.error('Failed to update product. Please try again.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await inventoryAPI.deleteProduct(id);
      // Refresh products
      const response = await inventoryAPI.getProducts();
      setProducts(response || []);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          <FiAlertTriangle size={24} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <span>Inventory</span> / <span>Products</span>
        </div>
      </div>

      <div className="page-actions">
        <div className="search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-dropdown">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id === 'all' ? 'all' : category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <FiFilter className="filter-icon" />
          </div>
        </div>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => {
              setShowAddForm(true);
              setAddMode('single');
            }}
          >
            <FiPlus /> Add Product
          </button>
          <button className="btn btn-secondary">
            <FiDownload /> Export
          </button>
          <button className="btn btn-secondary">
            <FiPrinter /> Print
          </button>
        </div>
      </div>

      {showAddForm ? (
        <div className="product-form-container">
          <div className="form-toggle-buttons">
            <button
              className={`toggle-btn ${addMode === 'single' ? 'active' : ''}`}
              onClick={() => setAddMode('single')}
            >
              Single Product
            </button>
            <button
              className={`toggle-btn ${addMode === 'bulk' ? 'active' : ''}`}
              onClick={() => setAddMode('bulk')}
            >
              Multiple Products
            </button>
          </div>

          {addMode === 'single' ? (
            <div className="form-grid expanded">
              <div className="form-group">
                <label>SKU*</label>
                <input
                  type="text"
                  name="sku"
                  value={singleProduct.sku}
                  onChange={handleSingleInputChange}
                  placeholder="e.g. ALC-001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Product Name*</label>
                <input
                  type="text"
                  name="name"
                  value={singleProduct.name}
                  onChange={handleSingleInputChange}
                  placeholder="e.g. Whiskey - Jack Daniels"
                  required
                />
              </div>

              <div className="form-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  name="serial_number"
                  value={singleProduct.serial_number}
                  onChange={handleSingleInputChange}
                  placeholder="Serial number"
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={singleProduct.category}
                  onChange={handleSingleInputChange}
                >
                  <option value="">Select Category</option>
                  {categories.filter(cat => cat.id !== 'all').map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>

              <hr style={{ width: '100%', margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

              <div className="form-group">
                <label>Cost Price (Ksh)</label>
                <input
                  type="number"
                  name="cost_price"
                  value={singleProduct.cost_price}
                  onChange={handleSingleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Selling Price (Ksh)</label>
                <input
                  type="number"
                  name="selling_price"
                  value={singleProduct.selling_price}
                  onChange={handleSingleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Wholesale Price (Ksh)</label>
                <input
                  type="number"
                  name="wholesale_price"
                  value={singleProduct.wholesale_price}
                  onChange={handleSingleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Wholesale Min Qty</label>
                <input
                  type="number"
                  name="wholesale_min_qty"
                  value={singleProduct.wholesale_min_qty}
                  onChange={handleSingleInputChange}
                  placeholder="10"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={singleProduct.stock_quantity}
                  onChange={handleSingleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Low Stock Threshold</label>
                <input
                  type="number"
                  name="low_stock_threshold"
                  value={singleProduct.low_stock_threshold}
                  onChange={handleSingleInputChange}
                  placeholder="10"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Barcode</label>
                <input
                  type="text"
                  name="barcode"
                  value={singleProduct.barcode}
                  onChange={handleSingleInputChange}
                  placeholder="Barcode number"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={singleProduct.description}
                  onChange={handleSingleInputChange}
                  placeholder="Product description"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={singleProduct.is_active}
                    onChange={(e) => setSingleProduct(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  Is Active
                </label>
              </div>
            </div>
          ) : (
            <>
              <div className="bulk-actions">
                <button className="btn btn-secondary" onClick={addNewRow}>
                  <FiPlus /> Add Row
                </button>
                <div className="hint">
                  {bulkProducts.filter(p => p.name && p.sku).length} valid products ready to save
                </div>
              </div>
              
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Product Name*</th>
                      <th>SKU*</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Cost</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Supplier</th>
                      <th>Expiry</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleBulkChange(product.id, 'name', e.target.value)}
                            placeholder="Product name"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={product.sku}
                            onChange={(e) => handleBulkChange(product.id, 'sku', e.target.value)}
                            placeholder="Product SKU"
                          />
                        </td>
                        <td>
                          <select
                            value={product.category}
                            onChange={(e) => handleBulkChange(product.id, 'category', e.target.value)}
                          >
                            <option value="">Select</option>
                            {categories.filter(cat => cat.id !== 'all').map(category => (
                              <option key={category.id} value={category.name}>{category.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => handleBulkChange(product.id, 'price', e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={product.cost}
                            onChange={(e) => handleBulkChange(product.id, 'cost', e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(e) => handleBulkChange(product.id, 'stock', e.target.value)}
                            min="0"
                          />
                        </td>
                        <td>
                          <select
                            value={product.status}
                            onChange={(e) => handleBulkChange(product.id, 'status', e.target.value)}
                          >
                            {statusOptions.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={product.supplier}
                            onChange={(e) => handleBulkChange(product.id, 'supplier', e.target.value)}
                            placeholder="Supplier"
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={product.expiryDate}
                            onChange={(e) => handleBulkChange(product.id, 'expiryDate', e.target.value)}
                          />
                        </td>
                        <td>
                          <button 
                            className="btn-icon danger"
                            onClick={() => removeRow(product.id)}
                            disabled={bulkProducts.length <= 1}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          <div className="form-actions">
            {addMode === 'single' ? (
              <button 
                className="btn btn-primary"
                onClick={addSingleProduct}
                disabled={!singleProduct.name || !singleProduct.sku}
              >
                <FiSave /> Save Product
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={saveBulkProducts}
                disabled={bulkProducts.filter(p => p.name && p.sku).length === 0}
              >
                <FiSave /> Save All Products
              </button>
            )}
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Buying Price</th>
                  <th>Category</th>
                  <th>Selling Price</th>
                  <th>Wholesale Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{`Ksh${(Number(product.cost_price) || 0).toFixed(2)}`}</td>
                    <td>{product.category_name || 'N/A'}</td>
                    <td>{`Ksh${(Number(product.selling_price) || 0).toFixed(2)}`}</td>
                    <td>{product.wholesale_price ? `Ksh${(Number(product.wholesale_price) || 0).toFixed(2)}` : 'N/A'}</td>
                    <td>{product.stock_quantity}</td>
                    <td>
                      <span className={`status-badge ${product.stock_quantity <= product.low_stock_threshold ? 'low-stock' : 'in-stock'}`}>
                        {product.stock_quantity <= product.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => startEditing(product)}
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => deleteProduct(product.id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-container">
            <div className="pagination-info">
              Showing {filteredProducts.length} of {products.length} entries
            </div>
            <div className="pagination-controls">
              <button className="btn-pagination" disabled>Previous</button>
              <button className="btn-pagination active">1</button>
              <button className="btn-pagination">Next</button>
            </div>
          </div>
        </>
      )}

      {showEditModal && (
        <div className="modal-overlay active">
          <div className="modal-container form-animate">
            <div className="modal-header">
              <h3 className="modal-title">Edit Product</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  setEditProduct({
                    sku: '',
                    name: '',
                    serial_number: '',
                    category: '',
                    cost_price: 0,
                    selling_price: 0,
                    wholesale_price: 0,
                    wholesale_min_qty: 10,
                    stock_quantity: 0,
                    low_stock_threshold: 10,
                    barcode: '',
                    description: '',
                    is_active: true
                  });
                }}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={saveEditedProduct} className="product-form">
              <div className="modal-body">
                <div className="form-grid two-column">
                  <div className="form-group">
                    <label>SKU*</label>
                    <input
                      type="text"
                      name="sku"
                      value={editProduct.sku}
                      onChange={handleEditInputChange}
                      placeholder="e.g. ALC-001"
                      required
                    />
                  </div>
  
                  <div className="form-group">
                    <label>Product Name*</label>
                    <input
                      type="text"
                      name="name"
                      value={editProduct.name}
                      onChange={handleEditInputChange}
                      placeholder="e.g. Whiskey - Jack Daniels"
                      required
                    />
                  </div>
  
                  <div className="form-group">
                    <label>Serial Number</label>
                    <input
                      type="text"
                      name="serial_number"
                      value={editProduct.serial_number}
                      onChange={handleEditInputChange}
                      placeholder="Serial number"
                    />
                  </div>
  
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={editProduct.category}
                      onChange={handleEditInputChange}
                    >
                      <option value="">Select Category</option>
                      {categories.filter(cat => cat.id !== 'all').map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
  
                  <div className="form-group">
                    <label>Buying Price (Ksh)</label>
                    <input
                      type="number"
                      name="cost_price"
                      value={editProduct.cost_price}
                      onChange={handleEditInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
  
                  <div className="form-group">
                    <label>Selling Price (Ksh)</label>
                    <input
                      type="number"
                      name="selling_price"
                      value={editProduct.selling_price}
                      onChange={handleEditInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
  
                  <div className="form-group">
                    <label>Wholesale Price (Ksh)</label>
                    <input
                      type="number"
                      name="wholesale_price"
                      value={editProduct.wholesale_price}
                      onChange={handleEditInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
  
                  <div className="form-group">
                    <label>Wholesale Min Qty</label>
                    <input
                      type="number"
                      name="wholesale_min_qty"
                      value={editProduct.wholesale_min_qty}
                      onChange={handleEditInputChange}
                      placeholder="10"
                      min="1"
                    />
                  </div>
  
                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input
                      type="number"
                      name="stock_quantity"
                      value={editProduct.stock_quantity}
                      onChange={handleEditInputChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
  
                  <div className="form-group">
                    <label>Low Stock Threshold</label>
                    <input
                      type="number"
                      name="low_stock_threshold"
                      value={editProduct.low_stock_threshold}
                      onChange={handleEditInputChange}
                      placeholder="10"
                      min="0"
                    />
                  </div>
  
                  <div className="form-group">
                    <label>Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      value={editProduct.barcode}
                      onChange={handleEditInputChange}
                      placeholder="Barcode number"
                    />
                  </div>
  
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={editProduct.description}
                      onChange={handleEditInputChange}
                      placeholder="Product description"
                      rows="3"
                    />
                  </div>
  
                  <div className="form-group full-width">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={editProduct.is_active}
                        onChange={(e) => setEditProduct(prev => ({ ...prev, is_active: e.target.checked }))}
                      />
                      Is Active
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditProduct({
                      sku: '',
                      name: '',
                      serial_number: '',
                      category: '',
                      cost_price: 0,
                      selling_price: 0,
                      wholesale_price: 0,
                      wholesale_min_qty: 10,
                      stock_quantity: 0,
                      low_stock_threshold: 10,
                      barcode: '',
                      description: '',
                      is_active: true
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!editProduct.name || !editProduct.sku || updating}
                >
                  {updating ? (
                    <>
                      <div className="spinner-small"></div> Updating...
                    </>
                  ) : (
                    <>
                      <FiCheck /> Update Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
