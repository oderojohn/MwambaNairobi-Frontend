// CacheManager.js
// Component to manually manage offline cache
import React, { useState, useEffect } from 'react';
import { preloadOfflineCache, getCacheStatus, clearCache } from '../services/cachePreloader';
import './CacheManager.css';

const CacheManager = () => {
  const [cacheStatus, setCacheStatus] = useState({
    hasCache: false,
    productsCount: 0,
    customersCount: 0,
    inventoryCount: 0,
    lastSyncTime: null,
    needsRefresh: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadCacheStatus();
  }, []);

  const loadCacheStatus = async () => {
    try {
      const status = await getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error('Failed to load cache status:', error);
    }
  };

  const handlePreloadCache = async () => {
    if (!navigator.onLine) {
      setMessage('❌ Cannot preload cache while offline');
      return;
    }

    setIsLoading(true);
    setMessage('🔄 Preloading cache...');

    try {
      const results = await preloadOfflineCache();
      
      // Build success message
      const successParts = [];
      if (results.products.success) successParts.push(`${results.products.count} products`);
      if (results.customers.success) successParts.push(`${results.customers.count} customers`);
      if (results.inventory.success) successParts.push(`${results.inventory.count} categories`);
      if (results.settings.success) successParts.push('settings');
      
      setMessage(`✅ Cached: ${successParts.join(', ')}`);
      
      // Reload status
      await loadCacheStatus();
    } catch (error) {
      setMessage(`❌ Cache preload failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear all cached data?')) {
      return;
    }

    setIsLoading(true);
    setMessage('🗑️ Clearing cache...');

    try {
      await clearCache();
      setMessage('✅ Cache cleared successfully');
      await loadCacheStatus();
    } catch (error) {
      setMessage(`❌ Failed to clear cache: ${error.message}`);
    } finally {
      setIsLoading(false);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const formatLastSync = () => {
    if (!cacheStatus.lastSyncTime) return 'Never';
    
    const now = new Date();
    const syncTime = new Date(cacheStatus.lastSyncTime);
    const diffMs = now - syncTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="cache-manager">
      <button 
        className="cache-toggle-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Offline Cache Manager"
      >
        💾 {cacheStatus.hasCache ? '✓' : '○'}
      </button>

      {isExpanded && (
        <div className="cache-panel">
          <div className="cache-panel-header">
            <h3>Offline Cache Manager</h3>
            <button 
              className="cache-close-btn"
              onClick={() => setIsExpanded(false)}
            >
              ✕
            </button>
          </div>

          <div className="cache-status">
            <div className="cache-status-item">
              <span className="cache-label">Status:</span>
              <span className={`cache-value ${cacheStatus.hasCache ? 'has-cache' : 'no-cache'}`}>
                {cacheStatus.hasCache ? '✓ Cached' : '○ Empty'}
              </span>
            </div>

            <div className="cache-status-item">
              <span className="cache-label">Products:</span>
              <span className="cache-value">{cacheStatus.productsCount}</span>
            </div>

            <div className="cache-status-item">
              <span className="cache-label">Customers:</span>
              <span className="cache-value">{cacheStatus.customersCount}</span>
            </div>

            <div className="cache-status-item">
              <span className="cache-label">Categories:</span>
              <span className="cache-value">{cacheStatus.inventoryCount}</span>
            </div>

            <div className="cache-status-item">
              <span className="cache-label">Last Sync:</span>
              <span className="cache-value">{formatLastSync()}</span>
            </div>

            {cacheStatus.needsRefresh && (
              <div className="cache-warning">
                ⚠️ Cache is older than 24 hours
              </div>
            )}
          </div>

          {message && (
            <div className="cache-message">
              {message}
            </div>
          )}

          <div className="cache-actions">
            <button
              className="cache-btn cache-btn-primary"
              onClick={handlePreloadCache}
              disabled={isLoading || !navigator.onLine}
            >
              {isLoading ? '⏳ Loading...' : '🔄 Preload Cache'}
            </button>

            <button
              className="cache-btn cache-btn-secondary"
              onClick={loadCacheStatus}
              disabled={isLoading}
            >
              🔃 Refresh Status
            </button>

            <button
              className="cache-btn cache-btn-danger"
              onClick={handleClearCache}
              disabled={isLoading || !cacheStatus.hasCache}
            >
              🗑️ Clear Cache
            </button>
          </div>

          <div className="cache-info">
            <p><strong>How it works:</strong></p>
            <ul>
              <li>Click "Preload Cache" to download data for offline use</li>
              <li>Cache is automatically updated when you login</li>
              <li>Data older than 24 hours will be refreshed automatically</li>
              <li>Use offline mode by going offline in browser DevTools</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheManager;
