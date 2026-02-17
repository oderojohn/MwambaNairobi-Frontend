// src/superadmin/components/QuickActions.js
import React from 'react';
import './QuickActions.css';

const QuickActions = ({ onAction }) => {
  console.log('QuickActions: component rendered');
  const quickActions = [
    {
      id: 'create_tenant',
      label: 'Create Tenant',
      icon: '🏢',
      description: 'Create a new tenant account',
      color: '#4CAF50'
    },
    {
      id: 'generate_keys',
      label: 'Generate Keys',
      icon: '🔑',
      description: 'Generate activation keys',
      color: '#2196F3'
    },
    {
      id: 'send_broadcast',
      label: 'Send Broadcast',
      icon: '📢',
      description: 'Send message to all tenants',
      color: '#FF9800'
    },
    {
      id: 'export_reports',
      label: 'Export Reports',
      icon: '📊',
      description: 'Export system reports',
      color: '#9C27B0'
    },
    {
      id: 'run_backup',
      label: 'Run Backup',
      icon: '💾',
      description: 'Trigger system backup',
      color: '#607D8B'
    },
    {
      id: 'system_diagnostics',
      label: 'Run Diagnostics',
      icon: '🔧',
      description: 'Run system diagnostics',
      color: '#795548'
    }
  ];

  return (
    <div className="quick-actions">
      <h2>Quick Actions</h2>
      <div className="actions-grid">
        {quickActions.map(action => (
          <div 
            key={action.id}
            className="action-card"
            onClick={() => onAction(action.id)}
            style={{ borderTopColor: action.color }}
          >
            <div className="action-icon" style={{ color: action.color }}>
              {action.icon}
            </div>
            <div className="action-content">
              <h4>{action.label}</h4>
              <p>{action.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;