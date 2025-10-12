import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency, toNumber, reportsAPI, purchaseOrdersAPI, inventoryAPI } from '../../services/ApiService/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ReportingPage.css';

// Extend jsPDF with autoTable
if (typeof jsPDF !== 'undefined') {
  jsPDF.API.autoTable = autoTable;
}

const ReportingPage = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reports, setReports] = useState({
    sales: [],
    inventory: [],
    customers: [],
    shifts: [],
    profitLoss: [],
    products: [],
    suppliers: [],
    purchaseOrders: [],
    profitAnalysis: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateProfitAnalysis = useCallback((purchaseOrders, sales, inventory) => {
    // Calculate total purchase costs
    const totalPurchaseCost = purchaseOrders.reduce((sum, order) => {
      if (order.status === 'received' && order.items) {
        return sum + order.items.reduce((orderSum, item) => {
          return orderSum + (toNumber(item.quantity) * toNumber(item.unit_price));
        }, 0);
      }
      return sum;
    }, 0);

    // Calculate sales by type (retail vs wholesale)
    const retailSales = sales.filter(sale => sale.sale_type === 'retail' || !sale.sale_type);
    const wholesaleSales = sales.filter(sale => sale.sale_type === 'wholesale');

    const retailRevenue = calculateTotals(retailSales, ['total_sales']).total_sales;
    const wholesaleRevenue = calculateTotals(wholesaleSales, ['total_sales']).total_sales;
    const totalRevenue = retailRevenue + wholesaleRevenue;

    // Calculate cost of goods sold (COGS) - using average purchase price
    const productCostMap = {};
    inventory.forEach(product => {
      productCostMap[product.id] = toNumber(product.cost_price || product.purchase_price || 0);
    });

    // For simplicity, assume 70% of revenue is COGS (this would need actual sales item data)
    const estimatedCOGS = totalRevenue * 0.7;
    const grossProfit = totalRevenue - estimatedCOGS;
    const netProfit = grossProfit - (totalRevenue * 0.1); // Assume 10% operating expenses

    // Calculate next purchase ability (assume 50% of profits can be used for purchases)
    const nextPurchaseCapacity = Math.max(0, netProfit * 0.5);

    return {
      period: {
        start: dateRange.start,
        end: dateRange.end
      },
      purchaseOrders: {
        total: purchaseOrders.length,
        received: purchaseOrders.filter(o => o.status === 'received').length,
        pending: purchaseOrders.filter(o => o.status === 'pending').length,
        totalValue: totalPurchaseCost
      },
      sales: {
        retail: {
          revenue: retailRevenue,
          transactions: retailSales.length
        },
        wholesale: {
          revenue: wholesaleRevenue,
          transactions: wholesaleSales.length
        },
        combined: {
          revenue: totalRevenue,
          transactions: sales.length
        }
      },
      profitAnalysis: {
        totalRevenue,
        estimatedCOGS,
        grossProfit,
        operatingExpenses: totalRevenue * 0.1,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      },
      nextPurchase: {
        capacity: nextPurchaseCapacity,
        percentageOfProfit: 50,
        recommendation: nextPurchaseCapacity > totalPurchaseCost * 0.1 ?
          'Good capacity for restocking' : 'Limited capacity - focus on high-margin items'
      },
      inventory: {
        totalProducts: inventory.length,
        totalValue: inventory.reduce((sum, product) =>
          sum + (toNumber(product.stock_quantity) * toNumber(product.cost_price || 0)), 0),
        lowStockItems: inventory.filter(p => toNumber(p.stock_quantity) < 10).length
      }
    };
  }, [dateRange]);

  const generateReports = useCallback(async () => {
    setLoading(true);
    try {
      const reportPromises = [];

      if (activeTab === 'sales' || activeTab === 'all') {
        reportPromises.push(
          reportsAPI.generateSalesReport(null, {
            date_from: dateRange.start,
            date_to: dateRange.end
          }).then(response => ({
            type: 'sales',
            data: response || []
          }))
        );
      }

      if (activeTab === 'inventory' || activeTab === 'all') {
        reportPromises.push(
          reportsAPI.generateInventoryReport()
            .then(response => ({
              type: 'inventory',
              data: response || []
            }))
        );
      }

      if (activeTab === 'customers' || activeTab === 'all') {
        reportPromises.push(
          reportsAPI.generateCustomerReport()
            .then(response => ({
              type: 'customers',
              data: response || []
            }))
        );
      }

      if (activeTab === 'shifts' || activeTab === 'all') {
        reportPromises.push(
          reportsAPI.getShiftSummary()
            .then(response => ({
              type: 'shifts',
              data: response || []
            }))
        );
      }

      if (activeTab === 'profitLoss' || activeTab === 'all') {
        // Use sales data to generate profit/loss analysis
        reportPromises.push(
          reportsAPI.generateSalesReport(null, {
            date_from: dateRange.start,
            date_to: dateRange.end
          }).then(salesData => {
            const sales = salesData || [];
            const totalRevenue = calculateTotals(sales, ['total_sales']).total_sales;
            const estimatedCOGS = totalRevenue * 0.7; // Estimate 70% COGS
            const grossProfit = totalRevenue - estimatedCOGS;
            const operatingExpenses = totalRevenue * 0.1; // Estimate 10% operating expenses
            const netProfit = grossProfit - operatingExpenses;
            const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

            return {
              type: 'profitLoss',
              data: {
                date_from: dateRange.start,
                date_to: dateRange.end,
                total_revenue: totalRevenue,
                cost_of_goods_sold: estimatedCOGS,
                gross_profit: grossProfit,
                operating_expenses: operatingExpenses,
                net_profit: netProfit,
                profit_margin_percentage: profitMargin
              }
            };
          }).catch(error => {
            console.error('Error generating profit/loss report:', error);
            return {
              type: 'profitLoss',
              data: {
                date_from: dateRange.start,
                date_to: dateRange.end,
                total_revenue: 0,
                cost_of_goods_sold: 0,
                gross_profit: 0,
                operating_expenses: 0,
                net_profit: 0,
                profit_margin_percentage: 0
              }
            };
          })
        );
      }

      if (activeTab === 'products' || activeTab === 'all') {
        reportPromises.push(
          reportsAPI.generateSalesReport(null, {
            date_from: dateRange.start,
            date_to: dateRange.end
          }).then(response => ({
            type: 'products',
            data: response || []
          }))
        );
      }

      if (activeTab === 'suppliers' || activeTab === 'all') {
        reportPromises.push(
          reportsAPI.generateInventoryReport()
            .then(response => ({
              type: 'suppliers',
              data: response || []
            }))
        );
      }

      if (activeTab === 'purchaseOrders' || activeTab === 'all') {
        reportPromises.push(
          purchaseOrdersAPI.getPurchaseOrders()
            .then(response => ({
              type: 'purchaseOrders',
              data: response || []
            }))
            .catch(error => {
              console.error('Error fetching purchase orders:', error);
              return { type: 'purchaseOrders', data: [] };
            })
        );

        // Also fetch sales data for profit analysis
        reportPromises.push(
          reportsAPI.generateSalesReport(null, {
            date_from: dateRange.start,
            date_to: dateRange.end
          }).then(response => ({
            type: 'sales',
            data: response || []
          })).catch(error => {
            console.error('Error fetching sales for profit analysis:', error);
            return { type: 'sales', data: [] };
          })
        );

        // Generate profit analysis using the same sales data fetched above
        reportPromises.push(
          Promise.all([
            purchaseOrdersAPI.getPurchaseOrders().catch(() => []),
            reportsAPI.generateSalesReport(null, {
              date_from: dateRange.start,
              date_to: dateRange.end
            }).catch(() => []),
            inventoryAPI.products.getAll().catch(() => [])
          ])
            .then(([purchaseOrders, sales, inventory]) => {
              const profitAnalysis = generateProfitAnalysis(purchaseOrders, sales, inventory);
              return {
                type: 'profitAnalysis',
                data: profitAnalysis
              };
            })
            .catch(error => {
              console.error('Error generating profit analysis:', error);
              return { type: 'profitAnalysis', data: {} };
            })
        );
      }

      const results = await Promise.all(reportPromises);
      const newReports = { ...reports };

      results.forEach(result => {
        newReports[result.type] = result.data;
      });

      setReports(newReports);
    } catch (error) {
      console.error('Error generating reports:', error);
      setError(`Failed to load reports: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, generateProfitAnalysis, reports]);

  useEffect(() => {
    generateReports();
  }, [dateRange, generateReports]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const exportReport = useCallback((reportType) => {
    try {
      const reportData = reports[reportType.toLowerCase() + 's'] || reports[reportType.toLowerCase()] || reports[reportType.toLowerCase() + 'Loss'];
      if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
        alert(`No ${reportType} data available to export. Please generate reports first.`);
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(`${reportType} Report`, 14, 22);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      doc.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, 14, 40);

      let yPosition = 50;

      if (reportType === 'Sales') {
        exportSalesReport(doc, yPosition);
      } else if (reportType === 'Inventory') {
        exportInventoryReport(doc, yPosition);
      } else if (reportType === 'Customer') {
        exportCustomerReport(doc, yPosition);
      } else if (reportType === 'Shift') {
        exportShiftReport(doc, yPosition);
      } else if (reportType === 'ProfitLoss') {
        exportProfitLossReport(doc, yPosition);
      } else if (reportType === 'Products') {
        exportProductsReport(doc, yPosition);
      } else if (reportType === 'Suppliers') {
        exportSuppliersReport(doc, yPosition);
      }

      doc.save(`${reportType.toLowerCase()}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error generating ${reportType} PDF: ${error.message || 'Please try again.'}`);
    }
  }, [reports, dateRange]);

  const exportSalesReport = (doc, yPosition) => {
    try {
      const totals = calculateTotals(reports.sales, ['total_sales', 'cash_sales', 'card_sales', 'mobile_sales', 'transactions']);

      doc.setFontSize(14);
      doc.text('Summary', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Total Sales: ${formatCurrency(totals.total_sales)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Cash Sales: ${formatCurrency(totals.cash_sales)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Card Sales: ${formatCurrency(totals.card_sales)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Mobile Sales: ${formatCurrency(totals.mobile_sales)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Total Transactions: ${totals.transactions}`, 14, yPosition);
      yPosition += 15;

      const tableData = reports.sales.map(row => [
        row.date,
        formatCurrency(row.total_sales),
        formatCurrency(row.cash_sales),
        formatCurrency(row.card_sales),
        formatCurrency(row.mobile_sales),
        row.transactions.toString()
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Date', 'Total Sales', 'Cash', 'Card', 'Mobile', 'Transactions']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
    } catch (error) {
      console.error('Error generating sales report PDF:', error);
      doc.setFontSize(12);
      doc.text('Error generating sales report. Please check data format.', 14, yPosition);
    }
  };

  const exportInventoryReport = (doc, yPosition) => {
    try {
      const totals = calculateTotals(reports.inventory, ['stock_level', 'sold_today', 'value']);

      doc.setFontSize(14);
      doc.text('Summary', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Total Stock Value: ${formatCurrency(totals.value)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Total Items Sold Today: ${totals.sold_today}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Low Stock Items: ${reports.inventory.filter(item => item.stock_level < 50).length}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Total Products: ${reports.inventory.length}`, 14, yPosition);
      yPosition += 15;

      const tableData = reports.inventory.map(row => [
        row.product || 'N/A',
        row.category || 'Uncategorized',
        row.stock_level?.toString() || '0',
        row.sold_today?.toString() || '0',
        formatCurrency(row.value || 0)
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Product', 'Category', 'Stock Level', 'Sold Today', 'Value']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
    } catch (error) {
      console.error('Error generating inventory report PDF:', error);
      doc.setFontSize(12);
      doc.text('Error generating inventory report. Please check data format.', 14, yPosition);
    }
  };

  const exportCustomerReport = (doc, yPosition) => {
    const totals = calculateTotals(reports.customers, ['total_purchases', 'loyalty_points']);

    doc.setFontSize(14);
    doc.text('Summary', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Total Customer Value: ${formatCurrency(totals.total_purchases)}`, 14, yPosition);
    yPosition += 8;
    doc.text(`Active Customers: ${reports.customers.length}`, 14, yPosition);
    yPosition += 8;
    doc.text(`Avg Customer Value: ${formatCurrency(totals.total_purchases / reports.customers.length)}`, 14, yPosition);
    yPosition += 15;

    const tableData = reports.customers.map(row => [
      row.name,
      row.phone || '',
      formatCurrency(row.total_purchases),
      row.last_visit || '',
      row.loyalty_points.toString()
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Customer Name', 'Phone', 'Total Purchases', 'Last Visit', 'Loyalty Points']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
  };

  const exportShiftReport = (doc, yPosition) => {
    const totals = calculateTotals(reports.shifts, ['total_sales', 'discrepancy']);

    doc.setFontSize(14);
    doc.text('Summary', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Total Shift Sales: ${formatCurrency(totals.total_sales)}`, 14, yPosition);
    yPosition += 8;
    doc.text(`Total Discrepancy: ${formatCurrency(totals.discrepancy)}`, 14, yPosition);
    yPosition += 8;
    doc.text(`Shifts Completed: ${reports.shifts.length}`, 14, yPosition);
    yPosition += 15;

    const tableData = reports.shifts.map(row => [
      row.cashier,
      row.shift_date,
      `${row.start_time} - ${row.end_time}`,
      formatCurrency(row.opening_balance),
      formatCurrency(row.closing_balance),
      formatCurrency(row.total_sales),
      formatCurrency(row.discrepancy)
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Cashier', 'Date', 'Shift Time', 'Opening Balance', 'Closing Balance', 'Total Sales', 'Discrepancy']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
  };

  const exportProfitLossReport = (doc, yPosition) => {
    const data = reports.profitLoss;

    doc.setFontSize(14);
    doc.text('Profit & Loss Summary', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Period: ${data.date_from || dateRange.start} to ${data.date_to || dateRange.end}`, 14, yPosition);
    yPosition += 10;
    doc.text(`Total Revenue: ${formatCurrency(data.total_revenue || 0)}`, 14, yPosition);
    yPosition += 8;
    doc.text(`Cost of Goods Sold: ${formatCurrency(data.cost_of_goods_sold || 0)}`, 14, yPosition);
    yPosition += 8;
    doc.text(`Gross Profit: ${formatCurrency(data.gross_profit || 0)}`, 14, yPosition);
    yPosition += 8;
    doc.text(`Operating Expenses: ${formatCurrency(data.operating_expenses || 0)}`, 14, yPosition);
    yPosition += 8;
    doc.text(`Net Profit: ${formatCurrency(data.net_profit || 0)}`, 14, yPosition);
    yPosition += 8;
    doc.text(`Profit Margin: ${((data.profit_margin_percentage || 0) * 100).toFixed(2)}%`, 14, yPosition);
  };

  const exportProductsReport = (doc, yPosition) => {
    const tableData = reports.products.map(row => [
      row.date,
      formatCurrency(row.total_sales),
      formatCurrency(row.cash_sales),
      formatCurrency(row.mobile_sales),
      row.transactions.toString()
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Date', 'Total Sales', 'Cash Sales', 'Mobile Sales', 'Transactions']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
  };

  const exportSuppliersReport = (doc, yPosition) => {
    const tableData = reports.suppliers.map(row => [
      row.product,
      row.category,
      row.stock_level.toString(),
      formatCurrency(row.value)
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Product', 'Category', 'Stock Level', 'Value']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
  };

  const exportPurchaseOrdersReport = useCallback(() => {
    try {
      const profitData = reports.profitAnalysis || {};
      const purchaseOrders = reports.purchaseOrders || [];

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Purchase Orders & Profit Analysis Report', 14, 22);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 40);

      let yPosition = 50;

      // Purchase Orders Summary
      doc.setFontSize(14);
      doc.text('Purchase Orders Summary', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Total Orders: ${profitData.purchaseOrders?.total || 0}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Received Orders: ${profitData.purchaseOrders?.received || 0}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Pending Orders: ${profitData.purchaseOrders?.pending || 0}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Total Purchase Value: ${formatCurrency(profitData.purchaseOrders?.totalValue || 0)}`, 14, yPosition);
      yPosition += 15;

      // Sales Performance
      doc.setFontSize(14);
      doc.text('Sales Performance', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Retail Sales: ${formatCurrency(profitData.sales?.retail?.revenue || 0)} (${profitData.sales?.retail?.transactions || 0} transactions)`, 14, yPosition);
      yPosition += 8;
      doc.text(`Wholesale Sales: ${formatCurrency(profitData.sales?.wholesale?.revenue || 0)} (${profitData.sales?.wholesale?.transactions || 0} transactions)`, 14, yPosition);
      yPosition += 8;
      doc.text(`Combined Sales: ${formatCurrency(profitData.sales?.combined?.revenue || 0)} (${profitData.sales?.combined?.transactions || 0} transactions)`, 14, yPosition);
      yPosition += 15;

      // Profit Analysis
      doc.setFontSize(14);
      doc.text('Profit & Loss Analysis', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Total Revenue: ${formatCurrency(profitData.profitAnalysis?.totalRevenue || 0)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Cost of Goods Sold: ${formatCurrency(profitData.profitAnalysis?.estimatedCOGS || 0)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Gross Profit: ${formatCurrency(profitData.profitAnalysis?.grossProfit || 0)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Operating Expenses: ${formatCurrency(profitData.profitAnalysis?.operatingExpenses || 0)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Net Profit: ${formatCurrency(profitData.profitAnalysis?.netProfit || 0)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Profit Margin: ${(profitData.profitAnalysis?.profitMargin || 0).toFixed(2)}%`, 14, yPosition);
      yPosition += 15;

      // Next Purchase Capacity
      doc.setFontSize(14);
      doc.text('Next Purchase Capacity', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Available for Purchases: ${formatCurrency(profitData.nextPurchase?.capacity || 0)}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Recommendation: ${profitData.nextPurchase?.recommendation || 'N/A'}`, 14, yPosition);
      yPosition += 15;

      // Purchase Orders Table
      if (purchaseOrders.length > 0) {
        doc.setFontSize(14);
        doc.text('Purchase Orders Details', 14, yPosition);
        yPosition += 10;

        const tableData = purchaseOrders.map(order => [
          order.order_number || order.id,
          order.supplier_name || 'N/A',
          order.order_date,
          order.status,
          order.items?.length || 0,
          formatCurrency(order.total_amount || 0)
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Order #', 'Supplier', 'Date', 'Status', 'Items', 'Total Value']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] }
        });
      }

      doc.save(`purchase_orders_profit_analysis_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating purchase orders PDF:', error);
      alert(`Error generating Purchase Orders PDF: ${error.message || 'Please try again.'}`);
    }
  }, [reports, dateRange]);

  const calculateTotals = (data, fields) => {
    return fields.reduce((totals, field) => {
      totals[field] = data.reduce((sum, item) => sum + toNumber(item[field]), 0);
      return totals;
    }, {});
  };


  const renderSalesReport = () => {
    const totals = calculateTotals(reports.sales, ['total_sales', 'cash_sales', 'card_sales', 'mobile_sales', 'transactions']);

    return (
      <div className="reporting-section">
        <div className="reporting-header">
          <h3 className="reporting-title">Sales Report</h3>
          <button className="reporting-export-btn reporting-export-primary" onClick={() => exportReport('Sales')}>
            Export PDF
          </button>
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
            <h4 className="reporting-metric-label">Mobile Sales</h4>
            <p className="reporting-metric-value">{formatCurrency(totals.mobile_sales)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Transactions</h4>
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
              {reports.sales.map((row, index) => (
                <tr key={index} className="reporting-table-row">
                  <td className="reporting-table-cell">{row.date}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.total_sales)}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.cash_sales)}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.card_sales)}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.mobile_sales)}</td>
                  <td className="reporting-table-cell">{row.transactions}</td>
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

  const renderInventoryReport = () => {
    const totals = calculateTotals(reports.inventory, ['stock_level', 'sold_today', 'value']);

    return (
      <div className="reporting-section">
        <div className="reporting-header">
          <h3 className="reporting-title">Inventory Report</h3>
          <button className="reporting-export-btn reporting-export-primary" onClick={() => exportReport('Inventory')}>
            Export PDF
          </button>
        </div>

        <div className="reporting-metrics">
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Stock Value</h4>
            <p className="reporting-metric-value">{formatCurrency(totals.value)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Items Sold Today</h4>
            <p className="reporting-metric-value">{totals.sold_today}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Low Stock Items</h4>
            <p className="reporting-metric-value">{reports.inventory.filter(item => item.stock_level < 50).length}</p>
          </div>
        </div>

        <div className="reporting-table-container">
          <table className="reporting-data-table">
            <thead className="reporting-table-header">
              <tr>
                <th className="reporting-table-head">Product</th>
                <th className="reporting-table-head">Category</th>
                <th className="reporting-table-head">Stock Level</th>
                <th className="reporting-table-head">Sold Today</th>
                <th className="reporting-table-head">Value</th>
              </tr>
            </thead>
            <tbody className="reporting-table-body">
              {reports.inventory.map((row, index) => (
                <tr key={index} className={`reporting-table-row ${row.stock_level < 50 ? 'reporting-low-stock' : ''}`}>
                  <td className="reporting-table-cell">{row.product}</td>
                  <td className="reporting-table-cell">{row.category}</td>
                  <td className="reporting-table-cell">{row.stock_level}</td>
                  <td className="reporting-table-cell">{row.sold_today}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCustomerReport = () => {
    const totals = calculateTotals(reports.customers, ['total_purchases', 'loyalty_points']);

    return (
      <div className="reporting-section">
        <div className="reporting-header">
          <h3 className="reporting-title">Customer Report</h3>
          <button className="reporting-export-btn reporting-export-primary" onClick={() => exportReport('Customer')}>
            Export PDF
          </button>
        </div>

        <div className="reporting-metrics">
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Customer Value</h4>
            <p className="reporting-metric-value">{formatCurrency(totals.total_purchases)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Active Customers</h4>
            <p className="reporting-metric-value">{reports.customers.length}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Avg Customer Value</h4>
            <p className="reporting-metric-value">{formatCurrency(totals.total_purchases / reports.customers.length)}</p>
          </div>
        </div>

        <div className="reporting-table-container">
          <table className="reporting-data-table">
            <thead className="reporting-table-header">
              <tr>
                <th className="reporting-table-head">Customer Name</th>
                <th className="reporting-table-head">Phone</th>
                <th className="reporting-table-head">Total Purchases</th>
                <th className="reporting-table-head">Last Visit</th>
                <th className="reporting-table-head">Loyalty Points</th>
              </tr>
            </thead>
            <tbody className="reporting-table-body">
              {reports.customers.map((row, index) => (
                <tr key={index} className="reporting-table-row">
                  <td className="reporting-table-cell">{row.name}</td>
                  <td className="reporting-table-cell">{row.phone}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.total_purchases)}</td>
                  <td className="reporting-table-cell">{row.last_visit}</td>
                  <td className="reporting-table-cell">{row.loyalty_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderShiftReport = () => {
    const totals = calculateTotals(reports.shifts, ['total_sales', 'discrepancy']);

    return (
      <div className="reporting-section">
        <div className="reporting-header">
          <h3 className="reporting-title">Shift Report</h3>
          <button className="reporting-export-btn reporting-export-primary" onClick={() => exportReport('Shift')}>
            Export PDF
          </button>
        </div>

        <div className="reporting-metrics">
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Shift Sales</h4>
            <p className="reporting-metric-value">{formatCurrency(totals.total_sales)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Discrepancy</h4>
            <p className={`reporting-metric-value ${totals.discrepancy >= 0 ? 'reporting-positive' : 'reporting-negative'}`}>
              {formatCurrency(totals.discrepancy)}
            </p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Shifts Completed</h4>
            <p className="reporting-metric-value">{reports.shifts.length}</p>
          </div>
        </div>

        <div className="reporting-table-container">
          <table className="reporting-data-table">
            <thead className="reporting-table-header">
              <tr>
                <th className="reporting-table-head">Cashier</th>
                <th className="reporting-table-head">Date</th>
                <th className="reporting-table-head">Shift Time</th>
                <th className="reporting-table-head">Opening Balance</th>
                <th className="reporting-table-head">Closing Balance</th>
                <th className="reporting-table-head">Total Sales</th>
                <th className="reporting-table-head">Discrepancy</th>
              </tr>
            </thead>
            <tbody className="reporting-table-body">
              {reports.shifts.map((row, index) => (
                <tr key={index} className="reporting-table-row">
                  <td className="reporting-table-cell">{row.cashier}</td>
                  <td className="reporting-table-cell">{row.shift_date}</td>
                  <td className="reporting-table-cell">{row.start_time} - {row.end_time}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.opening_balance)}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.closing_balance)}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.total_sales)}</td>
                  <td className={`reporting-table-cell ${row.discrepancy >= 0 ? 'reporting-positive' : 'reporting-negative'}`}>
                    {formatCurrency(row.discrepancy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProfitLossReport = () => {
    const data = reports.profitLoss;

    return (
      <div className="reporting-section">
        <div className="reporting-header">
          <h3 className="reporting-title">Profit & Loss Report</h3>
          <button className="reporting-export-btn reporting-export-primary" onClick={() => exportReport('ProfitLoss')}>
            Export PDF
          </button>
        </div>

        <div className="reporting-metrics">
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Revenue</h4>
            <p className="reporting-metric-value">{formatCurrency(data.total_revenue || 0)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Gross Profit</h4>
            <p className="reporting-metric-value">{formatCurrency(data.gross_profit || 0)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Net Profit</h4>
            <p className={`reporting-metric-value ${(data.net_profit || 0) >= 0 ? 'reporting-positive' : 'reporting-negative'}`}>
              {formatCurrency(data.net_profit || 0)}
            </p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Profit Margin</h4>
            <p className="reporting-metric-value">{((data.profit_margin_percentage || 0) * 100).toFixed(2)}%</p>
          </div>
        </div>

        <div className="reporting-details">
          <div className="reporting-detail-section">
            <h4 className="reporting-detail-title">Revenue & Costs</h4>
            <div className="reporting-detail-grid">
              <div className="reporting-detail-item">
                <span className="reporting-detail-label">Total Revenue:</span>
                <span className="reporting-detail-value">{formatCurrency(data.total_revenue || 0)}</span>
              </div>
              <div className="reporting-detail-item">
                <span className="reporting-detail-label">Cost of Goods Sold:</span>
                <span className="reporting-detail-value">{formatCurrency(data.cost_of_goods_sold || 0)}</span>
              </div>
              <div className="reporting-detail-item">
                <span className="reporting-detail-label">Gross Profit:</span>
                <span className="reporting-detail-value">{formatCurrency(data.gross_profit || 0)}</span>
              </div>
              <div className="reporting-detail-item">
                <span className="reporting-detail-label">Operating Expenses:</span>
                <span className="reporting-detail-value">{formatCurrency(data.operating_expenses || 0)}</span>
              </div>
              <div className="reporting-detail-item">
                <span className="reporting-detail-label">Net Profit:</span>
                <span className={`reporting-detail-value ${(data.net_profit || 0) >= 0 ? 'reporting-positive' : 'reporting-negative'}`}>
                  {formatCurrency(data.net_profit || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProductsReport = () => {
    const totals = calculateTotals(reports.products, ['total_sales', 'cash_sales', 'mobile_sales', 'transactions']);

    return (
      <div className="reporting-section">
        <div className="reporting-header">
          <h3 className="reporting-title">Product Performance Report</h3>
          <button className="reporting-export-btn reporting-export-primary" onClick={() => exportReport('Products')}>
            Export PDF
          </button>
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
            <h4 className="reporting-metric-label">Mobile Sales</h4>
            <p className="reporting-metric-value">{formatCurrency(totals.mobile_sales)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Transactions</h4>
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
                <th className="reporting-table-head">Mobile</th>
                <th className="reporting-table-head">Transactions</th>
              </tr>
            </thead>
            <tbody className="reporting-table-body">
              {reports.products.map((row, index) => (
                <tr key={index} className="reporting-table-row">
                  <td className="reporting-table-cell">{row.date}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.total_sales)}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.cash_sales)}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.mobile_sales)}</td>
                  <td className="reporting-table-cell">{row.transactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSuppliersReport = () => {
    const totals = calculateTotals(reports.suppliers, ['stock_level', 'value']);

    return (
      <div className="reporting-section">
        <div className="reporting-header">
          <h3 className="reporting-title">Supplier Performance Report</h3>
          <button className="reporting-export-btn reporting-export-primary" onClick={() => exportReport('Suppliers')}>
            Export PDF
          </button>
        </div>

        <div className="reporting-metrics">
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Stock Value</h4>
            <p className="reporting-metric-value">{formatCurrency(totals.value)}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Items</h4>
            <p className="reporting-metric-value">{totals.stock_level}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Active Products</h4>
            <p className="reporting-metric-value">{reports.suppliers.length}</p>
          </div>
        </div>

        <div className="reporting-table-container">
          <table className="reporting-data-table">
            <thead className="reporting-table-header">
              <tr>
                <th className="reporting-table-head">Product</th>
                <th className="reporting-table-head">Category</th>
                <th className="reporting-table-head">Stock Level</th>
                <th className="reporting-table-head">Value</th>
              </tr>
            </thead>
            <tbody className="reporting-table-body">
              {reports.suppliers.map((row, index) => (
                <tr key={index} className="reporting-table-row">
                  <td className="reporting-table-cell">{row.product}</td>
                  <td className="reporting-table-cell">{row.category}</td>
                  <td className="reporting-table-cell">{row.stock_level}</td>
                  <td className="reporting-table-cell">{formatCurrency(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPurchaseOrdersReport = () => {
    const profitData = reports.profitAnalysis || {};
    const purchaseOrders = reports.purchaseOrders || [];

    return (
      <div className="reporting-section">
        <div className="reporting-header">
          <h3 className="reporting-title">Purchase Orders & Profit Analysis</h3>
          <button className="reporting-export-btn reporting-export-primary" onClick={() => exportPurchaseOrdersReport()}>
            Export PDF
          </button>
        </div>

        {/* Purchase Orders Summary */}
        <div className="reporting-metrics">
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Purchase Orders</h4>
            <p className="reporting-metric-value">{profitData.purchaseOrders?.total || 0}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Received Orders</h4>
            <p className="reporting-metric-value">{profitData.purchaseOrders?.received || 0}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Pending Orders</h4>
            <p className="reporting-metric-value">{profitData.purchaseOrders?.pending || 0}</p>
          </div>
          <div className="reporting-metric-card">
            <h4 className="reporting-metric-label">Total Purchase Value</h4>
            <p className="reporting-metric-value">{formatCurrency(profitData.purchaseOrders?.totalValue || 0)}</p>
          </div>
        </div>

        {/* Sales Breakdown */}
        <div className="reporting-subsection">
          <h4>Sales Performance</h4>
          <div className="reporting-metrics">
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Retail Sales</h4>
              <p className="reporting-metric-value">{formatCurrency(profitData.sales?.retail?.revenue || 0)}</p>
              <small>{profitData.sales?.retail?.transactions || 0} transactions</small>
            </div>
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Wholesale Sales</h4>
              <p className="reporting-metric-value">{formatCurrency(profitData.sales?.wholesale?.revenue || 0)}</p>
              <small>{profitData.sales?.wholesale?.transactions || 0} transactions</small>
            </div>
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Combined Sales</h4>
              <p className="reporting-metric-value">{formatCurrency(profitData.sales?.combined?.revenue || 0)}</p>
              <small>{profitData.sales?.combined?.transactions || 0} transactions</small>
            </div>
          </div>
        </div>

        {/* Profit Analysis */}
        <div className="reporting-subsection">
          <h4>Profit & Loss Analysis</h4>
          <div className="reporting-metrics">
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Total Revenue</h4>
              <p className="reporting-metric-value">{formatCurrency(profitData.profitAnalysis?.totalRevenue || 0)}</p>
            </div>
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Cost of Goods Sold</h4>
              <p className="reporting-metric-value">{formatCurrency(profitData.profitAnalysis?.estimatedCOGS || 0)}</p>
            </div>
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Gross Profit</h4>
              <p className={`reporting-metric-value ${profitData.profitAnalysis?.grossProfit >= 0 ? 'reporting-positive' : 'reporting-negative'}`}>
                {formatCurrency(profitData.profitAnalysis?.grossProfit || 0)}
              </p>
            </div>
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Net Profit</h4>
              <p className={`reporting-metric-value ${profitData.profitAnalysis?.netProfit >= 0 ? 'reporting-positive' : 'reporting-negative'}`}>
                {formatCurrency(profitData.profitAnalysis?.netProfit || 0)}
              </p>
            </div>
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Profit Margin</h4>
              <p className="reporting-metric-value">{(profitData.profitAnalysis?.profitMargin || 0).toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Next Purchase Capacity */}
        <div className="reporting-subsection">
          <h4>Next Purchase Capacity</h4>
          <div className="reporting-metrics">
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Available for Purchases</h4>
              <p className="reporting-metric-value">{formatCurrency(profitData.nextPurchase?.capacity || 0)}</p>
              <small>{profitData.nextPurchase?.percentageOfProfit || 0}% of net profits</small>
            </div>
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Recommendation</h4>
              <p className="reporting-metric-value">{profitData.nextPurchase?.recommendation || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="reporting-subsection">
          <h4>Current Inventory Status</h4>
          <div className="reporting-metrics">
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Total Products</h4>
              <p className="reporting-metric-value">{profitData.inventory?.totalProducts || 0}</p>
            </div>
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Inventory Value</h4>
              <p className="reporting-metric-value">{formatCurrency(profitData.inventory?.totalValue || 0)}</p>
            </div>
            <div className="reporting-metric-card">
              <h4 className="reporting-metric-label">Low Stock Items</h4>
              <p className="reporting-metric-value">{profitData.inventory?.lowStockItems || 0}</p>
            </div>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="reporting-table-container">
          <h4>Purchase Orders Details</h4>
          <table className="reporting-data-table">
            <thead className="reporting-table-header">
              <tr>
                <th className="reporting-table-head">Order #</th>
                <th className="reporting-table-head">Supplier</th>
                <th className="reporting-table-head">Date</th>
                <th className="reporting-table-head">Status</th>
                <th className="reporting-table-head">Items</th>
                <th className="reporting-table-head">Total Value</th>
              </tr>
            </thead>
            <tbody className="reporting-table-body">
              {purchaseOrders.map((order, index) => (
                <tr key={index} className="reporting-table-row">
                  <td className="reporting-table-cell">{order.order_number || order.id}</td>
                  <td className="reporting-table-cell">{order.supplier_name || 'N/A'}</td>
                  <td className="reporting-table-cell">{order.order_date}</td>
                  <td className="reporting-table-cell">
                    <span className={`status-badge ${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="reporting-table-cell">{order.items?.length || 0}</td>
                  <td className="reporting-table-cell">{formatCurrency(order.total_amount || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="reporting-page">
      <div className="reporting-page-header">
        <h1 className="reporting-page-title">Reports & Analytics</h1>
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
          <button className="reporting-generate-btn reporting-export-secondary" onClick={generateReports}>
            Generate Reports
          </button>
        </div>
      </div>

      <div className="reporting-tabs">
        <button
          className={`reporting-tab ${activeTab === 'sales' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales Reports
        </button>
        <button
          className={`reporting-tab ${activeTab === 'inventory' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory Reports
        </button>
        <button
          className={`reporting-tab ${activeTab === 'customers' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customer Reports
        </button>
        <button
          className={`reporting-tab ${activeTab === 'shifts' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('shifts')}
        >
          Shift Reports
        </button>
        <button
          className={`reporting-tab ${activeTab === 'profitLoss' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('profitLoss')}
        >
          Profit & Loss
        </button>
        <button
          className={`reporting-tab ${activeTab === 'products' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Product Performance
        </button>
        <button
          className={`reporting-tab ${activeTab === 'suppliers' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          Supplier Performance
        </button>
        <button
          className={`reporting-tab ${activeTab === 'purchaseOrders' ? 'reporting-tab-active' : ''}`}
          onClick={() => setActiveTab('purchaseOrders')}
        >
          Purchase Orders & Profit Analysis
        </button>
      </div>

      <div className="reporting-content">
        {loading ? (
          <div className="reporting-loading">Generating reports...</div>
        ) : error ? (
          <div className="reporting-error">
            <h3 className="reporting-error-title">Error Loading Reports</h3>
            <p className="reporting-error-message">{error}</p>
            <div className="reporting-error-actions">
              <button className="reporting-export-btn reporting-export-primary" onClick={() => {
                setError('');
                generateReports();
              }}>
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'sales' && renderSalesReport()}
            {activeTab === 'inventory' && renderInventoryReport()}
            {activeTab === 'customers' && renderCustomerReport()}
            {activeTab === 'shifts' && renderShiftReport()}
            {activeTab === 'profitLoss' && renderProfitLossReport()}
            {activeTab === 'products' && renderProductsReport()}
            {activeTab === 'suppliers' && renderSuppliersReport()}
            {activeTab === 'purchaseOrders' && renderPurchaseOrdersReport()}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportingPage;