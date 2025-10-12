import React, { useState, useEffect } from 'react';
import { FiSearch, FiDownload, FiEye, FiPlus, FiCheck, FiSend } from 'react-icons/fi';
import { invoicesAPI } from '../../../services/ApiService/api';

const InvoicesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load invoices on component mount
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const invoicesData = await invoicesAPI.getInvoices();
        setInvoices(invoicesData);
        setError(null);
      } catch (err) {
        console.error('Error loading invoices:', err);
        setError('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMarkPaid = async (invoiceId) => {
    try {
      await invoicesAPI.markPaid(invoiceId);
      // Refresh invoices
      const updatedInvoices = await invoicesAPI.getInvoices();
      setInvoices(updatedInvoices);
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Failed to mark invoice as paid');
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await invoicesAPI.sendInvoice(invoiceId);
      // Refresh invoices
      const updatedInvoices = await invoicesAPI.getInvoices();
      setInvoices(updatedInvoices);
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice');
    }
  };

const openCreateInvoice = () => {
  const features = 'width=1200,height=800,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes';
  window.open('/invoice-creation', 'InvoiceCreation', features);
};



   return (
    <div className="invoice-container">
      <div className="invoice-header">
        <div>
          <h1 className="invoice-title">Invoices</h1>
          {!loading && !error && (
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary">
            <FiDownload /> Export
          </button>
          <button className="btn btn-primary" onClick={openCreateInvoice}>
            <FiPlus /> New Invoice
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '20px',
        gap: '20px'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#95a5a6'
          }} />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: '35px',
              width: '100%'
            }}
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minWidth: '180px'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading invoices...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
          <p>{error}</p>
        </div>
      ) : (
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.invoice_number}</td>
                <td>{invoice.customer_name}</td>
                <td>{invoice.invoice_date}</td>
                <td>{invoice.due_date}</td>
                <td>Ksh {parseFloat(invoice.total_amount).toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${invoice.status.toLowerCase()}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-sm btn-secondary">
                      <FiEye /> View
                    </button>
                    {invoice.status !== 'paid' && (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleMarkPaid(invoice.id)}
                        >
                          <FiCheck /> Mark Paid
                        </button>
                        {invoice.status === 'draft' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSendInvoice(invoice.id)}
                          >
                            <FiSend /> Send
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '20px'
      }}>
        <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
          Page 1 of 1
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" disabled>Previous</button>
          <button className="btn btn-secondary">Next</button>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;