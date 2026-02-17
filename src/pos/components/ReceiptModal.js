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
            body, div, span, p, h1, h2, h3, h4, h5, h6, table, tr, td, th {
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
                font-weight: bold !important;
              }
              .receipt {
                width: 100%;
                font-weight: bold !important;
              }
              * {
                font-weight: bold !important;
              }
              div, span, p, h1, h2, h3, h4, h5, h6 {
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
                Tel: +254 745 119 135<br>
                Paybill: 522533<br>
                Account: 8015580
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

            ${saleData?.return_code_used ? `
              <div class="divider"></div>
              <div class="receipt-return-code-info">
                <i class="fas fa-undo-alt"></i>
                <span>Return Code Applied</span>
              </div>
              <div class="receipt-return-code-row">
                <span>Code:</span>
                <span class="bold">${saleData.return_code_used}</span>
              </div>
              <div class="receipt-return-code-row">
                <span>Credit:</span>
                <span class="bold credit">-${formatCurrency(parseFloat(saleData.return_code_amount) || 0)}</span>
              </div>
            ` : ''}

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
                  <div class="item-name">${item.name || item.product_name || 'Unknown Item'}</div>
                  <div class="item-qty">${item.quantity}</div>
                  <div class="item-price">${formatCurrency(parseFloat(item.price || item.unit_price || 0))}</div>
                  <div class="item-total">${formatCurrency((parseFloat(item.price || item.unit_price || 0)) * item.quantity)}</div>
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

              {/* Return Code Applied Display */}
              {saleData?.return_code_used && (
                <div className="receipt-return-code-section">
                  <div className="divider" />
                  <div className="receipt-return-code-info">
                    <i className="fas fa-undo-alt"></i>
                    <span>Return Code Applied</span>
                  </div>
                  <div className="receipt-return-code-row">
                    <span>Code:</span>
                    <span className="bold">{saleData.return_code_used}</span>
                  </div>
                  <div className="receipt-return-code-row">
                    <span>Credit:</span>
                    <span className="bold credit">-{formatCurrency(parseFloat(saleData.return_code_amount) || 0)}</span>
                  </div>
                </div>
              )}

              <div className="divider" />

              <div className="receipt-items-header">
                <span className="item-name">ITEM</span>
                <span className="item-qty">QTY</span>
                <span className="item-price">PRICE</span>
                <span className="item-total">TOTAL</span>
              </div>

              <div className="receipt-items">
                {cart && cart.length > 0 ? (
                  cart.map((item, idx) => (
                    <div key={idx} className="receipt-item">
                      <div className="item-name">
                        {item.name || item.product_name || 'Unknown Item'}
                        {item.category_name && (
                          <small className="item-category">({item.category_name})</small>
                        )}
                      </div>
                      <div className="item-qty">{item.quantity}</div>
                      <div className="item-price">{formatCurrency(parseFloat(item.price || item.unit_price || 0))}</div>
                      <div className="item-total">{formatCurrency((parseFloat(item.price || item.unit_price || 0)) * item.quantity)}</div>
                    </div>
                  ))
                ) : (
                  <div className="receipt-item">
                    <div className="item-name">No items</div>
                    <div className="item-qty">-</div>
                    <div className="item-price">-</div>
                    <div className="item-total">-</div>
                  </div>
                )}
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
    </>
  );
};

export default ReceiptModal;
