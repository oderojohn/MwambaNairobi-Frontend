import React from 'react';

const ErrorModal = ({ isOpen, onClose, title, message, details, errors }) => {
  if (!isOpen) return null;

  return (
    <div className="modal active">
      <div className="modal-content error-modal">
        <div className="modal-header error-header">
          <h3>
            <i className="fas fa-exclamation-triangle"></i>
            {title || 'Error'}
          </h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          <div className="error-message">
            <i className="fas fa-times-circle"></i>
            {message}
          </div>

          {errors && errors.length > 0 && (
            <div className="error-list">
              <h4>Validation Errors:</h4>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {details && (
            <div className="error-details">
              <h4>Technical Details:</h4>
              <div className="details-content">
                {typeof details === 'string' ? (
                  <pre>{details}</pre>
                ) : (
                  <pre>{JSON.stringify(details, null, 2)}</pre>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            <i className="fas fa-check"></i> OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;