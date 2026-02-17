import React, { useState, useEffect } from 'react';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'subscription_expiry',
      title: 'Subscription Expiring Soon',
      message: 'Tenant "Supermarket Ltd" subscription expires in 3 days',
      timestamp: '10 minutes ago',
      read: false,
      priority: 'high',
      icon: '⚠️'
    },
    {
      id: 2,
      type: 'new_tenant',
      title: 'New Tenant Registered',
      message: 'New tenant "Coffee Shop" has been created',
      timestamp: '2 hours ago',
      read: false,
      priority: 'medium',
      icon: '🏢'
    },
    {
      id: 3,
      type: 'payment_received',
      title: 'Payment Received',
      message: 'Payment of KSh 10,000 received from "Retail Chain"',
      timestamp: '1 day ago',
      read: true,
      priority: 'low',
      icon: '💰'
    },
    {
      id: 4,
      type: 'system_alert',
      title: 'System Maintenance',
      message: 'Scheduled maintenance in 2 hours',
      timestamp: '2 days ago',
      read: true,
      priority: 'medium',
      icon: '⚙️'
    }
  ]);
  
  const [showPanel, setShowPanel] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      const newNotification = {
        id: Date.now(),
        type: 'info',
        title: 'System Update',
        message: 'System performance is optimal',
        timestamp: 'Just now',
        read: false,
        priority: 'low',
        icon: '✅'
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      setNotifications([]);
    }
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className="notification-center">
      <div 
        className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={() => setShowPanel(!showPanel)}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {showPanel && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <div className="notifications-actions">
              <button 
                className="btn-sm mark-all-read"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark All Read
              </button>
              <button 
                className="btn-sm btn-danger"
                onClick={clearAll}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <div className="empty-icon">📭</div>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${getPriorityClass(notification.priority)} ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {notification.icon}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                      {!notification.read && <span className="unread-dot" />}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-timestamp">
                      {notification.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notifications-footer">
            <button 
              className="btn-secondary" 
              onClick={() => setShowPanel(false)}
            >
              Close
            </button>
            <button className="btn-secondary">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;