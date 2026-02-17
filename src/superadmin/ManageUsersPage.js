// src/superadmin/ManageUsersPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tenantsAPI, branchesAPI } from '../services/ApiService/api';

const ManageUsersPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [users, setUsers] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);

  const loadTenantAndUsers = useCallback(async () => {
    try {
      setLoading(true);

      const tenants = await tenantsAPI.getTenants();
      const tenantData = tenants.find(t => t.id === Number(id));
      if (!tenantData) throw new Error('Tenant not found');
      setTenant(tenantData);

      // Load branches for this tenant
      const branchesData = await branchesAPI.getBranches();
      const tenantBranches = branchesData.filter(b => b.tenant === Number(id));
      setBranches(tenantBranches);

      const usersData = await tenantsAPI.getTenantUsers(id);
      setUsers(usersData.results ?? usersData);
    } catch (error) {
      console.error(error);
      alert('Failed to load tenant users');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTenantAndUsers();
  }, [loadTenantAndUsers]);

  const handleAddUser = async (userData) => {
    try {
      const result = await tenantsAPI.addUserToTenant(id, userData);
      alert(result?.message ?? 'User added successfully');
      setShowAddUser(false);
      loadTenantAndUsers();
    } catch (error) {
      alert(error?.message ?? 'Failed to add user');
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the tenant?')) {
      return;
    }

    try {
      await tenantsAPI.removeUserFromTenant(id, userId);
      alert('User removed successfully');
      loadTenantAndUsers();
    } catch (error) {
      alert(error?.message ?? 'Failed to remove user');
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="page-container">
          <div className="loading-spinner">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-container">
        <div className="page-header">
          <h1>Manage Users: {tenant?.display_name}</h1>
          <div className="breadcrumbs">
            <span onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
              Admin
            </span>{' '}
            / <span>Manage Users</span>
          </div>
        </div>

        <div className="form-container">
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => setShowAddUser(true)}>
              Add User
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Branch</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.user?.username}</td>
                  <td>
                    {[user.user?.first_name, user.user?.last_name]
                      .filter(Boolean)
                      .join(' ')}
                  </td>
                  <td>{user.user?.email}</td>
                  <td>{user.branch?.name || 'N/A'}</td>
                  <td>{user.role}</td>
                  <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => handleRemoveUser(user.user?.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {showAddUser && (
            <AddUserModal
              onClose={() => setShowAddUser(false)}
              onAdd={handleAddUser}
              branches={branches}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const AddUserModal = ({ onClose, onAdd, branches }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    branch: '',
    role: 'cashier',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Add User to Tenant</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Username *</label>
            <input name="username" required value={formData.username} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>First Name</label>
            <input name="first_name" value={formData.first_name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input name="last_name" value={formData.last_name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Branch *</label>
            <select name="branch" value={formData.branch} onChange={handleChange} required>
              <option value="">Select Branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.location}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="viewer">Viewer</option>
              <option value="cashier">Cashier</option>
              <option value="inventory_clerk">Inventory Clerk</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageUsersPage;
