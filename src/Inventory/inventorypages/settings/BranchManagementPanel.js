import React, { useMemo, useState } from 'react';
import {
  FiEdit,
  FiGitBranch,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiTrash2,
  FiUsers,
} from 'react-icons/fi';

const DEFAULT_BRANCH_FORM = {
  name: '',
  location: '',
  address: '',
  phone: '',
  manager: '',
  is_active: true,
};

const MANAGER_ROLES = ['admin', 'manager', 'supervisor', 'bar_manager'];

const BranchManagementPanel = ({
  branches,
  users,
  currentRole,
  onCreateBranch,
  onUpdateBranch,
  onDeleteBranch,
}) => {
  const [formData, setFormData] = useState(DEFAULT_BRANCH_FORM);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isReadOnly = currentRole !== 'admin';

  const managerCandidates = useMemo(
    () => users.filter((user) => user.is_active && MANAGER_ROLES.includes(user.role)),
    [users],
  );

  const activeBranches = useMemo(
    () => branches.filter((branch) => branch.is_active).length,
    [branches],
  );

  const staffedBranches = useMemo(
    () => branches.filter((branch) => branch.manager_id).length,
    [branches],
  );

  const resetModal = () => {
    setEditingBranch(null);
    setFormData(DEFAULT_BRANCH_FORM);
    setShowModal(false);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormData(DEFAULT_BRANCH_FORM);
    setShowModal(true);
    setErrorMessage('');
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      location: branch.location || '',
      address: branch.address || '',
      phone: branch.phone || '',
      manager: branch.manager_id ?? branch.manager?.id ?? '',
      is_active: Boolean(branch.is_active),
    });
    setShowModal(true);
    setErrorMessage('');
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage('');

    const payload = {
      name: formData.name.trim(),
      location: formData.location.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      manager: formData.manager ? Number(formData.manager) : null,
      is_active: Boolean(formData.is_active),
    };

    try {
      if (editingBranch) {
        await onUpdateBranch(editingBranch.id, payload);
      } else {
        await onCreateBranch(payload);
      }
      resetModal();
    } catch (error) {
      console.error('Failed to save branch:', error);
      setErrorMessage(error.message || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branchId, branchName) => {
    if (!window.confirm(`Delete ${branchName}? Users assigned to this branch will lose the branch link.`)) {
      return;
    }

    try {
      await onDeleteBranch(branchId);
    } catch (error) {
      console.error('Failed to delete branch:', error);
      setErrorMessage(error.message || 'Failed to delete branch');
    }
  };

  return (
    <>
      <div className="user-settings-card">
        <div className="user-settings-card-header">
          <div>
            <h3><FiGitBranch /> Branch Operations</h3>
            <p>Connect physical branches to your admin workflow, assign branch leads, and keep teams organized.</p>
          </div>
          {!isReadOnly && (
            <button className="btn btn-primary" type="button" onClick={openCreateModal}>
              <FiPlus /> Add Branch
            </button>
          )}
        </div>

        <div className="user-settings-metric-grid">
          <div className="user-settings-metric-card">
            <span className="user-settings-metric-label">Total branches</span>
            <strong>{branches.length}</strong>
          </div>
          <div className="user-settings-metric-card">
            <span className="user-settings-metric-label">Active branches</span>
            <strong>{activeBranches}</strong>
          </div>
          <div className="user-settings-metric-card">
            <span className="user-settings-metric-label">Branches with managers</span>
            <strong>{staffedBranches}</strong>
          </div>
        </div>

        {isReadOnly && (
          <div className="user-settings-alert user-settings-alert-info">
            Branch creation and edits are reserved for admins. Managers can still review branch coverage from here.
          </div>
        )}

        {errorMessage && <div className="user-settings-alert user-settings-alert-warning">{errorMessage}</div>}

        <div className="user-settings-table-wrap">
          <table className="user-settings-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Location</th>
                <th>Manager</th>
                <th>Team</th>
                <th>Contact</th>
                <th>Status</th>
                {!isReadOnly && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 6 : 7}>No branches created yet.</td>
                </tr>
              )}
              {branches.map((branch) => (
                <tr key={branch.id}>
                  <td>
                    <div className="user-settings-user-cell">
                      <strong>{branch.name}</strong>
                      <span className="user-settings-muted">{branch.address || 'No address set'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-settings-inline-meta">
                      <FiMapPin />
                      <span>{branch.location || 'Unspecified'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-settings-user-cell">
                      <strong>{branch.manager_name || 'Unassigned'}</strong>
                      <span className="user-settings-muted">{branch.manager?.role || branch.manager_role || 'No branch lead'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-settings-inline-meta">
                      <FiUsers />
                      <span>{branch.active_user_count || 0} active / {branch.user_count || 0} total</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-settings-inline-meta">
                      <FiPhone />
                      <span>{branch.phone || 'No phone'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`user-settings-status-badge ${branch.is_active ? 'is-active' : 'is-inactive'}`}>
                      {branch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {!isReadOnly && (
                    <td>
                      <div className="user-settings-actions">
                        <button className="user-settings-icon-btn" type="button" onClick={() => openEditModal(branch)} title="Edit branch">
                          <FiEdit />
                        </button>
                        <button
                          className="user-settings-icon-btn is-warning"
                          type="button"
                          onClick={() => handleDelete(branch.id, branch.name)}
                          title="Delete branch"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="user-settings-modal user-settings-modal-active">
          <div className="user-settings-modal-content">
            <div className="user-settings-modal-header">
              <h3>{editingBranch ? 'Edit Branch' : 'Create Branch'}</h3>
              <span className="user-settings-modal-close" onClick={resetModal}>&times;</span>
            </div>
            <div className="user-settings-modal-body">
              <form onSubmit={handleSubmit} className="user-settings-form-grid">
                <div className="user-settings-form-group">
                  <label>Branch Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                  />
                </div>
                <div className="user-settings-form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(event) => handleChange('location', event.target.value)}
                  />
                </div>
                <div className="user-settings-form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(event) => handleChange('phone', event.target.value)}
                  />
                </div>
                <div className="user-settings-form-group">
                  <label>Branch Manager</label>
                  <select
                    value={formData.manager}
                    onChange={(event) => handleChange('manager', event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {managerCandidates.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.user?.username || user.username} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="user-settings-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(event) => handleChange('address', event.target.value)}
                  />
                </div>
                <div className="user-settings-form-group user-settings-form-group-check">
                  <label className="user-settings-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(event) => handleChange('is_active', event.target.checked)}
                    />
                    Branch is active
                  </label>
                </div>
              </form>
            </div>
            <div className="user-settings-modal-footer">
              <button className="btn btn-secondary" type="button" onClick={resetModal}>Cancel</button>
              <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : editingBranch ? 'Save Changes' : 'Create Branch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BranchManagementPanel;
