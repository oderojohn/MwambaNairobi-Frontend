import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantsAPI, subscriptionsAPI } from '../services/ApiService/api';

const GenerateKeysPage = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState({
    count: 1,
    plan_type: 'basic',
    key_type: 'subscription',
    duration_days: 30,
    max_activations: 1,
    tenant_id: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await tenantsAPI.getTenants();
      setTenants(data.results || data);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await subscriptionsAPI.generateActivationKeys(formData);
      const tenantMsg = result.tenant ? ` for ${result.tenant}` : '';
      alert(`Generated ${result.keys.length} activation keys${tenantMsg} successfully!`);
      navigate('/admin');
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to generate keys'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-container">
        <div className="page-header">
           <h1>Generate Tenant-Specific Activation Keys</h1>
           <div className="breadcrumbs">
             <span onClick={() => navigate('/admin')} style={{cursor: 'pointer'}}>Admin</span> / <span>Generate Keys</span>
           </div>
         </div>

        <div className="form-container">
           <form onSubmit={handleSubmit} className="tenant-form">
             <div className="form-grid">
               <div className="form-group">
                 <label>Tenant *</label>
                 <select
                   name="tenant_id"
                   value={formData.tenant_id}
                   onChange={handleChange}
                   required
                 >
                   <option value="">Select Tenant</option>
                   {tenants.map(tenant => (
                     <option key={tenant.id} value={tenant.id}>
                       {tenant.display_name} ({tenant.domain})
                     </option>
                   ))}
                 </select>
               </div>

               <div className="form-group">
                 <label>Number of Keys *</label>
                 <input
                   type="number"
                   name="count"
                   value={formData.count}
                   onChange={handleChange}
                   min="1"
                   max="10"
                   required
                 />
               </div>

              <div className="form-group">
                <label>Plan Type *</label>
                <select
                  name="plan_type"
                  value={formData.plan_type}
                  onChange={handleChange}
                  required
                >
                  <option value="free">Free Trial</option>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="form-group">
                <label>Key Type *</label>
                <select
                  name="key_type"
                  value={formData.key_type}
                  onChange={handleChange}
                  required
                >
                  <option value="trial">Trial Key</option>
                  <option value="subscription">Subscription Key</option>
                  <option value="extension">Extension Key</option>
                  <option value="upgrade">Upgrade Key</option>
                </select>
              </div>

              <div className="form-group">
                <label>Duration (Days) *</label>
                <input
                  type="number"
                  name="duration_days"
                  value={formData.duration_days}
                  onChange={handleChange}
                  min="1"
                  max="365"
                  required
                />
              </div>

              <div className="form-group">
                <label>Max Activations *</label>
                <input
                  type="number"
                  name="max_activations"
                  value={formData.max_activations}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Internal notes for these keys"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/admin')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Keys'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GenerateKeysPage;