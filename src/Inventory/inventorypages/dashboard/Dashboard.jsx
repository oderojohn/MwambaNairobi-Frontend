import React, { useState, useEffect } from 'react';
import {
  FiPlus, FiDownload,
  FiAlertTriangle, FiCheckCircle,
  FiPackage, FiTruck, FiDollarSign, FiRefreshCw,
  FiShoppingCart, FiUsers, FiCreditCard, FiTrendingUp
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
import { inventoryAPI, salesAPI, customersAPI, shiftsAPI } from '../../../services/ApiService/api';

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
  const [stockMovements, setStockMovements] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);
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
          inventoryAPI.getStockMovements({ page_size: 5 }),
          inventoryAPI.getLowStock(),
          salesAPI.getSalesSummary(),
          inventoryAPI.getInventorySummary(),
          customersAPI.getCustomerSummary(),
          shiftsAPI.getShiftSummary(),
          shiftsAPI.getShifts()
        ]);

        setStockMovements(movementsRes.results || []);
        setLowStockProducts(lowStockRes || []);
        setShifts(shiftsRes || []);
        setInventorySummary(inventorySummaryRes || null);

        // Set POS data from real API responses
        setPosData({
          todaySales: salesSummaryRes?.today_sales || 0,
          totalSales: salesSummaryRes?.total_sales || 0,
          activeShifts: shiftSummaryRes?.active_shifts || 0,
          totalCustomers: customerSummaryRes?.total_customers || 0,
          salesData: salesSummaryRes?.sales_data || [],
          paymentMethods: salesSummaryRes?.payment_methods || [],
          topProducts: salesSummaryRes?.top_products || [],
          recentTransactions: salesSummaryRes?.recent_transactions || []
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

  // Calculate metrics from inventory summary
  const totalItems = inventorySummary?.total_items || 0;
  const totalValue = inventorySummary?.total_value || 0;
  const lowStockItems = inventorySummary?.low_stock_items || 0;
  const outOfStockItems = inventorySummary?.out_of_stock_items || 0;

  // Recent activity data from stock movements
  const recentActivity = stockMovements.slice(0, 5).map(movement => ({
    id: movement.id,
    action: movement.movement_type === 'in' ? 'Stock Added' :
            movement.movement_type === 'out' ? 'Stock Removed' : 'Stock Adjusted',
    item: movement.product_name || movement.product?.name || 'Unknown Product',
    quantity: movement.quantity,
    date: new Date(movement.created_at).toLocaleString(),
    user: movement.user_name || movement.user?.user?.username || 'System'
  }));

  // Data for line chart (stock movements) - from backend
  const stockMovementData = React.useMemo(() => {
    if (!inventorySummary?.stock_movement_data) {
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        datasets: []
      };
    }

    const movementData = inventorySummary.stock_movement_data;
    const labels = movementData.map(item => item.week);

    // Get all unique categories
    const categories = new Set();
    movementData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'month') {
          categories.add(key);
        }
      });
    });

    // Colors for different categories
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];

    const datasets = Array.from(categories).map((category, index) => ({
      label: category,
      data: movementData.map(item => item[category] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
      tension: 0.3,
    }));

    return {
      labels,
      datasets
    };
  }, [inventorySummary]);

  // Data for sales trend chart
  const salesTrendData = {
    labels: posData.salesData.map(item => item.date) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Daily Sales',
        data: posData.salesData.map(item => item.amount) || [1200, 1500, 1800, 1400, 2100, 1900, 1600],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
      },
    ],
  };

  // Data for payment methods chart
  const paymentMethodsData = {
    labels: posData.paymentMethods.map(item => item.method) || ['Cash', 'M-Pesa', 'Card'],
    datasets: [
      {
        data: posData.paymentMethods.map(item => item.percentage) || [60, 30, 10],
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


  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Stock Movement (Last 12 Weeks)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity',
        },
      },
    },
  };


  const salesTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales Trend (Last 7 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sales Amount (KSh)',
        },
      },
    },
  };

  const paymentMethodsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Payment Methods Distribution',
      },
    },
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading inventory data...</div>
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
    <div className="page-container">
      <div className="page-header">
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <span>Inventory</span> / <span>Dashboard</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="stock-alerts">
        {/* Inventory Metrics */}
        <div className="alert-card info">
          <div className="alert-icon">
            <FiPackage size={24} />
          </div>
          <div className="alert-content">
            <h3>Total Items</h3>
            <p>{totalItems} products in inventory</p>
          </div>
        </div>

        <div className="alert-card info">
          <div className="alert-icon">
            <FiDollarSign size={24} />
          </div>
          <div className="alert-content">
            <h3>Inventory Value</h3>
            <p>Ksh {totalValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="alert-card warning">
          <div className="alert-icon">
            <FiAlertTriangle size={24} />
          </div>
          <div className="alert-content">
            <h3>Low Stock</h3>
            <p>{lowStockItems} items need attention</p>
          </div>
        </div>

        <div className="alert-card critical">
          <div className="alert-icon">
            <FiAlertTriangle size={24} />
          </div>
          <div className="alert-content">
            <h3>Out of Stock</h3>
            <p>{outOfStockItems} items unavailable</p>
          </div>
        </div>
      </div>

      {/* POS Analytics Cards */}
      <div className="stock-alerts" style={{ marginTop: '20px' }}>
        <div className="alert-card success">
          <div className="alert-icon">
            <FiShoppingCart size={24} />
          </div>
          <div className="alert-content">
            <h3>Today's Sales</h3>
            <p>Ksh {posData.todaySales.toLocaleString()}</p>
          </div>
        </div>

        <div className="alert-card success">
          <div className="alert-icon">
            <FiTrendingUp size={24} />
          </div>
          <div className="alert-content">
            <h3>Total Sales</h3>
            <p>Ksh {posData.totalSales.toLocaleString()}</p>
          </div>
        </div>

        <div className="alert-card info">
          <div className="alert-icon">
            <FiUsers size={24} />
          </div>
          <div className="alert-content">
            <h3>Total Customers</h3>
            <p>{posData.totalCustomers} registered customers</p>
          </div>
        </div>

        <div className="alert-card primary">
          <div className="alert-icon">
            <FiCreditCard size={24} />
          </div>
          <div className="alert-content">
            <h3>Active Shifts</h3>
            <p>{posData.activeShifts} shifts in progress</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="page-actions" style={{ marginBottom: '20px' }}>
        <div className="action-buttons">
          <button className="btn btn-primary">
            <FiPlus /> Add New Item
          </button>
          <button className="btn btn-secondary">
            <FiTruck /> Receive Stock
          </button>
          <button className="btn btn-secondary">
            <FiRefreshCw /> Stock Take
          </button>
          <button className="btn btn-secondary">
            <FiDownload /> Export Report
          </button>
        </div>
      </div>

      {/* Inventory Charts Row */}
      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Line Chart */}
        <div className="data-table-container">
          <div style={{ padding: '16px', height: '300px' }}>
            <Line data={stockMovementData} options={lineChartOptions} />
          </div>
        </div>
      </div>

      {/* POS Analytics Charts Row */}
      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Sales Trend Chart */}
        <div className="data-table-container">
          <div style={{ padding: '16px', height: '300px' }}>
            <Line data={salesTrendData} options={salesTrendOptions} />
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="data-table-container">
          <div style={{ padding: '8px', display: 'flex', justifyContent: 'center', height: '250px' }}>
            <div style={{ width: '200px', height: '200px' }}>
              <Pie data={paymentMethodsData} options={paymentMethodsOptions} />
            </div>
          </div>
        </div>
      </div>


      {/* POS Analytics Section */}
      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Top Products */}
        <div className="data-table-container">
          <h3 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #e2e8f0' }}>Top Selling Products</h3>
          <div style={{ padding: '16px' }}>
            {posData.topProducts.slice(0, 5).map((product, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  flexShrink: 0,
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{product.name}</div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {product.sold} units sold • Ksh {product.revenue?.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="data-table-container">
          <h3 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #e2e8f0' }}>Recent Transactions</h3>
          <div style={{ padding: '16px' }}>
            {posData.recentTransactions.slice(0, 5).map((transaction, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  flexShrink: 0,
                  color: 'white',
                  fontSize: '12px'
                }}>
                  <FiShoppingCart size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>Sale #{transaction.id}</div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {transaction.customer || 'Walk-in'} • Ksh {transaction.amount?.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{transaction.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Analytics Summary */}
      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Low Stock Alerts */}
        <div className="data-table-container">
          <h3 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #e2e8f0' }}>Low Stock Alerts</h3>
          <div style={{ padding: '16px' }}>
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 5).map((product, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    flexShrink: 0
                  }}>
                    <FiAlertTriangle size={14} color="#ef4444" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{product.name}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      Current Stock: {product.stock_quantity} • Threshold: {product.low_stock_threshold}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#64748b',
                fontStyle: 'italic'
              }}>
                No low stock items. All inventory levels are good!
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="data-table-container">
          <h3 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #e2e8f0' }}>Recent Activity</h3>
          <div style={{ padding: '16px' }}>
            {recentActivity.map(activity => (
              <div key={activity.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: activity.quantity > 0 ? '#d1fae5' : '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  {activity.quantity > 0 ? (
                    <FiCheckCircle size={18} color="#10b981" />
                  ) : (
                    <FiAlertTriangle size={18} color="#ef4444" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{activity.action}</div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {activity.item} • {activity.quantity > 0 ? `+${activity.quantity}` : activity.quantity}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{activity.date.split(' ')[0]}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{activity.user}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shifts */}
      <div className="data-table-container">
        <h3 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #e2e8f0' }}>Recent Shifts</h3>
        <div style={{ padding: '16px' }}>
          {shifts.length > 0 ? (
            shifts
              .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
              .slice(0, 5)
              .map(shift => (
              <div key={shift.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  flexShrink: 0,
                  color: 'white',
                  fontSize: '12px'
                }}>
                  <FiUsers size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{shift.cashier_name || 'Unknown User'}</div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Started: {new Date(shift.start_time).toLocaleString()} •
                    {shift.end_time ? `Ended: ${new Date(shift.end_time).toLocaleString()}` : 'Active'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Starting Cash: Ksh {shift.opening_balance?.toLocaleString() || '0'} •
                    Ending Cash: Ksh {shift.closing_balance?.toLocaleString() || '0'} •
                    Total Sales: Ksh {shift.total_sales?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#64748b',
              fontStyle: 'italic'
            }}>
              No shifts found. Shifts will appear here once they are created.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
export default InventoryDashboard;