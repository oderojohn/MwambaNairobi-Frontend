// ReportingPage.js - Refined with Important Reports
import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency, toNumber, reportsAPI, purchaseOrdersAPI } from '../../services/ApiService/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ReportingPage.css';

// Extend jsPDF with autoTable
if (typeof jsPDF !== 'undefined') {
  jsPDF.API.autoTable = autoTable;
}

const ReportingPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reports, setReports] = useState({
    sales: [],
    inventory: [],
    profitLoss: {},
    productPerformance: [],
    dailySummary: {},
    purchaseOrders: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate comprehensive reports
  const generateReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const reportPromises = [];

      // Always fetch dashboard data
      if (activeTab === 'dashboard' || activeTab === 'all') {
        reportPromises.push(
          reportsAPI.getTodaySummary().then(response => ({
            type: 'dailySummary',
            data: response || {}
          })).catch(() => ({ type: 'dailySummary', data: {} }))
        );
      }

      // Sales data for multiple reports
      if (['dashboard', 'sales', 'profit', 'products'].includes(activeTab)) {
        reportPromises.push(
          reportsAPI.generateSalesReport(null, {
            date_from: dateRange.start,
            date_to: dateRange.end
          }).then(response => ({
            type: 'sales',
            data: response || []
          })).catch(() => ({ type: 'sales', data: [] }))
        );
      }

      // Inventory data
      if (['dashboard', 'inventory'].includes(activeTab)) {
        reportPromises.push(
          reportsAPI.generateInventoryReport({
            date_from: dateRange.start,
            date_to: dateRange.end
          }).then(response => ({
            type: 'inventory',
            data: Array.isArray(response) ? response : []
          })).catch(() => ({ type: 'inventory', data: [] }))
        );
      }

      // Product performance
      if (['products'].includes(activeTab)) {
        reportPromises.push(
          reportsAPI.getProfitLossSummary({
            product_performance: true,
            date_from: dateRange.start,
            date_to: dateRange.end
          }).then(response => ({
            type: 'productPerformance',
            data: Array.isArray(response) ? response : []
          })).catch(() => ({ type: 'productPerformance', data: [] }))
        );
      }

      // Overall profit & loss summary (calculated from sales data)
      if (['dashboard', 'profit'].includes(activeTab)) {
        // We'll calculate this from the sales data after it's fetched
      }

      // Purchase orders for profit analysis
      if (['dashboard', 'profit'].includes(activeTab)) {
        reportPromises.push(
          purchaseOrdersAPI.getPurchaseOrders()
            .then(response => ({
              type: 'purchaseOrders',
              data: response || []
            }))
            .catch(() => ({ type: 'purchaseOrders', data: [] }))
        );
      }

      const results = await Promise.all(reportPromises);

      setReports(prevReports => {
        const newReports = { ...prevReports };
        results.forEach(result => {
          newReports[result.type] = result.data;
        });

        // Calculate profit & loss summary from sales data if not already available
        if (newReports.sales && Array.isArray(newReports.sales) && newReports.sales.length > 0 && !newReports.profitLoss) {
          const salesTotals = calculateTotals(newReports.sales, ['total_sales', 'gross_profit', 'net_profit', 'cost_of_goods_sold']);
          const revenue = salesTotals.total_sales || 0;
          const cogs = salesTotals.cost_of_goods_sold || 0;
          const grossProfit = salesTotals.gross_profit || 0;
          const netProfit = salesTotals.net_profit || 0;
          const expenses = grossProfit - netProfit;

          newReports.profitLoss = {
            date_from: dateRange.start,
            date_to: dateRange.end,
            total_revenue: revenue,
            cost_of_goods_sold: cogs,
            gross_profit: grossProfit,
            operating_expenses: expenses,
            net_profit: netProfit,
            profit_margin_percentage: revenue > 0 ? (netProfit / revenue) * 100 : 0
          };
        }

        return newReports;
      });

    } catch (error) {
      console.error('Error generating reports:', error);
      setError(`Failed to load reports: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange.start, dateRange.end]);

  useEffect(() => {
    generateReports();
  }, [generateReports]);

  // Calculate totals helper
  const calculateTotals = (data, fields) => {
    if (!data || !Array.isArray(data)) return {};
    return fields.reduce((totals, field) => {
      totals[field] = data.reduce((sum, item) => sum + toNumber(item[field] || 0), 0);
      return totals;
    }, {});
  };

  // Export functions
  const exportReport = (reportType) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('MWAMBA LIQUORS', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(`${reportType} Report`, 105, 35, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 50);
      doc.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, 14, 58);
      
      doc.setLineWidth(0.5);
      doc.line(14, 65, 196, 65);

      // Add report-specific content
      if (reportType === 'Sales') {
        exportSalesContent(doc, 75);
      } else if (reportType === 'Inventory') {
        exportInventoryContent(doc, 75);
      } else if (reportType === 'Profit & Loss') {
        exportProfitLossContent(doc, 75);
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('MWAMBA LIQUORS - POS System', 105, 290, { align: 'center' });
      }

      doc.save(`${reportType.toLowerCase().replace(' & ', '_')}_report_${dateRange.start}_to_${dateRange.end}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error generating ${reportType} PDF: ${error.message}`);
    }
  };

  const exportSalesContent = (doc, yPosition) => {
    const totals = calculateTotals(reports.sales, ['total_sales', 'cash_sales', 'card_sales', 'mobile_sales', 'transactions']);
    
    doc.setFontSize(12);
    doc.text('Summary', 14, yPosition);
    yPosition += 15;

    const summaryData = [
      ['Total Sales:', formatCurrency(totals.total_sales)],
      ['Cash Sales:', formatCurrency(totals.cash_sales)],
      ['Card Sales:', formatCurrency(totals.card_sales)],
      ['Mobile Sales:', formatCurrency(totals.mobile_sales)],
      ['Transactions:', totals.transactions.toString()]
    ];

    doc.autoTable({
      startY: yPosition,
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10 },
      margin: { left: 14 }
    });
  };

  const exportInventoryContent = (doc, yPosition) => {
    const inventory = Array.isArray(reports.inventory) ? reports.inventory : [];
    const lowStockCount = inventory.filter(item => toNumber(item.stock_level) < 10).length;
    const totalValue = inventory.reduce((sum, item) => sum + toNumber(item.value || 0), 0);

    const summaryData = [
      ['Total Products:', inventory.length.toString()],
      ['Low Stock Items:', lowStockCount.toString()],
      ['Total Inventory Value:', formatCurrency(totalValue)]
    ];

    doc.autoTable({
      startY: yPosition,
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10 },
      margin: { left: 14 }
    });
  };

  const exportProfitLossContent = (doc, yPosition) => {
    // Use same logic as renderProfitLossReport
    let revenue = 0;
    let cogs = 0;
    let grossProfit = 0;
    let expenses = 0;
    let netProfit = 0;

    if (reports.profitLoss && Object.keys(reports.profitLoss).length > 0) {
      // Use backend profit/loss data
      revenue = reports.profitLoss.total_revenue || 0;
      cogs = reports.profitLoss.cost_of_goods_sold || 0;
      grossProfit = reports.profitLoss.gross_profit || 0;
      expenses = reports.profitLoss.operating_expenses || 0;
      netProfit = reports.profitLoss.net_profit || 0;
    } else {
      // Fallback to sales data calculations
      const salesTotals = calculateTotals(reports.sales, ['total_sales', 'gross_profit', 'net_profit', 'cost_of_goods_sold']);
      revenue = salesTotals.total_sales || 0;
      cogs = salesTotals.cost_of_goods_sold || (revenue * 0.7);
      grossProfit = salesTotals.gross_profit || (revenue - cogs);
      netProfit = salesTotals.net_profit || (grossProfit * 0.95);
      expenses = grossProfit - netProfit;
    }

    const plData = [
      ['Total Revenue:', formatCurrency(revenue)],
      ['Cost of Goods Sold:', formatCurrency(cogs)],
      ['Gross Profit:', formatCurrency(grossProfit)],
      ['Operating Expenses:', formatCurrency(expenses)],
      ['Net Profit:', formatCurrency(netProfit)],
      ['Profit Margin:', `${revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : '0.00'}%`]
    ];

    doc.autoTable({
      startY: yPosition,
      body: plData,
      theme: 'grid',
      styles: { fontSize: 10 },
      margin: { left: 14 }
    });
  };

  // Render Dashboard
  const renderDashboard = () => {
    const salesTotals = calculateTotals(reports.sales, ['total_sales', 'transactions', 'gross_profit', 'net_profit']);
    const inventory = Array.isArray(reports.inventory) ? reports.inventory : [];
    const lowStockCount = inventory.filter(item => toNumber(item.stock_level) < 10).length;
    const revenue = salesTotals.total_sales || 0;
    const netProfit = salesTotals.net_profit || 0;

    return (
      <div className="reporting-content">
        {/* Quick Stats */}
        <div className="reporting-quick-stats">
          <div className="reporting-stat-card">
            <div className="reporting-stat-label">Total Revenue</div>
            <div className="reporting-stat-value">{formatCurrency(revenue)}</div>
          </div>
          <div className="reporting-stat-card">
            <div className="reporting-stat-label">Profit</div>
            <div className="reporting-stat-value reporting-positive">{formatCurrency(netProfit)}</div>
          </div>
          <div className="reporting-stat-card">
            <div className="reporting-stat-label">Transactions</div>
            <div className="reporting-stat-value">{salesTotals.transactions}</div>
          </div>
          <div className="reporting-stat-card">
            <div className="reporting-stat-label">Low Stock Items</div>
            <div className="reporting-stat-value reporting-negative">{lowStockCount}</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="reporting-charts">
          <div className="reporting-chart-container">
            <h4 className="reporting-chart-title">Sales Performance</h4>
            <div className="reporting-chart-placeholder">
              {reports.sales && reports.sales.length > 0 ? (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'end', height: '200px', gap: '10px' }}>
                    {reports.sales.slice(-7).map((sale, index) => {
                      const maxAmount = Math.max(...reports.sales.slice(-7).map(s => s.total_sales));
                      const height = maxAmount > 0 ? (sale.total_sales / maxAmount) * 180 : 0;
                      return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div
                            style={{
                              width: '30px',
                              height: `${height}px`,
                              backgroundColor: '#8884d8',
                              borderRadius: '4px 4px 0 0',
                              marginBottom: '5px'
                            }}
                            title={`${sale.date}: ${formatCurrency(sale.total_sales)}`}
                          ></div>
                          <span style={{ fontSize: '10px', transform: 'rotate(-45deg)', width: '40px', textAlign: 'center' }}>{sale.date}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>Sales Trend (Last 7 Days)</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px' }}>No sales data available</div>
              )}
            </div>
          </div>
          <div className="reporting-chart-container">
            <h4 className="reporting-chart-title">Top Products</h4>
            <div className="reporting-chart-placeholder">
              {reports.productPerformance && Array.isArray(reports.productPerformance) && reports.productPerformance.length > 0 ? (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'end', height: '200px', gap: '10px' }}>
                    {reports.productPerformance.filter(item => item.product_name !== 'TOTAL').slice(0, 5).map((product, index) => {
                      const maxRevenue = Math.max(...reports.productPerformance.filter(item => item.product_name !== 'TOTAL').slice(0, 5).map(p => p.total_revenue));
                      const height = maxRevenue > 0 ? (product.total_revenue / maxRevenue) * 180 : 0;
                      const name = product.product_name.length > 10 ? product.product_name.substring(0, 10) + '...' : product.product_name;
                      return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div
                            style={{
                              width: '40px',
                              height: `${height}px`,
                              backgroundColor: '#82ca9d',
                              borderRadius: '4px 4px 0 0',
                              marginBottom: '5px',
                              cursor: 'pointer'
                            }}
                            title={`${product.product_name}: ${formatCurrency(product.total_revenue)}`}
                          ></div>
                          <span style={{ fontSize: '10px', textAlign: 'center', width: '50px' }}>{name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>Top 5 Products by Revenue</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px' }}>No product data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="reporting-main-section">
          <div className="reporting-section-header">
            <h3 className="reporting-section-title">Recent Sales</h3>
            <div className="reporting-section-actions">
              <button className="reporting-btn reporting-btn-primary" onClick={() => exportReport('Sales')}>
                Export Sales Report
              </button>
            </div>
          </div>
          <div className="reporting-table-container">
            <table className="reporting-data-table">
              <thead className="reporting-table-header">
                <tr>
                  <th className="reporting-table-head">Date</th>
                  <th className="reporting-table-head">Total Sales</th>
                  <th className="reporting-table-head">Cash</th>
                  <th className="reporting-table-head">Card</th>
                  <th className="reporting-table-head">Mobile</th>
                  <th className="reporting-table-head">Transactions</th>
                </tr>
              </thead>
              <tbody className="reporting-table-body">
                {reports.sales.slice(0, 5).map((sale, index) => (
                  <tr key={index} className="reporting-table-row">
                    <td className="reporting-table-cell">{sale.date}</td>
                    <td className="reporting-table-cell">{formatCurrency(sale.total_sales)}</td>
                    <td className="reporting-table-cell">{formatCurrency(sale.cash_sales)}</td>
                    <td className="reporting-table-cell">{formatCurrency(sale.card_sales)}</td>
                    <td className="reporting-table-cell">{formatCurrency(sale.mobile_sales)}</td>
                    <td className="reporting-table-cell">{sale.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Sales Report
  const renderSalesReport = () => {
    const totals = calculateTotals(reports.sales, ['total_sales', 'cash_sales', 'card_sales', 'mobile_sales', 'transactions']);

    return (
      <div className="reporting-main-section">
        <div className="reporting-section-header">
          <h3 className="reporting-section-title">Sales Report</h3>
          <div className="reporting-section-actions">
            <button className="reporting-btn reporting-btn-primary" onClick={() => exportReport('Sales')}>
              Export PDF
            </button>
          </div>
        </div>

        <div className="reporting-metrics">
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Sales</h4>
            <p className="reporting-metric-value">{formatCurrency(totals.total_sales)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Cash Sales</h4>
            <p className="reporting-metric-value">{formatCurrency(totals.cash_sales)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Card Sales</h4>
            <p className="reporting-metric-value">{formatCurrency(totals.card_sales)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Transactions</h4>
            <p className="reporting-metric-value">{totals.transactions}</p>
          </div>
        </div>

        <div className="reporting-table-container">
          <table className="reporting-data-table">
            <thead className="reporting-table-header">
              <tr>
                <th className="reporting-table-head">Date</th>
                <th className="reporting-table-head">Total Sales</th>
                <th className="reporting-table-head">Cash</th>
                <th className="reporting-table-head">Card</th>
                <th className="reporting-table-head">Mobile</th>
                <th className="reporting-table-head">Transactions</th>
              </tr>
            </thead>
            <tbody className="reporting-table-body">
              {reports.sales.map((sale, index) => (
                <tr key={index} className="reporting-table-row">
                  <td className="reporting-table-cell">{sale.date}</td>
                  <td className="reporting-table-cell">{formatCurrency(sale.total_sales)}</td>
                  <td className="reporting-table-cell">{formatCurrency(sale.cash_sales)}</td>
                  <td className="reporting-table-cell">{formatCurrency(sale.card_sales)}</td>
                  <td className="reporting-table-cell">{formatCurrency(sale.mobile_sales)}</td>
                  <td className="reporting-table-cell">{sale.transactions}</td>
                </tr>
              ))}
              <tr className="reporting-total-row">
                <td className="reporting-table-cell"><strong>Total</strong></td>
                <td className="reporting-table-cell"><strong>{formatCurrency(totals.total_sales)}</strong></td>
                <td className="reporting-table-cell"><strong>{formatCurrency(totals.cash_sales)}</strong></td>
                <td className="reporting-table-cell"><strong>{formatCurrency(totals.card_sales)}</strong></td>
                <td className="reporting-table-cell"><strong>{formatCurrency(totals.mobile_sales)}</strong></td>
                <td className="reporting-table-cell"><strong>{totals.transactions}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Inventory Report
  const renderInventoryReport = () => {
    const inventory = Array.isArray(reports.inventory) ? reports.inventory : [];
    const lowStockItems = inventory.filter(item => toNumber(item.stock_level) < 10);
    const totalValue = inventory.reduce((sum, item) => sum + toNumber(item.value || 0), 0);

    return (
      <div className="reporting-main-section">
        <div className="reporting-section-header">
          <h3 className="reporting-section-title">Inventory Report</h3>
          <div className="reporting-section-actions">
            <button className="reporting-btn reporting-btn-primary" onClick={() => exportReport('Inventory')}>
              Export PDF
            </button>
          </div>
        </div>

        <div className="reporting-metrics">
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Products</h4>
            <p className="reporting-metric-value">{inventory.length}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Low Stock Items</h4>
            <p className="reporting-metric-value reporting-negative">{lowStockItems.length}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Value</h4>
            <p className="reporting-metric-value">{formatCurrency(totalValue)}</p>
          </div>
        </div>

        <div className="reporting-table-container">
          <table className="reporting-data-table">
            <thead className="reporting-table-header">
              <tr>
                <th className="reporting-table-head">Product</th>
                <th className="reporting-table-head">Category</th>
                <th className="reporting-table-head">Stock Level</th>
                <th className="reporting-table-head">Status</th>
                <th className="reporting-table-head">Value</th>
              </tr>
            </thead>
            <tbody className="reporting-table-body">
              {inventory.map((item, index) => (
                <tr key={index} className={`reporting-table-row ${toNumber(item.stock_level) < 10 ? 'reporting-low-stock' : ''}`}>
                  <td className="reporting-table-cell">{item.product}</td>
                  <td className="reporting-table-cell">{item.category}</td>
                  <td className="reporting-table-cell">{item.stock_level}</td>
                  <td className="reporting-table-cell">
                    <span className={`status-badge ${toNumber(item.stock_level) < 5 ? 'cancelled' : toNumber(item.stock_level) < 10 ? 'pending' : 'completed'}`}>
                      {toNumber(item.stock_level) < 5 ? 'Critical' : toNumber(item.stock_level) < 10 ? 'Low' : 'Good'}
                    </span>
                  </td>
                  <td className="reporting-table-cell">{formatCurrency(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Profit & Loss Report
  const renderProfitLossReport = () => {
    // Use actual backend data from profitLoss report if available, otherwise calculate from sales data
    let revenue = 0;
    let cogs = 0;
    let grossProfit = 0;
    let expenses = 0;
    let netProfit = 0;

    if (reports.profitLoss && Object.keys(reports.profitLoss).length > 0) {
      // Use backend profit/loss data
      revenue = reports.profitLoss.total_revenue || 0;
      cogs = reports.profitLoss.cost_of_goods_sold || 0;
      grossProfit = reports.profitLoss.gross_profit || 0;
      expenses = reports.profitLoss.operating_expenses || 0;
      netProfit = reports.profitLoss.net_profit || 0;
    } else {
      // Fallback to sales data calculations
      const salesTotals = calculateTotals(reports.sales, ['total_sales', 'gross_profit', 'net_profit', 'cost_of_goods_sold']);
      revenue = salesTotals.total_sales || 0;
      cogs = salesTotals.cost_of_goods_sold || (revenue * 0.7);
      grossProfit = salesTotals.gross_profit || (revenue - cogs);
      netProfit = salesTotals.net_profit || (grossProfit * 0.95);
      expenses = grossProfit - netProfit;
    }

    return (
      <div className="reporting-main-section">
        <div className="reporting-section-header">
          <h3 className="reporting-section-title">Profit & Loss Report</h3>
          <div className="reporting-section-actions">
            <button className="reporting-btn reporting-btn-primary" onClick={() => exportReport('Profit & Loss')}>
              Export PDF
            </button>
          </div>
        </div>

        <div className="reporting-metrics">
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Revenue</h4>
            <p className="reporting-metric-value">{formatCurrency(revenue)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Gross Profit</h4>
            <p className="reporting-metric-value">{formatCurrency(grossProfit)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Net Profit</h4>
            <p className={`reporting-metric-value ${netProfit >= 0 ? 'reporting-positive' : 'reporting-negative'}`}>
              {formatCurrency(netProfit)}
            </p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Profit Margin</h4>
            <p className="reporting-metric-value">{revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : '0.00'}%</p>
          </div>
        </div>

        <div className="reporting-table-container">
          <table className="reporting-data-table">
            <thead className="reporting-table-header">
              <tr>
                <th className="reporting-table-head">Item</th>
                <th className="reporting-table-head">Amount</th>
                <th className="reporting-table-head">Percentage</th>
              </tr>
            </thead>
            <tbody className="reporting-table-body">
              <tr className="reporting-table-row">
                <td className="reporting-table-cell">Total Revenue</td>
                <td className="reporting-table-cell">{formatCurrency(revenue)}</td>
                <td className="reporting-table-cell">100%</td>
              </tr>
              <tr className="reporting-table-row">
                <td className="reporting-table-cell">Cost of Goods Sold</td>
                <td className="reporting-table-cell">{formatCurrency(cogs)}</td>
                <td className="reporting-table-cell">{revenue > 0 ? ((cogs / revenue) * 100).toFixed(2) : '0.00'}%</td>
              </tr>
              <tr className="reporting-table-row">
                <td className="reporting-table-cell">Gross Profit</td>
                <td className="reporting-table-cell">{formatCurrency(grossProfit)}</td>
                <td className="reporting-table-cell">{revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(2) : '0.00'}%</td>
              </tr>
              <tr className="reporting-table-row">
                <td className="reporting-table-cell">Operating Expenses</td>
                <td className="reporting-table-cell">{formatCurrency(expenses)}</td>
                <td className="reporting-table-cell">{revenue > 0 ? ((expenses / revenue) * 100).toFixed(2) : '0.00'}%</td>
              </tr>
              <tr className="reporting-total-row">
                <td className="reporting-table-cell"><strong>Net Profit</strong></td>
                <td className="reporting-table-cell"><strong>{formatCurrency(netProfit)}</strong></td>
                <td className="reporting-table-cell"><strong>{revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : '0.00'}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Product Performance
  const renderProductPerformance = () => {
    const productData = Array.isArray(reports.productPerformance) ? reports.productPerformance : [];
    const filteredProducts = productData.filter(item =>
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="reporting-main-section">
        <div className="reporting-section-header">
          <h3 className="reporting-section-title">Top Products</h3>
          <div className="reporting-section-actions">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="reporting-search-input"
              style={{ marginRight: '10px', padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button className="reporting-btn reporting-btn-primary" onClick={() => exportReport('Product Performance')}>
              Export PDF
            </button>
          </div>
        </div>

        <div className="reporting-table-container" style={{ overflowX: 'auto', maxWidth: '100%', maxHeight: '500px', overflowY: 'auto' }}>
          <table className="reporting-data-table" style={{ minWidth: '1200px', fontSize: '12px' }}>
            <thead className="reporting-table-header" style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <tr>
                <th className="reporting-table-head" style={{ minWidth: '150px' }}>Product Name</th>
                <th className="reporting-table-head" style={{ minWidth: '80px' }}>SKU</th>
                <th className="reporting-table-head" style={{ minWidth: '70px' }}>BP</th>
                <th className="reporting-table-head" style={{ minWidth: '70px' }}>Retail SP</th>
                <th className="reporting-table-head" style={{ minWidth: '80px' }}>Wholesale SP</th>
                <th className="reporting-table-head" style={{ minWidth: '70px' }}>Retail Qty</th>
                <th className="reporting-table-head" style={{ minWidth: '80px' }}>Wholesale Qty</th>
                <th className="reporting-table-head" style={{ minWidth: '70px' }}>Total Qty</th>
                <th className="reporting-table-head" style={{ minWidth: '90px' }}>Retail Revenue</th>
                <th className="reporting-table-head" style={{ minWidth: '100px' }}>Wholesale Revenue</th>
                <th className="reporting-table-head" style={{ minWidth: '90px' }}>Total Revenue</th>
                <th className="reporting-table-head" style={{ minWidth: '80px' }}>Retail Profit</th>
                <th className="reporting-table-head" style={{ minWidth: '90px' }}>Wholesale Profit</th>
                <th className="reporting-table-head" style={{ minWidth: '80px' }}>Total Profit</th>
              </tr>
            </thead>
            <tbody className="reporting-table-body">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="14" className="reporting-table-cell" style={{ textAlign: 'center' }}>
                    {productData.length === 0 ? 'No product performance data available for the selected date range.' : 'No products match your search.'}
                  </td>
                </tr>
              ) : (
                <>
                  {filteredProducts.filter(item => item.product_name !== 'TOTAL').map((product, index) => (
                    <tr key={index} className="reporting-table-row">
                      <td className="reporting-table-cell" style={{ fontWeight: '500' }}>{product.product_name}</td>
                      <td className="reporting-table-cell" style={{ fontSize: '11px' }}>{product.sku}</td>
                      <td className="reporting-table-cell" style={{ fontSize: '11px' }}>{formatCurrency(product.buying_price)}</td>
                      <td className="reporting-table-cell" style={{ fontSize: '11px' }}>{formatCurrency(product.retail_price)}</td>
                      <td className="reporting-table-cell" style={{ fontSize: '11px' }}>{formatCurrency(product.wholesale_price)}</td>
                      <td className="reporting-table-cell" style={{ textAlign: 'center' }}>{product.retail_quantity}</td>
                      <td className="reporting-table-cell" style={{ textAlign: 'center' }}>{product.wholesale_quantity}</td>
                      <td className="reporting-table-cell" style={{ textAlign: 'center', fontWeight: '600' }}>{product.total_quantity}</td>
                      <td className="reporting-table-cell" style={{ fontSize: '11px' }}>{formatCurrency(product.retail_revenue)}</td>
                      <td className="reporting-table-cell" style={{ fontSize: '11px' }}>{formatCurrency(product.wholesale_revenue)}</td>
                      <td className="reporting-table-cell" style={{ fontSize: '11px', fontWeight: '600' }}>{formatCurrency(product.total_revenue)}</td>
                      <td className="reporting-table-cell reporting-positive" style={{ fontSize: '11px' }}>{formatCurrency(product.retail_profit)}</td>
                      <td className="reporting-table-cell reporting-positive" style={{ fontSize: '11px' }}>{formatCurrency(product.wholesale_profit)}</td>
                      <td className="reporting-table-cell reporting-positive" style={{ fontSize: '11px', fontWeight: '600' }}>{formatCurrency(product.total_profit)}</td>
                    </tr>
                  ))}
                  {filteredProducts.filter(item => item.product_name === 'TOTAL').map((total, index) => (
                    <tr key={`total-${index}`} className="reporting-total-row" style={{ position: 'sticky', bottom: 0, background: 'white', zIndex: 1, boxShadow: '0 -2px 4px rgba(0,0,0,0.1)' }}>
                      <td className="reporting-table-cell"><strong>{total.product_name}</strong></td>
                      <td className="reporting-table-cell"></td>
                      <td className="reporting-table-cell"></td>
                      <td className="reporting-table-cell"></td>
                      <td className="reporting-table-cell"></td>
                      <td className="reporting-table-cell" style={{ textAlign: 'center' }}><strong>{total.retail_quantity}</strong></td>
                      <td className="reporting-table-cell" style={{ textAlign: 'center' }}><strong>{total.wholesale_quantity}</strong></td>
                      <td className="reporting-table-cell" style={{ textAlign: 'center' }}><strong>{total.total_quantity}</strong></td>
                      <td className="reporting-table-cell"><strong>{formatCurrency(total.retail_revenue)}</strong></td>
                      <td className="reporting-table-cell"><strong>{formatCurrency(total.wholesale_revenue)}</strong></td>
                      <td className="reporting-table-cell"><strong>{formatCurrency(total.total_revenue)}</strong></td>
                      <td className="reporting-table-cell reporting-positive"><strong>{formatCurrency(total.retail_profit)}</strong></td>
                      <td className="reporting-table-cell reporting-positive"><strong>{formatCurrency(total.wholesale_profit)}</strong></td>
                      <td className="reporting-table-cell reporting-positive"><strong>{formatCurrency(total.total_profit)}</strong></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="reporting-page">
      <div className="reporting-page-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'white', padding: '10px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 className="reporting-page-title">Business Intelligence Dashboard</h1>
        <div className="reporting-filters">
          <div className="reporting-filter-group">
            <label className="reporting-filter-label">Start Date:</label>
            <input
              type="date"
              className="reporting-date-input"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <div className="reporting-filter-group">
            <label className="reporting-filter-label">End Date:</label>
            <input
              type="date"
              className="reporting-date-input"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
          <button 
            className="reporting-btn reporting-btn-secondary" 
            onClick={generateReports}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="reporting-tabs">
        <button
          className={`reporting-tab ${activeTab === 'dashboard' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`reporting-tab ${activeTab === 'sales' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          💰 Sales Report
        </button>
        <button
          className={`reporting-tab ${activeTab === 'inventory' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Inventory
        </button>
        <button
          className={`reporting-tab ${activeTab === 'profit' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('profit')}
        >
          📈 Profit & Loss
        </button>
        <button
          className={`reporting-tab ${activeTab === 'products' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          🏆 Top Products
        </button>
      </div>

      {loading ? (
        <div className="reporting-loading">Loading reports...</div>
      ) : error ? (
        <div className="reporting-error">
          <h3 className="reporting-error-title">Error Loading Reports</h3>
          <p className="reporting-error-message">{error}</p>
          <div className="reporting-error-actions">
            <button className="reporting-btn reporting-btn-primary" onClick={generateReports}>
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'sales' && renderSalesReport()}
          {activeTab === 'inventory' && renderInventoryReport()}
          {activeTab === 'profit' && renderProfitLossReport()}
          {activeTab === 'products' && renderProductPerformance()}
        </>
      )}
    </div>
  );
};

export default ReportingPage;