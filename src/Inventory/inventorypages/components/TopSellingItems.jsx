// components/TopSellingItems.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../services/ApiService/api';
import './TopSellingItems.css';

const TopSellingItems = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="manager-section">
        <h4>Top Selling Items Today</h4>
        <div className="empty-state">
          <p>No items sold today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-section">
      <h4>Top Selling Items Today</h4>
      <div className="top-items-grid">
        {items.map((item, index) => (
          <div key={item.id} className="top-item-card">
            <div className="item-rank">{index + 1}</div>
            <div className="item-info">
              <h5>{item.name}</h5>
              <p>Quantity: {item.quantity}</p>
              <p>Total: {formatCurrency(item.total)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

TopSellingItems.propTypes = {
  items: PropTypes.array.isRequired
};

export default TopSellingItems;