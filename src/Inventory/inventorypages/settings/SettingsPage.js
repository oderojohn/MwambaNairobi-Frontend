import {  useLocation } from 'react-router-dom';
import { FiSettings } from 'react-icons/fi';
import { userService } from '../../../services/ApiService/api';
import GeneralSettings from './GeneralSettings';
import BusinessSettings from './BusinessSettings';
import InventorySettings from './InventorySettings';
import POSSettings from './POSSettings';
import UserSettings from './UserSettings';
import SystemSettings from './SystemSettings';
import './SettingsPage.css';

const SettingsPage = () => {
  const location = useLocation();
  const userRole = userService.getUserRole();

  const allSettingsComponents = {
    general: GeneralSettings,
    business: BusinessSettings,
    inventory: InventorySettings,
    pos: POSSettings,
    users: UserSettings,
    system: SystemSettings
  };

  const getCurrentComponent = () => {
    const pathParts = location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];

    // Define role-based access
    const roleAccess = {
      general: ['admin', 'manager', 'storekeeper'],
      business: ['admin', 'manager'],
      inventory: ['admin', 'manager', 'storekeeper'],
      pos: ['admin', 'manager', 'storekeeper'],
      users: ['admin', 'manager'],
      system: ['admin']
    };

    // Check if user has access to this component
    if (roleAccess[lastPart] && roleAccess[lastPart].includes(userRole)) {
      return allSettingsComponents[lastPart] || GeneralSettings;
    }

    return GeneralSettings; // Default fallback
  };

  const CurrentComponent = getCurrentComponent();

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="settings-title">
          <FiSettings className="settings-icon" />
          <h1>System Settings</h1>
        </div>
        <p className="settings-subtitle">
          Configure and manage all system settings and preferences
        </p>
      </div>

      <div className="settings-content">
        <CurrentComponent />
      </div>
    </div>
  );
};

export default SettingsPage;