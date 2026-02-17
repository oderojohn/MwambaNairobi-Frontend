import React, { useState } from 'react';
import './ActivationModal.css';

const API_BASE_URL = 'http://127.0.0.1:8005';

const ActivationModal = ({ isOpen, onClose, onActivate }) => {
  const [activationKey, setActivationKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!activationKey.trim()) {
      setError('Please enter an activation key');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/activation-keys/validate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pos_access_token')}`
        },
        body: JSON.stringify({ key: activationKey.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setValidationResult(data);
      } else {
        setError(data.error || 'Failed to validate key');
        setValidationResult(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleActivate = async () => {
    if (!validationResult || !validationResult.valid) {
      setError('Please validate a valid key first');
      return;
    }

    setIsActivating(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/activation-keys/activate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pos_access_token')}`
        },
        body: JSON.stringify({ key: activationKey.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        onActivate(data);
        onClose();
        setActivationKey('');
        setValidationResult(null);
      } else {
        setError(data.error || 'Failed to activate key');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleClose = () => {
    setActivationKey('');
    setValidationResult(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="activation-modal-overlay">
      <div className="activation-modal">
        <div className="activation-modal-header">
          <h2>Activate MWAMBA POS</h2>
          <button className="activation-modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="activation-modal-body">
          <div className="activation-info">
            <p>Enter your activation key to unlock full access to MWAMBA POS.</p>
            <p>Activation keys are provided when you purchase a subscription.</p>
          </div>

          <div className="activation-form">
            <div className="form-group">
              <label htmlFor="activation-key">Activation Key</label>
              <input
                type="text"
                id="activation-key"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className="activation-input"
                disabled={isValidating || isActivating}
              />
            </div>

            {error && (
              <div className="activation-error">
                {error}
              </div>
            )}

            {validationResult && (
              <div className="activation-validation">
                <h3>Key Information</h3>
                <div className="validation-details">
                  <p><strong>Status:</strong>
                    <span className={`status-${validationResult.valid ? 'valid' : 'invalid'}`}>
                      {validationResult.valid ? 'Valid' : 'Invalid'}
                    </span>
                  </p>
                  {validationResult.valid && (
                    <>
                      <p><strong>Type:</strong> {validationResult.key_type}</p>
                      <p><strong>Plan:</strong> {validationResult.plan}</p>
                      <p><strong>Duration:</strong> {validationResult.duration_days} days</p>
                      <p><strong>Activations:</strong> {validationResult.activations_used}/{validationResult.max_activations}</p>
                      {validationResult.expires_at && (
                        <p><strong>Expires:</strong> {new Date(validationResult.expires_at).toLocaleDateString()}</p>
                      )}
                    </>
                  )}
                  <p className="validation-message">{validationResult.message}</p>
                </div>
              </div>
            )}

            <div className="activation-actions">
              <button
                className="btn-secondary"
                onClick={handleValidate}
                disabled={isValidating || isActivating || !activationKey.trim()}
              >
                {isValidating ? 'Validating...' : 'Validate Key'}
              </button>

              {validationResult && validationResult.valid && (
                <button
                  className="btn-primary"
                  onClick={handleActivate}
                  disabled={isActivating}
                >
                  {isActivating ? 'Activating...' : 'Activate Now'}
                </button>
              )}
            </div>
          </div>

          <div className="activation-help">
            <p><strong>Need help?</strong></p>
            <p>Contact our support team for assistance with activation.</p>
            <p>Email: support@mwambapos.com | Phone: +254 XXX XXX XXX</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivationModal;