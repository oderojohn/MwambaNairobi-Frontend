import React, { useState, useEffect } from 'react';
import './AuditLog.css';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    dateRange: 'today',
    page: 1,
    limit: 50
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    
    // Mock data - replace with API call
    const mockLogs = [
      {
        id: 1,
        user: 'Super Admin',
        action: 'CREATE_TENANT',
        details: 'Created tenant "Test Store" with domain test-store',
        ip_address: '192.168.1.1',
        user_agent: 'Chrome/120.0.0.0',
        timestamp: new Date().toISOString(),
        severity: 'info'
      },
      {
        id: 2,
        user: 'Admin User',
        action: 'UPDATE_SUBSCRIPTION',
        details: 'Upgraded subscription for "Retail Chain" to Premium plan',
        ip_address: '192.168.1.2',
        user_agent: 'Firefox/119.0',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        severity: 'info'
      },
      {
        id: 3,
        user: 'System',
        action: 'PAYMENT_RECEIVED',
        details: 'Payment of KSh 15,000 received via M-Pesa',
        ip_address: '127.0.0.1',
        user_agent: 'System',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        severity: 'success'
      },
      {
        id: 4,
        user: 'Super Admin',
        action: 'DELETE_TENANT',
        details: 'Deleted tenant "Old Business" and all associated data',
        ip_address: '192.168.1.1',
        user_agent: 'Chrome/120.0.0.0',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        severity: 'warning'
      },
      {
        id: 5,
        user: 'API Key',
        action: 'KEY_GENERATED',
        details: 'Generated 5 activation keys for Premium plan',
        ip_address: '10.0.0.1',
        user_agent: 'API/1.0',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        severity: 'info'
      }
    ];

    // Apply filters
    let filtered = mockLogs;
    
    if (filters.action) {
      filtered = filtered.filter(log => log.action.includes(filters.action));
    }
    
    if (filters.user) {
      filtered = filtered.filter(log => log.user.toLowerCase().includes(filters.user.toLowerCase()));
    }
    
    if (filters.dateRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(log => new Date(log.timestamp) >= today);
    } else if (filters.dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(log => new Date(log.timestamp) >= weekAgo);
    }

    setLogs(filtered);
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Details', 'IP Address', 'User Agent'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.timestamp).toISOString(),
        `"${log.user}"`,
        `"${log.action}"`,
        `"${log.details}"`,
        `"${log.ip_address}"`,
        `"${log.user_agent}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getSeverityBadge = (severity) => {
    const severityClasses = {
      info: 'severity-info',
      success: 'severity-success',
      warning: 'severity-warning',
      error: 'severity-error'
    };

    return (
      <span className={`severity-badge ${severityClasses[severity] || 'severity-info'}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="audit-log loading">
        <div className="loading-spinner">Loading audit log...</div>
      </div>
    );
  }

  return (
    <div className="audit-log">
      <div className="audit-header">
        <h2>System Audit Log</h2>
        <div className="audit-controls">
          <button className="btn-primary" onClick={exportToCSV}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="audit-filters">
        <div className="filter-group">
          <label>Action Type</label>
          <select 
            value={filters.action} 
            onChange={(e) => setFilters({...filters, action: e.target.value})}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="PAYMENT">Payment</option>
          </select>
        </div>

        <div className="filter-group">
          <label>User</label>
          <input
            type="text"
            placeholder="Filter by user..."
            value={filters.user}
            onChange={(e) => setFilters({...filters, user: e.target.value})}
          />
        </div>

        <div className="filter-group">
          <label>Date Range</label>
          <select 
            value={filters.dateRange} 
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
          >
            <option value="today">Today</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="audit-stats">
        <div className="stat-item">
          <span className="stat-label">Total Logs</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Last 24 Hours</span>
          <span className="stat-value">
            {logs.filter(log => {
              const dayAgo = new Date();
              dayAgo.setDate(dayAgo.getDate() - 1);
              return new Date(log.timestamp) >= dayAgo;
            }).length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Most Active User</span>
          <span className="stat-value">Super Admin</span>
        </div>
      </div>

      <div className="audit-table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
              <th>IP Address</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td className="timestamp-cell">
                  <div className="timestamp-date">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                  <div className="timestamp-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </td>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">
                      {log.user.charAt(0)}
                    </div>
                    <span className="user-name">{log.user}</span>
                  </div>
                </td>
                <td>
                  <span className="action-cell">
                    {formatAction(log.action)}
                  </span>
                </td>
                <td>
                  <div className="details-cell">
                    {log.details}
                  </div>
                </td>
                <td>
                  <code className="ip-cell">{log.ip_address}</code>
                </td>
                <td>
                  {getSeverityBadge(log.severity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && (
        <div className="empty-audit">
          <div className="empty-icon">📝</div>
          <p>No audit logs found for the selected filters</p>
          <button 
            className="btn-secondary" 
            onClick={() => setFilters({...filters, action: '', user: '', dateRange: 'all'})}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLog;