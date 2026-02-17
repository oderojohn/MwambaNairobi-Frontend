import React, { useState, useEffect } from 'react';
import { toNumber, formatCurrency, chitsAPI } from '../../services/ApiService/api';

const ChitModal = ({ isOpen, onClose, onLoadChit }) => {
  const [chits, setChits] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      chitsAPI.getChits()
        .then(data => setChits(data || []))
        .catch(() => setChits([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal active">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h3>Open Chits</h3>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          <table className="chits-table">
            <thead>
              <tr>
                <th>Chit #</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {chits.map(chit => {
                // Handle field name differences between frontend and backend
                const tableNumber = chit.table_number || chit.table || 'N/A';
                const customerName = chit.customer_name || chit.customerName || 'Walk-in';
                const amount = toNumber(chit.amount || chit.total_amount || 0);
                const createdTime = chit.created_at ? new Date(chit.created_at).toLocaleTimeString() : chit.time || 'Unknown';

                return (
                  <tr key={chit.id}>
                    <td>#{chit.id}</td>
                    <td>{tableNumber}</td>
                    <td>{customerName}</td>
                    <td>{formatCurrency(amount)}</td>
                    <td>{createdTime}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => onLoadChit(chit)}
                      >
                        Load
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {chits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6' }}>
              No open chits found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChitModal;