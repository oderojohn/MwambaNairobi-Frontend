import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { FiLogIn, FiKey } from 'react-icons/fi';
import logo from '../logo.png';
import { AuthContext } from '../services/context/authContext';
import '../assets/pagesStyles/LoginPage.css';
import { useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '../utils/roleAccess';

const PIN_LENGTH = 5;

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [pin, setPin] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    if (e && e.type !== 'auto-submit') {
      e.preventDefault();
    }

    const fullPin = pin.join('');
    if (fullPin.length !== PIN_LENGTH) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await login(fullPin);
      navigate(getDefaultRouteForRole(result?.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid PIN. Please try again.');
      setPin(['', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  }, [login, navigate, pin]);

  useEffect(() => {
    const fullPin = pin.join('');
    if (fullPin.length === PIN_LENGTH && !isLoading) {
      handleSubmit(new Event('auto-submit'));
    }
  }, [handleSubmit, isLoading, pin]);

  const handlePinChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const pinString = newPin.join('');
    if (pinString.length === PIN_LENGTH && !isLoading) {
      handleSubmit(new Event('submit'));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, PIN_LENGTH).split('');
    const newPin = [...pin];

    digits.forEach((digit, i) => {
      if (i < PIN_LENGTH) {
        newPin[i] = digit;
      }
    });

    setPin(newPin);
    const lastFilledIndex = Math.min(digits.length, PIN_LENGTH - 1);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  return (
    <div className="stockmaster-login-page">
      <div className="stockmaster-login-container">
        <div className="stockmaster-login-branding">
          <div className="stockmaster-logo">
            <img src={logo} alt="Logo" className="login-logo-png" />
            <h1>POS</h1>
          </div>
          <p className="stockmaster-tagline">DecodeX POS</p>
          <div className="stockmaster-branding-footer">
            <p>&copy; {new Date().getFullYear()} DecodeX</p>
            <p>v0.0.1</p>
          </div>
        </div>

        <div className="stockmaster-login-form-container">
          <div className="stockmaster-login-card">
            <h2>Welcome Back</h2>
            {error && <div className="stockmaster-error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="stockmaster-form-group">
                <label htmlFor="pin">Enter PIN</label>
                <div className="pin-input-container" onPaste={handlePaste}>
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`pin-box ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                      disabled={isLoading}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <div className="pin-helper-text">Use keyboard only. PIN submits automatically after 5 digits.</div>
                {error && <div className="pin-error-message">{error}</div>}
              </div>

              <button type="submit" className="stockmaster-login-button" disabled={isLoading || pin.join('').length !== PIN_LENGTH}>
                {isLoading ? (
                  <>
                    <FiKey className="spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <FiLogIn />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
