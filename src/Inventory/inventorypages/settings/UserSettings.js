import React, { useEffect, useMemo, useState } from 'react';
import {
  FiEdit,
  FiPlus,
  FiSave,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiUsers,
} from 'react-icons/fi';
import {
  DEFAULT_TOPBAR_PERMISSIONS,
  branchesAPI,
  normalizeTopbarPermissions,
  usersAPI,
} from '../../../services/ApiService/api';

const FALLBACK_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'bar_manager', label: 'Bar Manager' },
  { value: 'waiter', label: 'Waiter' },
  { value: 'storekeeper', label: 'Storekeeper' },
];

const TOPBAR_ACTIONS = [
  { key: 'pending_orders', label: 'Pending Orders', hint: 'See and resume held/pending orders.' },
  { key: 'sales_summary', label: 'Sales Summary', hint: 'Open shift or day-level sales summaries.' },
  { key: 'shift', label: 'Shift', hint: 'Start/close shifts and view shift data.' },
  { key: 'order_prep', label: 'Order Prep', hint: 'Access order preparation workspace.' },
  { key: 'logout', label: 'Logout', hint: 'Allow quick logout from POS.' },
  { key: 'global_sales', label: 'Team Sales', hint: 'View all users’ sales/shift data and audit actions.' },
];

const toTopbar = (raw) => normalizeTopbarPermissions(raw?.allowed_buttons ? raw.allowed_buttons : raw);

const buildEmptyForm = (roles = []) => ({
  user: {
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_staff: false,
    is_superuser: false,
    group_ids: [],
  },
  role: roles[0]?.value || 'cashier',
  branch: '',
  pin: '',
  is_active: true,
  topbar_permissions: DEFAULT_TOPBAR_PERMISSIONS,
});

const getRoleLabel = (roles, value) => roles.find((role) => role.value === value)?.label || FALLBACK_ROLES.find((role) => role.value === value)?.label || value || '—';

const getGroupIds = (user) => (user.user?.groups || []).map((group) => group.id);

const UserSettings = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(buildEmptyForm());
  const [groupName, setGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const asArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (data?.results && typeof data.results === 'object') return Object.values(data.results);
    return data ? Object.values(data) : [];
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [userRes, roleRes, groupRes, branchRes] = await Promise.all([
        usersAPI.getUsers(),
        usersAPI.getRoles().catch(() => []),
        usersAPI.getGroups().catch(() => []),
        branchesAPI.getBranches().catch(() => []),
      ]);
      setUsers(asArray(userRes));
      const mergedRoles = [...(roleRes || [])];
      FALLBACK_ROLES.forEach((fallbackRole) => {
        if (!mergedRoles.some((role) => role.value === fallbackRole.value)) {
          mergedRoles.push(fallbackRole);
        }
      });
      setRoles(mergedRoles);
      setGroups(asArray(groupRes));
      setBranches(branchRes || []);
      if (!editingUser) setFormData(buildEmptyForm(mergedRoles));
    } catch (error) {
      console.error('Error loading users:', error);
      setErrorMessage(error.message || 'Failed to load users, roles, or groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePermissionToggle = async (userId, key) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const current = toTopbar(target.topbar_permissions);
    const updated = { ...current, [key]: !current[key] };

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, topbar_permissions: updated } : u)));

    try {
      await usersAPI.updateTopbarPermissions(userId, updated);
    } catch (error) {
      console.error('Permission update failed:', error);
      setErrorMessage(error.message || 'Failed to update permissions');
      loadData();
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u)));
    try {
      await usersAPI.updateUser(userId, { is_active: isActive });
    } catch (error) {
      console.error('Error updating user status:', error);
      setErrorMessage(error.message || 'Failed to update user status');
      loadData();
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(buildEmptyForm(roles));
    setShowAddUser(true);
    setErrorMessage('');
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      user: {
        username: user.user?.username || user.username || '',
        email: user.user?.email || '',
        first_name: user.user?.first_name || '',
        last_name: user.user?.last_name || '',
        password: '',
        is_staff: Boolean(user.user?.is_staff),
        is_superuser: Boolean(user.user?.is_superuser),
        group_ids: getGroupIds(user),
      },
      role: user.role,
      branch: user.branch || '',
      pin: user.pin || '',
      is_active: user.is_active,
      topbar_permissions: toTopbar(user.topbar_permissions),
    });
    setShowAddUser(true);
    setErrorMessage('');
  };

  const handleFormChange = (section, key, value) => {
    if (section === 'user') {
      setFormData((prev) => ({ ...prev, user: { ...prev.user, [key]: value } }));
      return;
    }
    if (section === 'topbar_permissions') {
      setFormData((prev) => ({
        ...prev,
        topbar_permissions: { ...prev.topbar_permissions, [key]: value },
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [section]: value }));
  };

  const handleRoleSelect = (value) => {
    const isAdmin = value === 'admin';
    setFormData((prev) => ({
      ...prev,
      role: value,
      user: {
        ...prev.user,
        is_staff: isAdmin ? true : prev.user.is_staff,
        is_superuser: isAdmin ? true : prev.user.is_superuser,
      },
    }));
  };

  const handleAdminToggle = (checked) => {
    setFormData((prev) => ({
      ...prev,
      role: checked ? 'admin' : prev.role === 'admin' ? 'manager' : prev.role,
      user: {
        ...prev.user,
        is_staff: checked,
        is_superuser: checked,
      },
    }));
  };

  const handleGroupSelection = (groupId) => {
    setFormData((prev) => {
      const exists = prev.user.group_ids.includes(groupId);
      return {
        ...prev,
        user: {
          ...prev.user,
          group_ids: exists
            ? prev.user.group_ids.filter((id) => id !== groupId)
            : [...prev.user.group_ids, groupId],
        },
      };
    });
  };

  const handleSaveUser = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setErrorMessage('');

    const payload = {
      ...formData,
      topbar_permissions: toTopbar(formData.topbar_permissions),
      is_staff: formData.user.is_staff,
      is_superuser: formData.user.is_superuser,
      group_ids: formData.user.group_ids,
    };

    if (payload.user && !payload.user.password) {
      delete payload.user.password;
    }

    try {
      if (editingUser) {
        await usersAPI.updateUser(editingUser.id, payload);
      } else {
        await usersAPI.createUser(payload);
      }
      await loadData();
      setShowAddUser(false);
    } catch (error) {
      console.error('Error saving user:', error);
      setErrorMessage(error.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return;
    setErrorMessage('');
    try {
      if (editingGroupId) {
        await usersAPI.updateGroup(editingGroupId, { name: groupName.trim() });
      } else {
        await usersAPI.createGroup({ name: groupName.trim() });
      }
      setGroupName('');
      setEditingGroupId(null);
      await loadData();
    } catch (error) {
      console.error('Error saving group:', error);
      setErrorMessage(error.message || 'Failed to save group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group?')) return;
    try {
      await usersAPI.deleteGroup(groupId);
      await loadData();
    } catch (error) {
      console.error('Error deleting group:', error);
      setErrorMessage(error.message || 'Failed to delete group');
    }
  };

  const activeUsers = useMemo(() => users.filter((u) => u.is_active).length, [users]);
  const adminCount = useMemo(
    () => users.filter((u) => u.role === 'admin' || u.user?.is_superuser || u.user?.is_staff).length,
    [users],
  );

  return (
    <div className="user-settings-section">
      <div className="user-settings-header">
        <h2>Users, Roles and Groups</h2>
        <p>Manage user roles, Django groups, POS top bar access, and promote admin users from the frontend.</p>
      </div>

      <div className="user-settings-toolbar" style={{ justifyContent: 'space-between' }}>
        <div className="user-settings-stats">
          <span className="user-settings-chip user-settings-chip-success">{activeUsers} active users</span>
          <span className="user-settings-chip user-settings-chip-neutral">{users.length - activeUsers} inactive</span>
          <span className="user-settings-chip user-settings-chip-warning">{adminCount} admins</span>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <FiPlus /> Add User
        </button>
      </div>

      {errorMessage && <div className="user-settings-alert user-settings-alert-warning">{errorMessage}</div>}

      <div className="user-settings-card">
        <div className="user-settings-card-header">
          <h3><FiUsers /> User Groups</h3>
          <p>Create and maintain Django auth groups from the frontend.</p>
        </div>

        <div className="user-settings-group-form">
          <div className="user-settings-form-group">
            <label>Group Name</label>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Bar Team" />
          </div>
          <div className="user-settings-form-group">
            <button type="button" className="btn btn-primary" onClick={handleSaveGroup}>
              <FiSave /> {editingGroupId ? 'Update Group' : 'Create Group'}
            </button>
          </div>
        </div>

        <div className="user-settings-groups-list">
          {groups.length === 0 && <div className="user-settings-muted">No groups created yet.</div>}
          {groups.map((group) => (
            <div key={group.id} className="user-settings-group-item">
              <div className="user-settings-group-item-header">
                <h4>{group.name}</h4>
                <div className="user-settings-actions">
                  <button
                    className="user-settings-icon-btn"
                    type="button"
                    onClick={() => {
                      setEditingGroupId(group.id);
                      setGroupName(group.name);
                    }}
                    title="Rename group"
                  >
                    <FiEdit />
                  </button>
                  <button className="btn-icon btn-warning" type="button" onClick={() => handleDeleteGroup(group.id)} title="Delete group">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="user-settings-card">
        <div className="user-settings-card-header">
          <h3><FiShield /> Roles and POS Access</h3>
          <p>Assign system roles, groups, admin rights, and top bar actions per user.</p>
        </div>

        <div className="user-settings-table-wrap">
          <table className="user-settings-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Groups</th>
                <th>Admin</th>
                <th>Branch</th>
                <th>Status</th>
                {TOPBAR_ACTIONS.map((action) => (
                  <th key={action.key}>{action.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={TOPBAR_ACTIONS.length + 7}>Loading users...</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={TOPBAR_ACTIONS.length + 7}>No users found.</td></tr>
              )}
              {!loading && users.map((user) => {
                const perms = toTopbar(user.topbar_permissions);
                const userGroups = user.user?.groups || [];
                const isAdmin = user.role === 'admin' || user.user?.is_staff || user.user?.is_superuser;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="user-settings-user-cell">
                        <strong>{user.user?.username || user.username}</strong>
                        <div className="user-settings-muted">{user.user?.first_name} {user.user?.last_name}</div>
                      </div>
                    </td>
                    <td><span className="user-settings-role-badge">{getRoleLabel(roles, user.role)}</span></td>
                    <td>{userGroups.length ? userGroups.map((group) => group.name).join(', ') : '—'}</td>
                    <td>{isAdmin ? <span className="user-settings-chip user-settings-chip-warning">Admin</span> : '—'}</td>
                    <td>{user.branch || '—'}</td>
                    <td>
                      <span className={`user-settings-status-badge ${user.is_active ? 'is-active' : 'is-inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {TOPBAR_ACTIONS.map((action) => (
                      <td key={action.key}>
                        <label className="user-settings-checkbox" title={action.hint}>
                          <input type="checkbox" checked={perms[action.key]} onChange={() => handlePermissionToggle(user.id, action.key)} />
                        </label>
                      </td>
                    ))}
                    <td>
                      <div className="user-settings-actions">
                        <button className="user-settings-icon-btn" onClick={() => openEditModal(user)} title="Edit user">
                          <FiEdit />
                        </button>
                        <button
                          className={`user-settings-icon-btn ${user.is_active ? 'is-warning' : 'is-success'}`}
                          onClick={() => toggleUserStatus(user.id, !user.is_active)}
                          title={user.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.is_active ? <FiUserX /> : <FiUserCheck />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddUser && (
        <div className="user-settings-modal user-settings-modal-active">
          <div className="user-settings-modal-content">
            <div className="user-settings-modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <span className="user-settings-modal-close" onClick={() => setShowAddUser(false)}>&times;</span>
            </div>
            <div className="user-settings-modal-body">
              <form onSubmit={handleSaveUser} className="user-settings-form-grid">
                <div className="user-settings-form-group">
                  <label>Username</label>
                  <input type="text" required value={formData.user.username} onChange={(e) => handleFormChange('user', 'username', e.target.value)} />
                </div>
                <div className="user-settings-form-group">
                  <label>Email</label>
                  <input type="email" required value={formData.user.email} onChange={(e) => handleFormChange('user', 'email', e.target.value)} />
                </div>
                <div className="user-settings-form-group">
                  <label>First Name</label>
                  <input type="text" value={formData.user.first_name} onChange={(e) => handleFormChange('user', 'first_name', e.target.value)} />
                </div>
                <div className="user-settings-form-group">
                  <label>Last Name</label>
                  <input type="text" value={formData.user.last_name} onChange={(e) => handleFormChange('user', 'last_name', e.target.value)} />
                </div>
                {!editingUser && (
                  <div className="user-settings-form-group">
                    <label>Temporary Password</label>
                    <input type="password" required value={formData.user.password} onChange={(e) => handleFormChange('user', 'password', e.target.value)} />
                  </div>
                )}
                <div className="user-settings-form-group">
                  <label>Role</label>
                  <select value={formData.role} onChange={(e) => handleRoleSelect(e.target.value)}>
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div className="user-settings-form-group">
                  <label>Branch</label>
                  <select
                    value={formData.branch || ''}
                    onChange={(e) => handleFormChange('branch', null, e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">None</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                <div className="user-settings-form-group">
                  <label>Login PIN (5 digits)</label>
                  <input type="text" maxLength={5} value={formData.pin || ''} onChange={(e) => handleFormChange('pin', null, e.target.value)} />
                </div>
                <div className="user-settings-form-group user-settings-form-group-check">
                  <label className="user-settings-checkbox">
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => handleFormChange('is_active', null, e.target.checked)} />
                    Active account
                  </label>
                </div>
                <div className="user-settings-form-group user-settings-form-group-check">
                  <label className="user-settings-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.user.is_staff && formData.user.is_superuser}
                      onChange={(e) => handleAdminToggle(e.target.checked)}
                    />
                    Make this user admin
                  </label>
                </div>
                <div className="user-settings-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>User Groups</label>
                  <div className="user-settings-permissions-grid">
                    {groups.map((group) => (
                      <label key={group.id} className="user-settings-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.user.group_ids.includes(group.id)}
                          onChange={() => handleGroupSelection(group.id)}
                        />
                        {group.name}
                      </label>
                    ))}
                    {groups.length === 0 && <span className="user-settings-muted">Create a group first to assign users.</span>}
                  </div>
                </div>
                <div className="user-settings-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Top Bar Buttons</label>
                  <div className="user-settings-permissions-grid">
                    {TOPBAR_ACTIONS.map((action) => (
                      <label key={action.key} className="user-settings-checkbox" title={action.hint}>
                        <input
                          type="checkbox"
                          checked={formData.topbar_permissions[action.key]}
                          onChange={(e) => handleFormChange('topbar_permissions', action.key, e.target.checked)}
                        />
                        {action.label}
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="user-settings-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveUser} disabled={saving}>
                <FiSave /> {saving ? 'Saving...' : 'Save User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;
