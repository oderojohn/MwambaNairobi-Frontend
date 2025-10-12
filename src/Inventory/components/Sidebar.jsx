// components/Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiTruck, FiUsers, 
  FiShoppingCart, FiBarChart2, FiSettings, 
  FiChevronDown, FiChevronRight
} from 'react-icons/fi';
import { userService } from '../../services/ApiService/api';

const Sidebar = ({ sidebarOpen }) => {
  const location = useLocation();
  const [expandedModules, setExpandedModules] = useState({});
  const userRole = userService.getUserRole(); // Get the current user's role

  const toggleModule = (moduleName) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  // Define all possible modules
  const allModules = [
    { name: 'Dashboard', icon: <FiHome />, path: 'dashboard', roles: ['admin',  'storekeeper'] },
    {
      name: 'Inventory',
      icon: <FiPackage />,
      roles: ['admin', 'storekeeper'],
      subModules: [
        { name: 'Products', path: 'products', roles: ['admin',  'storekeeper'] },
        { name: 'Categories', path: 'categories', roles: ['admin',  'storekeeper'] },
        { name: 'Stock Levels', path: 'stock-levels', roles: ['admin',  'storekeeper'] },
        { name: 'Batches', path: 'BatchesPage', roles: ['admin',  'storekeeper'] }

      ]
    },
    {
      name: 'Purchasing',
      icon: <FiShoppingCart />,
      roles: ['admin', 'storekeeper'],
      subModules: [
        { name: 'Orders', path: 'orders', roles: ['admin', 'storekeeper'] },
        { name: 'Suppliers', path: 'suppliers', roles: ['admin', 'storekeeper'] },
        { name: 'Receiving', path: 'receiving', roles: ['admin', 'storekeeper'] }
      ]
    },
    {
      name: 'Sales',
      icon: <FiTruck />,
      roles: ['admin', '', 'storekeeper'],
      subModules: [
        { name: 'Invoices', path: 'invoices', roles: ['admin', 'storekeeper'] },
        { name: 'Customers', path: 'customers', roles: ['admin', 'storekeeper'] },
        { name: 'Returns', path: 'returns', roles: ['admin', 'storekeeper'] }
      ]
    },
    { name: 'Reporting', icon: <FiBarChart2 />, path: 'reporting', roles: ['admin','storekeeper'] },
    { name: 'Users', icon: <FiUsers />, path: 'users', roles: ['admin', 'manager'] },
    {
      name: 'Settings',
      icon: <FiSettings />,
      roles: ['admin','manager','storekeeper'],
      subModules: [
        { name: 'General', path: 'settings/general', roles: ['admin','manager','storekeeper'] },
        { name: 'Business', path: 'settings/business', roles: ['admin','manager'] },
        { name: 'Inventory', path: 'settings/inventory', roles: ['admin','manager','storekeeper'] },
        { name: 'POS', path: 'settings/pos', roles: ['admin','manager','storekeeper'] },
        { name: 'Users & Roles', path: 'settings/users', roles: ['admin','manager'] },
        { name: 'System', path: 'settings/system', roles: ['admin'] }
      ]
    }
  ];

  // Filter modules based on user role
  const getFilteredModules = () => {
    return allModules.filter(module => {
      // Check if user has access to this module
      const hasAccess = module.roles.includes(userRole);
      
      // If module has submodules, filter those too
      if (module.subModules) {
        const filteredSubModules = module.subModules.filter(
          subModule => subModule.roles.includes(userRole)
        );
        return hasAccess && filteredSubModules.length > 0;
      }
      
      return hasAccess;
    });
  };

  const modules = getFilteredModules();

  const isActive = (path) => {
    // Handle nested routes for settings
    if (path.startsWith('settings/')) {
      return location.pathname.includes('/settings/') && location.pathname.endsWith(path.replace('settings/', ''));
    }
    return location.pathname === `/${path}` || location.pathname.endsWith(`/${path}`);
  };

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-menu">
        {modules.map((module, index) => (
          <div key={index} className="menu-section">
            {module.subModules ? (
              <>
                <div 
                  className={`menu-item ${module.subModules.some(sm => isActive(sm.path)) ? 'active' : ''}`}
                  onClick={() => toggleModule(module.name)}
                >
                  <div className="menu-icon">
                    {module.icon}
                  </div>
                  <span className="menu-text">{module.name}</span>
                  {expandedModules[module.name] ? (
                    <FiChevronDown className="submenu-arrow" />
                  ) : (
                    <FiChevronRight className="submenu-arrow" />
                  )}
                </div>
                
                <div 
                  className={`submenu ${expandedModules[module.name] ? 'expanded' : 'collapsed'}`}
                  style={{
                    maxHeight: expandedModules[module.name] ? `${module.subModules.length * 40}px` : '0'
                  }}
                >
                  {module.subModules
                    .filter(subModule => subModule.roles.includes(userRole))
                    .map((subModule, subIndex) => (
                      <Link 
                        key={subIndex} 
                        to={subModule.path}
                        className={`submenu-item ${isActive(subModule.path) ? 'active' : ''}`}
                      >
                        {subModule.name}
                      </Link>
                    ))}
                </div>
              </>
            ) : (
              <Link 
                to={module.path}
                className={`menu-item ${isActive(module.path) ? 'active' : ''}`}
              >
                <div className="menu-icon">
                  {module.icon}
                </div>
                <span className="menu-text">{module.name}</span>
              </Link>
            )}
          </div>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <div className="help-center">
          <button className="help-button">Help Center</button>
        </div>
        <div className="system-status">
          <div className="status-indicator online"></div>
          <span>System Online</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;