import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../services/context/authContext';
import AdminDashboard from './AdminDashboard';
import CreateTenantPage from './CreateTenantPage';
import CreateUsersPage from './CreateUsersPage';
import EditTenantPage from './EditTenantPage';
import GenerateKeysPage from './GenerateKeysPage';
import ManageUsersPage from './ManageUsersPage';
import ManageBranchesPage from './ManageBranchesPage';
import SystemSettingsPage from './SystemSettingsPage';
import './AdminPage.css';

const SuperAdminApp = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div className="superadmin-app">
      <div className="app-header">
        <div className="header-content">
          <h1>MWAMBA POS - Super Admin</h1>
          <button
            className="btn-secondary logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      <Routes>
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/create-tenant" element={<CreateTenantPage />} />
        <Route path="admin/create-users" element={<CreateUsersPage />} />
        <Route path="admin/edit-tenant/:id" element={<EditTenantPage />} />
        <Route path="admin/generate-keys" element={<GenerateKeysPage />} />
        <Route path="admin/tenants/:id/users" element={<ManageUsersPage />} />
        <Route path="admin/tenants/:id/branches" element={<ManageBranchesPage />} />
        <Route path="admin/system-settings" element={<SystemSettingsPage />} />
        <Route path="*" element={<Navigate to="admin" replace />} />
      </Routes>
    </div>
  );
};

export default SuperAdminApp;