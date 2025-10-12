// Customers Management Page
import React, { useState, useEffect } from 'react';
import { FiPlus, FiFilter, FiEdit, FiTrash2, FiPrinter, FiDownload, FiRefreshCw, FiSearch, FiX, FiSave, FiFileText, FiEye, FiShoppingCart } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { customersAPI, inventoryAPI } from '../../../services/ApiService/api';

const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    customer_type: 'retail',
    business_name: '',
    tax_id: ''
  });

  const customerTypes = [
    { value: 'all', label: 'All Customers' },
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' }
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await customersAPI.getCustomers();
      setCustomers(response || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.phone.includes(searchTerm) ||
                          (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || customer.customer_type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.phone) return;

    try {
      const customerData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || '',
        address: formData.address || '',
        customer_type: formData.customer_type
      };

      // Only add business fields for wholesale customers
      if (formData.customer_type === 'wholesale') {
        customerData.business_name = formData.business_name || '';
        customerData.tax_id = formData.tax_id || '';
      }

      await customersAPI.createCustomer(customerData);
      await fetchCustomers(); // Refresh the list
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('Failed to create customer');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      customer_type: 'retail',
      business_name: '',
      tax_id: ''
    });
  };

  const viewPurchaseHistory = async (customer) => {
    try {
      setSelectedCustomer(customer);
      // Fetch the customer's purchase history from the sales history API
      const response = await inventoryAPI.salesHistory.byCustomer(customer.id);
      setPurchaseHistory(response || []);
      setShowPurchaseHistory(true);
    } catch (err) {
      console.error('Error fetching purchase history:', err);
      setError('Failed to load purchase history');
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      await customersAPI.deleteCustomer(id);
      await fetchCustomers(); // Refresh the list
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading customers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          <FiX size={24} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Customers</h1>
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <span>Sales</span> / <span>Customers</span>
        </div>
      </div>

      <div className="page-actions">
        <div className="search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-dropdown">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {customerTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <FiFilter className="filter-icon" />
          </div>
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowAddForm(!showAddForm);
              resetForm();
            }}
          >
            {showAddForm ? <FiX /> : <FiPlus />}
            {showAddForm ? 'Cancel' : 'Add Customer'}
          </button>
          {!showAddForm && (
            <>
              <button className="btn btn-secondary">
                <FiDownload /> Export
              </button>
              <button className="btn btn-secondary">
                <FiPrinter /> Print
              </button>
              <button className="btn btn-secondary" onClick={fetchCustomers}>
                <FiRefreshCw /> Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {showPurchaseHistory && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h2>Purchase History - {selectedCustomer.name}</h2>
              <button
                className="btn-icon"
                onClick={() => setShowPurchaseHistory(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="customer-info">
                <div className="info-grid">
                  <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
                  <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                  <div><strong>Type:</strong> {selectedCustomer.customer_type}</div>
                  <div><strong>Loyalty Points:</strong> {selectedCustomer.loyalty_points || 0}</div>
                </div>
              </div>

              <div className="purchase-history">
                <h3>Purchase History</h3>
                {purchaseHistory.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory.map(purchase => (
                        <tr key={purchase.id}>
                          <td>{new Date(purchase.sale_date).toLocaleDateString()}</td>
                          <td>{purchase.product_name || 'N/A'}</td>
                          <td>{purchase.quantity}</td>
                          <td>Ksh{purchase.unit_price ? parseFloat(purchase.unit_price).toFixed(2) : '0.00'}</td>
                          <td>Ksh{purchase.total_price ? parseFloat(purchase.total_price).toFixed(2) : '0.00'}</td>
                          <td>{purchase.receipt_number || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No purchase history found for this customer.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddForm ? (
        <div className="customer-form-container">
          <div className="customer-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Customer Name*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number*</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. +254712345678"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="form-group">
                <label>Customer Type</label>
                <select
                  name="customer_type"
                  value={formData.customer_type}
                  onChange={handleInputChange}
                >
                  <option value="retail">Retail Customer</option>
                  <option value="wholesale">Wholesale Customer</option>
                </select>
              </div>

              {formData.customer_type === 'wholesale' && (
                <>
                  <div className="form-group">
                    <label>Business Name</label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      placeholder="Business/Company Name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tax ID</label>
                    <input
                      type="text"
                      name="tax_id"
                      value={formData.tax_id}
                      onChange={handleInputChange}
                      placeholder="VAT/Tax ID Number"
                    />
                  </div>
                </>
              )}

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Customer address"
                  rows="3"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleAddCustomer}
                disabled={!formData.name || !formData.phone}
              >
                <FiSave /> Save Customer
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Loyalty Points</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${customer.customer_type}`}>
                        {customer.customer_type}
                      </span>
                    </td>
                    <td>{customer.loyalty_points || 0}</td>
                    <td>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => viewPurchaseHistory(customer)}
                          title="View Purchase History"
                        >
                          <FiShoppingCart />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => deleteCustomer(customer.id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-container">
            <div className="pagination-info">
              Showing {filteredCustomers.length} of {customers.length} customers
            </div>
            <div className="pagination-controls">
              <button className="btn-pagination" disabled>Previous</button>
              <button className="btn-pagination active">1</button>
              <button className="btn-pagination">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomersPage;