import React from 'react';
import logo from '../../logo.png';
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
    const currentDate = new Date().toLocaleString();
    
    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${saleData?.receipt_number || 'Sale'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-weight: bold !important;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 16px;
              line-height: 1.3;
              color: #000;
              background: #fff;
              width: 100%;
              margin: 0;
              padding: 8px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-weight: bold;
            }
            .receipt {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
              font-weight: bold;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
              font-weight: bold;
            }
            .logo-container {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin-bottom: 8px;
              font-weight: bold;
            }
            .receipt-logo {
              width: 50px;
              height: 50px;
              object-fit: contain;
            }
            .logo-text {
              font-family: 'Courier New', monospace;
              font-size: 28px;
              font-weight: bold;
              letter-spacing: 3px;
            }
            .receipt-title {
              font-size: 22px;
              font-weight: bold;
              margin: 8px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .receipt-store-info h2 {
              font-size: 20px;
              margin: 5px 0;
              font-weight: bold;
            }
            .receipt-store-info p {
              margin: 3px 0;
              font-size: 16px;
              font-weight: bold;
            }
            .receipt-info {
              margin-bottom: 15px;
              padding: 0 8px;
              font-weight: bold;
            }
            .receipt-info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-weight: bold;
            }
            .receipt-items-header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #000;
              border-top: 2px solid #000;
              padding: 6px 8px;
              margin: 12px 0 8px 0;
              font-weight: bold;
              background: #f0f0f0;
              font-size: 16px;
            }
            .item-name {
              flex: 3;
              text-align: left;
              font-size: 15px;
              font-weight: bold;
            }
            .item-qty {
              width: 50px;
              text-align: center;
              font-size: 15px;
              font-weight: bold;
            }
            .item-price {
              width: 70px;
              text-align: right;
              font-size: 15px;
              font-weight: bold;
            }
            .item-total {
              width: 70px;
              text-align: right;
              font-size: 15px;
              font-weight: bold;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              padding: 0 8px;
              align-items: flex-start;
              font-weight: bold;
            }
            .item-category {
              display: block;
              font-size: 12px;
              color: #000;
              margin-top: 2px;
              font-style: italic;
              font-weight: bold;
            }
            .receipt-totals {
              border-top: 3px solid #000;
              border-bottom: 3px solid #000;
              padding: 12px 8px;
              margin: 15px 0;
              font-weight: bold;
            }
            .receipt-total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 16px;
              font-weight: bold;
            }
            .receipt-grand-total {
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 8px;
              font-weight: bold;
              font-size: 20px;
            }
            .receipt-footer {
              text-align: center;
              border-top: 2px dashed #000;
              padding-top: 12px;
              margin-top: 15px;
              font-weight: bold;
            }
            .receipt-footer p {
              margin: 5px 0;
              font-size: 16px;
              font-weight: bold;
            }
            .barcode-placeholder {
              font-family: 'Courier New', monospace;
              font-size: 18px;
              letter-spacing: 2px;
              margin: 12px 0;
              padding: 4px;
              border: 2px solid #000;
              font-weight: bold;
            }
            .divider {
              border-bottom: 2px dashed #000;
              margin: 12px 0;
            }
            .text-center {
              text-align: center;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
              font-weight: bold;
            }
            .bold {
              font-weight: bold;
            }
            @media print {
              body {
                margin: 0;
                padding: 8px;
                width: 100%;
                font-size: 16px;
                font-weight: bold;
              }
              .receipt {
                width: 100%;
                max-width: 100%;
                font-weight: bold;
              }
              * {
                font-weight: bold !important;
              }
            }
            @page {
              margin: 0;
              size: auto;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <div class="logo-container">
                <div class="logo-text">MWAMBA</div>
              </div>
              <h1 class="receipt-title">RECEIPT</h1>
              <div class="receipt-store-info">
                <h2>MWAMBA LIQUOR STORES</h2>
                <p>RONGO</p>
                <p>Tel: +254 745 119 135</p>
                <p>Paybill: 522533</p>
                <p>Account: 8015580</p>
              </div>
            </div>

            <div class="receipt-info">
              <div class="receipt-info-row">
                <span>Date:</span>
                <span>${currentDate}</span>
              </div>
              <div class="receipt-info-row">
                <span>Receipt #:</span>
                <span class="bold">${saleData?.receipt_number || 'N/A'}</span>
              </div>
              <div class="receipt-info-row">
                <span>Sale ID:</span>
                <span>${saleData?.id || 'N/A'}</span>
              </div>
              ${customer ? `
                <div class="receipt-info-row">
                  <span>Customer:</span>
                  <span>${customer.name}</span>
                </div>
              ` : ''}
              <div class="receipt-info-row">
                <span>Payment:</span>
                <span class="bold">${paymentMethod.toUpperCase()}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="receipt-items-header">
              <span class="item-name">ITEM</span>
              <span class="item-qty">QTY</span>
              <span class="item-price">PRICE</span>
              <span class="item-total">TOTAL</span>
            </div>

            <div class="receipt-items">
              ${cart.map((item, idx) => `
                <div class="receipt-item">
                  <div class="item-name">
                    ${item.name}
                    ${item.category_name ? `
                      <small class="item-category">(${item.category_name})</small>
                    ` : ''}
                  </div>
                  <div class="item-qty">${item.quantity}</div>
                  <div class="item-price">${formatCurrency(item.price)}</div>
                  <div class="item-total">${formatCurrency(item.price * item.quantity)}</div>
                </div>
              `).join('')}
            </div>

            <div class="divider"></div>

            <div class="receipt-totals">
              <div class="receipt-total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(total)}</span>
              </div>
              <div class="receipt-total-row">
                <span>Tax:</span>
                <span>KSh 0.00</span>
              </div>
              <div class="receipt-total-row receipt-grand-total">
                <span>TOTAL:</span>
                <span>${formatCurrency(total)}</span>
              </div>
              ${change > 0 ? `
                <div class="receipt-total-row">
                  <span>Paid:</span>
                  <span>${formatCurrency(total + change)}</span>
                </div>
                <div class="receipt-total-row">
                  <span>Change:</span>
                  <span>${formatCurrency(change)}</span>
                </div>
              ` : ''}
            </div>

            <div class="receipt-footer">
              <p class="bold">Thank you for your business!</p>
              <p>Please come again</p>
              <div class="divider"></div>
              <div class="receipt-barcode">
                <div class="barcode-placeholder text-center">
                  ${saleData?.receipt_number || 'RECEIPT'}
                </div>
              </div>
              <p>MWAMBA STORES © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups for this site to print receipts.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then trigger print
    printWindow.onload = () => {
      // Small delay to ensure everything is rendered
      setTimeout(() => {
        printWindow.print();
        // Optionally close the window after printing
        // printWindow.close();
      }, 500);
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
                <div className="logo-container">
                  <img src={logo} alt="Logo" className="receipt-logo-png" />
                  <div className="logo-text">MWAMBA</div>
                </div>
                <h1 className="receipt-title">RECEIPT</h1>
                <div className="receipt-store-info">
                  <h2>MWAMBA LIQUOR STORES</h2>
                  <p>RONGO</p>
                  <p>Tel: +254 745 119 135</p>
                  <p>Paybill: 522533</p>
                  <p>Account: 8015580</p>
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

      {/* In‑app styles for modal & receipt preview */}
      <style jsx>{`
        .modal.active {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .receipt-modal .modal-content {
          max-width: 400px;
          width: 100%;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #ddd;
        }
        .modal-body {
          padding: 20px;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .close {
          font-size: 24px;
          cursor: pointer;
          margin-left: 15px;
        }
        .receipt {
          font-family: 'Courier New', monospace;
          font-size: 16px;
          line-height: 1.3;
          color: #000;
          background: #fff;
          padding: 20px;
          max-width: 100%;
          margin: 0 auto;
          border: 1px solid #ddd;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          font-weight: bold;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 3px solid #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 8px;
          font-weight: bold;
        }
        .receipt-logo-png {
          width: 50px;
          height: 50px;
          object-fit: contain;
        }
        .logo-text {
          font-family: 'Courier New', monospace;
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 3px;
        }
        .receipt-title {
          font-size: 22px;
          font-weight: bold;
          margin: 8px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .receipt-store-info h2 {
          font-size: 20px;
          margin: 5px 0;
          font-weight: bold;
        }
        .receipt-store-info p {
          margin: 3px 0;
          font-size: 16px;
          font-weight: bold;
        }
        .receipt-info {
          margin-bottom: 15px;
          padding: 0 8px;
          font-weight: bold;
        }
        .receipt-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-weight: bold;
        }
        .receipt-items-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #000;
          border-top: 2px solid #000;
          padding: 6px 8px;
          margin: 12px 0 8px 0;
          font-weight: bold;
          background: #f0f0f0;
          font-size: 16px;
        }
        .item-name {
          flex: 3;
          text-align: left;
          font-size: 15px;
          font-weight: bold;
        }
        .item-qty {
          width: 50px;
          text-align: center;
          font-size: 15px;
          font-weight: bold;
        }
        .item-price {
          width: 70px;
          text-align: right;
          font-size: 15px;
          font-weight: bold;
        }
        .item-total {
          width: 70px;
          text-align: right;
          font-size: 15px;
          font-weight: bold;
        }
        .receipt-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          padding: 0 8px;
          align-items: flex-start;
          font-weight: bold;
        }
        .item-category {
          display: block;
          font-size: 12px;
          color: #000;
          margin-top: 2px;
          font-style: italic;
          font-weight: bold;
        }
        .receipt-totals {
          border-top: 3px solid #000;
          border-bottom: 3px solid #000;
          padding: 12px 8px;
          margin: 15px 0;
          font-weight: bold;
        }
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 16px;
          font-weight: bold;
        }
        .receipt-grand-total {
          border-top: 2px solid #000;
          padding-top: 8px;
          margin-top: 8px;
          font-weight: bold;
          font-size: 20px;
        }
        .receipt-footer {
          text-align: center;
          border-top: 2px dashed #000;
          padding-top: 12px;
          margin-top: 15px;
          font-weight: bold;
        }
        .receipt-footer p {
          margin: 5px 0;
          font-size: 16px;
          font-weight: bold;
        }
        .barcode-placeholder {
          font-family: 'Courier New', monospace;
          font-size: 18px;
          letter-spacing: 2px;
          margin: 12px 0;
          padding: 4px;
          border: 2px solid #000;
          font-weight: bold;
        }
        .divider {
          border-bottom: 2px dashed #000;
          margin: 12px 0;
        }
        .text-center {
          text-align: center;
          font-weight: bold;
        }
        .text-right {
          text-align: right;
          font-weight: bold;
        }
        .bold {
          font-weight: bold;
        }
      `}</style>
    </>
  );
};

export default ReceiptModal;