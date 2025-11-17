import { offlineStorage } from './offlineStorage.js';
// import { apiRequest } from './ApiService/api.js'; // Not used in this file

// Sync event listeners
export const initBackgroundSync = () => {
  // Register background sync when device comes online
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      window.addEventListener('online', () => {
        console.log('Device online - registering background sync');
        registration.sync.register('sync-pending-data');
      });
    });
  }

  // Immediate sync when coming online
  window.addEventListener('online', () => {
    console.log('Device back online - starting immediate sync');
    performFullSync();
  });
};

// Main sync function
export const performFullSync = async () => {
  try {
    console.log('Starting full data synchronization...');

    // Show sync indicator (will be implemented in UI)
    if (window.showSyncIndicator) {
      window.showSyncIndicator(true);
    }

    // Step 1: Sync authentication actions (logout, etc.)
    await syncPendingServerActions();

    // Step 2: Sync pending sales transactions
    await syncPendingSales();

    // Step 3: Sync other pending operations
    await syncPendingOperations();

    // Step 4: Refresh critical data from server
    await refreshServerData();

    // Step 5: Clean up synced items
    await cleanupSyncedData();

    // Update last sync time
    offlineStorage.setLastSyncTime();

    console.log('Full sync completed successfully');

    // Show success feedback
    if (window.showSyncSuccess) {
      window.showSyncSuccess();
    }

  } catch (error) {
    console.error('Sync failed:', error);

    // Show error feedback
    if (window.showSyncError) {
      window.showSyncError(error);
    }

    // Could implement retry logic here
    throw error;
  } finally {
    // Hide sync indicator
    if (window.showSyncIndicator) {
      window.showSyncIndicator(false);
    }
  }
};

// Sync pending sales
const syncPendingSales = async () => {
  const pendingSales = await offlineStorage.getPendingSales();
  console.log(`Syncing ${pendingSales.length} pending sales`);

  for (const sale of pendingSales) {
    try {
      console.log('Syncing sale:', sale.id);

      // Attempt to create sale on server
      const response = await fetch(`${'https://pos-iota-five.vercel.app'}${sale.endpoint}`, {
        method: sale.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pos_access_token')}`
        },
        body: JSON.stringify(sale.body)
      });

      if (response.ok) {
        const serverResponse = await response.json();
        console.log('Sale synced successfully:', serverResponse);

        // Update local sale with server ID
        await offlineStorage.updatePendingSale(sale.id, {
          synced: true,
          serverId: serverResponse.id,
          syncedAt: Date.now()
        });

        // Update local inventory if sale affected stock
        if (sale.body && sale.body.items) {
          await updateLocalInventory(sale.body.items);
        }

      } else {
        // Handle sync conflicts
        const errorData = await response.json().catch(() => ({}));
        await handleSyncConflict(sale, response.status, errorData);
      }

    } catch (error) {
      console.error(`Failed to sync sale ${sale.id}:`, error);
      // Mark for retry or manual resolution
      await offlineStorage.markSaleSyncFailed(sale.id, error.message);
    }
  }
};

// Sync other server actions
const syncPendingServerActions = async () => {
  const pendingActions = await offlineStorage.getPendingServerActions();
  console.log(`Syncing ${pendingActions.length} pending server actions`);

  for (const action of pendingActions) {
    try {
      if (action.type === 'logout') {
        await fetch(`${'https://pos-iota-five.vercel.app'}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${action.accessToken || localStorage.getItem('pos_access_token')}`
          },
          body: JSON.stringify({ refresh: action.refreshToken })
        });
        console.log('Server logout synced');
      } else if (action.type === 'api_request') {
        // Handle other queued API requests
        await fetch(`${'https://pos-iota-five.vercel.app'}${action.endpoint}`, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('pos_access_token')}`,
            ...action.headers
          },
          body: action.body ? JSON.stringify(action.body) : undefined
        });
      }

      await offlineStorage.removePendingServerAction(action.id);

    } catch (error) {
      console.error('Failed to sync server action:', error);
    }
  }
};

// Sync other operations
const syncPendingOperations = async () => {
  // Sync cart operations
  await syncPendingCartOperations();

  // Sync inventory adjustments
  await syncPendingInventoryAdjustments();

  // Sync customer updates
  await syncPendingCustomerUpdates();

  // Sync settings changes
  await syncPendingSettingsChanges();
};

// Placeholder functions for other sync operations
const syncPendingCartOperations = async () => {
  // Implement cart sync logic if needed
  console.log('Syncing pending cart operations');
};

const syncPendingInventoryAdjustments = async () => {
  // Implement inventory sync logic if needed
  console.log('Syncing pending inventory adjustments');
};

const syncPendingCustomerUpdates = async () => {
  // Implement customer sync logic if needed
  console.log('Syncing pending customer updates');
};

const syncPendingSettingsChanges = async () => {
  // Implement settings sync logic if needed
  console.log('Syncing pending settings changes');
};

// Refresh server data
const refreshServerData = async () => {
  try {
    console.log('Refreshing critical data from server');

    // Refresh products
    const productsResponse = await fetch(`${'https://pos-iota-five.vercel.app'}/api/inventory/products/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('pos_access_token')}`
      }
    });
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      await offlineStorage.saveProducts(products);
    }

    // Refresh customers
    const customersResponse = await fetch(`${'https://pos-iota-five.vercel.app'}/api/customers/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('pos_access_token')}`
      }
    });
    if (customersResponse.ok) {
      const customers = await customersResponse.json();
      await offlineStorage.saveCustomers(customers);
    }

    // Refresh inventory
    const inventoryResponse = await fetch(`${'https://pos-iota-five.vercel.app'}/api/inventory/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('pos_access_token')}`
      }
    });
    if (inventoryResponse.ok) {
      const inventory = await inventoryResponse.json();
      await offlineStorage.saveInventory(inventory);
    }

  } catch (error) {
    console.warn('Failed to refresh server data:', error);
    // Non-critical, continue with sync
  }
};

// Handle sync conflicts
const handleSyncConflict = async (pendingSale, statusCode, errorData) => {
  console.warn('Sync conflict detected:', { pendingSale, statusCode, errorData });

  // Different strategies for different conflict types
  if (statusCode === 409 || errorData.error?.includes('duplicate')) {
    // Duplicate transaction - sale already exists
    console.log('Duplicate sale detected, marking as synced');
    await offlineStorage.markSaleSynced(pendingSale.id);
    return;
  }

  if (statusCode === 400 && errorData.error?.includes('stock')) {
    // Insufficient stock
    await offlineStorage.saveSyncConflict({
      type: 'sale',
      localData: pendingSale,
      serverError: errorData,
      conflictType: 'insufficient_stock',
      timestamp: Date.now()
    });
    return;
  }

  // Generic conflict - store for manual resolution
  await offlineStorage.saveSyncConflict({
    type: 'sale',
    localData: pendingSale,
    serverError: errorData,
    conflictType: 'unknown',
    timestamp: Date.now()
  });
};

// Update local inventory after successful sale sync
const updateLocalInventory = async (saleItems) => {
  // This would update local inventory counts
  // Implementation depends on your inventory tracking logic
  console.log('Updating local inventory for sale items:', saleItems);
};

// Clean up synced data
const cleanupSyncedData = async () => {
  // Remove old synced items after a certain period
  const syncedSales = await offlineStorage.getPendingSales();
  const oldSyncedSales = syncedSales.filter(sale =>
    sale.synced && (Date.now() - sale.syncedAt) > (7 * 24 * 60 * 60 * 1000) // 7 days
  );

  for (const sale of oldSyncedSales) {
    await offlineStorage.removePendingSale(sale.id);
  }

  console.log(`Cleaned up ${oldSyncedSales.length} old synced sales`);
};

// Manual sync trigger
export const triggerManualSync = async () => {
  if (!navigator.onLine) {
    throw new Error('Cannot sync while offline');
  }

  return await performFullSync();
};

// Get sync status
export const getSyncStatus = async () => {
  const pendingItems = await offlineStorage.getPendingItemsCount();
  const conflicts = await offlineStorage.getSyncConflicts();
  const lastSync = offlineStorage.getLastSyncTime();

  return {
    pendingItems,
    hasConflicts: conflicts.length > 0,
    lastSyncTime: lastSync,
    isOnline: navigator.onLine
  };
};