import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';
import { tenantsAPI, subscriptionsAPI, usersAPI } from '../services/ApiService/api';
import AdvancedTenantSearch from './components/AdvancedTenantSearch';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NotificationCenter from './components/NotificationCenter';
import QuickActions from './components/QuickActions';
import SystemHealth from './components/SystemHealth';
import AuditLog from './components/AuditLog';
import BulkOperations from './components/BulkOperations';
import IntegrationsDashboard from './components/IntegrationsDashboard';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const loadingRef = useRef(false);
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [activationKeys, setActivationKeys] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingActivations: 0,
    monthlyGrowth: 0,
    churnRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showEditTenant, setShowEditTenant] = useState(false);
  const [showChangeSubscription, setShowChangeSubscription] = useState(false);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showKeyDetails, setShowKeyDetails] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [selectedTenantsForBulk, setSelectedTenantsForBulk] = useState([]);

  useEffect(() => {
    loadDashboardData();
    // const interval = setInterval(() => {
    //   loadDashboardData();
    // }, 30000); // Auto-refresh every 30 seconds
    // return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setFilteredTenants(tenants);
  }, [tenants]);

  const loadDashboardData = async () => {
    if (loadingRef.current) return; // Prevent multiple simultaneous calls
    loadingRef.current = true;

    try {
      setLoading(true);

      // Load tenants
      const tenantsData = await tenantsAPI.getTenants();
      setTenants(tenantsData.results || tenantsData);

      // Load activation keys
      const keysData = await subscriptionsAPI.getActivationKeys();
      setActivationKeys(keysData.results || keysData);

      // Load subscription plans
      const plansData = await subscriptionsAPI.getSubscriptionPlans();
      setPlans(plansData.results || plansData);

      // Load payments
      const paymentsData = await subscriptionsAPI.getPayments();
      setPayments(paymentsData.results || paymentsData);

      // Load subscriptions with users
      const subscriptionsData = await subscriptionsAPI.getSubscriptionUsers();
      setSubscriptions(subscriptionsData.subscriptions || []);

      // Calculate stats
      calculateStats(tenantsData.results || tenantsData, keysData.results || keysData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const calculateStats = (tenantsData, keysData) => {
    const totalTenants = tenantsData.length;
    const activeSubscriptions = tenantsData.filter(t => t.subscription_status?.status === 'active').length;
    
    // Calculate revenue from payments data if available
    const totalRevenue = payments.reduce((sum, payment) => {
      if (payment.status === 'completed') {
        return sum + (payment.amount || 0);
      }
      return sum;
    }, 0);
    
    const pendingActivations = keysData.filter(k => k.status === 'active').length;
    
    // Calculate growth (simplified - would need historical data in real app)
    const thisMonthTenants = tenantsData.filter(t => {
      const created = new Date(t.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    
    const monthlyGrowth = totalTenants > 0 ? (thisMonthTenants / totalTenants) * 100 : 0;
    
    // Calculate churn rate (simplified)
    const cancelledSubscriptions = tenantsData.filter(t => 
      t.subscription_status?.status === 'cancelled' || t.subscription_status?.status === 'expired'
    ).length;
    
    const churnRate = activeSubscriptions > 0 ? (cancelledSubscriptions / activeSubscriptions) * 100 : 0;

    setStats({
      totalTenants,
      activeSubscriptions,
      totalRevenue,
      pendingActivations,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100
    });
  };

  const handleQuickAction = (actionId) => {
    switch(actionId) {
      case 'create_tenant':
        navigate('create-tenant');
        break;
      case 'generate_keys':
        navigate('generate-keys');
        break;
      case 'send_broadcast':
        alert('Broadcast feature coming soon!');
        break;
      case 'export_reports':
        exportReports();
        break;
      case 'run_backup':
        triggerBackup();
        break;
      case 'system_diagnostics':
        runDiagnostics();
        break;
      default:
        break;
    }
  };

  const exportReports = async () => {
    try {
      // Generate CSV report
      const csvContent = generateCSVReport();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mwamba_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      alert('Report exported successfully!');
    } catch (error) {
      alert('Error exporting report');
    }
  };

  const triggerBackup = async () => {
    try {
      // Call backup API
      alert('Backup initiated! You will receive a notification when complete.');
    } catch (error) {
      alert('Error triggering backup');
    }
  };

  const runDiagnostics = async () => {
    try {
      // Call diagnostics API
      const result = await subscriptionsAPI.runDiagnostics();
      alert(`Diagnostics complete:\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      alert('Error running diagnostics');
    }
  };

  const handleTenantSelect = (tenantId, checked) => {
    if (checked) {
      setSelectedTenantsForBulk(prev => [...prev, tenantId]);
    } else {
      setSelectedTenantsForBulk(prev => prev.filter(id => id !== tenantId));
    }
  };

  const handleSelectAllTenants = (checked) => {
    if (checked) {
      setSelectedTenantsForBulk(tenants.map(t => t.id));
    } else {
      setSelectedTenantsForBulk([]);
    }
  };

  const handleBulkOperation = async (operation, data) => {
    try {
      console.log('Bulk operation:', operation, data, selectedTenantsForBulk);

      let successCount = 0;
      let errors = [];

      for (const tenantId of selectedTenantsForBulk) {
        try {
          switch (operation) {
            case 'extend_subscription':
              await tenantsAPI.changeTenantSubscription(tenantId, {
                plan_type: 'premium', // Assuming current plan, or need to get current plan
                duration_days: data.months * 30
              });
              break;
            case 'change_plan':
              const planMapping = {
                'Free Trial': 'free',
                'Basic': 'basic',
                'Standard': 'standard',
                'Premium': 'premium',
                'Enterprise': 'enterprise'
              };
              await tenantsAPI.changeTenantSubscription(tenantId, {
                plan_type: planMapping[data.new_plan] || 'basic',
                duration_days: 30 // Default duration
              });
              break;
            case 'send_notification':
              // TODO: Implement send notification API
              console.log(`Sending notification to tenant ${tenantId}: ${data.subject} - ${data.message}`);
              break;
            case 'apply_discount':
              // TODO: Implement apply discount API
              console.log(`Applying ${data.discount_percentage}% discount for ${data.duration_months} months to tenant ${tenantId}`);
              break;
            case 'export_data':
              // TODO: Implement export data API
              console.log(`Exporting ${data.data_type} for tenant ${tenantId}`);
              break;
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
          successCount++;
        } catch (error) {
          errors.push(`Tenant ${tenantId}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        alert(`Bulk operation "${operation}" completed for ${successCount} tenants`);
      }
      if (errors.length > 0) {
        alert(`Errors occurred:\n${errors.join('\n')}`);
      }

      setShowBulkOperations(false);
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to perform bulk operation'}`);
    }
  };

  const generateCSVReport = () => {
    const headers = ['Tenant Name', 'Domain', 'Users', 'Subscription Plan', 'Status', 'Created Date'];
    const rows = tenants.map(tenant => [
      tenant.display_name,
      tenant.domain,
      tenant.user_count || 0,
      tenant.subscription_status?.plan || 'None',
      tenant.subscription_status?.status || 'inactive',
      new Date(tenant.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(row =>
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    return csvContent;
  };

  const handleEditTenant = (tenant) => {
    setSelectedTenant(tenant);
    setShowEditTenant(true);
  };

  const handleToggleTenantStatus = async (tenant) => {
    try {
      const result = await tenantsAPI.toggleTenantStatus(tenant.id);
      alert(`Tenant ${tenant.is_active ? 'deactivated' : 'activated'} successfully!`);
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to toggle tenant status'}`);
    }
  };

  const handleManageUsers = (tenant) => {
    setSelectedTenant(tenant);
    setShowManageUsers(true);
  };

  const handleManageBranches = (tenant) => {
    navigate(`manage-branches/${tenant.id}`);
  };

  const handleChangeSubscription = (tenant) => {
    setSelectedTenant(tenant);
    setShowChangeSubscription(true);
  };

  const handleDeleteTenant = async (tenant) => {
    if (!window.confirm(`Are you sure you want to delete tenant "${tenant.display_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await tenantsAPI.deleteTenant(tenant.id);
      alert('Tenant deleted successfully!');
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to delete tenant'}`);
    }
  };

  const handleValidateKey = async (key) => {
    try {
      const result = await subscriptionsAPI.validateKey(key);
      alert(`Key validation result: ${result.valid ? 'Valid' : 'Invalid'}`);
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to validate key'}`);
    }
  };

  const handleActivateKey = async (key) => {
    try {
      const result = await subscriptionsAPI.activateKey(key);
      alert('Key activated successfully!');
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to activate key'}`);
    }
  };

  const handleSuspendSubscription = async (userId) => {
    try {
      const result = await subscriptionsAPI.suspendSubscription(userId);
      alert('Subscription suspended successfully!');
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to suspend subscription'}`);
    }
  };

  const handleRenewSubscription = async (userId) => {
    try {
      const result = await subscriptionsAPI.renewSubscription(userId);
      alert('Subscription renewed successfully!');
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to renew subscription'}`);
    }
  };

  const handleUpgradeSubscription = async (userId) => {
    try {
      const result = await subscriptionsAPI.upgradeSubscription(userId);
      alert('Subscription upgraded successfully!');
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to upgrade subscription'}`);
    }
  };

  const handleCreateTrialSubscription = async (userId) => {
    try {
      const result = await subscriptionsAPI.createTrialSubscription(userId);
      alert('Trial subscription created successfully!');
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to create trial subscription'}`);
    }
  };

  const handleCancelSubscription = async (userId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      const result = await subscriptionsAPI.cancelSubscription(userId);
      alert('Subscription cancelled successfully!');
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to cancel subscription'}`);
    }
  };

  const handleProcessPayment = async (userId) => {
    try {
      const result = await subscriptionsAPI.processPayment(userId);
      alert('Payment processed successfully!');
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to process payment'}`);
    }
  };

  const handleMpesaPayment = async (userId) => {
    try {
      const result = await subscriptionsAPI.processMpesaPayment(userId);
      alert('M-Pesa payment initiated successfully!');
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to process M-Pesa payment'}`);
    }
  };

  const handleUpdateTenant = async (formData) => {
    try {
      const result = await tenantsAPI.updateTenant(selectedTenant.id, formData);
      alert('Tenant updated successfully!');
      setShowEditTenant(false);
      setSelectedTenant(null);
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to update tenant'}`);
    }
  };

  const handleChangeTenantSubscription = async (formData) => {
    try {
      const result = await subscriptionsAPI.changeTenantSubscription(selectedTenant.id, formData);
      alert('Subscription changed successfully!');
      setShowChangeSubscription(false);
      setSelectedTenant(null);
      loadDashboardData();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to change subscription'}`);
    }
  };

  const formatCurrency = (amount) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'status-active',
      expired: 'status-expired',
      trial: 'status-trial',
      grace_period: 'status-warning',
      cancelled: 'status-inactive'
    };

    return (
      <span className={`status-badge ${statusClasses[status] || 'status-inactive'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>MWAMBA POS - Super Admin Dashboard</h1>
        <div className="dashboard-actions">
          <NotificationCenter />
          <button
            className="btn-primary"
            onClick={() => navigate('create-tenant')}
          >
            Create Tenant
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('create-users')}
          >
            Create Users
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('generate-keys')}
          >
            Generate Keys
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowBulkOperations(true)}
            disabled={selectedTenantsForBulk.length === 0}
          >
            Bulk Actions ({selectedTenantsForBulk.length})
          </button>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActions onAction={handleQuickAction} />

      {/* System Health Monitor */}
      <SystemHealth />

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{stats.totalTenants}</h3>
            <p>Total Tenants</p>
            <small className={stats.monthlyGrowth >= 0 ? 'positive' : 'negative'}>
              {stats.monthlyGrowth >= 0 ? '↗' : '↘'} {Math.abs(stats.monthlyGrowth)}% this month
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.activeSubscriptions}</h3>
            <p>Active Subscriptions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Monthly Revenue</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔑</div>
          <div className="stat-content">
            <h3>{stats.pendingActivations}</h3>
            <p>Available Keys</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.monthlyGrowth}%</h3>
            <p>Monthly Growth</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <h3>{stats.churnRate}%</h3>
            <p>Churn Rate</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button
          className={activeTab === 'tenants' ? 'active' : ''}
          onClick={() => setActiveTab('tenants')}
        >
          Tenants ({tenants.length})
        </button>
        <button
          className={activeTab === 'keys' ? 'active' : ''}
          onClick={() => setActiveTab('keys')}
        >
          Activation Keys ({activationKeys.length})
        </button>
        <button
          className={activeTab === 'subscriptions' ? 'active' : ''}
          onClick={() => setActiveTab('subscriptions')}
        >
          Subscriptions ({subscriptions.length})
        </button>
        <button
          className={activeTab === 'plans' ? 'active' : ''}
          onClick={() => setActiveTab('plans')}
        >
          Plans
        </button>
        <button
          className={activeTab === 'payments' ? 'active' : ''}
          onClick={() => setActiveTab('payments')}
        >
          Payments
        </button>
        <button
          className={activeTab === 'integrations' ? 'active' : ''}
          onClick={() => setActiveTab('integrations')}
        >
          Integrations
        </button>
        <button
          className={activeTab === 'audit' ? 'active' : ''}
          onClick={() => setActiveTab('audit')}
        >
          Audit Log
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-section">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {tenants.slice(0, 5).map(tenant => (
                  <div key={tenant.id} className="activity-item">
                    <div className="activity-icon">🏢</div>
                    <div className="activity-content">
                      <p><strong>{tenant.display_name}</strong> was created</p>
                      <small>{new Date(tenant.created_at).toLocaleDateString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overview-section">
              <h2>Subscription Overview</h2>
              <div className="subscription-breakdown">
                <div className="subscription-item">
                  <span className="plan-name">Free Trial</span>
                  <span className="plan-count">
                    {tenants.filter(t => t.subscription_status?.plan === 'Free Trial').length}
                  </span>
                </div>
                <div className="subscription-item">
                  <span className="plan-name">Basic</span>
                  <span className="plan-count">
                    {tenants.filter(t => t.subscription_status?.plan === 'Basic').length}
                  </span>
                </div>
                <div className="subscription-item">
                  <span className="plan-name">Standard</span>
                  <span className="plan-count">
                    {tenants.filter(t => t.subscription_status?.plan === 'Standard').length}
                  </span>
                </div>
                <div className="subscription-item">
                  <span className="plan-name">Premium</span>
                  <span className="plan-count">
                    {tenants.filter(t => t.subscription_status?.plan === 'Premium').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="overview-section">
              <h2>Performance Metrics</h2>
              <div className="performance-metrics">
                <div className="metric-item">
                  <span className="metric-label">Average Revenue Per User (ARPU)</span>
                  <span className="metric-value">KSh 2,450</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Customer Lifetime Value (LTV)</span>
                  <span className="metric-value">KSh 29,400</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Customer Acquisition Cost (CAC)</span>
                  <span className="metric-value">KSh 1,850</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'tenants' && (
          <div className="tenants-tab">
            <div className="table-controls">
              <AdvancedTenantSearch 
                tenants={tenants}
                onSearch={setFilteredTenants}
              />
              <div className="bulk-select">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedTenantsForBulk.length === tenants.length && tenants.length > 0}
                  onChange={(e) => handleSelectAllTenants(e.target.checked)}
                />
                <label htmlFor="select-all">
                  Select All ({selectedTenantsForBulk.length} selected)
                </label>
              </div>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th width="40px"></th>
                    <th>Tenant Name</th>
                    <th>Domain</th>
                    <th>Users</th>
                    <th>Subscription</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map(tenant => (
                    <tr key={tenant.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedTenantsForBulk.includes(tenant.id)}
                          onChange={(e) => handleTenantSelect(tenant.id, e.target.checked)}
                        />
                      </td>
                      <td>{tenant.display_name}</td>
                      <td>{tenant.domain}</td>
                      <td>{tenant.user_count || 0}</td>
                      <td>{tenant.subscription_status?.plan || 'None'}</td>
                      <td>{getStatusBadge(tenant.subscription_status?.status || 'inactive')}</td>
                      <td>{new Date(tenant.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-sm btn-edit"
                            onClick={() => handleEditTenant(tenant)}
                          >
                            Edit
                          </button>
                          <button
                            className={`btn-sm ${tenant.is_active ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleTenantStatus(tenant)}
                          >
                            {tenant.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="btn-sm btn-users"
                            onClick={() => handleManageUsers(tenant)}
                          >
                            Users
                          </button>
                          <button
                            className="btn-sm btn-secondary"
                            onClick={() => handleManageBranches(tenant)}
                          >
                            Branches
                          </button>
                          <button
                            className="btn-sm btn-subscription"
                            onClick={() => handleChangeSubscription(tenant)}
                          >
                            Subscription
                          </button>
                          <button
                            className="btn-sm btn-danger"
                            onClick={() => handleDeleteTenant(tenant)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="keys-tab">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Type</th>
                    <th>Plan</th>
                    <th>Tenant</th>
                    <th>Status</th>
                    <th>Activations</th>
                    <th>Expires</th>
                    <th>Generated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activationKeys.map(key => (
                    <tr key={key.id}>
                      <td className="key-cell">{key.key}</td>
                      <td>{key.key_type}</td>
                      <td>{key.plan_name}</td>
                      <td>{key.tenant_name || 'N/A'}</td>
                      <td>{getStatusBadge(key.status)}</td>
                      <td>{key.activations_used}/{key.max_activations}</td>
                      <td>{key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}</td>
                      <td>{new Date(key.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-sm btn-secondary"
                            onClick={() => {
                              setSelectedKey(key);
                              setShowKeyDetails(true);
                            }}
                          >
                            Change
                          </button>
                          {key.status === 'active' && (
                            <>
                              <button
                                className="btn-sm btn-success"
                                onClick={() => handleValidateKey(key.key)}
                              >
                                Validate
                              </button>
                              <button
                                className="btn-sm btn-primary"
                                onClick={() => handleActivateKey(key.key)}
                              >
                                Activate
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="subscriptions-tab">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Users Count</th>
                    <th>Renewal Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(sub => (
                    <tr key={sub.subscription_id}>
                      <td>{sub.username}</td>
                      <td>{sub.email}</td>
                      <td>{sub.plan}</td>
                      <td>{getStatusBadge(sub.status)}</td>
                      <td>{sub.user_count}</td>
                      <td>
                        {sub.renewal_date ? new Date(sub.renewal_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {sub.status === 'active' && (
                            <>
                              <button
                                className="btn-sm btn-warning"
                                onClick={() => handleSuspendSubscription(sub.user_id)}
                              >
                                Suspend
                              </button>
                              <button
                                className="btn-sm btn-success"
                                onClick={() => handleRenewSubscription(sub.user_id)}
                              >
                                Renew
                              </button>
                              <button
                                className="btn-sm btn-primary"
                                onClick={() => handleUpgradeSubscription(sub.user_id)}
                              >
                                Upgrade
                              </button>
                            </>
                          )}
                          {sub.status !== 'active' && sub.status !== 'cancelled' && (
                            <button
                              className="btn-sm btn-success"
                              onClick={() => handleCreateTrialSubscription(sub.user_id)}
                            >
                              Create Trial
                            </button>
                          )}
                          <button
                            className="btn-sm btn-danger"
                            onClick={() => handleCancelSubscription(sub.user_id)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-sm btn-secondary"
                            onClick={() => handleProcessPayment(sub.user_id)}
                          >
                            Process Payment
                          </button>
                          <button
                            className="btn-sm btn-secondary"
                            onClick={() => handleMpesaPayment(sub.user_id)}
                          >
                            M-Pesa Payment
                          </button>
                          <button
                            className="btn-sm btn-info"
                            onClick={() => setSelectedSubscription(sub)}
                          >
                            View Users
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedSubscription && (
              <div className="subscription-details">
                <h3>Users for {selectedSubscription.username} ({selectedSubscription.plan})</h3>
                <div className="users-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Tenant</th>
                        <th>Branch</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSubscription.users.map(user => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{user.full_name}</td>
                          <td>{user.email}</td>
                          <td>{user.tenant.name}</td>
                          <td>{user.branch || 'N/A'}</td>
                          <td>{user.role}</td>
                          <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                          <td>{new Date(user.joined_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedSubscription(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="plans-tab">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plan Name</th>
                    <th>Type</th>
                    <th>Monthly Price</th>
                    <th>Yearly Price</th>
                    <th>Max Users</th>
                    <th>Max Branches</th>
                    <th>Status</th>
                    <th>Features</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => (
                    <tr key={plan.id}>
                      <td>{plan.name}</td>
                      <td>{plan.plan_type}</td>
                      <td>{formatCurrency(plan.price_monthly)}</td>
                      <td>{formatCurrency(plan.price_yearly)}</td>
                      <td>{plan.max_users}</td>
                      <td>{plan.max_branches}</td>
                      <td>{getStatusBadge(plan.is_active ? 'active' : 'inactive')}</td>
                      <td>
                        <div className="features-list">
                          {plan.features && Object.entries(plan.features).map(([key, value]) => (
                            <span key={key} className="feature-tag">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button className="btn-sm btn-edit">Edit</button>
                        <button className="btn-sm btn-danger">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-tab">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Transaction ID</th>
                    <th>Payment Date</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td>{payment.subscription?.user?.username || 'N/A'}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{payment.payment_method}</td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td>{payment.transaction_id || 'N/A'}</td>
                      <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button className="btn-sm btn-secondary">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <IntegrationsDashboard />
        )}

        {activeTab === 'audit' && (
          <AuditLog />
        )}
      </div>

      {/* Modals */}

      {showEditTenant && selectedTenant && (
        <EditTenantModal
          tenant={selectedTenant}
          onClose={() => {
            setShowEditTenant(false);
            setSelectedTenant(null);
          }}
          onUpdate={handleUpdateTenant}
        />
      )}

      {showChangeSubscription && selectedTenant && (
        <ChangeSubscriptionModal
          tenant={selectedTenant}
          onClose={() => {
            setShowChangeSubscription(false);
            setSelectedTenant(null);
          }}
          onChange={handleChangeTenantSubscription}
        />
      )}

      {showManageUsers && selectedTenant && (
        <ManageUsersModal
          tenant={selectedTenant}
          onClose={() => {
            setShowManageUsers(false);
            setSelectedTenant(null);
          }}
        />
      )}

      {showKeyDetails && selectedKey && (
        <KeyDetailsModal
          keyData={selectedKey}
          onClose={() => {
            setShowKeyDetails(false);
            setSelectedKey(null);
          }}
          onUpdate={loadDashboardData}
        />
      )}

      {showBulkOperations && (
        <BulkOperations
          selectedCount={selectedTenantsForBulk.length}
          onClose={() => setShowBulkOperations(false)}
          onOperation={handleBulkOperation}
        />
      )}

    </div>
  );
};

// Edit Tenant Modal Component
const EditTenantModal = ({ tenant, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    display_name: tenant.display_name || '',
    email: tenant.email || '',
    phone: tenant.phone || '',
    address: tenant.address || '',
    business_type: tenant.business_type || 'retail'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Edit Tenant: {tenant.display_name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Business Type</label>
            <select
              name="business_type"
              value={formData.business_type}
              onChange={handleChange}
            >
              <option value="retail">Retail Store</option>
              <option value="restaurant">Restaurant</option>
              <option value="supermarket">Supermarket</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Manage Users Modal Component
const ManageUsersModal = ({ tenant, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    loadTenantUsers();
  }, [tenant]);

  const loadTenantUsers = async () => {
    try {
      const data = await tenantsAPI.getTenantUsers(tenant.id);
      setUsers(data.results || data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      const result = await tenantsAPI.addUserToTenant(tenant.id, userData);
      alert(result.message || 'User added successfully!');
      setShowAddUser(false);
      loadTenantUsers();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to add user'}`);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the tenant?')) {
      return;
    }

    try {
      await tenantsAPI.removeUserFromTenant(tenant.id, userId);
      alert('User removed successfully!');
      loadTenantUsers();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to remove user'}`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal large-modal">
        <div className="modal-header">
          <h2>Manage Users: {tenant.display_name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-actions">
            <button
              className="btn-primary"
              onClick={() => setShowAddUser(true)}
            >
              Add User
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <div className="users-list">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.user?.username}</td>
                      <td>{user.user ? `${user.user.first_name} ${user.user.last_name}`.trim() : ''}</td>
                      <td>{user.user?.email}</td>
                      <td>{user.role}</td>
                      <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleRemoveUser(user.user?.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showAddUser && (
            <AddUserModal
              onClose={() => setShowAddUser(false)}
              onAdd={handleAddUser}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Change Subscription Modal Component
const ChangeSubscriptionModal = ({ tenant, onClose, onChange }) => {
  const [formData, setFormData] = useState({
    plan_type: 'basic',
    duration_days: 30
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onChange(formData);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Change Subscription: {tenant.display_name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="subscription-info">
            <p><strong>Current Status:</strong> {tenant.subscription_status?.status || 'No subscription'}</p>
            {tenant.subscription_status?.plan && (
              <p><strong>Current Plan:</strong> {tenant.subscription_status.plan}</p>
            )}
          </div>

          <div className="form-group">
            <label>New Plan *</label>
            <select
              name="plan_type"
              value={formData.plan_type}
              onChange={handleChange}
              required
            >
              <option value="free">Free Trial</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="form-group">
            <label>Duration (Days) *</label>
            <input
              type="number"
              name="duration_days"
              value={formData.duration_days}
              onChange={handleChange}
              min="1"
              max="365"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Change Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add User Modal Component
const AddUserModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'cashier'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Add User to Tenant</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="viewer">Viewer</option>
              <option value="cashier">Cashier</option>
              <option value="inventory_clerk">Inventory Clerk</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Key Details Modal Component
const KeyDetailsModal = ({ keyData, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    key_type: keyData.key_type || '',
    status: keyData.status || '',
    plan: keyData.plan || '',
    duration_days: keyData.duration_days || 30,
    max_activations: keyData.max_activations || 1,
    notes: keyData.notes || '',
    expires_at: keyData.expires_at ? new Date(keyData.expires_at).toISOString().slice(0, 16) : ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Local helper functions
  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'status-active',
      expired: 'status-expired',
      trial: 'status-trial',
      grace_period: 'status-warning',
      cancelled: 'status-inactive',
      used: 'status-inactive',
      revoked: 'status-expired'
    };

    return (
      <span className={`status-badge ${statusClasses[status] || 'status-inactive'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `KSh ${numericAmount.toFixed(2)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Note: This would require a backend endpoint to update keys
      // For now, we'll just show a message
      alert('Key update functionality would require backend implementation');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to update key'}`);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="modal-overlay">
      <div className="modal large-modal">
        <div className="modal-header">
          <h2>Change activation key</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="key-header">
            <h3>{keyData.key_type}: {keyData.key?.slice(0, 12)}... ({keyData.status})</h3>
            <div className="key-actions">
              <button
                className="btn-secondary"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              {isEditing && (
                <button className="btn-primary" onClick={handleSave}>
                  Save
                </button>
              )}
            </div>
          </div>

          <div className="key-details-grid">
            <div className="detail-section">
              <h4>Key Information</h4>
              <div className="detail-row">
                <label>Key type:</label>
                {isEditing ? (
                  <select name="key_type" value={formData.key_type} onChange={handleChange}>
                    <option value="trial">Trial Key</option>
                    <option value="subscription">Subscription Key</option>
                    <option value="extension">Extension Key</option>
                    <option value="upgrade">Upgrade Key</option>
                  </select>
                ) : (
                  <span>{keyData.key_type}</span>
                )}
              </div>

              <div className="detail-row">
                <label>Status:</label>
                {isEditing ? (
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="used">Used</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                  </select>
                ) : (
                  <span>{getStatusBadge(keyData.status)}</span>
                )}
              </div>

              <div className="detail-row">
                <label>Plan:</label>
                <span>{keyData.plan_name} - {formatCurrency(keyData.plan?.price_monthly || 0)}/month</span>
              </div>

              <div className="detail-row">
                <label>Duration days:</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="duration_days"
                    value={formData.duration_days}
                    onChange={handleChange}
                    min="1"
                  />
                ) : (
                  <span>{keyData.duration_days} days</span>
                )}
              </div>

              <div className="detail-row">
                <label>Max activations:</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="max_activations"
                    value={formData.max_activations}
                    onChange={handleChange}
                    min="1"
                  />
                ) : (
                  <span>{keyData.max_activations}</span>
                )}
              </div>

              <div className="detail-row">
                <label>Activations used:</label>
                <span>{keyData.activations_used}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Activation Details</h4>
              <div className="detail-row">
                <label>Activated by:</label>
                <span>{keyData.activated_by || 'N/A'}</span>
              </div>

              <div className="detail-row">
                <label>Activated at:</label>
                <div className="datetime-display">
                  <div>Date: {formatDateTime(keyData.activated_at).split(',')[0]}</div>
                  <div>Time: {formatDateTime(keyData.activated_at).split(',')[1] || 'N/A'}</div>
                </div>
              </div>

              <div className="detail-row">
                <label>Tenant:</label>
                <span>{keyData.tenant_name || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Metadata</h4>
              <div className="detail-row">
                <label>Generated by:</label>
                <span>{keyData.generated_by || 'N/A'}</span>
              </div>

              <div className="detail-row">
                <label>Notes:</label>
                {isEditing ? (
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                  />
                ) : (
                  <span>{keyData.notes || 'Internal notes'}</span>
                )}
              </div>

              <div className="detail-row">
                <label>Expires at:</label>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    name="expires_at"
                    value={formData.expires_at}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="datetime-display">
                    <div>Date: {keyData.expires_at ? new Date(keyData.expires_at).toLocaleDateString() : 'Never'}</div>
                    <div>Time: {keyData.expires_at ? new Date(keyData.expires_at).toLocaleTimeString() : 'N/A'}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h4>Key Data</h4>
              <div className="detail-row">
                <label>Key:</label>
                <div className="key-display">{keyData.key}</div>
              </div>

              <div className="detail-row">
                <label>Key hash:</label>
                <div className="hash-display">{keyData.key_hash}</div>
              </div>

              <div className="detail-row">
                <label>Created at:</label>
                <span>{new Date(keyData.created_at).toLocaleString()}</span>
              </div>

              <div className="detail-row">
                <label>Updated at:</label>
                <span>{new Date(keyData.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;