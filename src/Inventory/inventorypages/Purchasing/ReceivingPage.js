import { useState, useEffect } from 'react';
import { FiCheck, FiFilter, FiDownload, FiPrinter, FiSearch, FiTrendingUp, FiTrendingDown, FiPackage } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { inventoryAPI } from '../../../services/ApiService/api';
import './ReceivingPage.css';

const ReceivingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockMovements, setStockMovements] = useState([]);
  const [ setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [useCustomDates, setUseCustomDates] = useState(false);

  // Load data on component mount and when date range changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load stock movements (receiving history)
        const movementsData = await inventoryAPI.stockMovements.getAll();
        setStockMovements(movementsData);

        // Load batches for additional info
        const batchesData = await inventoryAPI.batches.getAll();
        setBatches(batchesData);

        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load receiving data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateRange]);

  // Filter stock movements based on criteria
  const filteredMovements = stockMovements.filter(movement => {
    const matchesSearch = movement.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          movement.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || movement.movement_type === typeFilter;

    // Date filtering
    const movementDate = new Date(movement.created_at);

    if (useCustomDates && (fromDate || toDate)) {
      // Custom date range filtering
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0); // Start of day
        if (movementDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999); // End of day
        if (movementDate > to) return false;
      }
    } else if (dateRange !== 'all') {
      // Preset date range filtering
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      if (movementDate < cutoffDate) return false;
    }

    return matchesSearch && matchesType;
  });

  const setTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
    setUseCustomDates(true);
  };

  const clearDateFilters = () => {
    setFromDate('');
    setToDate('');
    setUseCustomDates(false);
    setDateRange('30');
  };

  const handleDateFilterChange = (useCustom) => {
    setUseCustomDates(useCustom);
    if (!useCustom) {
      setFromDate('');
      setToDate('');
    }
  };

  // Calculate receiving statistics
  const receivingStats = {
    totalReceived: stockMovements
      .filter(m => m.movement_type === 'in')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
    totalShipped: stockMovements
      .filter(m => m.movement_type === 'out')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
    recentReceivings: stockMovements
      .filter(m => m.movement_type === 'in' && m.created_at)
      .filter(m => {
        const movementDate = new Date(m.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return movementDate >= weekAgo;
      }).length
  };


  return (
    <div className="page-container">
      <div className="page-header">
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <span>Inventory</span> / <span>Purchasing</span> / <span>Receiving History</span>
        </div>
        <h1>Receiving History & Reports</h1>
      </div>

      {!loading && !error && (
        <div className="receiving-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FiPackage />
            </div>
            <div className="stat-value">{receivingStats.totalReceived}</div>
            <div className="stat-label">Total Items Received</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>
            <div className="stat-value">{receivingStats.recentReceivings}</div>
            <div className="stat-label">Recent Receivings (7 days)</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiTrendingDown />
            </div>
            <div className="stat-value">{receivingStats.totalShipped}</div>
            <div className="stat-label">Items Shipped Out</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiCheck />
            </div>
            <div className="stat-value">{filteredMovements.length}</div>
            <div className="stat-label">Stock Movements</div>
          </div>
        </div>
      )}

      <div className="page-actions">
        <div className="search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by product or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-dropdown">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Movements</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustments</option>
            </select>
            <FiFilter className="filter-icon" />
          </div>
          <div className="date-filters">
            <div className="filter-group">
              <label>
                <input
                  type="radio"
                  name="dateFilter"
                  checked={!useCustomDates}
                  onChange={() => handleDateFilterChange(false)}
                />
                Preset
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                disabled={useCustomDates}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
            <div className="filter-group">
              <label>
                <input
                  type="radio"
                  name="dateFilter"
                  checked={useCustomDates}
                  onChange={() => handleDateFilterChange(true)}
                />
                Custom
              </label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="From date"
                  disabled={!useCustomDates}
                />
                <span>to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="To date"
                  disabled={!useCustomDates}
                />
              </div>
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={setTodayFilter}
              disabled={!useCustomDates}
            >
              Today
            </button>
            {useCustomDates && (fromDate || toDate) && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={clearDateFilters}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn btn-secondary">
            <FiDownload /> Export
          </button>
          <button className="btn btn-secondary">
            <FiPrinter /> Print
          </button>
        </div>
      </div>

      <div className="data-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading batches...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
            <p>{error}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>Movement Type</th>
                <th>Quantity</th>
                <th>Stock Impact</th>
                <th>Reason</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map(movement => {
                const movementDate = new Date(movement.created_at);
                const isStockIn = movement.movement_type === 'in';
                const quantity = Math.abs(movement.quantity);

                return (
                  <tr key={movement.id}>
                    <td>
                      <div className="date-time">
                        <div className="date">{movementDate.toLocaleDateString()}</div>
                        <div className="time">{movementDate.toLocaleTimeString()}</div>
                      </div>
                    </td>
                    <td>{movement.product_name || 'Unknown Product'}</td>
                    <td>
                      <span className={`movement-type ${movement.movement_type}`}>
                        {movement.movement_type === 'in' ? 'Stock In' :
                         movement.movement_type === 'out' ? 'Stock Out' : 'Adjustment'}
                      </span>
                    </td>
                    <td className={`quantity ${isStockIn ? 'positive' : 'negative'}`}>
                      {isStockIn ? '+' : '-'}{quantity}
                    </td>
                    <td>
                      <div className="stock-impact">
                        <span className={`impact-icon ${isStockIn ? 'up' : 'down'}`}>
                          {isStockIn ? <FiTrendingUp /> : <FiTrendingDown />}
                        </span>
                        <span className="impact-text">
                          {isStockIn ? 'Increased stock' : 'Reduced stock'}
                        </span>
                      </div>
                    </td>
                    <td className="reason">{movement.reason || 'No reason specified'}</td>
                    <td>{movement.user_name || 'System'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing 1 to {filteredMovements.length} of {stockMovements.length} stock movements
          </div>
          <div className="pagination-controls">
            <button className="btn-pagination" disabled>Previous</button>
            <button className="btn-pagination active">1</button>
            <button className="btn-pagination">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivingPage;