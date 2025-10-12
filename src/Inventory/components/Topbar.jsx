import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  FiBell, FiMail, FiSearch, FiMenu, FiChevronDown, FiLogOut,
  FiSun, FiMoon, FiDroplet, FiCoffee, FiUser, FiSettings, FiAlertCircle,
  FiFeather, FiHeart, FiStar, FiSunset, FiWind,FiZap
} from 'react-icons/fi';

import { AuthContext } from '../../services/context/authContext';

const Topbar = ({ toggleSidebar }) => {
  const { logout, user, role } = useContext(AuthContext);

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const themeDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { id: 'light', name: 'Light', icon: <FiSun />, color: '#f5f7fb' },
    { id: 'dark', name: 'Dark', icon: <FiMoon />, color: '#1a1a2e' },
    { id: 'blue', name: 'Ocean', icon: <FiDroplet />, color: '#0077b6' },
    { id: 'coffee', name: 'Coffee', icon: <FiCoffee />, color: '#6f4e37' },
    { id: 'emerald', name: 'Emerald', icon: <FiFeather />, color: '#2e7d32' },
    { id: 'rose-gold', name: 'Rose Gold', icon: <FiHeart />, color: '#d6336c' },
    { id: 'midnight-purple', name: 'Midnight', icon: <FiStar />, color: '#7e4aec' },
    { id: 'sunset', name: 'Sunset', icon: <FiSunset />, color: '#ff7733' },
    { id: 'mint', name: 'Mint', icon: <FiWind />, color: '#10b981' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: <FiZap />, color: '#8b5cf6' },
    { id: 'high-contrast', name: 'High Contrast', icon: <FiAlertCircle />, color: '#000000' }
];

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const setTheme = (themeId) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('theme', themeId);
    setThemeDropdownOpen(false);
  };

  const currentThemeIcon = themes.find(t => t.id === currentTheme)?.icon || <FiSun />;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <FiMenu size={20} />
        </button>
        <div className="logo">
          <span>POS</span>Pro
        </div>
      </div>
      
      <div className="search-bar">
        <FiSearch className="search-icon" />
        <input type="text" placeholder="Search inventory, orders, reports..." />
      </div>
      
      <div className="topbar-right">
        <div className="theme-switcher-container" ref={themeDropdownRef}>
          <button className="theme-toggle" onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}>
            {currentThemeIcon}
          </button>
          {themeDropdownOpen && (
            <div className="theme-dropdown show">
              {themes.map((theme) => (
                <button key={theme.id} className={`dropdown-item ${currentTheme === theme.id ? 'active' : ''}`} 
                  onClick={() => setTheme(theme.id)} style={{ '--theme-color': theme.color }}>
                  <span className="theme-icon">{theme.icon}</span>
                  <span>{theme.name}</span>
                  {currentTheme === theme.id && <span className="theme-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="notification-icon">
          <FiBell size={20} />
          <span className="notification-badge">3</span>
        </div>
        <div className="message-icon">
          <FiMail size={20} />
          <span className="notification-badge">5</span>
        </div>
        
        <div className="user-profile" onClick={() => setUserDropdownOpen(!userDropdownOpen)} ref={userDropdownRef}>
          <div className="avatar">
            <img src="https://avatars.githubusercontent.com/u/105012027?v=4" alt="User" />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.username || 'User'}</span>
            <span className="user-role">{role || 'Role'}</span>
          </div>
          <FiChevronDown className={`dropdown-arrow ${userDropdownOpen ? 'open' : ''}`} />
          
          <div className={`user-dropdown ${userDropdownOpen ? 'show' : ''}`}>
            <a href="/profile" className="dropdown-item">
              <FiUser /> My Profile
            </a>
            <a href="/settings" className="dropdown-item">
              <FiSettings /> Account Settings
            </a>
            <a href="/notifications" className="dropdown-item">
              <FiBell /> Notifications
            </a>
            <div className="dropdown-divider"></div>
            <button onClick={logout} className="btn btn-secondary">
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
