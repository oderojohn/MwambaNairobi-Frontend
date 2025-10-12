import  { useState, useEffect } from 'react';
import { FiSave, FiPlus, FiEdit, FiUserCheck, FiUserX } from 'react-icons/fi';

const UserSettings = () => {
  const [settings, setSettings] = useState({
    defaultRole: 'storekeeper',
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      passwordExpiryDays: 90
    },
    sessionSettings: {
      maxConcurrentSessions: 3,
      sessionTimeoutMinutes: 30,
      requireStrongPasswords: true
    },
    userRoles: [
      { id: 1, name: 'admin', displayName: 'Administrator', permissions: ['all'] },
      { id: 2, name: 'manager', displayName: 'Manager', permissions: ['users', 'reports', 'settings'] },
      { id: 3, name: 'storekeeper', displayName: 'Store Keeper', permissions: ['inventory', 'sales', 'purchasing'] }
    ],
    twoFactorAuth: {
      enabled: false,
      required: false,
      methods: ['sms', 'email', 'app']
    }
  });

  const [users] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [ setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUsers();
  }, []);

  const loadSettings = async () => {
    try {
      // Load user settings from API
      // const response = await settingsAPI.getUserSettings();
      // setSettings(response);
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // Load users from API
      // const response = await usersAPI.getUsers();
      // setUsers(response);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings to API
      // await settingsAPI.updateUserSettings(settings);
      alert('User settings saved successfully!');
    } catch (error) {
      console.error('Error saving user settings:', error);
      alert('Failed to save user settings');
    } finally {
      setSaving(false);
    }
  };

  const updatePasswordPolicy = (field, value) => {
    setSettings(prev => ({
      ...prev,
      passwordPolicy: {
        ...prev.passwordPolicy,
        [field]: value
      }
    }));
  };

  const updateSessionSettings = (field, value) => {
    setSettings(prev => ({
      ...prev,
      sessionSettings: {
        ...prev.sessionSettings,
        [field]: value
      }
    }));
  };

  const updateTwoFactorAuth = (field, value) => {
    setSettings(prev => ({
      ...prev,
      twoFactorAuth: {
        ...prev.twoFactorAuth,
        [field]: value
      }
    }));
  };

  const updateRolePermissions = (roleId, permissions) => {
    setSettings(prev => ({
      ...prev,
      userRoles: prev.userRoles.map(role =>
        role.id === roleId ? { ...role, permissions } : role
      )
    }));
  };

  



  const toggleUserStatus = async (userId, isActive) => {
    try {
      // await usersAPI.updateUser(userId, { is_active: isActive });
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>Users & Roles Settings</h2>
        <p>Manage user accounts, roles, and access permissions</p>
      </div>

      <div className="settings-form">
        {/* Default Settings */}
        <div className="settings-group">
          <h3>Default Settings</h3>
          <div className="form-group">
            <label>Default User Role</label>
            <select
              value={settings.defaultRole}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultRole: e.target.value }))}
            >
              {settings.userRoles.map(role => (
                <option key={role.id} value={role.name}>
                  {role.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Password Policy */}
        <div className="settings-group">
          <h3>Password Policy</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Minimum Length</label>
              <input
                type="number"
                min="6"
                max="32"
                value={settings.passwordPolicy.minLength}
                onChange={(e) => updatePasswordPolicy('minLength', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Password Expiry (days)</label>
              <input
                type="number"
                min="30"
                max="365"
                value={settings.passwordPolicy.passwordExpiryDays}
                onChange={(e) => updatePasswordPolicy('passwordExpiryDays', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.passwordPolicy.requireUppercase}
                onChange={(e) => updatePasswordPolicy('requireUppercase', e.target.checked)}
              />
              Require uppercase letters
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.passwordPolicy.requireLowercase}
                onChange={(e) => updatePasswordPolicy('requireLowercase', e.target.checked)}
              />
              Require lowercase letters
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.passwordPolicy.requireNumbers}
                onChange={(e) => updatePasswordPolicy('requireNumbers', e.target.checked)}
              />
              Require numbers
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.passwordPolicy.requireSpecialChars}
                onChange={(e) => updatePasswordPolicy('requireSpecialChars', e.target.checked)}
              />
              Require special characters
            </label>
          </div>
        </div>

        {/* Session Settings */}
        <div className="settings-group">
          <h3>Session Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Max Concurrent Sessions</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.sessionSettings.maxConcurrentSessions}
                onChange={(e) => updateSessionSettings('maxConcurrentSessions', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={settings.sessionSettings.sessionTimeoutMinutes}
                onChange={(e) => updateSessionSettings('sessionTimeoutMinutes', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.sessionSettings.requireStrongPasswords}
                onChange={(e) => updateSessionSettings('requireStrongPasswords', e.target.checked)}
              />
              Require strong passwords
            </label>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="settings-group">
          <h3>Two-Factor Authentication</h3>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.twoFactorAuth.enabled}
                onChange={(e) => updateTwoFactorAuth('enabled', e.target.checked)}
              />
              Enable 2FA for all users
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.twoFactorAuth.required}
                onChange={(e) => updateTwoFactorAuth('required', e.target.checked)}
              />
              Require 2FA for login
            </label>
          </div>

          {settings.twoFactorAuth.enabled && (
            <div className="form-group">
              <label>Available Methods</label>
              <div className="checkbox-group">
                {['sms', 'email', 'app'].map(method => (
                  <label key={method} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth.methods.includes(method)}
                      onChange={(e) => {
                        const methods = e.target.checked
                          ? [...settings.twoFactorAuth.methods, method]
                          : settings.twoFactorAuth.methods.filter(m => m !== method);
                        updateTwoFactorAuth('methods', methods);
                      }}
                    />
                    {method.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Roles */}
        <div className="settings-group">
          <h3>User Roles & Permissions</h3>
          <div className="roles-list">
            {settings.userRoles.map(role => (
              <div key={role.id} className="role-item">
                <div className="role-header">
                  <h4>{role.displayName}</h4>
                  <span className="role-name">({role.name})</span>
                </div>

                <div className="role-permissions">
                  <label>Permissions:</label>
                  <div className="permissions-grid">
                    {['inventory', 'sales', 'purchasing', 'users', 'reports', 'settings'].map(permission => (
                      <label key={permission} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={role.permissions.includes(permission) || role.permissions.includes('all')}
                          onChange={(e) => {
                            const currentPerms = role.permissions;
                            const newPerms = e.target.checked
                              ? [...currentPerms, permission]
                              : currentPerms.filter(p => p !== permission);
                            updateRolePermissions(role.id, newPerms);
                          }}
                          disabled={role.permissions.includes('all')}
                        />
                        {permission.charAt(0).toUpperCase() + permission.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Management */}
        <div className="settings-group">
          <div className="group-header">
            <h3>User Management</h3>
            <button className="btn btn-sm btn-primary" onClick={() => setShowAddUser(true)}>
              <FiPlus /> Add User
            </button>
          </div>

          <div className="users-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>
                      <span className="role-badge">
                        {settings.userRoles.find(r => r.name === user.role)?.displayName || user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => setEditingUser(user)}
                          title="Edit user"
                        >
                          <FiEdit />
                        </button>
                        <button
                          className={`btn-icon ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => toggleUserStatus(user.id, !user.is_active)}
                          title={user.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.is_active ? <FiUserX /> : <FiUserCheck />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <FiSave /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Add/Edit User Modal would go here */}
      {showAddUser && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New User</h3>
              <span className="close" onClick={() => setShowAddUser(false)}>&times;</span>
            </div>
            <div className="modal-body">
              {/* User form would go here */}
              <p>User creation form would be implemented here.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;