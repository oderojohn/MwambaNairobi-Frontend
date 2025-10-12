// layouts/InventoryLayout.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

const InventoryLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="ims-container">
      <Topbar toggleSidebar={toggleSidebar} />

      <Sidebar sidebarOpen={sidebarOpen} />
      <div
        className={`main-content ${sidebarOpen ? '' : 'collapsed'}`}
        style={{
          marginLeft: sidebarOpen ? '200px' : '-5px',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default InventoryLayout;