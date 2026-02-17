import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
// import './AdminPage.css'; // File not found

const AdminPage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // First check stored user data for admin status
      const userData = JSON.parse(localStorage.getItem('pos_user_data') || '{}');

      if (userData.is_superadmin === true) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Check if user has admin role in tenant roles
      if (userData.tenant_roles && Array.isArray(userData.tenant_roles)) {
        const hasAdminRole = userData.tenant_roles.some(role => role.role === 'admin');
        if (hasAdminRole) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }
      }

      // Check if user has admin role in groups
      if (userData.roles && userData.roles.includes('admin')) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // If not found in stored data, try to access admin-only endpoint
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Try to access admin-only endpoint to verify admin status
      const response = await fetch('/api/users/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // If we can access user data, user has admin privileges
      setIsAdmin(response.ok);

    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page access-denied">
        <div className="access-denied-container">
          <div className="access-icon">🚫</div>
          <h1>Access Denied</h1>
          <p>You don't have permission to access the admin dashboard.</p>
          <p>This area is restricted to administrators only.</p>
          <button
            className="btn-primary"
            onClick={() => window.location.href = '/'}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminPage;