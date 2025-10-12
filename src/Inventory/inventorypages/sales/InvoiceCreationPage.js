import React, { useState, useEffect } from 'react';
import {
  FiFileText,
  FiUser,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiSave,
  FiPrinter,
  FiSend,
  FiX,
  FiSearch,
  FiCalendar,
  FiDollarSign,
  FiPercent
} from 'react-icons/fi';
import { invoicesAPI, customersAPI } from '../../../services/ApiService/api';
const InvoiceCreationPage = ({ onClose }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('Thank you for your business!');
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, price: 0, tax: 0, total: 0 }
  ]);

  // Load customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customersData = await customersAPI.getCustomers();
        setCustomers(customersData);
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };
    loadCustomers();
  }, []);

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxTotal = items.reduce((sum, item) => sum + (item.quantity * item.price * item.tax / 100), 0);
  const grandTotal = subtotal + taxTotal;

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: field === 'description' ? value : Number(value) };
        
        // Calculate total if quantity, price or tax changes
        if (['quantity', 'price', 'tax'].includes(field)) {
          updatedItem.total = updatedItem.quantity * updatedItem.price * (1 + updatedItem.tax / 100);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const addNewItem = () => {
    setItems([...items, { 
      id: items.length + 1, 
      description: '', 
      quantity: 1, 
      price: 0, 
      tax: 0, 
      total: 0 
    }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (action) => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    if (items.length === 0 || items.every(item => !item.description.trim())) {
      alert('Please add at least one item to the invoice');
      return;
    }

    setLoading(true);

    try {
      const invoiceData = {
        customer: selectedCustomer.id,
        invoice_date: invoiceDate,
        due_date: dueDate,
        notes: notes,
        status: action === 'save' ? 'draft' : 'sent',
        items: items.filter(item => item.description.trim()).map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.price,
          tax_rate: item.tax,
          discount_amount: 0
        }))
      };

      const createdInvoice = await invoicesAPI.createInvoice(invoiceData);

      if (action === 'save') {
        alert('Invoice saved successfully!');
      } else if (action === 'print') {
        alert('Invoice saved! Opening print preview...');
        // TODO: Implement PDF generation and printing
      } else if (action === 'send') {
        await invoicesAPI.sendInvoice(createdInvoice.id);
        alert('Invoice sent to customer!');
      }

      if (onClose) onClose();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

 return (
    <div className="invoice-container">
      <div className="invoice-header">
        <h1 className="invoice-title">Create Invoice</h1>
        <div>
          <button className="btn btn-secondary" onClick={onClose}>
            <FiX /> Close
          </button>
        </div>
      </div>

      <div className="invoice-meta">
        <div>
          <label>Invoice Number</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>
        <div>
          <label>Invoice Date</label>
          <div style={{ position: 'relative' }}>
            <FiCalendar style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#95a5a6'
            }} />
            <input
              type="date"
              style={{ paddingLeft: '35px' }}
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label>Due Date</label>
          <div style={{ position: 'relative' }}>
            <FiCalendar style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#95a5a6'
            }} />
            <input
              type="date"
              style={{ paddingLeft: '35px' }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="invoice-grid">
        <div>
          <h3 className="section-title"><FiUser /> Bill To</h3>
          <div style={{ position: 'relative', marginBottom: '15px' }}>
            <FiSearch style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#95a5a6'
            }} />
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customerId = e.target.value;
                const customer = customers.find(c => c.id === customerId);
                setSelectedCustomer(customer);
                setCustomerAddress(customer ? `${customer.address || ''}`.trim() : '');
              }}
              style={{ paddingLeft: '35px', width: '100%', padding: '8px 12px' }}
            >
              <option value="">Select a customer...</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
          </div>
          {selectedCustomer && (
            <div style={{
              background: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              <strong>{selectedCustomer.name}</strong><br />
              {selectedCustomer.phone && <>Phone: {selectedCustomer.phone}<br /></>}
              {selectedCustomer.email && <>Email: {selectedCustomer.email}<br /></>}
            </div>
          )}
          <textarea
            placeholder="Additional address details"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div>
          <h3 className="section-title"><FiMapPin /> From</h3>
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            lineHeight: '1.6'
          }}>
            <strong>Your Business Name</strong><br />
            123 Business Street<br />
            City, State 12345<br />
            Phone: (123) 456-7890<br />
            Email: contact@yourbusiness.com
          </div>
        </div>
      </div>

      <h3 className="section-title"><FiFileText /> Items</h3>
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style={{ width: '80px' }}>Qty</th>
            <th style={{ width: '120px' }}>Unit Price</th>
            <th style={{ width: '80px' }}>Tax %</th>
            <th style={{ width: '120px' }}>Amount</th>
            <th style={{ width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                  placeholder="Item description"
                />
              </td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                />
              </td>
              <td>
                <div style={{ position: 'relative' }}>
                  <FiDollarSign style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#95a5a6'
                  }} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                    style={{ paddingLeft: '30px' }}
                  />
                </div>
              </td>
              <td>
                <div style={{ position: 'relative' }}>
                  <FiPercent style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#95a5a6'
                  }} />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.tax}
                    onChange={(e) => handleItemChange(item.id, 'tax', e.target.value)}
                    style={{ paddingLeft: '30px' }}
                  />
                </div>
              </td>
              <td>
                {(item.quantity * item.price * (1 + item.tax / 100)).toFixed(2)}
              </td>
              <td>
                <button 
                  className="btn-icon" 
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                >
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button 
        className="btn btn-secondary" 
        onClick={addNewItem}
        style={{ marginBottom: '30px' }}
      >
        <FiPlus /> Add Item
      </button>

      <div className="invoice-totals">
        <div className="totals-row">
          <span>Subtotal:</span>
          <span>Ksh {subtotal.toFixed(2)}</span>
        </div>
        <div className="totals-row">
          <span>Tax:</span>
          <span>Ksh {taxTotal.toFixed(2)}</span>
        </div>
        <div className="totals-row totals-grand">
          <span>Total:</span>
          <span>Ksh {grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 className="section-title">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes or terms here..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          className="btn btn-secondary"
          onClick={() => handleSubmit('save')}
          disabled={loading}
        >
          <FiSave /> {loading ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => handleSubmit('print')}
          disabled={loading}
        >
          <FiPrinter /> {loading ? 'Processing...' : 'Save & Print'}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => handleSubmit('send')}
          disabled={loading}
        >
          <FiSend /> {loading ? 'Sending...' : 'Save & Send'}
        </button>
      </div>
    </div>
  );
};

export default InvoiceCreationPage;