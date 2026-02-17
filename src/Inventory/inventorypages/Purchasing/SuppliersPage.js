import React, { useState, useEffect } from 'react';
import { FiPlus, FiDownload, FiPrinter, FiSearch, FiEdit, FiTrash2, FiX, FiSave } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { suppliersAPI } from '../../../services/ApiService/api';
import '../../../assets/pagesStyles/suppliers.css';

const SuppliersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    payment_terms: '30'
  });

  // Load suppliers on component mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        const suppliersData = await suppliersAPI.getSuppliers();
        setSuppliers(suppliersData);
        setError(null);
      } catch (err) {
        console.error('Error loading suppliers:', err);
        setError('Failed to load suppliers');
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSupplier = async () => {
    if (!newSupplier.name.trim()) {
      alert('Please enter supplier name');
      return;
    }

    try {
      await suppliersAPI.createSupplier(newSupplier);

      // Refresh suppliers list
      const updatedSuppliers = await suppliersAPI.getSuppliers();
      setSuppliers(updatedSuppliers);

      // Reset form
      setNewSupplier({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        payment_terms: '30'
      });

      setShowAddModal(false);
      alert('Supplier created successfully!');
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('Failed to create supplier. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="suppliers-xlsSuprPage">
      <div className="suppliers-xlsSuprHeader">
        {/* <h1>Suppliers</h1> */}
        <div className="suppliers-xlsSuprBreadcrumbs">
          <Link to="/">Home</Link> / <span>Purchasing</span> / <span>Suppliers</span>
        </div>
      </div>

      {!loading && !error && (
        <div className="xlsSuprStats">
          <div className="xlsSuprStatCard">
            <div className="xlsSuprStatValue">{suppliers.length}</div>
            <div className="xlsSuprStatLabel">Total Suppliers</div>
          </div>
          <div className="xlsSuprStatCard">
            <div className="xlsSuprStatValue">{suppliers.filter(s => s.is_active).length}</div>
            <div className="xlsSuprStatLabel">Active</div>
          </div>
          <div className="xlsSuprStatCard">
            <div className="xlsSuprStatValue">
              {suppliers.reduce((sum, supplier) => sum + (supplier.purchase_orders_count || 0), 0)}
            </div>
            <div className="xlsSuprStatLabel">Total Orders</div>
          </div>
        </div>
      )}

      <div className="suppliers-xlsSuprActions">
        <div className="suppliers-xlsSuprSearchFilter">
          <div className="suppliers-xlsSuprSearchBox">
            <FiSearch className="suppliers-xlsSuprSearchIcon" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="xlsSuprActionButtons">
          <button
            className="xlsSuprBtn xlsSuprBtnPrimary"
            onClick={() => setShowAddModal(true)}
          >
            <FiPlus /> Add Supplier
          </button>
          <button className="xlsSuprBtn xlsSuprBtnSecondary">
            <FiDownload /> Export
          </button>
          <button className="xlsSuprBtn xlsSuprBtnSecondary">
            <FiPrinter /> Print
          </button>
        </div>
      </div>

      <div className="data-xlsSuprTableContainer">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading suppliers...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
            <p>{error}</p>
          </div>
        ) : (
          <table className="xlsSuprDataTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td>{supplier.id}</td>
                  <td>
                    <Link to={`/suppliers/${supplier.id}`} className="xlsSuprLink">
                      {supplier.name}
                    </Link>
                  </td>
                  <td>{supplier.contact_person}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.purchase_orders_count || 0}</td>
                  <td>
                    <span className={`xlsSuprStatus ${supplier.is_active ? 'active' : 'inactive'}`}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="xlsSuprActionButtons">
                      <button className="btn-icon" title="Edit">
                        <FiEdit />
                      </button>
                      <button className="btn-icon" title="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && (
        <div className="xlsSuprPagination">
          <div className="xlsSuprPaginationInfo">
            Showing 1 to {filteredSuppliers.length} of {suppliers.length} suppliers
          </div>
          <div className="xlsSuprPaginationControls">
            <button className="btn-pagination" disabled>Previous</button>
            <button className="btn-pagination active">1</button>
            <button className="btn-pagination">Next</button>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="xlsSuprModalOverlay active">
          <div className="suppliers-modal-container">
            <div className="suppliers-modal-header">
              <h3 className="suppliers-modal-title">Add New Supplier</h3>
              <button
                className="suppliers-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="suppliers-modal-body">
              <div className="form-group">
                <label>Supplier Name*</label>
                <input
                  type="text"
                  name="name"
                  value={newSupplier.name}
                  onChange={handleInputChange}
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    name="contact_person"
                    value={newSupplier.contact_person}
                    onChange={handleInputChange}
                    placeholder="Enter contact person"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newSupplier.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newSupplier.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Terms (days)</label>
                  <select
                    name="payment_terms"
                    value={newSupplier.payment_terms}
                    onChange={handleInputChange}
                  >
                    <option value="7">7 days</option>
                    <option value="15">15 days</option>
                    <option value="30">30 days</option>
                    <option value="45">45 days</option>
                    <option value="60">60 days</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={newSupplier.address}
                  onChange={handleInputChange}
                  placeholder="Enter supplier address"
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddSupplier}
                disabled={!newSupplier.name.trim()}
              >
                <FiSave /> Add Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
