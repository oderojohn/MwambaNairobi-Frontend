import React, { useState, useEffect } from 'react';
import '../../../assets/pagesStyles/dashboard.css';
import {
  FiAlertTriangle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { inventoryAPI, shiftsAPI, reportsAPI } from '../../../services/ApiService/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const InventoryDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Removed categories state as it's no longer used
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [posData, setPosData] = useState({
    todaySales: 0,
    totalSales: 0,
    activeShifts: 0,
    totalCustomers: 0,
    salesData: [],
    paymentMethods: [],
    topProducts: [],
    recentTransactions: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [movementsRes, lowStockRes, salesSummaryRes, inventorySummaryRes, customerSummaryRes, shiftSummaryRes, shiftsRes] = await Promise.all([
          inventoryAPI.getStockMovements({ page_size: 10 }),
          inventoryAPI.getLowStock(),
          reportsAPI.getSalesSummary({}),
          inventoryAPI.getInventorySummary(),
          reportsAPI.getCustomerSummary(),
          reportsAPI.getShiftSummary(),
          shiftsAPI.getShifts(6),  // Get only 6 recent shifts
        ]);

        // Get shifts array - handle pagination response
        const shiftsData = shiftsRes?.results || shiftsRes || [];
        
        console.log('Shifts Data:', shiftsData);
        console.log('Shifts Count:', shiftsData.length);

        setLowStockProducts(lowStockRes || []);
        setShifts(shiftsData);
        setInventorySummary(inventorySummaryRes || null);

        // Calculate totals from shifts data - TODAY'S SALES from today's shifts
        const today = new Date().toDateString();
        const totalFromShifts = (shiftsData || []).reduce((sum, shift) => sum + (parseFloat(shift.total_sales) || 0), 0);
        const todayFromShifts = (shiftsData || [])
          .filter(shift => new Date(shift.start_time).toDateString() === today)
          .reduce((sum, shift) => sum + (parseFloat(shift.total_sales) || 0), 0);
        const activeShiftsCount = (shiftsData || []).filter(shift => shift.status === 'open' || shift.status === 'active').length;

        // Get today's sales from the API or calculate from today's shifts
        const todaySalesAPI = salesSummaryRes?.today_sales || 0;
        const todaySales = todaySalesAPI > 0 ? todaySalesAPI : todayFromShifts;

        // Use reports API data if available, otherwise fallback to shifts data
        const totalSales = salesSummaryRes?.total_sales || salesSummaryRes?.totalSales || totalFromShifts;
        const activeShifts = shiftSummaryRes?.active_shifts || shiftSummaryRes?.activeShifts || activeShiftsCount;
        
        // Get total customers from API - check both possible field names
        const totalCustomers = customerSummaryRes?.total_customers 
          || customerSummaryRes?.totalCustomers 
          || customerSummaryRes?.count 
          || customerSummaryRes?.customer_count 
          || 0;

        // Set POS data from API with fallbacks - using correct API field names
        // Note: payment_methods from API is for TODAY only, so we'll use shifts data for all-time
        
        // Calculate payment methods from all shifts sales (all-time)
        const calculatePaymentFromShifts = () => {
          const paymentMap = {};
          let totalPaymentAmount = 0;
          
          (shiftsData || []).forEach(shift => {
            // Use cash_sales as Cash, card_sales as Card, mobile_sales as M-Pesa
            const cashSales = parseFloat(shift.cash_sales || 0);
            const cardSales = parseFloat(shift.card_sales || 0);
            const mobileSales = parseFloat(shift.mobile_sales || 0);
            
            if (cashSales > 0) {
              paymentMap['Cash'] = (paymentMap['Cash'] || 0) + cashSales;
              totalPaymentAmount += cashSales;
            }
            if (cardSales > 0) {
              paymentMap['Card'] = (paymentMap['Card'] || 0) + cardSales;
              totalPaymentAmount += cardSales;
            }
            if (mobileSales > 0) {
              paymentMap['M-Pesa'] = (paymentMap['M-Pesa'] || 0) + mobileSales;
              totalPaymentAmount += mobileSales;
            }
          });
          
          return Object.entries(paymentMap).map(([method, amount]) => ({
            method,
            amount,
            percentage: totalPaymentAmount > 0 ? (amount / totalPaymentAmount * 100) : 0
          }));
        };
        
        // Use today's payment methods from API if available, otherwise use shifts data
        const todayPaymentMethods = Array.isArray(salesSummaryRes?.payment_methods) 
          ? salesSummaryRes.payment_methods
          : [];
        
        const allTimePaymentMethods = calculatePaymentFromShifts();
        const paymentMethods = todayPaymentMethods.length > 0 && todayPaymentMethods.some(pm => pm.amount > 0)
          ? todayPaymentMethods
          : (allTimePaymentMethods.length > 0 ? allTimePaymentMethods : [
              { method: 'Cash', amount: 0, percentage: 0 },
              { method: 'M-Pesa', amount: 0, percentage: 0 },
              { method: 'Card', amount: 0, percentage: 0 }
            ]);

        setPosData({
          todaySales: todaySales,
          totalSales: totalSales,
          activeShifts,
          totalCustomers,
          salesData: salesSummaryRes?.sales_data || salesSummaryRes?.salesData || [],
          paymentMethods,
          topProducts: salesSummaryRes?.top_products || salesSummaryRes?.topProducts || [],
          recentTransactions: salesSummaryRes?.recent_transactions || salesSummaryRes?.recentTransactions || []
        });

        // Set profit/loss - use ONLY backend data (no fallback)
        const revenue = totalSales;
        const totalCost = salesSummaryRes?.total_cost || 0;
        const grossProfit = salesSummaryRes?.gross_profit || 0;
        const netProfit = salesSummaryRes?.net_profit || 0;
        const expenses = grossProfit - netProfit;
        const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100) : 0;
        
        setProfitLoss({
          total_revenue: revenue,
          total_cost: totalCost,
          gross_profit: grossProfit,
          total_expenses: expenses,
          net_profit: netProfit,
          profit_margin: profitMargin
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load dashboard data';
        setError(errorMessage);
        console.error('Full error details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate metrics from inventory summary - using correct API field names
  const totalItems = inventorySummary?.total_items || 0;
  const totalValue = inventorySummary?.total_value || 0;
  const lowStockItems = inventorySummary?.low_stock_items || 0;
  const outOfStockItems = inventorySummary?.out_of_stock_items || 0;

  // Data for line chart (stock movements) - last 1 week
  const stockMovementData = React.useMemo(() => {
    // Try to get data from inventorySummary
    if (inventorySummary?.stock_movement_data && Array.isArray(inventorySummary.stock_movement_data) && inventorySummary.stock_movement_data.length > 0) {
      const movementData = inventorySummary.stock_movement_data;
      // Take only the last 1 week (last entry)
      const recentData = movementData.slice(-1);
      const labels = recentData.map(item => item.week || item.month || 'This Week');

      // Get all unique categories (exclude metadata keys)
      const categories = new Set();
      recentData.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== 'week' && key !== 'month' && key !== 'week_number') {
            categories.add(key);
          }
        });
      });

      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
      ];

      const datasets = Array.from(categories).map((category, index) => ({
        label: category,
        data: recentData.map(item => item[category] || 0),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.3,
      }));

      return { labels, datasets };
    }

    // Fallback: Generate sample data for stock movement visualization (1 week)
    return {
      labels: ['This Week'],
      datasets: [
        {
          label: 'Stock In',
          data: [65],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
        },
        {
          label: 'Stock Out',
          data: [28],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
        }
      ]
    };
  }, [inventorySummary]);

  // Data for sales trend chart - with robust fallback and correct API field names
  const salesTrendData = React.useMemo(() => {
    const salesData = posData.salesData || [];
    
    // Check if we have valid sales data from API
    if (salesData.length > 0 && salesData.some(item => (item.amount || item.total || item.sales || 0) > 0)) {
      const labels = salesData.map(item => item.date || item.day || item.date_created || `Day ${salesData.indexOf(item) + 1}`);
      const data = salesData.map(item => item.amount || item.total || item.sales || 0);
      
      return {
        labels,
        datasets: [
          {
            label: 'Daily Sales',
            data,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      };
    }

    // Fallback sample data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay();
    const adjustedDays = [...days.slice(today), ...days.slice(0, today)];
    
    return {
      labels: adjustedDays,
      datasets: [
        {
          label: 'Daily Sales',
          data: [1200, 1500, 1800, 1400, 2100, 1900, 1600],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [posData.salesData]);

  // Data for payment methods chart - with robust fallback and correct API field names
  const paymentMethodsData = React.useMemo(() => {
    const paymentMethods = posData.paymentMethods || [];
    
    // Check if we have valid payment method data from API
    // API returns array with {method, amount, ...} or {payment_type, amount, ...}
    if (paymentMethods.length > 0 && paymentMethods.some(pm => (pm.amount || pm.total || 0) > 0)) {
      return {
        labels: paymentMethods.map(item => item.method || item.payment_type || 'Unknown'),
        datasets: [
          {
            data: paymentMethods.map(item => item.amount || item.total || 0),
            backgroundColor: [
              '#10b981',
              '#3b82f6',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6'
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    // Fallback sample data
    return {
      labels: ['Cash', 'M-Pesa', 'Card'],
      datasets: [
        {
          data: [60, 30, 10],
          backgroundColor: [
            '#10b981',
            '#3b82f6',
            '#f59e0b'
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [posData.paymentMethods]);


  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11 }
        }
      },
      title: {
        display: true,
        text: 'Stock Movement (This Week)',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        title: { display: true, text: 'Week' }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity',
        },
        grid: { color: '#e5e5e5' }
      },
    },
  };


  const salesTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11 }
        }
      },
      title: {
        display: true,
        text: 'Sales Trend (Last 7 Days)',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => `Sales: KSh ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        title: { display: true, text: 'Day' }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sales Amount (KSh)',
        },
        grid: { color: '#e5e5e5' },
        ticks: {
          callback: (value) => 'KSh ' + value.toLocaleString()
        }
      },
    },
  };

  const paymentMethodsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11 }
        }
      },
      title: {
        display: true,
        text: 'Payment Methods Distribution',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `KSh ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
  };

  if (loading) {
    return (
      <div className="dashboard-page-container">
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          <FiAlertTriangle size={24} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-container">
      <div className="dashboard-header">
        <div className="dashboard-breadcrumbs">
          <Link to="/">Home</Link> / <span>Inventory</span> / <span>Dashboard</span>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-value">{posData.todaySales.toLocaleString()} KSh</div>
          <div className="dashboard-stat-label">Today's Sales</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-value">{posData.totalSales.toLocaleString()} KSh</div>
          <div className="dashboard-stat-label">Total Sales</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-value" style={{ color: (profitLoss?.net_profit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
            {parseFloat(profitLoss?.net_profit || 0).toLocaleString()} KSh
          </div>
          <div className="dashboard-stat-label">Net Profit</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-value">{posData.totalCustomers}</div>
          <div className="dashboard-stat-label">Total Customers</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-value">{totalItems > 0 ? totalItems.toLocaleString() : '-'}</div>
          <div className="dashboard-stat-label">Total Stock Qty</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-value">{totalValue > 0 ? totalValue.toLocaleString() : '-'} KSh</div>
          <div className="dashboard-stat-label">Inventory Value</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-value">{lowStockItems + outOfStockItems}</div>
          <div className="dashboard-stat-label">Stock Alerts</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-content">
        {/* Stock Movement Chart */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Stock Movement</h3>
          </div>
          <div className="dashboard-chart-container">
            <Line data={stockMovementData} options={lineChartOptions} />
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Sales Trend</h3>
          </div>
          <div className="dashboard-chart-container">
            <Line data={salesTrendData} options={salesTrendOptions} />
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Payment Methods</h3>
          </div>
          <div className="dashboard-chart-container">
            <Pie data={paymentMethodsData} options={paymentMethodsOptions} />
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Low Stock Alerts</h3>
          </div>
          {(lowStockProducts.length > 0) ? (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.slice(0, 5).map((product) => (
                  <tr key={product.id}>
                    <td>{product.name || product.product_name}</td>
                    <td>{product.stock_quantity || product.quantity || 0}</td>
                    <td>{product.low_stock_threshold || product.min_stock_level || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : lowStockItems > 0 ? (
            <p style={{ padding: '10px', color: '#666' }}>{lowStockItems} items below threshold</p>
          ) : (
            <p style={{ padding: '10px', color: '#666' }}>No low stock products</p>
          )}
        </div>

        {/* Recent Shifts */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Recent Shifts</h3>
          </div>
          {shifts.length > 0 ? (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td>{new Date(shift.start_time).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${shift.status === 'active' ? 'status-active' : 'status-closed'}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td>{parseFloat(shift.total_sales || 0).toLocaleString()} KSh</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '10px', color: '#666' }}>No recent shifts</p>
          )}
        </div>

        {/* Profit & Loss */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Profit & Loss Summary</h3>
          </div>
          {profitLoss ? (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Revenue</td>
                  <td style={{ color: '#10b981', fontWeight: 'bold' }}>{parseFloat(profitLoss.total_revenue || 0).toLocaleString()} KSh</td>
                </tr>
                <tr>
                  <td>Total Cost</td>
                  <td style={{ color: '#ef4444' }}>{parseFloat(profitLoss.total_cost || 0).toLocaleString()} KSh</td>
                </tr>
                <tr>
                  <td>Gross Profit</td>
                  <td style={{ color: '#10b981', fontWeight: 'bold' }}>{parseFloat(profitLoss.gross_profit || 0).toLocaleString()} KSh</td>
                </tr>
                <tr>
                  <td>Expenses</td>
                  <td style={{ color: '#ef4444' }}>{parseFloat(profitLoss.total_expenses || 0).toLocaleString()} KSh</td>
                </tr>
                <tr>
                  <td><strong>Net Profit</strong></td>
                  <td style={{ 
                    color: (profitLoss.net_profit || 0) >= 0 ? '#10b981' : '#ef4444', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>{parseFloat(profitLoss.net_profit || 0).toLocaleString()} KSh</td>
                </tr>
                <tr>
                  <td>Profit Margin</td>
                  <td style={{ 
                    color: (profitLoss.profit_margin || 0) >= 0 ? '#10b981' : '#ef4444', 
                    fontWeight: 'bold'
                  }}>{Number(profitLoss.profit_margin || 0).toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '10px', color: '#666' }}>No profit/loss data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;