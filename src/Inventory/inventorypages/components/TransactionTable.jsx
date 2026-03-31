// components/TransactionTable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency, userService } from '../../../services/ApiService/api';
import './TransactionTable.css';

const TransactionTable = ({
  transactions,
  isLoading,
  handleViewTransactionDetails,
  handleVoidSale,
  handleRefundSale,
  handlePrintReceipt
}) => {
  const canVoidSales = userService.getUserRole() === 'supervisor';

  if (isLoading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-receipt"></i>
        <h3>No Transactions Today</h3>
        <p>No transactions have been made today yet.</p>
      </div>
    );
  }

  return (
    <div className="excel-table-container">
      <table className="excel-table">
        <thead>
          <tr>
            <th>Chit No</th>
            <th>Time</th>
            <th>Customer</th>
            <th>NO of Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(sale => (
            <tr key={sale.id} className={`excel-${sale.status || 'completed'}`}>
              <td className="excel-transaction-id">#{sale.id}</td>
              <td>{sale.sale_date ? new Date(sale.sale_date).toLocaleTimeString() : 'N/A'}</td>
              <td>{sale.customer_name || 'Walk-in'}</td>
              <td>{sale.items?.length || 0}</td>
              <td>{formatCurrency(sale.total_amount || 0)}</td>
              <td>{sale.payment_method || 'N/A'}</td>
              <td>
                <span className={`excel-status-badge excel-${sale.status || 'completed'}`}>
                  {sale.status || 'Completed'}
                </span>
              </td>
              <td>
                <div className="excel-action-buttons">
                  <button
                    className="excel-btn excel-btn-info"
                    onClick={() => handleViewTransactionDetails(sale)}
                    title="View Details"
                  >
                    <i className="fas fa-eye"></i> View
                  </button>
                  <button
                    className="excel-btn excel-btn-primary"
                    onClick={() => handleViewTransactionDetails(sale)}
                    title="Edit Transaction"
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button
                    className="excel-btn excel-btn-warning"
                    onClick={() => handlePrintReceipt(sale)}
                    title="Print Receipt"
                  >
                    <i className="fas fa-print"></i> Print
                  </button>
                  {canVoidSales && (
                    <button
                      className="excel-btn excel-btn-danger"
                      onClick={() => handleVoidSale(sale)}
                      disabled={isLoading || sale.status === 'voided'}
                      title="Void Sale"
                    >
                      <i className="fas fa-ban"></i> Void
                    </button>
                  )}
                  <button
                    className="excel-btn excel-btn-secondary"
                    onClick={() => handleRefundSale(sale)}
                    disabled={isLoading || sale.status === 'refunded' || sale.status === 'voided'}
                    title="Refund Sale"
                  >
                    <i className="fas fa-undo"></i> Refund
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

TransactionTable.propTypes = {
  transactions: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  handleViewTransactionDetails: PropTypes.func.isRequired,
  handleVoidSale: PropTypes.func.isRequired,
  handleRefundSale: PropTypes.func.isRequired,
  handlePrintReceipt: PropTypes.func.isRequired
};

export default TransactionTable;
