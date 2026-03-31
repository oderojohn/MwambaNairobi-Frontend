import React from 'react';
import logo from '../../logo.png';
import { formatCurrency } from '../../services/ApiService/api';
import './ReceiptModal.css';

// Custom format function without currency symbol for receipts
const formatNumber = (amount) => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return numericAmount.toFixed(2);
};

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
  vatRate = 0.16, // Default VAT rate of 16%
  isReprint = false,
  user = null,
  isPendingBill = false
}) => {
  const [recipientPhone, setRecipientPhone] = React.useState('');

  React.useEffect(() => {
    setRecipientPhone(customer?.phone || '');
  }, [customer]);

  if (!isOpen) return null;

  // Calculate VAT
  const subtotal = total / (1 + vatRate);
  const vatAmount = total - subtotal;

  const handlePrint = () => {
    const currentDate = new Date().toLocaleString();
    const servedBy = user ? (user.name || user.username || 'Staff') : 'Staff';

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
              width: 80mm;
              min-height: 100%;
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
              min-width: 180px;
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
              width: 50px;
              text-align: right;
              font-size: 10px;
              font-weight: bold;
            }
            .item-total {
              width: 55px;
              text-align: right;
              font-size: 10px;
              font-weight: bold;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              font-weight: bold;
              font-size: 10px;
              min-width: 180px;
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
            .reprinted-label {
              color: #dc2626;
              font-size: 14px;
              font-weight: 900;
              text-transform: uppercase;
              margin: 5px 0;
              padding: 3px;
              border: 2px solid #dc2626;
              display: inline-block;
            }
            @media print {
              body {
                margin: 0;
                padding: 2mm;
                width: 80mm;
                font-size: 11px;
                font-weight: bold !important;
              }
              .receipt {
                width: 100%;
                font-weight: bold !important;
                page-break-inside: avoid;
                page-break-after: auto;
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
              min-height: auto;
            }
            .receipt-container {
              width: 58mm;
              page-break-inside: avoid;
              page-break-before: avoid;
              page-break-after: avoid;
            }
            .receipt-header, .receipt-info, .receipt-items-header, .receipt-items, .receipt-item, .receipt-totals, .receipt-footer, .divider {
              page-break-inside: avoid;
              page-break-before: avoid;
              page-break-after: avoid;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <div class="logo-text">MWAMBA</div>
              <div class="receipt-title">RECEIPT</div>
              ${isReprint ? '<div class="reprinted-label">REPRINTED</div>' : ''}
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
              ${isPendingBill ? `
                <div class="receipt-info-row" style="color: #d97706; font-weight: bold;">
                  <span>Status:</span>
                  <span>PENDING - PAYMENT REQUIRED</span>
                </div>
              ` : `
              <div class="receipt-info-row">
                <span>Payment:</span>
                <span class="bold">${paymentMethod.toUpperCase()}</span>
              </div>
              `}
              ${user ? `
                <div class="receipt-info-row">
                  <span>Served by:</span>
                  <span class="bold">${servedBy}</span>
                </div>
              ` : ''}
              ${!isPendingBill && paymentMethod === 'split' && splitData ? `
                <div class="receipt-info-row">
                  <span>MPesa:</span>
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
                  <div class="item-price">${formatNumber(parseFloat(item.price || item.unit_price || 0))}</div>
                  <div class="item-total">${formatNumber((parseFloat(item.price || item.unit_price || 0)) * item.quantity)}</div>
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
              ${!isPendingBill && change > 0 ? `
                <div class="receipt-total-row">
                  <span>Paid:</span>
                  <span>${formatCurrency(total + change)}</span>
                </div>
                <div class="receipt-total-row">
                  <span>Change:</span>
                  <span>${formatCurrency(change)}</span>
                </div>
              ` : ''}
              ${isPendingBill ? `
                <div class="receipt-total-row" style="color: #d97706;">
                  <span>Balance Due:</span>
                  <span>${formatCurrency(total)}</span>
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
    const printWindow = window.open('', '_blank', 'width=250,height=400,scrollbars=no,toolbar=no,menubar=no');
    if (!printWindow) {
      alert('Please allow popups for this site to print receipts.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Print directly without waiting
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing
      setTimeout(() => {
        printWindow.close();
      }, 500);
    };
  };

  const currentDate = new Date().toLocaleString();
  const buildReceiptMessage = () => {
    const header = `Receipt ${saleData?.receipt_number || 'N/A'} - ${formatCurrency(total)}`;
    const lines = (cart || []).map(
      (item) => `${item.quantity} x ${item.name || item.product_name || 'Item'} @ ${formatCurrency(item.price || item.unit_price || 0)} = ${formatCurrency((item.price || item.unit_price || 0) * item.quantity)}`
    );
    const customerLine = customer ? `Customer: ${customer.name}${customer.phone ? ` (${customer.phone})` : ''}` : 'Customer: Walk-in';
    return [header, customerLine, `Mode: ${mode.toUpperCase()}`, `Payment: ${paymentMethod.toUpperCase()}`, ...lines, `TOTAL: ${formatCurrency(total)}`, 'Thank you!'].join('\n');
  };

  const sanitizedPhone = (phone) => (phone || '').replace(/[^0-9+]/g, '');

  const openWhatsApp = () => {
    const message = encodeURIComponent(buildReceiptMessage());
    const phone = sanitizedPhone(recipientPhone);
    const url = `https://wa.me/${phone}?text=${message}`;
    window.open(url, '_blank');
  };

  const openSMS = () => {
    const message = encodeURIComponent(buildReceiptMessage());
    const phone = sanitizedPhone(recipientPhone);
    window.location.href = `sms:${phone}?&body=${message}`;
  };

  return (
    <>
      <div className="receipt-modal-overlay">
        <div className="receipt-modal-content">
          <div className="modal-header">
            <h3>{isReprint ? 'Reprint Receipt' : 'Sale Receipt'}</h3>
            <div className="modal-actions">
              <button className="receipt-modal-btn receipt-modal-btn-primary" onClick={handlePrint}>
                <i className="fas fa-print" /> Print Receipt
              </button>
              <span className="close" onClick={onClose}>&times;</span>
            </div>
          </div>
          <div className="receipt-modal-body">
            <div className="receipt-send">
              <label className="receipt-send__label" htmlFor="receipt-phone">Send to phone</label>
              <div className="receipt-send__row">
                <input
                  id="receipt-phone"
                  type="tel"
                  className="receipt-send__input"
                  placeholder="e.g. +254712345678"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
                <button className="receipt-modal-btn receipt-modal-btn-secondary" onClick={openSMS}>
                  <i className="fas fa-sms" /> SMS
                </button>
                <button className="receipt-modal-btn receipt-modal-btn-secondary" onClick={openWhatsApp}>
                  <i className="fab fa-whatsapp" /> WhatsApp
                </button>
              </div>
            </div>
            <div id="receipt-content" className="receipt">
              <div className="receipt-header">
                <div className="logo-container">
                  <img src={logo} alt="Logo" className="receipt-logo-png" />
                  <div className="logo-text">MWAMBA</div>
                </div>
                <h1 className="receipt-title">RECEIPT</h1>
                {isReprint && <div className="reprinted-label">REPRINTED</div>}
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
                {user && (
                  <div className="receipt-info-row">
                    <span>Served by:</span>
                    <span className="bold">{user.name || user.username || 'Staff'}</span>
                  </div>
                )}
                {!isPendingBill && paymentMethod === 'split' && splitData && (
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
                {isPendingBill && (
                  <div className="receipt-info-row" style={{ color: '#d97706', fontWeight: 'bold' }}>
                    <span>Status:</span>
                    <span>PENDING - PAYMENT REQUIRED</span>
                  </div>
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
                      <div className="item-price">{formatNumber(parseFloat(item.price || item.unit_price || 0))}</div>
                      <div className="item-total">{formatNumber((parseFloat(item.price || item.unit_price || 0)) * item.quantity)}</div>
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
