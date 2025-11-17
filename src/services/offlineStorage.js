import { openDB } from 'idb';

const DB_NAME = 'pos-offline-db';
const DB_VERSION = 1;

// Storage keys for additional data
const STORAGE_KEYS = {
  USER_ROLES: 'pos_user_roles_offline',
  LAST_SYNC_TIME: 'pos_last_sync_time',
  OFFLINE_SESSION_START: 'pos_offline_session_start'
};

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }

      // Customers store
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }

      // Pending sales (for sync when online)
      if (!db.objectStoreNames.contains('pendingSales')) {
        db.createObjectStore('pendingSales', { keyPath: 'id', autoIncrement: true });
      }

      // Cart data
      if (!db.objectStoreNames.contains('cart')) {
        db.createObjectStore('cart', { keyPath: 'id' });
      }

      // Pending server actions (logout, etc.)
      if (!db.objectStoreNames.contains('pendingServerActions')) {
        db.createObjectStore('pendingServerActions', { keyPath: 'id' });
      }

      // Sync conflicts
      if (!db.objectStoreNames.contains('syncConflicts')) {
        db.createObjectStore('syncConflicts', { keyPath: 'id', autoIncrement: true });
      }

      // Inventory data
      if (!db.objectStoreNames.contains('inventory')) {
        db.createObjectStore('inventory', { keyPath: 'id' });
      }

      // Settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
};

export const offlineStorage = {
  // Products
  async saveProducts(products) {
    const db = await initDB();
    const tx = db.transaction('products', 'readwrite');
    await Promise.all(products.map(product => tx.store.put(product)));
    await tx.done;
  },

  async getProducts() {
    const db = await initDB();
    return await db.getAll('products');
  },

  async getProduct(id) {
    const db = await initDB();
    return await db.get('products', id);
  },

  // Customers
  async saveCustomers(customers) {
    const db = await initDB();
    const tx = db.transaction('customers', 'readwrite');
    await Promise.all(customers.map(customer => tx.store.put(customer)));
    await tx.done;
  },

  async getCustomers() {
    const db = await initDB();
    return await db.getAll('customers');
  },

  async getCustomer(id) {
    const db = await initDB();
    return await db.get('customers', id);
  },

  // Pending sales for sync
  async savePendingSale(sale) {
    const db = await initDB();
    const tx = db.transaction('pendingSales', 'readwrite');
    const id = await tx.store.add({
      ...sale,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    });
    await tx.done;
    return id;
  },

  async getPendingSales() {
    const db = await initDB();
    return await db.getAll('pendingSales');
  },

  async updatePendingSale(id, updates) {
    const db = await initDB();
    const tx = db.transaction('pendingSales', 'readwrite');
    const sale = await tx.store.get(id);
    if (sale) {
      await tx.store.put({ ...sale, ...updates });
    }
    await tx.done;
  },

  async markSaleSynced(id) {
    await this.updatePendingSale(id, { synced: true, syncedAt: Date.now() });
  },

  async markSaleSyncFailed(id, error) {
    const db = await initDB();
    const tx = db.transaction('pendingSales', 'readwrite');
    const sale = await tx.store.get(id);
    if (sale) {
      await tx.store.put({
        ...sale,
        lastError: error,
        retryCount: (sale.retryCount || 0) + 1,
        lastRetryAt: Date.now()
      });
    }
    await tx.done;
  },

  async removePendingSale(id) {
    const db = await initDB();
    await db.delete('pendingSales', id);
  },

  // Cart operations
  async saveCart(cartData) {
    const db = await initDB();
    const tx = db.transaction('cart', 'readwrite');
    await tx.store.put({ id: 'current', ...cartData, lastModified: Date.now() });
    await tx.done;
  },

  async getCart() {
    const db = await initDB();
    return await db.get('cart', 'current');
  },

  async clearCart() {
    const db = await initDB();
    await db.delete('cart', 'current');
  },

  // Pending server actions
  async queueServerAction(action) {
    const db = await initDB();
    const tx = db.transaction('pendingServerActions', 'readwrite');
    const id = `${action.type}_${Date.now()}_${Math.random()}`;
    await tx.store.add({ ...action, id, timestamp: Date.now(), synced: false });
    await tx.done;
    return id;
  },

  async getPendingServerActions() {
    const db = await initDB();
    return await db.getAll('pendingServerActions');
  },

  async removePendingServerAction(id) {
    const db = await initDB();
    await db.delete('pendingServerActions', id);
  },

  // Sync conflicts
  async saveSyncConflict(conflict) {
    const db = await initDB();
    const tx = db.transaction('syncConflicts', 'readwrite');
    await tx.store.add({ ...conflict, timestamp: Date.now(), resolved: false });
    await tx.done;
  },

  async getSyncConflicts() {
    const db = await initDB();
    return await db.getAll('syncConflicts');
  },

  async resolveSyncConflict(id) {
    const db = await initDB();
    const tx = db.transaction('syncConflicts', 'readwrite');
    const conflict = await tx.store.get(id);
    if (conflict) {
      await tx.store.put({ ...conflict, resolved: true, resolvedAt: Date.now() });
    }
    await tx.done;
  },

  // Inventory
  async saveInventory(inventoryData) {
    const db = await initDB();
    const tx = db.transaction('inventory', 'readwrite');
    await Promise.all(inventoryData.map(item => tx.store.put(item)));
    await tx.done;
  },

  async getInventory() {
    const db = await initDB();
    return await db.getAll('inventory');
  },

  // Settings
  async saveSetting(key, value) {
    const db = await initDB();
    const tx = db.transaction('settings', 'readwrite');
    await tx.store.put({ key, value, timestamp: Date.now() });
    await tx.done;
  },

  async getSetting(key) {
    const db = await initDB();
    const setting = await db.get('settings', key);
    return setting ? setting.value : null;
  },

  // Utility functions
  async getPendingItemsCount() {
    const [pendingSales, pendingActions] = await Promise.all([
      this.getPendingSales(),
      this.getPendingServerActions()
    ]);
    return pendingSales.length + pendingActions.length;
  },

  async clearAllData() {
    const db = await initDB();
    const tx = db.transaction(['products', 'customers', 'pendingSales', 'cart', 'pendingServerActions', 'syncConflicts', 'inventory', 'settings'], 'readwrite');

    await Promise.all([
      tx.objectStore('products').clear(),
      tx.objectStore('customers').clear(),
      tx.objectStore('pendingSales').clear(),
      tx.objectStore('cart').clear(),
      tx.objectStore('pendingServerActions').clear(),
      tx.objectStore('syncConflicts').clear(),
      tx.objectStore('inventory').clear(),
      tx.objectStore('settings').clear()
    ]);

    await tx.done;
  },

  // User roles for offline auth
  saveUserRoles(roles) {
    localStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify(roles));
  },

  getUserRoles() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_ROLES) || '[]');
    } catch {
      return [];
    }
  },

  clearUserRoles() {
    localStorage.removeItem(STORAGE_KEYS.USER_ROLES);
  },

  // Sync tracking
  setLastSyncTime(time = Date.now()) {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, time.toString());
  },

  getLastSyncTime() {
    const time = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
    return time ? parseInt(time, 10) : null;
  },

  // Offline session tracking
  startOfflineSession() {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_SESSION_START, Date.now().toString());
  },

  getOfflineSessionStart() {
    const start = localStorage.getItem(STORAGE_KEYS.OFFLINE_SESSION_START);
    return start ? parseInt(start, 10) : null;
  },

  endOfflineSession() {
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_SESSION_START);
  }
};