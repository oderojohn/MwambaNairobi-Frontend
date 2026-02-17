import React, { useState, useEffect } from 'react';
import { recurringExpensesAPI, journalEntriesAPI, accountsAPI } from '../../../services/ApiService/apiAccounting';
import { formatCurrency } from '../../../services/ApiService/api';

const RecurringExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    account: '',
    amount: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
    is_active: true
  });

  useEffect(() => {
    loadExpenses();
    loadAccounts();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await recurringExpensesAPI.getRecurringExpenses();
      setExpenses(data.results || data);
    } catch (err) {
      setError('Failed to load recurring expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const data = await accountsAPI.getAccounts({ account_type: 'expense', is_active: true });
      setAccounts(data.results || data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await recurringExpensesAPI.createRecurringExpense(formData);
      setShowModal(false);
      setFormData({
        name: '',
        account: '',
        amount: '',
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: '',
        is_active: true
      });
      loadExpenses();
    } catch (err) {
      setError('Failed to create recurring expense');
      console.error(err);
    }
  };

  const handlePostNow = async () => {
    try {
      const result = await journalEntriesAPI.postRecurring();
      setSuccess(result.message || 'Recurring expenses posted successfully');
      loadExpenses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to post recurring expenses');
      console.error(err);
    }
  };

  const handleToggleActive = async (expense) => {
    try {
      await recurringExpensesAPI.updateRecurringExpense(expense.id, {
        ...expense,
        is_active: !expense.is_active
      });
      loadExpenses();
    } catch (err) {
      setError('Failed to update expense');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recurring expense?')) return;
    try {
      await recurringExpensesAPI.deleteRecurringExpense(id);
      loadExpenses();
    } catch (err) {
      setError('Failed to delete expense');
      console.error(err);
    }
  };

  const frequencyLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Recurring Expenses</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePostNow}>
            Post Due Expenses Now
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Add Expense
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Frequency</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Last Posted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9">Loading...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan="9">No recurring expenses found</td></tr>
            ) : (
              expenses.map(expense => (
                <tr key={expense.id}>
                  <td>{expense.name}</td>
                  <td>{expense.account_name} ({expense.account_code})</td>
                  <td>{formatCurrency(expense.amount)}</td>
                  <td>{frequencyLabels[expense.frequency] || expense.frequency}</td>
                  <td>{expense.start_date}</td>
                  <td>{expense.end_date || 'Ongoing'}</td>
                  <td>{expense.last_posted || 'Never'}</td>
                  <td>
                    <span className={`badge ${expense.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {expense.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => handleToggleActive(expense)}>
                      {expense.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn-icon btn-danger" onClick={() => handleDelete(expense.id)}>
                      Delete
                    </button>
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
            <h2>Add Recurring Expense</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Expense Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Rent"
                  required
                />
              </div>
              <div className="form-group">
                <label>Expense Account</label>
                <select
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  required
                >
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date (optional)</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .page-container { padding: 20px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .header-actions { display: flex; gap: 12px; }
        .table-container { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .data-table th { background: #f8f9fa; font-weight: 600; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .badge-success { background: #e8f5e9; color: #2e7d32; }
        .badge-danger { background: #ffebee; color: #c62828; }
        .btn-primary { background: #217346; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-secondary { background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-icon { padding: 6px 12px; margin-right: 4px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; }
        .btn-danger { color: #dc3545; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 24px; border-radius: 8px; width: 500px; max-width: 90%; }
        .form-group { margin-bottom: 16px; }
        .form-row { display: flex; gap: 16px; }
        .form-row .form-group { flex: 1; }
        .form-group label { display: block; margin-bottom: 4px; font-weight: 500; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
        .error-message { color: #dc3545; padding: 12px; margin-bottom: 16px; background: #ffebee; border-radius: 4px; }
        .success-message { color: #155724; padding: 12px; margin-bottom: 16px; background: #d4edda; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default RecurringExpensesPage;
