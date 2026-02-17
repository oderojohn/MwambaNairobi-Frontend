import React, { useState, useEffect } from 'react';
import './ExpiryNotification.css';

const ExpiryNotification = ({ subscription, onActivateClick }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    if (subscription && subscription.end_date) {
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      const diffTime = endDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(diffDays);
    }
  }, [subscription]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage for 24 hours
    localStorage.setItem('expiry_notification_dismissed', Date.now().toString());
  };

  const handleActivate = () => {
    onActivateClick();
    setIsVisible(false);
  };

  // Don't show if dismissed recently
  const dismissedTime = localStorage.getItem('expiry_notification_dismissed');
  if (dismissedTime) {
    const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
    if (hoursSinceDismissed < 24) {
      return null;
    }
  }

  // Don't show if no subscription or subscription is active with more than 7 days left
  if (!subscription || !daysLeft || daysLeft > 7) {
    return null;
  }

  // Don't show if subscription is expired (handled by different component)
  if (daysLeft <= 0) {
    return null;
  }

  if (!isVisible) return null;

  const getNotificationType = () => {
    if (daysLeft <= 1) return 'critical';
    if (daysLeft <= 3) return 'warning';
    return 'info';
  };

  const notificationType = getNotificationType();

  return (
    <div className={`expiry-notification expiry-${notificationType}`}>
      <div className="expiry-content">
        <div className="expiry-icon">
          {notificationType === 'critical' && '🚨'}
          {notificationType === 'warning' && '⚠️'}
          {notificationType === 'info' && 'ℹ️'}
        </div>

        <div className="expiry-message">
          <h4>Subscription Expiring Soon</h4>
          <p>
            Your {subscription.plan?.name || 'subscription'} will expire in{' '}
            <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.
            Renew now to avoid service interruption.
          </p>
        </div>

        <div className="expiry-actions">
          <button
            className="btn-activate"
            onClick={handleActivate}
          >
            Activate Key
          </button>
          <button
            className="btn-dismiss"
            onClick={handleDismiss}
          >
            Remind Later
          </button>
        </div>

        <button
          className="expiry-close"
          onClick={handleDismiss}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ExpiryNotification;