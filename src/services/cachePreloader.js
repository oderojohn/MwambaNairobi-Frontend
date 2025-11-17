// cachePreloader.js
// Service to preload critical data into offline cache at app startup

import { inventoryAPI, customersAPI, settingsAPI } from './ApiService/api.js';
import { offlineStorage } from './offlineStorage.js';

/**
 * Preload all critical data for offline use
 * This should be called after successful login
 */
export const preloadOfflineCache = async () => {
  console.log('🔄 Starting offline cache preload...');
  
  const results = {
    products: { success: false, count: 0, error: null },
    customers: { success: false, count: 0, error: null },
    inventory: { success: false, count: 0, error: null },
    settings: { success: false, error: null }
  };

  // Only preload if online
  if (!navigator.onLine) {
    console.log('⚠️ Offline - skipping cache preload');
    return results;
  }

  try {
    // Preload products
    try {
      console.log('📦 Preloading products...');
      const products = await inventoryAPI.products.getAll();
      if (products && Array.isArray(products)) {
        await offlineStorage.saveProducts(products);
        results.products.success = true;
        results.products.count = products.length;
        console.log(`✅ Cached ${products.length} products`);
      }
    } catch (error) {
      console.error('❌ Failed to preload products:', error);
      results.products.error = error.message;
    }

    // Preload customers
    try {
      console.log('👥 Preloading customers...');
      const customers = await customersAPI.getCustomers();
      if (customers && Array.isArray(customers)) {
        await offlineStorage.saveCustomers(customers);
        results.customers.success = true;
        results.customers.count = customers.length;
        console.log(`✅ Cached ${customers.length} customers`);
      }
    } catch (error) {
      console.error('❌ Failed to preload customers:', error);
      results.customers.error = error.message;
    }

    // Preload categories (part of inventory)
    try {
      console.log('📂 Preloading categories...');
      const categories = await inventoryAPI.categories.getAll();
      if (categories && Array.isArray(categories)) {
        await offlineStorage.saveInventory(categories);
        results.inventory.success = true;
        results.inventory.count = categories.length;
        console.log(`✅ Cached ${categories.length} categories`);
      }
    } catch (error) {
      console.error('❌ Failed to preload categories:', error);
      results.inventory.error = error.message;
    }

    // Preload settings
    try {
      console.log('⚙️ Preloading settings...');
      const settingsTypes = ['general', 'business', 'inventory', 'pos', 'users', 'system'];
      
      for (const type of settingsTypes) {
        try {
          let settings;
          switch (type) {
            case 'general':
              settings = await settingsAPI.getGeneralSettings();
              break;
            case 'business':
              settings = await settingsAPI.getBusinessSettings();
              break;
            case 'inventory':
              settings = await settingsAPI.getInventorySettings();
              break;
            case 'pos':
              settings = await settingsAPI.getPOSSettings();
              break;
            case 'users':
              settings = await settingsAPI.getUserSettings();
              break;
            case 'system':
              settings = await settingsAPI.getSystemSettings();
              break;
          }
          
          if (settings) {
            await offlineStorage.saveSetting(type, settings);
            console.log(`✅ Cached ${type} settings`);
          }
        } catch (settingError) {
          console.warn(`⚠️ Failed to cache ${type} settings:`, settingError.message);
        }
      }
      
      results.settings.success = true;
    } catch (error) {
      console.error('❌ Failed to preload settings:', error);
      results.settings.error = error.message;
    }

    // Update last sync time
    offlineStorage.setLastSyncTime();
    
    console.log('✅ Cache preload completed:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Cache preload failed:', error);
    throw error;
  }
};

/**
 * Check if cache needs refresh (older than 24 hours)
 */
export const shouldRefreshCache = () => {
  const lastSync = offlineStorage.getLastSyncTime();
  if (!lastSync) return true;
  
  const hoursSinceSync = (Date.now() - lastSync) / (1000 * 60 * 60);
  return hoursSinceSync > 24;
};

/**
 * Get cache status
 */
export const getCacheStatus = async () => {
  try {
    const [products, customers, inventory] = await Promise.all([
      offlineStorage.getProducts(),
      offlineStorage.getCustomers(),
      offlineStorage.getInventory()
    ]);

    const lastSync = offlineStorage.getLastSyncTime();
    
    return {
      hasCache: (products?.length > 0 || customers?.length > 0 || inventory?.length > 0),
      productsCount: products?.length || 0,
      customersCount: customers?.length || 0,
      inventoryCount: inventory?.length || 0,
      lastSyncTime: lastSync ? new Date(lastSync) : null,
      needsRefresh: shouldRefreshCache()
    };
  } catch (error) {
    console.error('Failed to get cache status:', error);
    return {
      hasCache: false,
      productsCount: 0,
      customersCount: 0,
      inventoryCount: 0,
      lastSyncTime: null,
      needsRefresh: true
    };
  }
};

/**
 * Clear all cached data
 */
export const clearCache = async () => {
  try {
    await offlineStorage.clearAllData();
    console.log('✅ Cache cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    return false;
  }
};
