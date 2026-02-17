import React, { useState, useEffect } from 'react';
import { accountsAPI } from '../../../services/ApiService/apiAccounting';
import { formatCurrency } from '../../../services/ApiService/api';

const ChartOfAccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    account_type: 'asset',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadAccounts();
  }, [filterType]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'all' ? { account_type: filterType } : {};
      const data = await accountsAPI.getAccounts(params);
      setAccounts(data.results || data);
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await accountsAPI.updateAccount(editingAccount.id, formData);
      } else {
        await accountsAPI.createAccount(formData);
      }
      setShowModal(false);
      setEditingAccount(null);
      setFormData({ name: '', code: '', account_type: 'asset', description: '', is_active: true });
      loadAccounts();
    } catch (err) {
      setError('Failed to save account');
      console.error(err);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      code: account.code,
      account_type: account.account_type,
      description: account.description || '',
      is_active: account.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await accountsAPI.deleteAccount(id);
      loadAccounts();
    } catch (err) {
      setError('Failed to delete account');
      console.error(err);
    }
  };

  const accountTypes = [
    { value: 'all', label: 'All Accounts' },
    { value: 'asset', label: 'Assets' },
    { value: 'liability', label: 'Liabilities' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expenses' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Chart of Accounts</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Account
        </button>
      </div>

      <div className="filter-bar">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          {accountTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6">Loading...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan="6">No accounts found</td></tr>
            ) : (
              accounts.map(account => (
                <tr key={account.id}>
                  <td>{account.code}</td>
                  <td>{account.name}</td>
                  <td>
                    <span className={`badge badge-${account.account_type}`}>
                      {account.account_type_display || account.account_type}
                    </span>
                  </td>
                  <td>{formatCurrency(account.balance || 0)}</td>
                  <td>
                    <span className={`badge ${account.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => handleEdit(account)}>Edit</button>
                    <button className="btn-icon btn-danger" onClick={() => handleDelete(account.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingAccount ? 'Edit Account' : 'Add Account'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Account Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingAccount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .page-container { padding: 20px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .filter-bar { margin-bottom: 20px; }
        .filter-bar select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
        .table-container { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .data-table th { background: #f8f9fa; font-weight: 600; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .badge-asset { background: #e3f2fd; color: #1565c0; }
        .badge-liability { background: #fff3e0; color: #ef6c00; }
        .badge-equity { background: #f3e5f5; color: #7b1fa2; }
        .badge-revenue { background: #e8f5e9; color: #2e7d32; }
        .badge-expense { background: #ffebee; color: #c62828; }
        .badge-success { background: #e8f5e9; color: #2e7d32; }
        .badge-danger { background: #ffebee; color: #c62828; }
        .btn-primary { background: #217346; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-secondary { background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-icon { padding: 6px 12px; margin-right: 4px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; }
        .btn-danger { color: #dc3545; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 24px; border-radius: 8px; width: 500px; max-width: 90%; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 4px; font-weight: 500; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
        .error-message { color: #dc3545; padding: 12px; margin-bottom: 16px; background: #ffebee; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default ChartOfAccountsPage;
