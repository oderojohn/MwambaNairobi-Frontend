import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiPrinter,
  FiDownload,
  FiSearch,
  FiX,
  FiCheck,
  FiAlertTriangle,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { inventoryAPI } from '../../../services/ApiService/api';

const CategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [, setShowPrintModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('export');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    includeAll: true,
    selectedColumns: ['id', 'name', 'description'],
    fileName: 'categories_export'
  });
  const [printOptions, setPrintOptions] = useState({
    orientation: 'portrait',
    includeHeaders: true,
    includeImages: false
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await inventoryAPI.getCategories();
        setCategories(response || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.response?.data?.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.createCategory(formData);
      // Refresh categories
      const response = await inventoryAPI.getCategories();
      setCategories(response || []);
      setShowAddModal(false);
      setFormData({ name: '', description: '', status: 'Active' });
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category');
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.updateCategory(currentCategory.id, formData);
      // Refresh categories
      const response = await inventoryAPI.getCategories();
      setCategories(response || []);
      setShowEditModal(false);
      setFormData({ name: '', description: '', status: 'Active' });
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await inventoryAPI.deleteCategory(currentCategory.id);
      // Refresh categories
      const response = await inventoryAPI.getCategories();
      setCategories(response || []);
      setShowDeleteModal(false);
      setCurrentCategory(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
    }
  };

  const handleExport = () => {
    console.log('Exporting with options:', exportOptions);
    setShowExportModal(false);
  };

  const handlePrint = () => {
    console.log('Printing with options:', printOptions);
    setShowPrintModal(false);
  };

  const openEditModal = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (category) => {
    setCurrentCategory(category);
    setShowDeleteModal(true);
  };

  const toggleColumnSelection = (column) => {
    setExportOptions(prev => {
      if (prev.selectedColumns.includes(column)) {
        return {
          ...prev,
          selectedColumns: prev.selectedColumns.filter(col => col !== column)
        };
      } else {
        return {
          ...prev,
          selectedColumns: [...prev.selectedColumns, column]
        };
      }
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading categories...</div>
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
      {/* Add Category Modal */}
       {showAddModal && (
              <div className="modal-overlay active">
                <div className="modal-container form-animate">
                  <div className="modal-header">
                    <h3 className="modal-title">Add New Category</h3>
                    <button 
                      className="modal-close" 
                      onClick={() => {
                        setShowAddModal(false);
                        setFormData({ name: '', description: '' });
                      }}
                    >
                      <FiX />
                    </button>
                  </div>
                  <form onSubmit={handleAddCategory} className="category-form">
                    <div className="modal-body">
                      <div className="form-group">
                        <label htmlFor="name">Category Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter category name"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Enter category description"
                        />
                      </div>
                      
                    </div>
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowAddModal(false);
                          setFormData({ name: '', description: '' });
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        <FiCheck /> Add Category
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

     {showEditModal && currentCategory && (
             <div className="modal-overlay active">
               <div className="modal-container form-animate">
                 <div className="modal-header">
                   <h3 className="modal-title">Edit Category</h3>
                   <button 
                     className="modal-close" 
                     onClick={() => {
                       setShowEditModal(false);
                       setFormData({ name: '', description: '' });
                     }}
                   >
                     <FiX />
                   </button>
                 </div>
                 <form onSubmit={handleEditCategory} className="category-form">
                   <div className="modal-body">
                     <div className="form-group">
                       <label htmlFor="name">Category Name</label>
                       <input
                         type="text"
                         id="name"
                         name="name"
                         value={formData.name}
                         onChange={handleInputChange}
                         placeholder="Enter category name"
                         required
                       />
                     </div>
                     
                     <div className="form-group">
                       <label htmlFor="description">Description</label>
                       <textarea
                         id="description"
                         name="description"
                         value={formData.description}
                         onChange={handleInputChange}
                         placeholder="Enter category description"
                       />
                     </div>
                     
                   </div>
                   <div className="modal-footer">
                     <button 
                       type="button" 
                       className="btn btn-secondary"
                       onClick={() => {
                         setShowEditModal(false);
                         setFormData({ name: '', description: '' });
                       }}
                     >
                       Cancel
                     </button>
                     <button type="submit" className="btn btn-primary">
                       <FiCheck /> Update Category
                     </button>
                   </div>
                 </form>
               </div>
             </div>
           )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentCategory && (
        <div className="modal-overlay active delete-modal">
          <div className="modal-container form-animate">
            <div className="modal-header">
              <h3 className="modal-title">Delete Category</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowDeleteModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="delete-modal-content">
              <div className="delete-icon">
                <FiAlertTriangle />
              </div>
              <div className="delete-text">
                <h4>Are you sure you want to delete this category?</h4>
                <p>
                  This will permanently delete "{currentCategory.name}" and cannot be undone. 
                  Any products associated with this category will need to be reassigned.
                </p>
              </div>
              <div className="delete-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleDeleteCategory}
                  style={{ backgroundColor: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                >
                  <FiTrash2 /> Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
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
                <h5>Data Selection</h5>
                <div className="option-row">
                  <label className="option-label">Include all categories</label>
                  <div className="option-control">
                    <input 
                      type="checkbox" 
                      className="option-checkbox"
                      checked={exportOptions.includeAll}
                      onChange={(e) => setExportOptions({...exportOptions, includeAll: e.target.checked})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="option-group">
                <h5>Columns to Export</h5>
                {['id', 'name', 'description'].map(column => (
                  <div className="option-row" key={column}>
                    <label className="option-label">
                      {column.charAt(0).toUpperCase() + column.slice(1)}
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

      {/* Page Content */}
      <div className="page-header">
        {/* <h1>Categories</h1> */}
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <span>Inventory</span> / <span>Categories</span>
        </div>
      </div>

      <div className="page-actions">
        <div className="search-filter">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="search-icon" />
          </div>
        </div>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <FiPlus /> Add Category
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setShowExportModal(true);
              setActiveTab('export');
            }}
          >
            <FiDownload /> Export
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setShowExportModal(true);
              setActiveTab('print');
            }}
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
              <th>Category Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map(category => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>
                  <Link to={`/categories/${category.id}`} className="category-link">
                    {category.name}
                  </Link>
                </td>
                <td>{category.description}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      title="Edit"
                      onClick={() => openEditModal(category)}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="btn-icon"
                      title="Delete"
                      onClick={() => openDeleteModal(category)}
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
          Showing 1 to {filteredCategories.length} of {categories.length} entries
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

export default CategoriesPage;
