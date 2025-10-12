import React, { useState } from 'react';
import { FiPackage, FiCheckCircle, FiXCircle, FiClock, FiSearch, FiFilter, FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const ReturnsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const returns = [
    { id: 'RET-001', orderId: 'ORD-1001', customer: 'Acme Corp', date: '2023-05-15', 
      items: 2, reason: 'Damaged', status: 'Completed', amount: 250.50 },
    { id: 'RET-002', orderId: 'ORD-1003', customer: 'Globex Inc', date: '2023-05-12', 
      items: 1, reason: 'Wrong Item', status: 'Processing', amount: 120.00 },
    { id: 'RET-003', orderId: 'ORD-1005', customer: 'Soylent Corp', date: '2023-05-10', 
      items: 3, reason: 'Defective', status: 'Pending', amount: 450.75 },
    { id: 'RET-004', orderId: 'ORD-1002', customer: 'Initech', date: '2023-05-08', 
      items: 1, reason: 'No Longer Needed', status: 'Rejected', amount: 89.99 },
  ];

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ret.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || ret.status === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Returns</h1>
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <span>Sales</span> / <span>Returns</span>
        </div>
      </div>

      <div className="returns-metrics">
        <div className="metric-card">
          <div className="metric-value">{returns.length}</div>
          <div className="metric-label">Total Returns</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            Ksh {returns.reduce((sum, ret) => sum + ret.amount, 0).toFixed(2)}
          </div>
          <div className="metric-label">Total Value</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {returns.filter(r => r.status === 'Completed').length}
          </div>
          <div className="metric-label">Completed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {returns.filter(r => r.status === 'Pending').length}
          </div>
          <div className="metric-label">Pending</div>
        </div>
      </div>

      <div className="page-actions">
        <div className="search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-dropdown">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
            <FiFilter className="filter-icon" />
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn btn-secondary">
            <FiDownload /> Export
          </button>
        </div>
      </div>

      <div className="returns-timeline">
        {filteredReturns.map(ret => (
          <div key={ret.id} className={`timeline-item ${ret.status.toLowerCase()}`}>
            <div className="timeline-marker">
              {ret.status === 'Completed' && <FiCheckCircle />}
              {ret.status === 'Processing' && <FiPackage />}
              {ret.status === 'Pending' && <FiClock />}
              {ret.status === 'Rejected' && <FiXCircle />}
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="return-id">{ret.id}</span>
                <span className={`return-status ${ret.status.toLowerCase()}`}>
                  {ret.status}
                </span>
              </div>
              <div className="timeline-details">
                <div className="customer-info">
                  <Link to={`/customers/${ret.customer.replace(/\s+/g, '-').toLowerCase()}`}>
                    {ret.customer}
                  </Link>
                  <span>Order #{ret.orderId}</span>
                </div>
                <div className="return-info">
                  <div><strong>Reason:</strong> {ret.reason}</div>
                  <div><strong>Items:</strong> {ret.items}</div>
                  <div><strong>Amount:</strong> Ksh {ret.amount.toFixed(2)}</div>
                </div>
              </div>
              <div className="timeline-date">{ret.date}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination-container">
        <div className="pagination-info">
          Showing {filteredReturns.length} of {returns.length} returns
        </div>
        <div className="pagination-controls">
          <button className="btn-pagination" disabled>Previous</button>
          <button className="btn-pagination active">1</button>
          <button className="btn-pagination">Next</button>
        </div>
      </div>
    </div>
  );
};

export default ReturnsPage;