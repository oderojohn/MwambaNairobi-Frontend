// ProductGrid.js
import React, { useState, useRef, useEffect } from 'react';
import "../data/ProductGrid.css";

const ProductGrid = ({ products = [], categories = [], onAddToCart, loading = false, disabled = false }) => {
  const [selectedCategory, setSelectedCategory] = useState(null); // null = All Products
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
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

  // Focus search input when it becomes visible
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

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

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSearchVisible && searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        if (searchTerm === '') {
          setIsSearchVisible(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchVisible, searchTerm]);

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
  }).sort((a, b) => a.category - b.category);

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


  const handleSearchToggle = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleSearchClose = () => {
    setSearchTerm('');
    setIsSearchVisible(false);
  };

  if (loading) {
    return (
      <section className="pos-products-grid">
        <div className="pos-products-grid__loading">
          <div className="pos-products-grid__loading-spinner"></div>
          <div className="pos-products-grid__loading-text">Loading products...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="pos-products-grid">
      {/* Categories Sidebar */}
      <div className="pos-products-grid__sidebar">
        <div className="pos-products-grid__sidebar-header">
          <h3 className="pos-products-grid__sidebar-title">Categories</h3>
          <div className="pos-products-grid__sidebar-count">
            {filteredProducts.length} items
          </div>
        </div>
        
        <div className="pos-products-grid__categories">
          {/* All Products option */}
          <div
            className={`pos-products-grid__category-item ${selectedCategory === null ? 'pos-products-grid__category-item--active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            <div className="pos-products-grid__category-icon">
              <i className="fas fa-th-large"></i>
            </div>
            <span className="pos-products-grid__category-name">All</span>
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
              ? 'All Products'
              : categories.find(c => c.id === selectedCategory)?.name || 'Products'
            }
          </h2>
          
          {/* Search Container */}
          <div className="pos-products-grid__search-container">
            {/* Search Toggle Button - Always Visible */}
            <button 
              className="pos-products-grid__search-toggle"
              onClick={handleSearchToggle}
              title="Search products"
            >
              <i className="fas fa-search"></i>
            </button>

            {/* Search Input - Hidden by default */}
            <div className={`pos-products-grid__search ${isSearchVisible ? 'pos-products-grid__search--visible' : ''}`}>
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
              <button 
                className="pos-products-grid__search-close"
                onClick={handleSearchClose}
                title="Close search"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div className="pos-products-grid__stats">
            Showing {filteredProducts.length} of {products.length} products
            {searchTerm && (
              <span className="pos-products-grid__search-term">
                for "{searchTerm}"
              </span>
            )}
          </div>
        </div>

        <div className="pos-products-grid__container">
          {filteredProducts.length === 0 ? (
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
            <div className="pos-products-grid__products">
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
                      <div className="pos-products-grid__product-category">
                        {product.category_name || 'Uncategorized'}
                      </div>
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