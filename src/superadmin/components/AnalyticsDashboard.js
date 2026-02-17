import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    tenants: [],
    subscriptions: []
  });

  const metrics = [
    { label: 'Monthly Recurring Revenue (MRR)', value: 'KSh 543,840', change: '+15%', trend: 'up' },
    { label: 'Annual Recurring Revenue (ARR)', value: 'KSh 6.5M', change: '+12%', trend: 'up' },
    { label: 'Customer Acquisition Cost (CAC)', value: 'KSh 2,850', change: '-5%', trend: 'down' },
    { label: 'Customer Lifetime Value (LTV)', value: 'KSh 34,200', change: '+8%', trend: 'up' },
    { label: 'Churn Rate', value: '2.3%', change: '-0.8%', trend: 'down' },
    { label: 'Net Revenue Retention', value: '112%', change: '+4%', trend: 'up' }
  ];

  const topTenants = [
    { id: 1, name: 'Supermarket Ltd', mrr: 150000, growth: 25, users: 45, plan: 'Enterprise' },
    { id: 2, name: 'Retail Chain', mrr: 125000, growth: 18, users: 32, plan: 'Premium' },
    { id: 3, name: 'Restaurant Group', mrr: 98000, growth: 32, users: 28, plan: 'Standard' },
    { id: 4, name: 'Pharmacy Network', mrr: 85000, growth: 12, users: 24, plan: 'Standard' },
    { id: 5, name: 'Fashion Store', mrr: 72000, growth: 45, users: 18, plan: 'Basic' }
  ];

  const formatCurrency = (amount) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Business Analytics</h2>
        <div className="time-range-selector">
          <button 
            className={timeRange === '7d' ? 'active' : ''} 
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </button>
          <button 
            className={timeRange === '30d' ? 'active' : ''} 
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </button>
          <button 
            className={timeRange === '90d' ? 'active' : ''} 
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </button>
          <button 
            className={timeRange === '1y' ? 'active' : ''} 
            onClick={() => setTimeRange('1y')}
          >
            1 Year
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            <div className={`metric-change ${metric.trend}`}>
              <span className={`trend-icon ${metric.trend}`}>
                {metric.trend === 'up' ? '↗' : '↘'}
              </span>
              {metric.change}
            </div>
          </div>
        ))}
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {[65, 75, 80, 85, 90, 95, 100].map((height, i) => (
                <div key={i} className="chart-bar" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Tenant Growth</h3>
          <div className="chart-placeholder">
            <div className="chart-line">
              {[40, 50, 65, 75, 85, 95, 100].map((height, i) => (
                <div key={i} className="chart-point" style={{ bottom: `${height}%`, left: `${(i/6)*100}%` }}>
                  <div className="point" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="top-tenants-section">
        <h3>Top Performing Tenants</h3>
        <div className="tenants-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Tenant</th>
                <th>Monthly Revenue</th>
                <th>Growth</th>
                <th>Users</th>
                <th>Plan</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {topTenants.map((tenant, index) => (
                <tr key={tenant.id}>
                  <td className="rank-cell">
                    <div className={`rank-badge rank-${index + 1}`}>
                      #{index + 1}
                    </div>
                  </td>
                  <td>{tenant.name}</td>
                  <td className="revenue-cell">{formatCurrency(tenant.mrr)}</td>
                  <td>
                    <span className={`growth-badge ${tenant.growth >= 20 ? 'high' : 'medium'}`}>
                      {tenant.growth}%
                    </span>
                  </td>
                  <td>{tenant.users}</td>
                  <td><span className="plan-tag">{tenant.plan}</span></td>
                  <td>
                    <div className="performance-bar">
                      <div 
                        className="performance-fill" 
                        style={{ width: `${Math.min(100, (tenant.mrr / 150000) * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;