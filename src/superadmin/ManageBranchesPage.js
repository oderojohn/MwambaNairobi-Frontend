// src/superadmin/ManageBranchesPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tenantsAPI, branchesAPI } from '../services/ApiService/api';

const ManageBranchesPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [branches, setBranches] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddBranch, setShowAddBranch] = useState(false);

  const loadTenantAndBranches = useCallback(async () => {
    try {
      setLoading(true);

      const tenants = await tenantsAPI.getTenants();
      const tenantData = tenants.find(t => t.id === Number(id));
      if (!tenantData) throw new Error('Tenant not found');
      setTenant(tenantData);

      const branchesData = await branchesAPI.getBranches();
      const tenantBranches = branchesData.filter(b => b.tenant === Number(id));
      setBranches(tenantBranches);
    } catch (error) {
      console.error(error);
      alert('Failed to load tenant branches');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTenantAndBranches();
  }, [loadTenantAndBranches]);

  const handleAddBranch = async (branchData) => {
    try {
      const result = await branchesAPI.createBranch({
        ...branchData,
        tenant: id
      });
      alert(result?.message ?? 'Branch added successfully');
      setShowAddBranch(false);
      loadTenantAndBranches();
    } catch (error) {
      alert(error?.message ?? 'Failed to add branch');
    }
  };

  const handleUpdateBranch = async (branchId, branchData) => {
    try {
      await branchesAPI.updateBranch(branchId, branchData);
      alert('Branch updated successfully');
      loadTenantAndBranches();
    } catch (error) {
      alert(error?.message ?? 'Failed to update branch');
    }
  };

  const handleDeleteBranch = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch? This will affect all users and data associated with it.')) {
      return;
    }

    try {
      await branchesAPI.deleteBranch(branchId);
      alert('Branch deleted successfully');
      loadTenantAndBranches();
    } catch (error) {
      alert(error?.message ?? 'Failed to delete branch');
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="page-container">
          <div className="loading-spinner">Loading branches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-container">
        <div className="page-header">
          <h1>Manage Branches: {tenant?.display_name}</h1>
          <div className="breadcrumbs">
            <span onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
              Admin
            </span>{' '}
            / <span>Manage Branches</span>
          </div>
        </div>

        <div className="form-container">
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => setShowAddBranch(true)}>
              Add Branch
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Manager</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {branches.map(branch => (
                <tr key={branch.id}>
                  <td>{branch.name}</td>
                  <td>{branch.location}</td>
                  <td>{branch.address}</td>
                  <td>{branch.phone}</td>
                  <td>{branch.manager ? `${branch.manager.user.first_name} ${branch.manager.user.last_name}` : 'N/A'}</td>
                  <td>{branch.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button
                      className="btn-sm btn-edit"
                      onClick={() => {
                        // For now, just alert. Could implement edit modal
                        alert('Edit branch feature coming soon');
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => handleDeleteBranch(branch.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {showAddBranch && (
            <AddBranchModal
              onClose={() => setShowAddBranch(false)}
              onAdd={handleAddBranch}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const AddBranchModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    manager: '',
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
          <h2>Add Branch to Tenant</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Branch Name *</label>
            <input name="name" required value={formData.name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Location *</label>
            <input name="location" required value={formData.location} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea name="address" required value={formData.address} onChange={handleChange} rows="3" />
          </div>

          <div className="form-group">
            <label>Phone *</label>
            <input name="phone" required value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Manager (Optional)</label>
            <input name="manager" value={formData.manager} onChange={handleChange} placeholder="Manager ID" />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageBranchesPage;