import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiFilter, FiEdit, FiTrash2, FiPrinter, FiDownload,
  FiSearch, FiSave, FiX, FiCheck, FiAlertTriangle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { inventoryAPI } from '../../../services/ApiService/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF with autoTable
if (typeof jsPDF !== 'undefined') {
  jsPDF.API.autoTable = autoTable;
}

// Inline styles for Products Page to ensure buttons are visible
const productsPageStyles = `
  .products-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }
  
  .products-btn-primary {
    background-color: #4361ee;
    color: white;
  }
  
  .products-btn-primary:hover {
    background-color: #3651d4;
  }
  
  .products-btn-secondary {
    background-color: #6c757d;
    color: white;
  }
  
  .products-btn-secondary:hover {
    background-color: #5a6268;
  }
  
  .products-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #4361ee;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .products-btn-icon:hover {
    background-color: rgba(67, 97, 238, 0.1);
  }
  
  .products-btn-icon-danger {
    color: #dc3545;
  }
  
  .products-btn-icon-danger:hover {
    background-color: rgba(220, 53, 69, 0.1);
  }
  
  .products-modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #6c757d;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .products-modal-close:hover {
    background-color: #dc3545;
    color: white;
  }
  
  .products-toggle-btn {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    border: 2px solid #4361ee;
    border-radius: 4px;
    background-color: transparent;
    color: #4361ee;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .products-toggle-btn.active {
    background-color: #4361ee;
    color: white;
  }
  
  .products-pagination-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background-color: white;
    color: #4361ee;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .products-pagination-btn:hover:not(:disabled) {
    background-color: #4361ee;
    border-color: #4361ee;
    color: white;
  }
  
  .products-pagination-btn.active {
    background-color: #4361ee;
    border-color: #4361ee;
    color: white;
  }
  
  .products-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .products-action-buttons {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  
  /* Delete Confirmation Modal */
  .products-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .products-modal-content {
    background-color: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .products-modal-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    color: #dc3545;
  }
  
  .products-modal-title {
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }
  
  .products-modal-message {
    text-align: center;
    font-size: 14px;
    color: #666;
    margin-bottom: 24px;
  }
  
  .products-modal-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  
  .products-modal-btn-cancel {
    background-color: #6c757d;
    color: white;
  }
  
  .products-modal-btn-cancel:hover {
    background-color: #5a6268;
  }
  
  .products-modal-btn-delete {
    background-color: #dc3545;
    color: white;
  }
  
  .products-modal-btn-delete:hover {
    background-color: #c82333;
  }
  
  .products-modal-btn-delete:disabled {
    background-color: #e0a8a8;
    cursor: not-allowed;
  }
`;

const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState('single'); // 'single' or 'bulk'
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [products, setProducts] = useState([]);

  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

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
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async (search = '', category = 'all', page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = { page, page_size: pagination.limit };
      if (search) params.search = search;
      if (category !== 'all') params.category = category;

      const [productsResponse, categoriesResponse] = await Promise.all([
        inventoryAPI.getProducts(params),
        inventoryAPI.getCategories()
      ]);
      const apiProducts = productsResponse.results || [];
      setProducts(apiProducts);

      // Store categories as objects with id and name, plus 'All' option
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
  }, [pagination.limit]);

  useEffect(() => {
    fetchData(searchTerm, selectedCategory, pagination.page);
  }, [fetchData, selectedCategory, pagination.page, searchTerm]);

  const filteredProducts = products;

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
      const response = await inventoryAPI.getProducts({ page: pagination.page, page_size: pagination.limit });
      setProducts(response.results || []);

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
      const response = await inventoryAPI.getProducts({ page: pagination.page, page_size: pagination.limit });
      setProducts(response.results || []);
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
      setDeleting(true);
      await inventoryAPI.deleteProduct(id);
      // Refresh products
      const response = await inventoryAPI.getProducts({ page: pagination.page, page_size: pagination.limit });
      setProducts(response.results || []);
      setShowDeleteModal(false);
      setProductToDelete(null);
      
      // Show success message
      if (typeof window.Swal !== 'undefined') {
        window.Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Product has been deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      setShowDeleteModal(false);
      
      // Show error message
      if (typeof window.Swal !== 'undefined') {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete product. Please try again.'
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  // Open delete confirmation modal
  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const exportProductsToPDF = () => {
    try {
      // Create a simple HTML table and print it instead of using jsPDF
      const printWindow = window.open('', '_blank');
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>MWAMBA LIQUORS - Product Inventory Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #3498db;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #2c3e50;
              margin: 0;
              font-size: 28px;
            }
            .header h2 {
              color: #7f8c8d;
              margin: 10px 0;
              font-size: 18px;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 30px;
            }
            .summary-item {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #3498db;
            }
            .summary-item strong {
              display: block;
              font-size: 24px;
              color: #2c3e50;
            }
            .summary-item span {
              color: #7f8c8d;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #3498db;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .status-low-stock {
              background-color: #fee;
              color: #c0392b;
              font-weight: bold;
            }
            .status-in-stock {
              background-color: #efe;
              color: #27ae60;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #7f8c8d;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MWAMBA LIQUORS</h1>
            <h2>Complete Product List with Stock Levels</h2>
            <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <p>Total Products: ${filteredProducts.length}</p>
          </div>

          <div class="summary">
            ${(() => {
              const totalValue = filteredProducts.reduce((sum, product) =>
                sum + ((Number(product.stock_quantity) || 0) * (Number(product.cost_price) || 0)), 0);
              const lowStockCount = filteredProducts.filter(p => (Number(p.stock_quantity) || 0) <= (Number(p.low_stock_threshold) || 10)).length;
              const outOfStockCount = filteredProducts.filter(p => (Number(p.stock_quantity) || 0) === 0).length;

              return `
                <div class="summary-item">
                  <strong>${filteredProducts.length}</strong>
                  <span>Total Products</span>
                </div>
                <div class="summary-item">
                  <strong>Ksh ${totalValue.toFixed(2)}</strong>
                  <span>Total Inventory Value</span>
                </div>
                <div class="summary-item">
                  <strong>${lowStockCount}</strong>
                  <span>Low Stock Items</span>
                </div>
                <div class="summary-item">
                  <strong>${outOfStockCount}</strong>
                  <span>Out of Stock Items</span>
                </div>
              `;
            })()}
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Wholesale Price</th>
                <th>Stock Qty</th>
                <th>Low Stock Threshold</th>
                <th>Status</th>
                <th>Barcode</th>
                <th>Created Date</th>
                <th>Stock Take Notes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProducts.map(product => `
                <tr>
                  <td>${product.id || 'N/A'}</td>
                  <td>${product.name || 'N/A'}</td>
                  <td>${product.sku || 'N/A'}</td>
                  <td>${product.category_name || 'N/A'}</td>
                  <td>Ksh ${(Number(product.cost_price) || 0).toFixed(2)}</td>
                  <td>Ksh ${(Number(product.selling_price) || 0).toFixed(2)}</td>
                  <td>${product.wholesale_price ? `Ksh ${(Number(product.wholesale_price) || 0).toFixed(2)}` : 'N/A'}</td>
                  <td>${Number(product.stock_quantity) || 0}</td>
                  <td>${Number(product.low_stock_threshold) || 10}</td>
                  <td class="${(Number(product.stock_quantity) || 0) <= (Number(product.low_stock_threshold) || 10) ? 'status-low-stock' : 'status-in-stock'}">
                    ${(Number(product.stock_quantity) || 0) <= (Number(product.low_stock_threshold) || 10) ? 'Low Stock' : 'In Stock'}
                  </td>
                  <td>${product.barcode || 'N/A'}</td>
                  <td>${product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>MWAMBA LIQUORS - Product Inventory Report</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

    } catch (error) {
      console.error('Error generating products PDF:', error);
      alert(`Error generating Products PDF: ${error.message || 'Please try again.'}`);
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
      <style>{productsPageStyles}</style>
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
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <button className="products-btn products-btn-primary" onClick={handleSearch}>
              <FiSearch /> Search
            </button>
          </div>
          <div className="filter-dropdown">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FiFilter className="filter-icon" />
          </div>
        </div>
        <div className="">
          <button 
            className="products-btn products-btn-primary"
            onClick={() => {
              setShowAddForm(true);
              setAddMode('single');
            }}
          >
            <FiPlus /> Add Product
          </button>
          <button className="products-btn products-btn-secondary" onClick={exportProductsToPDF}>
            <FiDownload /> Export to PDF
          </button>
          <button className="products-btn products-btn-secondary">
            <FiPrinter /> Print
          </button>
        </div>
      </div>

      {showAddForm ? (
        <div className="product-form-container">
          <div className="form-toggle-buttons">
            <button
              className={`products-toggle-btn ${addMode === 'single' ? 'active' : ''}`}
              onClick={() => setAddMode('single')}
            >
              Single Product
            </button>
            <button
              className={`products-toggle-btn ${addMode === 'bulk' ? 'active' : ''}`}
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
                <button className="products-btn products-btn-secondary" onClick={addNewRow}>
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
                            className="products-btn-icon products-btn-icon-danger"
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
                className="products-btn products-btn-primary"
                onClick={addSingleProduct}
                disabled={!singleProduct.name || !singleProduct.sku}
              >
                <FiSave /> Save Product
              </button>
            ) : (
              <button 
                className="products-btn products-btn-primary"
                onClick={saveBulkProducts}
                disabled={bulkProducts.filter(p => p.name && p.sku).length === 0}
              >
                <FiSave /> Save All Products
              </button>
            )}
            <button 
              className="products-btn products-btn-secondary"
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
                      <div className="products-action-buttons">
                        <button
                          className="products-btn-icon"
                          onClick={() => startEditing(product)}
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="products-btn-icon products-btn-icon-danger"
                          onClick={() => confirmDelete(product)}
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
              Page {pagination.page}
            </div>
            <div className="pagination-controls">
              <button
                className="products-pagination-btn"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1 || loading}
              >
                Previous
              </button>
              <button className="products-pagination-btn active">{pagination.page}</button>
              <button
                className="products-pagination-btn"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={filteredProducts.length < pagination.limit || loading}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="products-modal-overlay">
          <div className="products-modal-content">
            <div className="products-modal-icon">
              <FiAlertTriangle size={48} />
            </div>
            <h3 className="products-modal-title">Delete Product?</h3>
            <p className="products-modal-message">
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="products-modal-actions">
              <button
                className="products-btn products-modal-btn-cancel"
                onClick={cancelDelete}
                disabled={deleting}
              >
                <FiX /> Cancel
              </button>
              <button
                className="products-btn products-modal-btn-delete"
                onClick={() => productToDelete && deleteProduct(productToDelete.id)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : (
                  <>
                    <FiTrash2 /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay active">
          <div className="modal-container form-animate">
            <div className="modal-header">
              <h3 className="modal-title">Edit Product</h3>
              <button
                className="products-modal-close"
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
                  className="products-btn products-btn-secondary"
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
                  className="products-btn products-btn-primary"
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
