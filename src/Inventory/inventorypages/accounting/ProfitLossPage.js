import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../../services/ApiService/apiAccounting';
import { formatCurrency } from '../../../services/ApiService/api';

const ProfitLossPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportsAPI.getProfitLoss(dateRange);
      setReport(data);
    } catch (err) {
      setError('Failed to load profit & loss report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Profit & Loss Statement</h1>
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
            <h2>Profit & Loss Statement</h2>
            <p>Period: {report.start_date} to {report.end_date}</p>
            <p>Generated: {report.report_date}</p>
          </div>

          <div className="pl-section">
            <h3>Revenue</h3>
            <table className="report-table">
              <tbody>
                {report.revenue && report.revenue.map((item, index) => (
                  <tr key={index}>
                    <td>{item.account_name}</td>
                    <td className="text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Total Revenue</strong></td>
                  <td className="text-right"><strong>{formatCurrency(report.total_revenue)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pl-section">
            <h3>Less: Cost of Goods Sold</h3>
            <table className="report-table">
              <tbody>
                {report.expenses && report.expenses.filter(e => e.account_code === '5000').map((item, index) => (
                  <tr key={index}>
                    <td>{item.account_name}</td>
                    <td className="text-right">({formatCurrency(item.amount)})</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Gross Profit</strong></td>
                  <td className="text-right">
                    <strong>{formatCurrency(report.total_revenue - (report.expenses?.find(e => e.account_code === '5000')?.amount || 0))}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pl-section">
            <h3>Operating Expenses</h3>
            <table className="report-table">
              <tbody>
                {report.expenses && report.expenses.filter(e => e.account_code !== '5000').map((item, index) => (
                  <tr key={index}>
                    <td>{item.account_name}</td>
                    <td className="text-right">({formatCurrency(item.amount)})</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Total Expenses</strong></td>
                  <td className="text-right"><strong>({formatCurrency(report.total_expenses)})</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pl-summary">
            <div className={`summary-box ${report.is_profitable ? 'profit' : 'loss'}`}>
              <h3>{report.is_profitable ? 'NET PROFIT' : 'NET LOSS'}</h3>
              <p className="amount">{formatCurrency(Math.abs(report.net_profit))}</p>
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
        .report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #217346; }
        .report-header h2 { color: #217346; margin-bottom: 8px; }
        .pl-section { margin-bottom: 24px; }
        .pl-section h3 { color: #333; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .report-table { width: 100%; border-collapse: collapse; }
        .report-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .text-right { text-align: right; }
        .total-row { background: #f8f9fa; }
        .pl-summary { text-align: center; margin-top: 24px; padding-top: 24px; border-top: 2px solid #217346; }
        .summary-box { padding: 24px; border-radius: 8px; }
        .summary-box.profit { background: #e8f5e9; }
        .summary-box.loss { background: #ffebee; }
        .summary-box h3 { margin: 0 0 8px 0; color: #333; }
        .summary-box .amount { font-size: 32px; font-weight: bold; margin: 0; }
        .summary-box.profit .amount { color: #2e7d32; }
        .summary-box.loss .amount { color: #c62828; }
        .btn-primary { background: #217346; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
        .error-message { color: #dc3545; padding: 12px; margin-bottom: 16px; background: #ffebee; border-radius: 4px; }
        .loading, .no-data { text-align: center; padding: 40px; color: #666; }
      `}</style>
    </div>
  );
};

export default ProfitLossPage;
