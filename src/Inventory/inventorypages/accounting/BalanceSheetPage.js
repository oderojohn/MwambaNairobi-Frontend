import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../../services/ApiService/apiAccounting';
import { formatCurrency } from '../../../services/ApiService/api';

const BalanceSheetPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportsAPI.getBalanceSheet(dateRange);
      setReport(data);
    } catch (err) {
      setError('Failed to load balance sheet report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Balance Sheet</h1>
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
            <h2>Balance Sheet</h2>
            <p>As of: {report.end_date}</p>
            <p>Generated: {report.report_date}</p>
          </div>

          <div className="bs-section">
            <h3>Assets</h3>
            <table className="report-table">
              <tbody>
                {report.assets && report.assets.map((item, index) => (
                  <tr key={index}>
                    <td>{item.account_name}</td>
                    <td className="text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Total Assets</strong></td>
                  <td className="text-right"><strong>{formatCurrency(report.total_assets)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bs-section">
            <h3>Liabilities</h3>
            <table className="report-table">
              <tbody>
                {report.liabilities && report.liabilities.map((item, index) => (
                  <tr key={index}>
                    <td>{item.account_name}</td>
                    <td className="text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Total Liabilities</strong></td>
                  <td className="text-right"><strong>{formatCurrency(report.total_liabilities)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bs-section">
            <h3>Equity</h3>
            <table className="report-table">
              <tbody>
                {report.equity && report.equity.map((item, index) => (
                  <tr key={index}>
                    <td>{item.account_name}</td>
                    <td className="text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Total Equity</strong></td>
                  <td className="text-right"><strong>{formatCurrency(report.total_equity)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bs-summary">
            <div className="summary-box">
              <h3>Total Liabilities + Equity</h3>
              <p className="amount">{formatCurrency(report.total_liabilities + report.total_equity)}</p>
            </div>
            <div className={`summary-box ${report.is_balanced ? 'balanced' : 'unbalanced'}`}>
              <h3>{report.is_balanced ? 'BALANCED' : 'NOT BALANCED'}</h3>
              <p className="amount">Difference: {formatCurrency(Math.abs(report.total_assets - (report.total_liabilities + report.total_equity)))}</p>
            </div>
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
        .report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1976d2; }
        .report-header h2 { color: #1976d2; margin-bottom: 8px; }
        .bs-section { margin-bottom: 24px; }
        .bs-section h3 { color: #333; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .report-table { width: 100%; border-collapse: collapse; }
        .report-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .text-right { text-align: right; }
        .total-row { background: #f8f9fa; }
        .bs-summary { display: flex; gap: 20px; justify-content: center; margin-top: 24px; padding-top: 24px; border-top: 2px solid #1976d2; }
        .summary-box { padding: 24px; border-radius: 8px; text-align: center; flex: 1; max-width: 300px; }
        .summary-box.balanced { background: #e8f5e9; }
        .summary-box.unbalanced { background: #ffebee; }
        .summary-box h3 { margin: 0 0 8px 0; color: #333; font-size: 14px; }
        .summary-box .amount { font-size: 24px; font-weight: bold; margin: 0; }
        .summary-box.balanced .amount { color: #2e7d32; }
        .summary-box.unbalanced .amount { color: #c62828; }
        .btn-primary { background: #1976d2; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
        .error-message { color: #dc3545; padding: 12px; margin-bottom: 16px; background: #ffebee; border-radius: 4px; }
        .loading, .no-data { text-align: center; padding: 40px; color: #666; }
      `}</style>
    </div>
  );
};

export default BalanceSheetPage;
