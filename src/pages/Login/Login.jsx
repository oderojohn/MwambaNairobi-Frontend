import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(credentials);

    if (result.success) {
      const userRole = user?.roles?.[0];
      if (userRole === 'Cashier' || userRole === 'Manager') {
        navigate('/pos');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="pos-login-container">
      <div className="pos-login-background">
        <div className="pos-login-graphic"></div>
      </div>
      
      <div className="pos-login-card">
        <div className="pos-login-header">
          <div className="pos-logo">
            <div className="logo-icon">
              <span className="logo-cash">$</span>
            </div>
            <h1>POS Pro</h1>
          </div>
          <p className="login-subtitle">Point of Sale System</p>
        </div>

        {error && (
          <div className="pos-login-error">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        <form className="pos-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              autoComplete="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className={`pos-login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In to POS'
            )}
          </button>
        </form>

        <div className="pos-login-footer">
          <p>Need help? Contact support</p>
          <span className="version">v2.4.1</span>
        </div>
      </div>
    </div>
  );
};

export default Login;