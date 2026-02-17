import React, { useState, useEffect } from 'react';
import { journalEntriesAPI, accountsAPI } from '../../../services/ApiService/apiAccounting';
import { formatCurrency } from '../../../services/ApiService/api';

const JournalEntriesPage = () => {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    entries: [
      { account: '', debit_amount: 0, credit_amount: 0, description: '' },
      { account: '', debit_amount: 0, credit_amount: 0, description: '' }
    ]
  });

  useEffect(() => {
    loadEntries();
    loadAccounts();
  }, [searchTerm, dateRange]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const params = { ...dateRange };
      if (searchTerm) params.search = searchTerm;
      const data = await journalEntriesAPI.getJournalEntries(params);
      setEntries(data.results || data);
    } catch (err) {
      setError('Failed to load journal entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const data = await accountsAPI.getAccounts({ is_active: true });
      setAccounts(data.results || data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate debits = credits
      const totalDebit = formData.entries.reduce((sum, e) => sum + parseFloat(e.debit_amount || 0), 0);
      const totalCredit = formData.entries.reduce((sum, e) => sum + parseFloat(e.credit_amount || 0), 0);
      
      if (totalDebit !== totalCredit) {
        setError('Debits must equal credits');
        return;
      }

      await journalEntriesAPI.createJournalEntry(formData);
      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        entries: [
          { account: '', debit_amount: 0, credit_amount: 0, description: '' },
          { account: '', debit_amount: 0, credit_amount: 0, description: '' }
        ]
      });
      loadEntries();
    } catch (err) {
      setError('Failed to create journal entry');
      console.error(err);
    }
  };

  const addEntryLine = () => {
    setFormData({
      ...formData,
      entries: [...formData.entries, { account: '', debit_amount: 0, credit_amount: 0, description: '' }]
    });
  };

  const removeEntryLine = (index) => {
    const newEntries = formData.entries.filter((_, i) => i !== index);
    setFormData({ ...formData, entries: newEntries });
  };

  const updateEntryLine = (index, field, value) => {
    const newEntries = [...formData.entries];
    newEntries[index][field] = value;
    
    // If debit has value, clear credit and vice versa
    if (field === 'debit_amount' && parseFloat(value) > 0) {
      newEntries[index].credit_amount = 0;
    } else if (field === 'credit_amount' && parseFloat(value) > 0) {
      newEntries[index].debit_amount = 0;
    }
    
    setFormData({ ...formData, entries: newEntries });
  };

  const totalDebit = formData.entries.reduce((sum, e) => sum + parseFloat(e.debit_amount || 0), 0);
  const totalCredit = formData.entries.reduce((sum, e) => sum + parseFloat(e.credit_amount || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Journal Entries</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Entry
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search entries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <input
          type="date"
          value={dateRange.start_date}
          onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
          placeholder="Start Date"
        />
        <input
          type="date"
          value={dateRange.end_date}
          onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
          placeholder="End Date"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Entry #</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan="7">No journal entries found</td></tr>
            ) : (
              entries.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.entry_number}</td>
                  <td>{entry.description}</td>
                  <td>{entry.reference || '-'}</td>
                  <td>{formatCurrency(entry.total_debit || 0)}</td>
                  <td>{formatCurrency(entry.total_credit || 0)}</td>
                  <td>
                    <span className={`badge ${entry.is_balanced ? 'badge-success' : 'badge-danger'}`}>
                      {entry.is_balanced ? 'Balanced' : 'Unbalanced'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>New Journal Entry</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reference</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <h3>Entry Lines</h3>
              <table className="entry-lines-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Description</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.entries.map((entry, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={entry.account}
                          onChange={(e) => updateEntryLine(index, 'account', e.target.value)}
                          required
                        >
                          <option value="">Select Account</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={entry.debit_amount}
                          onChange={(e) => updateEntryLine(index, 'debit_amount', e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={entry.credit_amount}
                          onChange={(e) => updateEntryLine(index, 'credit_amount', e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={entry.description}
                          onChange={(e) => updateEntryLine(index, 'description', e.target.value)}
                        />
                      </td>
                      <td>
                        {formData.entries.length > 2 && (
                          <button type="button" className="btn-icon btn-danger" onClick={() => removeEntryLine(index)}>X</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>{formatCurrency(totalDebit)}</strong></td>
                    <td><strong>{formatCurrency(totalCredit)}</strong></td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>

              <button type="button" className="btn-secondary" onClick={addEntryLine}>
                + Add Line
              </button>

              {totalDebit !== totalCredit && (
                <div className="error-message">Debits must equal credits. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}</div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={totalDebit !== totalCredit}>
                  Create Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .page-container { padding: 20px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }
        .search-input { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
        .filter-bar input[type="date"] { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
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
        .modal-content { background: white; padding: 24px; border-radius: 8px; width: 900px; max-width: 95%; max-height: 90vh; overflow-y: auto; }
        .form-group { margin-bottom: 16px; }
        .form-row { display: flex; gap: 16px; }
        .form-row .form-group { flex: 1; }
        .form-group label { display: block; margin-bottom: 4px; font-weight: 500; }
        .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
        .entry-lines-table { width: 100%; margin: 16px 0; border-collapse: collapse; }
        .entry-lines-table th, .entry-lines-table td { padding: 8px; border: 1px solid #ddd; }
        .entry-lines-table input, .entry-lines-table select { width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; }
        .error-message { color: #dc3545; padding: 12px; margin: 16px 0; background: #ffebee; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default JournalEntriesPage;
