import React from 'react';

const Loading = ({ text = 'Loading...', overlay = false, size = 'normal' }) => {
  const loaderClass = size === 'small' ? 'inline-loader' : 'loader';
  const loaderSize = size === 'small' ? '24px' : '48px';
  
  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className={loaderClass}></div>
        {text && <div className="loader-text">{text}</div>}
      </div>
    );
  }

  return (
    <div className="loading-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className={loaderClass}></div>
      {text && <span style={{ marginLeft: '15px', color: '#666' }}>{text}</span>}
    </div>
  );
};

export default Loading;
