import React from 'react';
import logo from '../../logo.png';
import { formatCurrency } from '../../services/ApiService/api';
import './ReceiptModal.css';

const ReceiptModal = ({
  isOpen,
  onClose,
  saleData,
  cart,
  total,
  paymentMethod,
  change = 0,
  customer = null,
  mode = 'retail',
  splitData = null,
  vatRate = 0.16 // Default VAT rate of 16%
}) => {
  if (!isOpen) return null;

  // Calculate VAT
  const subtotal = total / (1 + vatRate);
  const vatAmount = total - subtotal;

  const handlePrint = () => {
    const currentDate = new Date().toLocaleString();

    // Create print content with optimized thermal printer format
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
              font-size: 12px;
              line-height: 1.2;
              color: #000;
              background: #fff;
              width: 58mm;
              margin: 0 auto;
              padding: 2mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-weight: bold;
            }
            .receipt {
              width: 100%;
              font-weight: bold;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 3px;
              margin-bottom: 3px;
              font-weight: bold;
            }
            .logo-text {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .receipt-title {
              font-size: 12px;
              font-weight: bold;
              margin: 2px 0;
              text-transform: uppercase;
            }
            .receipt-store-info {
              font-size: 10px;
              margin: 2px 0;
              font-weight: bold;
            }
            .receipt-info {
              margin-bottom: 5px;
              font-weight: bold;
              font-size: 10px;
            }
            .receipt-info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-weight: bold;
            }
            .receipt-items-header {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #000;
              padding: 2px 0;
              margin: 3px 0;
              font-weight: bold;
              font-size: 10px;
            }
            .item-name {
              flex: 2;
              text-align: left;
              font-size: 10px;
              font-weight: bold;
            }
            .item-qty {
              width: 20px;
              text-align: center;
              font-size: 10px;
              font-weight: bold;
            }
            .item-price {
              width: 30px;
              text-align: right;
              font-size: 10px;
              font-weight: bold;
            }
            .item-total {
              width: 30px;
              text-align: right;
              font-size: 10px;
              font-weight: bold;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-weight: bold;
              font-size: 10px;
            }
            .receipt-totals {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 3px 0;
              margin: 5px 0;
              font-weight: bold;
              font-size: 10px;
            }
            .receipt-total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-weight: bold;
            }
            .receipt-grand-total {
              border-top: 1px solid #000;
              padding-top: 2px;
              margin-top: 2px;
              font-weight: bold;
              font-size: 12px;
            }
            .receipt-footer {
              text-align: center;
              border-top: 1px dashed #000;
              padding-top: 3px;
              margin-top: 5px;
              font-weight: bold;
              font-size: 10px;
            }
            .receipt-footer p {
              margin: 2px 0;
              font-weight: bold;
            }
            .divider {
              border-bottom: 1px dashed #000;
              margin: 3px 0;
            }
            .bold {
              font-weight: bold;
            }
            @media print {
              body {
                margin: 0;
                padding: 2mm;
                width: 58mm;
                font-size: 12px;
                font-weight: bold;
              }
              .receipt {
                width: 100%;
                font-weight: bold;
              }
              * {
                font-weight: bold !important;
              }
            }
            @page {
              margin: 0;
              size: 58mm auto;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <div class="logo-text">MWAMBA</div>
              <div class="receipt-title">RECEIPT</div>
              <div class="receipt-store-info">
                MWAMBA LIQUOR STORES<br>
                RONGO<br>
                Tel: +254 745 119 135
              </div>
            </div>

            <div class="receipt-info">
              <div class="receipt-info-row">
                <span>Date:</span>
                <span>${currentDate.split(',')[0]}</span>
              </div>
              <div class="receipt-info-row">
                <span>Receipt:</span>
                <span class="bold">${saleData?.receipt_number || 'N/A'}</span>
              </div>
              <div class="receipt-info-row">
                <span>Mode:</span>
                <span class="bold">${mode.toUpperCase()}</span>
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
              ${paymentMethod === 'split' && splitData ? `
                <div class="receipt-info-row">
                  <span>MPesa:</span>
                  <span>${formatCurrency(splitData.mpesa || 0)}</span>
                </div>
                <div class="receipt-info-row">
                  <span>Cash:</span>
                  <span>${formatCurrency(splitData.cash || 0)}</span>
                </div>
              ` : ''}
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
                  <div class="item-name">${item.name}</div>
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
                <span>${formatCurrency(subtotal)}</span>
              </div>
              <div class="receipt-total-row">
                <span>VAT (${(vatRate * 100).toFixed(0)}%):</span>
                <span>${formatCurrency(vatAmount)}</span>
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
              <p>MWAMBA STORES © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create a new window for printing with thermal printer dimensions
    const printWindow = window.open('', '_blank', 'width=300,height=600,scrollbars=yes');
    if (!printWindow) {
      alert('Please allow popups for this site to print receipts.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close the window after printing attempt
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 300);
    };
  };

  const currentDate = new Date().toLocaleString();

  return (
    <>
      <div className="receipt-modal-overlay">
        <div className="receipt-modal-content">
          <div className="modal-header">
            <h3>Sale Receipt</h3>
            <div className="modal-actions">
              <button className="receipt-modal-btn receipt-modal-btn-secondary" onClick={handlePrint}>
                <i className="fas fa-print" /> Print
              </button>
              <span className="close" onClick={onClose}>&times;</span>
            </div>
          </div>
          <div className="receipt-modal-body">
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
                <div className="receipt-info-row">
                  <span>Mode:</span>
                  <span className="bold">{mode.toUpperCase()}</span>
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
                {paymentMethod === 'split' && splitData && (
                  <>
                    <div className="receipt-info-row">
                      <span>MPesa:</span>
                      <span>{formatCurrency(splitData.mpesa || 0)}</span>
                    </div>
                    <div className="receipt-info-row">
                      <span>Cash:</span>
                      <span>{formatCurrency(splitData.cash || 0)}</span>
                    </div>
                  </>
                )}
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
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="receipt-total-row">
                  <span>VAT ({(vatRate * 100).toFixed(0)}%):</span>
                  <span>{formatCurrency(vatAmount)}</span>
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