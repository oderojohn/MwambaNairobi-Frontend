import React, { useState, useEffect } from 'react';
import './AdvancedTenantSearch.css';

const AdvancedTenantSearch = ({ tenants, onSearch }) => {
  const [filters, setFilters] = useState({
    search: '',
    subscriptionStatus: '',
    planType: '',
    businessType: '',
    dateRange: { start: '', end: '' },
    minUsers: '',
    maxUsers: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const filterOptions = {
    subscriptionStatus: ['active', 'trial', 'expired', 'cancelled', 'grace_period'],
    planType: ['free', 'basic', 'standard', 'premium', 'enterprise'],
    businessType: ['retail', 'restaurant', 'supermarket', 'pharmacy', 'other'],
    sortBy: ['created_at', 'display_name', 'subscription_plan', 'user_count']
  };

  const applyFilters = () => {
    let filtered = [...tenants];

    // Text search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.display_name?.toLowerCase().includes(searchTerm) ||
        t.domain?.toLowerCase().includes(searchTerm) ||
        t.email?.toLowerCase().includes(searchTerm)
      );
    }

    // Subscription status filter
    if (filters.subscriptionStatus) {
      filtered = filtered.filter(t => 
        t.subscription_status?.status === filters.subscriptionStatus
      );
    }

    // Plan type filter
    if (filters.planType) {
      filtered = filtered.filter(t => 
        t.subscription_status?.plan?.toLowerCase() === filters.planType
      );
    }

    // Business type filter
    if (filters.businessType) {
      filtered = filtered.filter(t => 
        t.business_type === filters.businessType
      );
    }

    // Date range filter
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      filtered = filtered.filter(t => new Date(t.created_at) >= startDate);
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter(t => new Date(t.created_at) <= endDate);
    }

    // User count range
    if (filters.minUsers) {
      filtered = filtered.filter(t => (t.user_count || 0) >= parseInt(filters.minUsers));
    }
    if (filters.maxUsers) {
      filtered = filtered.filter(t => (t.user_count || 0) <= parseInt(filters.maxUsers));
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch(filters.sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'user_count':
          aValue = a.user_count || 0;
          bValue = b.user_count || 0;
          break;
        default:
          aValue = a[filters.sortBy];
          bValue = b[filters.sortBy];
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    onSearch(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      search: '',
      subscriptionStatus: '',
      planType: '',
      businessType: '',
      dateRange: { start: '', end: '' },
      minUsers: '',
      maxUsers: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="advanced-search">
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search tenants by name, domain, or email..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="search-input"
        />
      </div>

      <div className="filter-grid">
        <div className="filter-group">
          <label>Subscription Status</label>
          <select 
            value={filters.subscriptionStatus} 
            onChange={(e) => setFilters({...filters, subscriptionStatus: e.target.value})}
          >
            <option value="">All Statuses</option>
            {filterOptions.subscriptionStatus.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Plan Type</label>
          <select 
            value={filters.planType} 
            onChange={(e) => setFilters({...filters, planType: e.target.value})}
          >
            <option value="">All Plans</option>
            {filterOptions.planType.map(plan => (
              <option key={plan} value={plan}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Business Type</label>
          <select 
            value={filters.businessType} 
            onChange={(e) => setFilters({...filters, businessType: e.target.value})}
          >
            <option value="">All Businesses</option>
            {filterOptions.businessType.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Created Between</label>
          <div className="date-range">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters({
                ...filters, 
                dateRange: {...filters.dateRange, start: e.target.value}
              })}
            />
            <span>to</span>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters({
                ...filters, 
                dateRange: {...filters.dateRange, end: e.target.value}
              })}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Users Range</label>
          <div className="range-inputs">
            <input
              type="number"
              placeholder="Min"
              value={filters.minUsers}
              onChange={(e) => setFilters({...filters, minUsers: e.target.value})}
              min="0"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxUsers}
              onChange={(e) => setFilters({...filters, maxUsers: e.target.value})}
              min="0"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select 
            value={filters.sortBy} 
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
          >
            {filterOptions.sortBy.map(field => (
              <option key={field} value={field}>
                {field.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Order</label>
          <select 
            value={filters.sortOrder} 
            onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="filter-actions">
        <button className="btn-secondary" onClick={resetFilters}>
          Reset All Filters
        </button>
      </div>
    </div>
  );
};

export default AdvancedTenantSearch;