import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertTriangle,
  FiRefreshCw,
  FiSearch,
  FiShield,
} from 'react-icons/fi';
import { usersAPI } from '../../../services/ApiService/api';

const ACTION_OPTIONS = [
  'login',
  'login_failed',
  'logout',
  'shift_started',
  'shift_closed',
  'user_created',
  'user_updated',
  'user_deleted',
  'group_created',
  'group_updated',
  'group_deleted',
  'permissions_updated',
  'branch_created',
  'branch_updated',
  'branch_deleted',
  'product_created',
  'product_updated',
  'product_deleted',
  'product_price_changed',
  'stock_recalculated',
  'batch_received',
  'sale_created',
  'held_order_created',
  'held_order_updated',
  'held_order_voided',
  'sale_voided',
  'transaction_voided',
  'return_created',
  'payment_created',
];

const METHOD_OPTIONS = ['', 'GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
const LIMIT_OPTIONS = [50, 100, 200, 300, 500];

const buildInitialFilters = (currentRole, currentBranchId) => ({
  search: '',
  action: '',
  user_profile: '',
  branch_id: currentRole === 'manager' ? currentBranchId || '' : '',
  method: '',
  status_code: '',
  date_from: '',
  date_to: '',
  limit: 200,
});

const formatDateTime = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const toLabel = (value) => value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const statusToneClass = (statusCode) => {
  if (!statusCode) return 'user-settings-chip-neutral';
  if (Number(statusCode) >= 500) return 'user-settings-chip-danger';
  if (Number(statusCode) >= 400) return 'user-settings-chip-warning';
  return 'user-settings-chip-success';
};

const AuditTrailPanel = ({ branches, users, currentRole, currentBranchId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filters, setFilters] = useState(() => buildInitialFilters(currentRole, currentBranchId));
  const [appliedFilters, setAppliedFilters] = useState(() => buildInitialFilters(currentRole, currentBranchId));

  useEffect(() => {
    const nextFilters = buildInitialFilters(currentRole, currentBranchId);
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }, [currentRole, currentBranchId]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = {
        ...appliedFilters,
        branch_id: currentRole === 'manager' ? currentBranchId || '' : appliedFilters.branch_id,
      };

      const response = await usersAPI.getAuditLogs(params);
      const items = Array.isArray(response) ? response : response?.results || [];
      setLogs(items);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setErrorMessage(error.message || 'Failed to load audit trail.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentRole, currentBranchId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const failedLogins = useMemo(
    () => logs.filter((log) => log.action === 'login_failed').length,
    [logs],
  );

  const securityEvents = useMemo(
    () => logs.filter((log) => ['permissions_updated', 'user_deleted', 'branch_deleted', 'transaction_voided'].includes(log.action)).length,
    [logs],
  );

  const errorEvents = useMemo(
    () => logs.filter((log) => Number(log.status_code) >= 400).length,
    [logs],
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters({
      ...filters,
      branch_id: currentRole === 'manager' ? currentBranchId || '' : filters.branch_id,
    });
  };

  const handleReset = () => {
    const nextFilters = buildInitialFilters(currentRole, currentBranchId);
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  };

  return (
    <div className="user-settings-card">
      <div className="user-settings-card-header">
        <div>
          <h3><FiActivity /> Audit Trail</h3>
          <p>Give admins clear visibility into logins, cash operations, permissions, sales interventions, and branch activity.</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={loadLogs}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="user-settings-metric-grid">
        <div className="user-settings-metric-card">
          <span className="user-settings-metric-label">Loaded events</span>
          <strong>{logs.length}</strong>
        </div>
        <div className="user-settings-metric-card">
          <span className="user-settings-metric-label">Failed logins</span>
          <strong>{failedLogins}</strong>
        </div>
        <div className="user-settings-metric-card">
          <span className="user-settings-metric-label">Security-sensitive actions</span>
          <strong>{securityEvents}</strong>
        </div>
        <div className="user-settings-metric-card">
          <span className="user-settings-metric-label">4xx / 5xx responses</span>
          <strong>{errorEvents}</strong>
        </div>
      </div>

      {errorMessage && <div className="user-settings-alert user-settings-alert-warning">{errorMessage}</div>}

      <form className="user-settings-filters-grid" onSubmit={handleSubmit}>
        <div className="user-settings-form-group">
          <label>Search</label>
          <div className="user-settings-search-input">
            <FiSearch />
            <input
              type="text"
              value={filters.search}
              onChange={(event) => handleFilterChange('search', event.target.value)}
              placeholder="User, path, action"
            />
          </div>
        </div>
        <div className="user-settings-form-group">
          <label>Actor</label>
          <select
            value={filters.user_profile}
            onChange={(event) => handleFilterChange('user_profile', event.target.value)}
          >
            <option value="">All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.user?.username || user.username}
              </option>
            ))}
          </select>
        </div>
        <div className="user-settings-form-group">
          <label>Action</label>
          <select
            value={filters.action}
            onChange={(event) => handleFilterChange('action', event.target.value)}
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((action) => (
              <option key={action} value={action}>
                {toLabel(action)}
              </option>
            ))}
          </select>
        </div>
        <div className="user-settings-form-group">
          <label>Method</label>
          <select
            value={filters.method}
            onChange={(event) => handleFilterChange('method', event.target.value)}
          >
            {METHOD_OPTIONS.map((method) => (
              <option key={method || 'all'} value={method}>
                {method || 'All methods'}
              </option>
            ))}
          </select>
        </div>
        <div className="user-settings-form-group">
          <label>Status</label>
          <input
            type="number"
            min="100"
            max="599"
            value={filters.status_code}
            onChange={(event) => handleFilterChange('status_code', event.target.value)}
            placeholder="200"
          />
        </div>
        <div className="user-settings-form-group">
          <label>From</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(event) => handleFilterChange('date_from', event.target.value)}
          />
        </div>
        <div className="user-settings-form-group">
          <label>To</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(event) => handleFilterChange('date_to', event.target.value)}
          />
        </div>
        <div className="user-settings-form-group">
          <label>Limit</label>
          <select
            value={filters.limit}
            onChange={(event) => handleFilterChange('limit', Number(event.target.value))}
          >
            {LIMIT_OPTIONS.map((limit) => (
              <option key={limit} value={limit}>
                Latest {limit}
              </option>
            ))}
          </select>
        </div>
        <div className="user-settings-form-group">
          <label>Branch</label>
          <select
            value={currentRole === 'manager' ? currentBranchId || '' : filters.branch_id}
            onChange={(event) => handleFilterChange('branch_id', event.target.value)}
            disabled={currentRole === 'manager'}
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div className="user-settings-filter-actions">
          <button className="btn btn-primary" type="submit">
            <FiShield /> Apply Filters
          </button>
          <button className="btn btn-secondary" type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>

      <div className="user-settings-table-wrap">
        <table className="user-settings-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Details</th>
              <th>Request</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7}>Loading audit trail...</td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={7}>No audit records match the current filters.</td>
              </tr>
            )}
            {!loading && logs.map((log) => (
              <tr key={log.id}>
                <td>
                  <div className="user-settings-user-cell">
                    <strong>{formatDateTime(log.created_at)}</strong>
                    <span className="user-settings-muted">{log.ip_address || 'No IP captured'}</span>
                  </div>
                </td>
                <td>
                  <div className="user-settings-user-cell">
                    <strong>{log.actor_name || log.username || 'System'}</strong>
                    <span className="user-settings-muted">{log.role || 'system'}</span>
                  </div>
                </td>
                <td>
                  <span className="user-settings-role-badge user-settings-role-badge-soft">
                    {log.action_label || toLabel(log.action)}
                  </span>
                </td>
                <td>{log.branch_name || 'Unscoped'}</td>
                <td>
                  <span className={`user-settings-chip ${statusToneClass(log.status_code)}`}>
                    {log.status_code || '—'}
                  </span>
                </td>
                <td>
                  <div className="user-settings-user-cell">
                    <strong>{log.summary || 'Activity recorded'}</strong>
                    {log.metadata?.void_reason && (
                      <span className="user-settings-muted"><FiAlertTriangle /> {log.metadata.void_reason}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="user-settings-user-cell">
                    <strong>{log.method || '—'} {log.path || ''}</strong>
                    <span className="user-settings-muted">{log.user_agent || 'No user agent captured'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTrailPanel;
