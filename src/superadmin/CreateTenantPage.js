import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantsAPI } from '../services/ApiService/api';

const CreateTenantPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    domain: '',
    email: '',
    phone: '',
    business_type: 'retail'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate domain from name if not manually set
      domain: name === 'name' && !formData.domain ? value.toLowerCase().replace(/\s+/g, '') : prev.domain
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newTenant = await tenantsAPI.createTenant(formData);
      alert('Tenant created successfully!');
      navigate('/admin');
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to create tenant'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-container">
        <div className="page-header">
          <h1>Create New Tenant</h1>
          <div className="breadcrumbs">
            <span onClick={() => navigate('/admin')} style={{cursor: 'pointer'}}>Admin</span> / <span>Create Tenant</span>
          </div>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="tenant-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Tenant Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="Will use tenant name if empty"
                />
              </div>

              <div className="form-group">
                <label>Domain *</label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Business Type</label>
                <select
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleChange}
                >
                  <option value="retail">Retail Store</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="supermarket">Supermarket</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="other">Other</option>
                </select>
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
                {loading ? 'Creating...' : 'Create Tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTenantPage;