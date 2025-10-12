// App.js
import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './services/context/authContext';
import LoginPage from './Login/Login';
import InventoryLayout from './Inventory/InventoryLayout/InventoryLayout';
import ProductsPage from './Inventory/inventorypages/inventory/ProductsPage';
import CategoriesPage from './Inventory/inventorypages/inventory/CategoriesPage';
import BatchesPage from './Inventory/inventorypages/inventory/BatchesPage';
import StockLevelsPage from './Inventory/inventorypages/inventory/StockLevelsPage';
import OrdersPage from './Inventory/inventorypages/Purchasing/OrdersPage';
import SuppliersPage from './Inventory/inventorypages/Purchasing/SuppliersPage';
import ReceivingPage from './Inventory/inventorypages/Purchasing/ReceivingPage';
import InvoicesPage from "./Inventory/inventorypages/sales/InvoicesPage";
import CustomersPage from './Inventory/inventorypages/sales/CustomersPage';
import ReturnsPage from './Inventory/inventorypages/sales/ReturnsPage';
import InvoiceCreationPage from './Inventory/inventorypages/sales/InvoiceCreationPage';
import InventoryDashboard from './Inventory/inventorypages/dashboard/Dashboard';
import UserManagementPage from './manager/user/user';
import PosApp from './pos/App';
import ReportingPage from './Inventory/inventorypages/ReportingPage';
import SettingsPage from './Inventory/inventorypages/settings/SettingsPage';
import "./assets/main.css";
const AppRoutes = () => {
  const { isAuthenticated, loading, role, logout } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (role === 'pos') {
    return (
      <Routes>
        <Route path="/" element={<PosApp />} />
        <Route path="/order-preparation" element={<PosApp />} />
        <Route path="/order-management" element={<PosApp />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/inventory"
        element={<InventoryLayout onLogout={logout} />}
      >
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="BatchesPage" element={<BatchesPage />} />
        <Route path="stock-levels" element={<StockLevelsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="receiving" element={<ReceivingPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="dashboard" element={<InventoryDashboard />} />
        <Route path="reporting" element={<ReportingPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="settings/*" element={<SettingsPage />} />
      </Route>
      <Route
        path="/invoice-creation"
        element={<InvoiceCreationPage />}
      />
      <Route
        path="*"
        element={<Navigate to="/inventory/dashboard" replace />}
      />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
