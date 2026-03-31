import { useLocation } from 'react-router-dom';
import { FiSettings } from 'react-icons/fi';
import { userService } from '../../../services/ApiService/api';
import { normalizeRole } from '../../../utils/roleAccess';
import GeneralSettings from './GeneralSettings';
import BusinessSettings from './BusinessSettings';
import InventorySettings from './InventorySettings';
import POSSettings from './POSSettings';
import UserSettings from './UserSettings';
import SystemSettings from './SystemSettings';
import './SettingsPage.css';

const SettingsPage = () => {
  const location = useLocation();
  const userRole = normalizeRole(userService.getUserRole());

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

    const roleAccess = {
      general: ['admin', 'manager'],
      business: ['admin', 'manager'],
      inventory: ['admin', 'manager'],
      pos: ['admin', 'manager'],
      users: ['admin', 'manager'],
      system: ['admin']
    };

    if (roleAccess[lastPart] && roleAccess[lastPart].includes(userRole)) {
      return allSettingsComponents[lastPart] || GeneralSettings;
    }

    return GeneralSettings;
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
