import React from 'react';
import { formatCurrency } from '../../services/ApiService/api';

const ReceiptModal = ({
  isOpen,
  onClose,
  saleData,
  cart,
  total,
  paymentMethod,
  change = 0,
  customer = null
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    const contentEl = document.getElementById('receipt-content');
    if (!contentEl) return;

    // create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${saleData?.receipt_number || 'Sale'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              color: #000;
              background: #fff;
              width: 280px;
              margin: 0 auto;
              padding: 5px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .receipt {
              width: 100%;
              max-width: 280px;
              margin: 0 auto;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .logo {
              font-family: 'Courier New', monospace;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
              letter-spacing: 2px;
            }
            .logo-symbol {
              font-size: 24px;
              margin-bottom: 3px;
            }
            .receipt-title {
              font-size: 16px;
              font-weight: bold;
              margin: 5px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .receipt-store-info h2 {
              font-size: 14px;
              margin: 3px 0;
              font-weight: bold;
            }
            .receipt-store-info p {
              margin: 1px 0;
              font-size: 10px;
            }
            .receipt-info {
              margin-bottom: 10px;
              padding: 0 5px;
            }
            .receipt-info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .receipt-items-header {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #000;
              border-top: 1px solid #000;
              padding: 4px 5px;
              margin: 8px 0 5px 0;
              font-weight: bold;
              background: #f0f0f0;
            }
            .item-name {
              flex: 2;
              text-align: left;
            }
            .item-qty {
              width: 25px;
              text-align: center;
            }
            .item-price {
              width: 50px;
              text-align: right;
            }
            .item-total {
              width: 50px;
              text-align: right;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              padding: 0 5px;
              align-items: flex-start;
            }
            .item-category {
              display: block;
              font-size: 9px;
              color: #666;
              margin-top: 1px;
              font-style: italic;
            }
            .receipt-totals {
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              padding: 8px 5px;
              margin: 10px 0;
            }
            .receipt-total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .receipt-grand-total {
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
              font-weight: bold;
              font-size: 14px;
            }
            .receipt-footer {
              text-align: center;
              border-top: 1px dashed #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            .receipt-footer p {
              margin: 3px 0;
              font-size: 10px;
            }
            .barcode-placeholder {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              letter-spacing: 1px;
              margin: 8px 0;
              padding: 2px;
              border: 1px solid #000;
            }
            .divider {
              border-bottom: 1px dashed #000;
              margin: 8px 0;
            }
            .text-center {
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .bold {
              font-weight: bold;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
                width: 280px;
              }
              .receipt {
                width: 280px;
                max-width: 280px;
              }
            }
          </style>
        </head>
        <body>
          ${contentEl.innerHTML}
        </body>
      </html>`);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      // slight delay to ensure rendering
      setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
      }, 200);
    };
  };

  const currentDate = new Date().toLocaleString();

  return (
    <>
      <div className="modal active">
        <div className="modal-content receipt-modal">
          <div className="modal-header">
            <h3>Sale Receipt</h3>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handlePrint}>
                <i className="fas fa-print" /> Print
              </button>
              <span className="close" onClick={onClose}>&times;</span>
            </div>
          </div>
          <div className="modal-body">
            <div id="receipt-content" className="receipt">
              <div className="receipt-header">
                <div className="logo">
                  <div className="logo-symbol">✦</div>
                  MWAMBA
                </div>
                <h1 className="receipt-title">RECEIPT</h1>
                <div className="receipt-store-info">
                  <h2>MWAMBA STORES</h2>
                  <p>Nairobi, Kenya</p>
                  <p>Tel: +254 700 123 456</p>
                </div>
              </div>

              <div className="receipt-info">
                <div className="receipt-info-row">
                  <span>Date:</span>
                  <span>{currentDate}</span>
                </div>
                <div className="receipt-info-row">
                  <span>Receipt #:</span>
                  <span className="bold">{saleData?.receipt_number || 'N/A'}</span>
                </div>
                <div className="receipt-info-row">
                  <span>Sale ID:</span>
                  <span>{saleData?.id || 'N/A'}</span>
                </div>
                {customer && (
                  <div className="receipt-info-row">
                    <span>Customer:</span>
                    <span>{customer.name}</span>
                  </div>
                )}
                <div className="receipt-info-row">
                  <span>Payment:</span>
                  <span className="bold">{paymentMethod.toUpperCase()}</span>
                </div>
              </div>

              <div className="divider" />

              <div className="receipt-items-header">
                <span className="item-name">ITEM</span>
                <span className="item-qty">QTY</span>
                <span className="item-price">PRICE</span>
                <span className="item-total">TOTAL</span>
              </div>

              <div className="receipt-items">
                {cart.map((item, idx) => (
                  <div key={idx} className="receipt-item">
                    <div className="item-name">
                      {item.name}
                      {item.category_name && (
                        <small className="item-category">({item.category_name})</small>
                      )}
                    </div>
                    <div className="item-qty">{item.quantity}</div>
                    <div className="item-price">{formatCurrency(item.price)}</div>
                    <div className="item-total">{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div className="receipt-totals">
                <div className="receipt-total-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="receipt-total-row">
                  <span>Tax:</span>
                  <span>KSh 0.00</span>
                </div>
                <div className="receipt-total-row receipt-grand-total">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {change > 0 && (
                  <>
                    <div className="receipt-total-row">
                      <span>Paid:</span>
                      <span>{formatCurrency(total + change)}</span>
                    </div>
                    <div className="receipt-total-row">
                      <span>Change:</span>
                      <span>{formatCurrency(change)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="receipt-footer">
                <p className="bold">Thank you for your business!</p>
                <p>Please come again</p>
                <div className="divider" />
                <div className="receipt-barcode">
                  <div className="barcode-placeholder text-center">
                    {saleData?.receipt_number || 'RECEIPT'}
                  </div>
                </div>
                <p>MWAMBA STORES © {new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* In‑app styles for modal & receipt preview – this does not affect print iframe */}
      <style jsx>{`
        .receipt-modal .modal-content {
          max-width: 320px;
          width: 100%;
        }
        .receipt {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
          color: #000;
          background: #fff;
          padding: 15px;
          max-width: 280px;
          margin: 0 auto;
          border: 1px solid #ddd;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .receipt-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .logo {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
          letter-spacing: 2px;
        }
        .logo-symbol {
          font-size: 24px;
          margin-bottom: 3px;
        }
        .receipt-title {
          font-size: 16px;
          font-weight: bold;
          margin: 5px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .receipt-store-info h2 {
          font-size: 14px;
          margin: 3px 0;
          font-weight: bold;
        }
        .receipt-store-info p {
          margin: 1px 0;
          font-size: 10px;
        }
        .receipt-info {
          margin-bottom: 10px;
          padding: 0 5px;
        }
        .receipt-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .receipt-items-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #000;
          border-top: 1px solid #000;
          padding: 4px 5px;
          margin: 8px 0 5px 0;
          font-weight: bold;
          background: #f0f0f0;
        }
        .item-name {
          flex: 2;
          text-align: left;
        }
        .item-qty {
          width: 25px;
          text-align: center;
        }
        .item-price {
          width: 50px;
          text-align: right;
        }
        .item-total {
          width: 50px;
          text-align: right;
        }
        .receipt-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          padding: 0 5px;
          align-items: flex-start;
        }
        .item-category {
          display: block;
          font-size: 9px;
          color: #666;
          margin-top: 1px;
          font-style: italic;
        }
        .receipt-totals {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 8px 5px;
          margin: 10px 0;
        }
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .receipt-grand-total {
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
          font-weight: bold;
          font-size: 14px;
        }
        .receipt-footer {
          text-align: center;
          border-top: 1px dashed #000;
          padding-top: 10px;
          margin-top: 10px;
        }
        .receipt-footer p {
          margin: 3px 0;
          font-size: 10px;
        }
        .barcode-placeholder {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          letter-spacing: 1px;
          margin: 8px 0;
          padding: 2px;
          border: 1px solid #000;
        }
        .divider {
          border-bottom: 1px dashed #000;
          margin: 8px 0;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .bold {
          font-weight: bold;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
      `}</style>
    </>
  );
};

export default ReceiptModal;
