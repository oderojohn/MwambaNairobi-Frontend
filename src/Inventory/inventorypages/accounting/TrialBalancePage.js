import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../../services/ApiService/apiAccounting';
import { formatCurrency } from '../../../services/ApiService/api';

const TrialBalancePage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportsAPI.getTrialBalance(dateRange);
      setReport(data);
    } catch (err) {
      setError('Failed to load trial balance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Trial Balance</h1>
      </div>

      <div className="filter-bar">
        <label>Date Range:</label>
        <input
          type="date"
          value={dateRange.start_date}
          onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
        />
        <span>to</span>
        <input
          type="date"
          value={dateRange.end_date}
          onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
        />
        <button className="btn-primary" onClick={loadReport}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : report ? (
        <div className="report-container">
          <div className="report-header">
            <h2>Trial Balance</h2>
            <p>Period: {report.start_date} to {report.end_date}</p>
            <p>Generated: {report.report_date}</p>
          </div>

          <table className="report-table">
            <thead>
              <tr>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {report.accounts && report.accounts.map((account, index) => (
                <tr key={index}>
                  <td>{account.account_code}</td>
                  <td>{account.account_name}</td>
                  <td>{account.account_type}</td>
                  <td className="text-right">{formatCurrency(account.debit)}</td>
                  <td className="text-right">{formatCurrency(account.credit)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="3"><strong>TOTAL</strong></td>
                <td className="text-right"><strong>{formatCurrency(report.total_debits)}</strong></td>
                <td className="text-right"><strong>{formatCurrency(report.total_credits)}</strong></td>
              </tr>
            </tfoot>
          </table>

          <div className="balance-status">
            {report.is_balanced ? (
              <span className="badge badge-success">Trial Balance is Balanced</span>
            ) : (
              <span className="badge badge-danger">Trial Balance is NOT Balanced</span>
            )}
          </div>
        </div>
      ) : (
        <div className="no-data">No data available</div>
      )}

      <style>{`
        .page-container { padding: 20px; }
        .page-header { margin-bottom: 20px; }
        .filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px; }
        .filter-bar label { font-weight: 600; }
        .filter-bar input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .report-container { background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #217346; }
        .report-header h2 { color: #217346; margin-bottom: 8px; }
        .report-table { width: 100%; border-collapse: collapse; }
        .report-table th, .report-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .report-table th { background: #f8f9fa; font-weight: 600; }
        .text-right { text-align: right; }
        .total-row { background: #f0f0f0; font-weight: 600; }
        .balance-status { text-align: center; margin-top: 24px; }
        .badge { padding: 8px 16px; border-radius: 4px; font-weight: 600; }
        .badge-success { background: #e8f5e9; color: #2e7d32; }
        .badge-danger { background: #ffebee; color: #c62828; }
        .btn-primary { background: #217346; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
        .error-message { color: #dc3545; padding: 12px; margin-bottom: 16px; background: #ffebee; border-radius: 4px; }
        .loading, .no-data { text-align: center; padding: 40px; color: #666; }
      `}</style>
    </div>
  );
};

export default TrialBalancePage;
