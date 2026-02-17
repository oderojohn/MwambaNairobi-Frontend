import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantsAPI, usersAPI } from '../services/ApiService/api';
import './AdminPage.css';

const CreateUsersPage = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createdUser, setCreatedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    tenant_id: '',
    role: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tenantsData, rolesData] = await Promise.all([
        tenantsAPI.getTenants(),
        tenantsAPI.getTenantRoles()
      ]);
      setTenants(tenantsData.results || tenantsData);
      setRoles(rolesData);
      // Set default role if roles are loaded
      if (rolesData.length > 0) {
        setFormData(prev => ({ ...prev, role: rolesData[0].value }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // First create the user
      const newUser = await usersAPI.createUser(formData);
      let tenantUser = null;
      // Then add to tenant if tenant is specified
      if (formData.tenant_id) {
        tenantUser = await tenantsAPI.addUserToTenant(formData.tenant_id, {
          user_id: newUser.id,
          role: formData.role || 'cashier'
        });
      }
      setCreatedUser({
        ...newUser,
        tenant_user: tenantUser,
        tenant: tenants.find(t => t.id === formData.tenant_id)
      });
      alert('User created successfully!');
      // Don't navigate away, show user rights instead
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to create user'}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="admin-page loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <button
          className="btn-secondary back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back to Dashboard
        </button>
        <h1>Create User for Tenant</h1>
      </div>

      <div className="page-content">
        <div className="form-container">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-section">
              <h2>User Information</h2>

              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
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
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Tenant Assignment</h2>

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
                      {tenant.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create User
              </button>
            </div>
          </form>
        </div>

        {createdUser && (
          <div className="user-rights-section">
            <h2>User Rights Summary</h2>
            <div className="user-info">
              <p><strong>Username:</strong> {createdUser.username}</p>
              <p><strong>Email:</strong> {createdUser.email}</p>
              <p><strong>Name:</strong> {createdUser.first_name} {createdUser.last_name}</p>
              {createdUser.tenant && (
                <>
                  <p><strong>Tenant:</strong> {createdUser.tenant.display_name}</p>
                  <p><strong>Role:</strong> {roles.find(r => r.value === createdUser.tenant_user?.role)?.label || createdUser.tenant_user?.role}</p>
                  <div className="permissions">
                    <h3>Permissions:</h3>
                    <ul>
                      <li>Can Manage Users: {createdUser.tenant_user?.can_manage_users ? 'Yes' : 'No'}</li>
                      <li>Can Manage Inventory: {createdUser.tenant_user?.can_manage_inventory ? 'Yes' : 'No'}</li>
                      <li>Can Manage Sales: {createdUser.tenant_user?.can_manage_sales ? 'Yes' : 'No'}</li>
                      <li>Can View Reports: {createdUser.tenant_user?.can_view_reports ? 'Yes' : 'No'}</li>
                      <li>Can Manage Settings: {createdUser.tenant_user?.can_manage_settings ? 'Yes' : 'No'}</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
            <div className="form-actions">
              <button type="button" className="btn-primary" onClick={() => navigate(-1)}>
                Back to Dashboard
              </button>
              <button type="button" className="btn-secondary" onClick={() => {
                setCreatedUser(null);
                setFormData({
                  username: '',
                  email: '',
                  first_name: '',
                  last_name: '',
                  password: '',
                  tenant_id: '',
                  role: roles.length > 0 ? roles[0].value : ''
                });
              }}>
                Create Another User
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateUsersPage;