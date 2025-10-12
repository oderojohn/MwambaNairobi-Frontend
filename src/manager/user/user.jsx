import React, { useState } from 'react';
import { 
  FiUser, 
  FiPlus, 
  FiEdit2, 
  FiTrash2,
  FiChevronDown
} from 'react-icons/fi';
import { authService } from '../../services/ApiService/api'; 

const UserManagementPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'cashier'
  });
  
  const [passwordStrength, setPasswordStrength] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load users on component mount
  React.useEffect(() => {
    // You would typically fetch users from your API here
    // For now we'll use the mock data
    setUsers([
      { id: 1, username: 'admin', role: 'manager' },
      { id: 2, username: 'john_doe', role: 'cashier' },
      { id: 3, username: 'jane_smith', role: 'storekeeper' }
    ]);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    // Simple password strength check
    if (password.length === 0) {
      setPasswordStrength('');
    } else if (password.length < 6) {
      setPasswordStrength('weak');
    } else if (password.length < 10) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Call the API to register the user
      await authService.registerUser(
        formData.username,
        formData.password,
        formData.role
      );
      
      // Assuming the API returns the created user
      const newUser = {
        id: users.length + 1, // This should come from the API in a real app
        username: formData.username,
        role: formData.role
      };

      // Update local state
      setUsers([...users, newUser]);
      setFormData({
        username: '',
        password: '',
        role: 'cashier'
      });
      setPasswordStrength('');

    } catch (error) {
      setError(error.message || 'Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>User Management</h1>
        <div className="breadcrumbs">
          <span>Home</span> / <span>System</span> / <span>Users</span>
        </div>
      </div>

      <div className="user-management-container">
        <div className="user-form-container">
          <h2 className="user-form-title"><FiUser /> Add New User</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="user-form-group">
              <label className="user-form-label">Username</label>
              <input
                type="text"
                className="user-form-input"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter username"
                required
              />
            </div>

            <div className="user-form-group">
              <label className="user-form-label">Password</label>
              <input
                type="password"
                className="user-form-input"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
                minLength="6"
              />
              <div className={`password-strength ${passwordStrength ? 'password-strength-' + passwordStrength : ''}`}>
                <div className="password-strength-bar"></div>
              </div>
              {passwordStrength && (
                <div className="password-strength-text">
                  {passwordStrength === 'weak' && 'Weak password'}
                  {passwordStrength === 'medium' && 'Medium strength'}
                  {passwordStrength === 'strong' && 'Strong password'}
                </div>
              )}
            </div>

            <div className="user-form-group">
              <label className="user-form-label">Role</label>
              <div className="role-select">
                <select
                  className="user-form-input"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                  <option value="storekeeper">Store Keeper</option>
                </select>
                <FiChevronDown className="role-select-icon" />
              </div>
            </div>

            <button 
              type="submit" 
              className="user-form-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : <><FiPlus /> Add User</>}
            </button>
          </form>
        </div>

        <div className="user-list-container">
          <h2 className="user-list-title"><FiUser /> User List</h2>
          <table className="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>
                    <span className={`user-role ${user.role}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button className="user-action-btn" title="Edit">
                        <FiEdit2 />
                      </button>
                      <button 
                        className="user-action-btn delete" 
                        title="Delete"
                        onClick={() => deleteUser(user.id)}
                      >
                        <FiTrash2 />
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
  );
};

export default UserManagementPage;