// ProductGrid.js
import React, { useState, useRef, useEffect } from 'react';
import "../data/ProductGrid.css";

const ProductGrid = ({ products = [], categories = [], onAddToCart, loading = false, disabled = false }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [displayMode, setDisplayMode] = useState('cards');
  const searchInputRef = useRef(null);

  // Predefined color palette for automatic assignment
  const colorPalette = [
    { primary: '#3498db', background: '#ebf5fb', hover: '#2980b9' }, // Blue
    { primary: '#2ecc71', background: '#eafaf1', hover: '#27ae60' }, // Green
    { primary: '#e74c3c', background: '#fdedec', hover: '#c0392b' }, // Red
    { primary: '#f39c12', background: '#fef5e7', hover: '#d35400' }, // Orange
    { primary: '#9b59b6', background: '#f4ecf7', hover: '#8e44ad' }, // Purple
    { primary: '#1abc9c', background: '#e8f8f5', hover: '#16a085' }, // Teal
    { primary: '#e67e22', background: '#fef9e7', hover: '#ca6f1d' }, // Carrot
    { primary: '#34495e', background: '#ecf0f1', hover: '#2c3e50' }, // Dark Blue Gray
    { primary: '#16a085', background: '#d5f4e6', hover: '#138a72' }, // Dark Teal
    { primary: '#27ae60', background: '#d5f4e6', hover: '#219653' }, // Dark Green
    { primary: '#2980b9', background: '#d6eaf8', hover: '#2471a3' }, // Dark Blue
    { primary: '#8e44ad', background: '#f5e6ff', hover: '#7d3c98' }, // Dark Purple
    { primary: '#d35400', background: '#fdeaa7', hover: '#ba4a00' }, // Dark Orange
    { primary: '#c0392b', background: '#fadbd8', hover: '#a93226' }, // Dark Red
    { primary: '#7f8c8d', background: '#f8f9f9', hover: '#707b7c' }, // Gray
  ];

  // Handle loading state changes
  useEffect(() => {
    if (loading) {
      setIsLoadingProducts(true);
      // Simulate loading delay for animation effect
      const timer = setTimeout(() => {
        setIsLoadingProducts(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsLoadingProducts(false);
    }
  }, [loading]);

  // Function to get color for category ID
  const getCategoryColor = (categoryId) => {
    const colorIndex = (categoryId - 1) % colorPalette.length;
    return colorPalette[colorIndex];
  };

  // Default colors for fallback
  const defaultColors = { primary: '#95a5a6', background: '#f8f9f9', hover: '#7f8c8d' };

  const filteredProducts = products.filter(product => {
    // Category filter
    const categoryMatch = selectedCategory === null || product.category === selectedCategory;

    // Search filter
    const searchMatch = searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return categoryMatch && searchMatch;
  }).sort((a, b) => a.id - b.id);

  // Helper function to get category colors safely
  const getCategoryColors = (product) => {
    try {
      const categoryId = product.category;
      if (categoryId) {
        return getCategoryColor(categoryId);
      }
      return defaultColors;
    } catch (error) {
      return defaultColors;
    }
  };

  return (
    <section className="pos-products-grid">
      {/* Sidebar Toggle Button - Always Visible */}
      <div className="pos-products-grid__sidebar-toggle-container">
        <button 
          className="pos-products-grid__sidebar-toggle-btn" 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? 'Show categories' : 'Hide categories'}
        >
          <i className={`fas ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
      </div>

      {/* Categories Sidebar */}
      <div className={`pos-products-grid__sidebar ${isSidebarCollapsed ? 'pos-products-grid__sidebar--collapsed' : ''}`}>
        <div className="pos-products-grid__sidebar-header">
          <h3 className="pos-products-grid__sidebar-title">Cats</h3>
        </div>
        
        <div className="pos-products-grid__categories">
          {/* All Products option */}
          <div
            className={`pos-products-grid__category-item ${selectedCategory === null ? 'pos-products-grid__category-item--active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            <div className="pos-products-grid__category-icon" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
              <i className="fas fa-th-large"></i>
            </div>
            <span className="pos-products-grid__category-name">All Products</span>
            <div className="pos-products-grid__category-badge">
              {products.length}
            </div>
          </div>
          
          {/* Individual categories */}
          {categories.map(category => {
            const colors = getCategoryColor(category.id);
            const categoryProducts = products.filter(p => p.category === category.id);
            
            return (
              <div
                key={category.id}
                className={`pos-products-grid__category-item ${selectedCategory === category.id ? 'pos-products-grid__category-item--active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  '--category-color': colors.primary,
                  '--category-bg': colors.background,
                  '--category-hover': colors.hover
                }}
              >
                <div 
                  className="pos-products-grid__category-icon"
                  style={{ backgroundColor: colors.primary }}
                >
                  {category.name.charAt(0).toUpperCase()}
                </div>
                <span className="pos-products-grid__category-name">{category.name}</span>
                <div className="pos-products-grid__category-badge">
                  {categoryProducts.length}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="pos-products-grid__main">
        <div className="pos-products-grid__header">
          <h2 className="pos-products-grid__title">
            {selectedCategory === null
              ? 'All'
              : categories.find(c => c.id === selectedCategory)?.name || 'Products'
            }
          </h2>
          
          {/* Search - Always Visible */}
          <div className="pos-products-grid__search">
            <i className="fas fa-search pos-products-grid__search-icon"></i>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pos-products-grid__search-input"
            />
            {searchTerm && (
              <button 
                className="pos-products-grid__search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          {/* Display Mode Toggle */}
          <div className="pos-products-grid__display-toggle">
            <button 
              className={`pos-products-grid__display-btn ${displayMode === 'cards' ? 'pos-products-grid__display-btn--active' : ''}`}
              onClick={() => setDisplayMode('cards')}
              title="Card view"
            >
              <i className="fas fa-th"></i>
            </button>
            <button 
              className={`pos-products-grid__display-btn ${displayMode === 'list' ? 'pos-products-grid__display-btn--active' : ''}`}
              onClick={() => setDisplayMode('list')}
              title="List view"
            >
              <i className="fas fa-list"></i>
            </button>
          </div>

          <div className="pos-products-grid__stats">
            {filteredProducts.length} of {products.length} products
          </div>
        </div>

        <div className="pos-products-grid__container">
          {/* Loading overlay - keeps grid visible */}
          {loading && (
            <div className="pos-products-grid__loading-overlay">
              <div className="pos-products-grid__loading-spinner"></div>
            </div>
          )}
          
          {filteredProducts.length === 0 && !loading ? (
            <div className="pos-products-grid__empty">
              <i className="fas fa-box-open pos-products-grid__empty-icon"></i>
              <h3 className="pos-products-grid__empty-title">No Products Found</h3>
              <p className="pos-products-grid__empty-message">
                {searchTerm 
                  ? `No products found matching "${searchTerm}"`
                  : selectedCategory === null 
                    ? 'No products available in inventory.' 
                    : 'No products found in this category.'
                }
              </p>
              {searchTerm && (
                <button 
                  className="pos-products-grid__empty-clear"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className={`pos-products-grid__products ${displayMode === 'list' ? 'pos-products-grid__products--list' : ''}`}>
              {/* Loading overlay - keeps grid visible */}
              {loading && (
                <div className="pos-products-grid__loading-overlay">
                  <div className="pos-products-grid__loading-spinner"></div>
                </div>
              )}
              
              {filteredProducts.map((product, index) => {
                const colors = getCategoryColors(product);

                return (
                  <div
                    key={product.id}
                    className={`pos-products-grid__product-card ${disabled ? 'pos-products-grid__product-card--disabled' : ''} ${isLoadingProducts ? 'pos-products-grid__product-card--loading' : ''}`}
                    onClick={() => !disabled && onAddToCart(product)}
                    style={{
                      '--product-color': colors.primary,
                      '--product-bg': colors.background,
                      '--product-hover': colors.hover,
                      '--animation-delay': `${index * 50}ms`
                    }}
                  >
                    <div className="pos-products-grid__product-header">
                      <div 
                        className="pos-products-grid__product-badge"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {product.category_name ? product.category_name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="pos-products-grid__product-stock">
                        {product.stock_quantity || product.stock || 0}
                      </div>
                    </div>

                    <div className="pos-products-grid__product-body">
                      <h3 className="pos-products-grid__product-name" title={product.name}>
                        {product.name}
                      </h3>
                    </div>

                    <div className="pos-products-grid__product-footer">
                      <div 
                        className="pos-products-grid__product-price"
                        style={{ color: colors.primary }}
                      >
                        Ksh {Number(product.display_price || product.selling_price || product.price || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
