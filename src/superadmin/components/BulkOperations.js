import React, { useState } from 'react';
import './BulkOperations.css';

const BulkOperations = ({ selectedCount, onClose, onOperation }) => {
  const [selectedOperation, setSelectedOperation] = useState('');
  const [operationData, setOperationData] = useState({});
  const [loading, setLoading] = useState(false);

  const operations = [
    {
      id: 'extend_subscription',
      label: 'Extend Subscription',
      description: 'Extend subscription duration for selected tenants',
      icon: '⏱️',
      fields: [
        { name: 'months', label: 'Months', type: 'number', min: 1, max: 12, required: true }
      ]
    },
    {
      id: 'change_plan',
      label: 'Change Plan',
      description: 'Change subscription plan for selected tenants',
      icon: '🔄',
      fields: [
        { 
          name: 'new_plan', 
          label: 'New Plan', 
          type: 'select', 
          options: ['Free Trial', 'Basic', 'Standard', 'Premium', 'Enterprise'],
          required: true 
        }
      ]
    },
    {
      id: 'send_notification',
      label: 'Send Notification',
      description: 'Send email notification to selected tenants',
      icon: '📧',
      fields: [
        { name: 'subject', label: 'Subject', type: 'text', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true }
      ]
    },
    {
      id: 'apply_discount',
      label: 'Apply Discount',
      description: 'Apply discount to next payment',
      icon: '💸',
      fields: [
        { name: 'discount_percentage', label: 'Discount %', type: 'number', min: 1, max: 100, required: true },
        { name: 'duration_months', label: 'Duration (Months)', type: 'number', min: 1, max: 12, required: true }
      ]
    },
    {
      id: 'export_data',
      label: 'Export Tenant Data',
      description: 'Export tenant data as CSV',
      icon: '📥',
      fields: [
        { 
          name: 'data_type', 
          label: 'Data Type', 
          type: 'select', 
          options: ['All Data', 'Subscription Details', 'User List', 'Payment History'],
          required: true 
        }
      ]
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedCount === 0) {
      alert('Please select at least one tenant');
      return;
    }

    if (!selectedOperation) {
      alert('Please select an operation');
      return;
    }

    const operation = operations.find(op => op.id === selectedOperation);
    const requiredFields = operation.fields.filter(field => field.required);
    
    for (const field of requiredFields) {
      if (!operationData[field.name]) {
        alert(`Please fill in ${field.label}`);
        return;
      }
    }

    const confirmed = window.confirm(
      `Are you sure you want to perform "${operation.label}" on ${selectedCount} tenants?`
    );

    if (!confirmed) return;

    setLoading(true);
    
    try {
      await onOperation(selectedOperation, operationData);
      onClose();
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to perform operation'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOperationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectedOp = operations.find(op => op.id === selectedOperation);

  return (
    <div className="modal-overlay">
      <div className="modal large-modal">
        <div className="modal-header">
          <h2>Bulk Operations</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="bulk-selection-info">
            <div className="selection-count">
              <span className="count-number">{selectedCount}</span>
              <span className="count-label">tenants selected</span>
            </div>
            <div className="selection-warning">
              {selectedCount === 0 
                ? 'Please select tenants from the table'
                : 'This operation will affect all selected tenants'}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="operations-grid">
              {operations.map(operation => (
                <div 
                  key={operation.id}
                  className={`operation-card ${selectedOperation === operation.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOperation(operation.id)}
                >
                  <div className="operation-icon">{operation.icon}</div>
                  <div className="operation-content">
                    <h4>{operation.label}</h4>
                    <p>{operation.description}</p>
                  </div>
                  <div className="operation-check">
                    {selectedOperation === operation.id && '✓'}
                  </div>
                </div>
              ))}
            </div>

            {selectedOp && (
              <div className="operation-form">
                <h3>{selectedOp.label} Settings</h3>
                <div className="form-fields">
                  {selectedOp.fields.map(field => (
                    <div key={field.name} className="form-group">
                      <label>{field.label} *</label>
                      {field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={operationData[field.name] || ''}
                          onChange={handleChange}
                          required={field.required}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          value={operationData[field.name] || ''}
                          onChange={handleChange}
                          rows="4"
                          required={field.required}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={operationData[field.name] || ''}
                          onChange={handleChange}
                          min={field.min}
                          max={field.max}
                          required={field.required}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={selectedCount === 0 || !selectedOperation || loading}
              >
                {loading ? 'Processing...' : `Apply to ${selectedCount} Tenants`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;