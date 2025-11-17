import React, { useState, useEffect } from 'react';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingItems: 0,
    hasConflicts: false,
    offlineSessionStart: null
  });

  useEffect(() => {
    // Import sync functions
    const loadSyncStatus = async () => {
      try {
        const { getSyncStatus } = await import('../services/backgroundSync.js');
        const syncStatus = await getSyncStatus();
        const { offlineStorage } = await import('../services/offlineStorage.js');

        setConnectionStatus(prev => ({
          ...prev,
          ...syncStatus,
          offlineSessionStart: offlineStorage.getOfflineSessionStart()
        }));
      } catch (error) {
        console.error('Failed to load sync status:', error);
      }
    };

    // Initial load
    loadSyncStatus();

    // Event listeners
    const handleOnline = () => {
      setConnectionStatus(prev => ({ ...prev, isOnline: true }));
      loadSyncStatus(); // Refresh sync status
    };

    const handleOffline = () => {
      setConnectionStatus(prev => ({ ...prev, isOnline: false }));
    };

    // Global sync status updates
    window.showSyncIndicator = (isSyncing) => {
      setConnectionStatus(prev => ({ ...prev, isSyncing }));
    };

    window.showSyncSuccess = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date()
      }));
      loadSyncStatus(); // Refresh counts
    };

    window.showSyncError = (error) => {
      setConnectionStatus(prev => ({ ...prev, isSyncing: false }));
      console.error('Sync error:', error);
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic status updates
    const statusInterval = setInterval(loadSyncStatus, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statusInterval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!connectionStatus.isOnline) {
      alert('Cannot sync while offline');
      return;
    }

    try {
      const { triggerManualSync } = await import('../services/backgroundSync.js');
      await triggerManualSync();
    } catch (error) {
      alert('Sync failed: ' + error.message);
    }
  };

  const getStatusColor = () => {
    if (!connectionStatus.isOnline) return 'offline';
    if (connectionStatus.isSyncing) return 'syncing';
    if (connectionStatus.hasConflicts) return 'conflicts';
    if (connectionStatus.pendingItems > 0) return 'pending';
    return 'online';
  };

  const getStatusText = () => {
    if (!connectionStatus.isOnline) return 'Offline';
    if (connectionStatus.isSyncing) return 'Syncing...';
    if (connectionStatus.hasConflicts) return 'Sync Conflicts';
    if (connectionStatus.pendingItems > 0) return `${connectionStatus.pendingItems} pending`;
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!connectionStatus.isOnline) return '📴';
    if (connectionStatus.isSyncing) return '🔄';
    if (connectionStatus.hasConflicts) return '⚠️';
    if (connectionStatus.pendingItems > 0) return '⏳';
    return '🟢';
  };

  return (
    <div className={`connection-status ${getStatusColor()}`}>
      <div className="status-indicator">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {connectionStatus.pendingItems > 0 && connectionStatus.isOnline && (
        <button
          className="sync-button"
          onClick={handleManualSync}
          disabled={connectionStatus.isSyncing}
        >
          {connectionStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}

      {connectionStatus.offlineSessionStart && !connectionStatus.isOnline && (
        <div className="offline-session-info">
          Offline since: {new Date(connectionStatus.offlineSessionStart).toLocaleString()}
        </div>
      )}

      {connectionStatus.lastSyncTime && (
        <div className="last-sync-info">
          Last sync: {connectionStatus.lastSyncTime.toLocaleString()}
        </div>
      )}

      {connectionStatus.hasConflicts && (
        <div className="conflict-warning">
          ⚠️ Sync conflicts need attention
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;