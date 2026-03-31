// components/Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiPackage, FiTruck, FiUsers,
  FiShoppingCart, FiBarChart2, FiSettings,
  FiChevronDown, FiChevronRight, FiMonitor, FiBook
} from 'react-icons/fi';
import { userService } from '../../services/ApiService/api';
import { normalizeRole } from '../../utils/roleAccess';

const Sidebar = ({ sidebarOpen }) => {
  const location = useLocation();
  const [expandedModules, setExpandedModules] = useState({});
  const userRole = normalizeRole(userService.getUserRole());

  const toggleModule = (moduleName) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const allModules = [
    { name: 'Dashboard', icon: <FiHome />, path: 'dashboard', roles: ['admin', 'manager'] },
    {
      name: 'Inventory',
      icon: <FiPackage />,
      roles: ['admin', 'manager'],
      subModules: [
        { name: 'Products', path: 'products', roles: ['admin', 'manager'] },
        { name: 'Categories', path: 'categories', roles: ['admin', 'manager'] },
        { name: 'Stock Levels', path: 'stock-levels', roles: ['admin', 'manager'] },
        { name: 'Batches', path: 'BatchesPage', roles: ['admin', 'manager'] },
        { name: 'Product History', path: 'product-history', roles: ['admin', 'manager'] },
        { name: 'Product Timeline', path: 'product-timeline', roles: ['admin', 'manager'] },
        { name: 'End of Day Stock', path: 'end-of-day-stock', roles: ['admin', 'manager'] }
      ]
    },
    {
      name: 'Purchasing',
      icon: <FiShoppingCart />,
      roles: ['admin', 'manager'],
      subModules: [
        { name: 'Orders', path: 'orders', roles: ['admin', 'manager'] },
        { name: 'Suppliers', path: 'suppliers', roles: ['admin', 'manager'] },
        { name: 'Receiving', path: 'receiving', roles: ['admin', 'manager'] }
      ]
    },
    {
      name: 'Sales',
      icon: <FiTruck />,
      roles: ['admin', 'manager'],
      subModules: [
        { name: 'Invoices', path: 'invoices', roles: ['admin', 'manager'] },
        { name: 'Customers', path: 'customers', roles: ['admin', 'manager'] },
        { name: 'Returns', path: 'returns', roles: ['admin', 'manager'] }
      ]
    },
    { name: 'Reporting', icon: <FiBarChart2 />, path: 'reporting', roles: ['admin', 'manager'] },
    { name: 'POS Admin', icon: <FiMonitor />, path: 'pos-admin', roles: ['admin'] },
    {
      name: 'General Ledger',
      icon: <FiBook />,
      roles: ['admin', 'manager'],
      subModules: [
        { name: 'Chart of Accounts', path: 'chart-of-accounts', roles: ['admin', 'manager'] },
        { name: 'Journal Entries', path: 'journal-entries', roles: ['admin', 'manager'] },
        { name: 'Trial Balance', path: 'trial-balance', roles: ['admin'] },
        { name: 'Profit & Loss', path: 'profit-loss', roles: ['admin'] },
        { name: 'Balance Sheet', path: 'balance-sheet', roles: ['admin'] },
        { name: 'Recurring Expenses', path: 'recurring-expenses', roles: ['admin', 'manager'] }
      ]
    },
    { name: 'Users', icon: <FiUsers />, path: 'users', roles: ['admin', 'manager'] },
    {
      name: 'Settings',
      icon: <FiSettings />,
      roles: ['admin', 'manager'],
      subModules: [
        { name: 'General', path: 'settings/general', roles: ['admin', 'manager'] },
        { name: 'Business', path: 'settings/business', roles: ['admin', 'manager'] },
        { name: 'Inventory', path: 'settings/inventory', roles: ['admin', 'manager'] },
        { name: 'POS', path: 'settings/pos', roles: ['admin', 'manager'] },
        { name: 'Users & Roles', path: 'settings/users', roles: ['admin', 'manager'] },
        { name: 'System', path: 'settings/system', roles: ['admin'] }
      ]
    }
  ];

  const modules = allModules.filter((module) => {
    const hasAccess = module.roles.includes(userRole);

    if (module.subModules) {
      const filteredSubModules = module.subModules.filter((subModule) => subModule.roles.includes(userRole));
      return hasAccess && filteredSubModules.length > 0;
    }

    return hasAccess;
  });

  const isActive = (path) => {
    if (path.startsWith('settings/')) {
      return location.pathname.includes('/settings/') && location.pathname.endsWith(path.replace('settings/', ''));
    }
    const fullPath = path.startsWith('inventory/') ? `/${path}` : `/inventory/${path}`;
    return location.pathname === fullPath || location.pathname === `/${path}` || location.pathname.endsWith(`/${path}`);
  };

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-menu">
        {modules.map((module, index) => (
          <div key={index} className="menu-section">
            {module.subModules ? (
              <>
                <div
                  className={`menu-item ${module.subModules.some((sm) => isActive(sm.path)) ? 'active' : ''}`}
                  onClick={() => toggleModule(module.name)}
                >
                  <div className="menu-icon">{module.icon}</div>
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
                    .filter((subModule) => subModule.roles.includes(userRole))
                    .map((subModule, subIndex) => (
                      <Link
                        key={subIndex}
                        to={`/inventory/${subModule.path}`}
                        className={`submenu-item ${isActive(subModule.path) ? 'active' : ''}`}
                      >
                        {subModule.name}
                      </Link>
                    ))}
                </div>
              </>
            ) : (
              <Link
                to={`/inventory/${module.path}`}
                className={`menu-item ${isActive(module.path) ? 'active' : ''}`}
              >
                <div className="menu-icon">{module.icon}</div>
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
