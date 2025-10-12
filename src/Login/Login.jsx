import React, { useState, useContext } from 'react';
import { FiLogIn, FiLock, FiPackage, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import { AuthContext } from '../services/context/authContext' 
import '../assets/pagesStyles/LoginPage.css';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (error) {
      setError(error.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="stockmaster-login-page">
      <div className="stockmaster-login-container">
        <div className="stockmaster-login-branding">
          <div className="stockmaster-logo">
            <FiPackage size={36} />
            <h1>POS</h1>
          </div>
          <p className="stockmaster-tagline">DecodeX POS</p>
          <div className="stockmaster-branding-footer">
            <p>© {new Date().getFullYear()}  DecodeX</p>
            <p>v0.0.1</p>
          </div>
        </div>

        <div className="stockmaster-login-form-container">
          <div className="stockmaster-login-card">
            <h2>Welcome Back</h2>
            {error && <div className="stockmaster-error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="stockmaster-form-group">
                <label htmlFor="username">Username</label>
                <div className="stockmaster-input-with-icon">
                  <FiUser className="input-icon" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div className="stockmaster-form-group">
                <label htmlFor="password">Password</label>
                <div className="stockmaster-input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button 
                    type="button" 
                    className="stockmaster-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="stockmaster-form-options">
                <label className="stockmaster-remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
              </div>

              <button 
                type="submit" 
                className="stockmaster-login-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="stockmaster-spinner"></span>
                ) : (
                  <>
                    <FiLogIn /> Login In
                  </>
                )}
              </button>
            </form>

            <div className="stockmaster-login-footer">
              <p>
                <a href="/request-access">Request access</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;