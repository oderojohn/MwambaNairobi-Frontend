// components/StatCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './StatCard.css';

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <i className={`fas fa-${icon}`}></i>
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string
};

StatCard.defaultProps = {
  color: '#007bff'
};

export default StatCard;