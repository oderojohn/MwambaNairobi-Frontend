import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tenantsAPI } from '../services/ApiService/api';

const EditTenantPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    business_type: 'retail'
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const loadTenant = useCallback(async () => {
    try {
      // Since getTenants returns all, we need to find the specific one
      const tenants = await tenantsAPI.getTenants();
      const tenant = tenants.find(t => t.id === parseInt(id));
      if (tenant) {
        setFormData({
          name: tenant.name || '',
          display_name: tenant.display_name || '',
          domain: tenant.domain || '',
          email: tenant.email || '',
          phone: tenant.phone || '',
          address: tenant.address || '',
          business_type: tenant.business_type || 'retail'
        });
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
      alert('Failed to load tenant data');
      navigate('/admin');
    } finally {
      setFetchLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await tenantsAPI.updateTenant(id, formData);
      alert('Tenant updated successfully!');
      navigate('/admin');
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to update tenant'}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="admin-page">
        <div className="page-container">
          <div className="loading-spinner">Loading tenant data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-container">
        <div className="page-header">
          <h1>Edit Tenant</h1>
          <div className="breadcrumbs">
            <span onClick={() => navigate('/admin')} style={{cursor: 'pointer'}}>Admin</span> / <span>Edit Tenant</span>
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
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
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
                {loading ? 'Updating...' : 'Update Tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTenantPage;