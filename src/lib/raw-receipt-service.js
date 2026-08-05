// raw-receipt-service.js
import { EscPosEncoder } from './esc-pos';
import { useSettingsStore } from '@/store/useSettingsStore';

const fetchLogoAsDataUri = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  if (!url.startsWith('http')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '');
      url = `${baseUrl}/${url}`;
  }
  try {
    const token = localStorage.getItem('erp_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('[rawReceiptService] Logo fetch failed:', e);
    return null;
  }
};

const formatDate = (dateStr) => {
  try {
    const date = new Date(dateStr || new Date());
    return date.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
  } catch (e) {
    return dateStr;
  }
};

export const generateRawReceiptBuffer = async (sale, settingsObj, business, branch, terminalName) => {
  // Use settings from params or fallback to store
  const settings = settingsObj || useSettingsStore.getState();
  
  const { 
      paperWidth, 
      showLogo, showHeader, headerText, 
      showFooter, footerText, 
      refundPolicy, showRefundPolicy, 
      showBarcode,
      showDateTime = true,
      showUser = true,
      showCustomer = true,
      showSalesType = true,
      showTax = true,
      showDiscount = true
  } = settings;

  const businessName = business?.name || 'INZEEDO POS';
  const businessAddress = business?.address || branch?.address || '';
  const businessPhone = business?.phone || branch?.phone || '';
  const taxId = business?.tax_id || '';
  const businessLogo = business?.logo;

  const encoder = new EscPosEncoder();
  encoder.initialize();

  // FORCE BOLD FOR THE ENTIRE RECEIPT TO MAKE IT DARK
  encoder.bold(true);

  // Header
  encoder.align('center');

  if (showLogo && businessLogo) {
    try {
      const logoDataUri = await fetchLogoAsDataUri(businessLogo);
      if (logoDataUri) {
        await encoder.image(logoDataUri, paperWidth === '80mm' ? 384 : 256);
        encoder.feed(1);
      }
    } catch (err) {
      console.error("Failed to append logo", err);
    }
  }

  encoder.size(1, 2).line(businessName.toUpperCase()).size(1, 1);

  if (businessAddress) encoder.line(businessAddress.toUpperCase());
  if (businessPhone) encoder.line(`TEL: ${businessPhone}`);
  if (taxId) encoder.line(`VAT/TIN: ${taxId}`);
  if (showHeader && headerText && headerText !== "Sale Invoice") {
      encoder.line(headerText.toUpperCase());
  }

  const lineLength = paperWidth === '80mm' ? 46 : 32;

  encoder.divider(lineLength, '=').align('left');

  const invStr = sale.invoice_number || 'DRAFT';
  encoder.line(`INVOICE:${' '.repeat(Math.max(1, lineLength - 8 - invStr.length))}${invStr}`);
  
  if (showDateTime) {
      const dateStr = formatDate(sale.created_at);
      encoder.line(`DATE:${' '.repeat(Math.max(1, lineLength - 5 - dateStr.length))}${dateStr}`);
  }

  encoder.divider(lineLength, '=');

  // Type & User line
  if (showSalesType) {
      const typeStr = sale.is_wholesale !== undefined ? (sale.is_wholesale ? 'WHOLESALE POS.SALE' : 'RETAIL POS.SALE') : 'POS.SALE';
      encoder.align('center').line(typeStr).align('left');
      encoder.divider(lineLength, '-');
  }
  
  if (showCustomer) {
      const customerStr = (sale.distributor?.name || sale.customer?.name || sale.customer_name || '').toUpperCase();
      if (customerStr) {
        encoder.line(`CUSTOMER:${' '.repeat(Math.max(1, lineLength - 9 - customerStr.length))}${customerStr.substring(0, lineLength - 9)}`);
      }
  }
  
  if (showUser && sale.sellers && sale.sellers.length > 0) {
      const sellerStr = sale.sellers.map(s => s.name).join(", ").substring(0, lineLength - 5).toUpperCase();
      encoder.line(`USER:${' '.repeat(Math.max(1, lineLength - 5 - sellerStr.length))}${sellerStr}`);
  }
  
  if (terminalName) {
      encoder.line(`TERM:${' '.repeat(Math.max(1, lineLength - 5 - terminalName.length))}${terminalName.substring(0, lineLength - 5).toUpperCase()}`);
  }

  encoder.divider(lineLength, '=');

  // Items Table Header
  encoder.line(lineLength === 46 ? '# DESCRIPTION         QTY    PRICE      AMOUNT' : '# DESCRIPTION  QTY  PRICE AMOUNT');
  encoder.divider(lineLength, '=');

  // Items
  let totalMrpSaved = 0;
  const items = sale.items || sale.sale_items || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const maxNameLen = lineLength === 46 ? 46 : 32;
    const rawProdName = (item.product_name || item.product?.name || item.name || 'Item').toUpperCase();
    const fullItemName = `${i + 1} ${rawProdName}`;
    
    if (fullItemName.length <= maxNameLen) {
      encoder.line(fullItemName);
    } else {
      let currentLine = "";
      const words = fullItemName.split(" ");
      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        if (currentLine.length + word.length + (currentLine ? 1 : 0) > maxNameLen) {
          if (currentLine) encoder.line(currentLine);
          currentLine = "  " + word; // Indent next line
        } else {
          currentLine += (currentLine ? " " : "") + word;
        }
      }
      if (currentLine) {
        encoder.line(currentLine);
      }
    }

    const variantName = (item.product_variant?.name || item.variant?.name || item.variant_name || '').toUpperCase();
    if (variantName && variantName !== rawProdName && variantName !== 'DEFAULT') {
      const fullVarName = `  - ${variantName}`;
      if (fullVarName.length <= maxNameLen) {
        encoder.line(fullVarName);
      } else {
        encoder.line(fullVarName.substring(0, maxNameLen));
        let rem = fullVarName.substring(maxNameLen);
        while (rem.length > 0) {
          encoder.line(`    ${rem.substring(0, maxNameLen - 4)}`);
          rem = rem.substring(maxNameLen - 4);
        }
      }
    }

    const priceStr = parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    const lineTotal = parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 });
    const qtyStr = `${Number(item.quantity)} x ${priceStr}`;

    const spaces = lineLength - qtyStr.length - lineTotal.length - 3;
    encoder.line(`${' '.repeat(Math.max(0, spaces > 0 ? spaces : 16))}${qtyStr}   ${lineTotal}`);

    // Manual or apportioned discount
    const discount = item.manual_discount !== undefined ? parseFloat(item.manual_discount) : parseFloat(item.discount_amount || 0);
    if (showDiscount && discount > 0) {
      encoder.line(`  SAVE: ${discount.toLocaleString()}`);
    }
    
    // Tax
    const tax = parseFloat(item.tax_amount || 0);
    if (showTax && tax > 0) {
       encoder.line(`  TAX:  ${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    }

    if (item.mrp_price > item.unit_price) {
        const lineMrpSave = (item.mrp_price - item.unit_price) * item.quantity;
        totalMrpSaved += lineMrpSave;
        encoder.line(`  MRP SAVE: ${lineMrpSave.toLocaleString()}`);
    }
  }

  encoder.divider(lineLength, '=');

  // Totals
  const subtotalStr = parseFloat(sale.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
  encoder.line(`SUB TOTAL:${' '.repeat(Math.max(1, lineLength - 10 - subtotalStr.length))}${subtotalStr}`);

  if (totalMrpSaved > 0) {
    const savedStr = totalMrpSaved.toLocaleString();
    encoder.line(`YOU SAVED (MRP):${' '.repeat(Math.max(1, lineLength - 16 - savedStr.length))}${savedStr}`);
  } 
  
  if (showDiscount && parseFloat(sale.discount_amount) > 0) {
    const discountStr = parseFloat(sale.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
    encoder.line(`DISCOUNT:${' '.repeat(Math.max(1, lineLength - 9 - discountStr.length))}${discountStr}`);
  }

  if (showTax && parseFloat(sale.tax_amount) > 0) {
    const taxStr = parseFloat(sale.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
    encoder.line(`TAX:${' '.repeat(Math.max(1, lineLength - 4 - taxStr.length))}${taxStr}`);
  }
  
  if (parseFloat(sale.adjustment || 0) !== 0) {
    const adjStr = parseFloat(sale.adjustment).toLocaleString(undefined, { minimumFractionDigits: 2 });
    encoder.line(`ADJUSTMENT:${' '.repeat(Math.max(1, lineLength - 11 - adjStr.length))}${adjStr}`);
  }

  encoder.divider(lineLength, '=');
  const currencyStr = settings.currency || 'LKR';
  const totalStr = `${currencyStr} ` + parseFloat(sale.payable_amount || sale.net_total || 0).toLocaleString();
  const bigLineLen = Math.floor(lineLength / 2);
  encoder.size(2, 2);
  encoder.line(`TOTAL:${' '.repeat(Math.max(1, bigLineLen - 6 - totalStr.length))}${totalStr}`);
  encoder.size(1, 1);
  encoder.divider(lineLength, '=');

  // Payments
  const parseAmt = (val) => parseFloat(String(val || 0).replace(/,/g, '')) || 0;

  if (sale.payments && sale.payments.length > 0) {
    let totalPaid = 0;
    sale.payments.forEach(pmt => {
      const amt = parseAmt(pmt.amount);
      totalPaid += amt;
      const methodStr = `${(pmt.payment_method || 'CASH').toUpperCase()} PAID:`;
      const amtStr = amt.toLocaleString(undefined, { minimumFractionDigits: 2 });
      encoder.line(`${methodStr}${' '.repeat(Math.max(1, lineLength - methodStr.length - amtStr.length))}${amtStr}`);
    });

    const payableAmount = parseAmt(sale.payable_amount || sale.net_total);
    if (totalPaid > payableAmount) {
      const changeStr = (totalPaid - payableAmount).toLocaleString(undefined, { minimumFractionDigits: 2 });
      encoder.line(`CHANGE:${' '.repeat(Math.max(1, lineLength - 7 - changeStr.length))}${changeStr}`);
    }
  } else {
    let paidAmount = parseAmt(sale.paid_amount || sale.payable_amount || sale.net_total);
    const payableAmount = parseAmt(sale.payable_amount || sale.net_total);

    const methodStr = `${(sale.payment_method || 'CASH').toUpperCase()} PAID:`;
    const amtStr = paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 });
    encoder.line(`${methodStr}${' '.repeat(Math.max(1, lineLength - methodStr.length - amtStr.length))}${amtStr}`);

    if (paidAmount > payableAmount) {
      const changeStr = (paidAmount - payableAmount).toLocaleString(undefined, { minimumFractionDigits: 2 });
      encoder.line(`CHANGE:${' '.repeat(Math.max(1, lineLength - 7 - changeStr.length))}${changeStr}`);
    }
  }

  encoder.divider(lineLength, '=');

  // Footer & Barcode
  encoder.align('center');
  if (showRefundPolicy && refundPolicy) encoder.line(refundPolicy.toUpperCase());

  if (showFooter && footerText) {
    encoder.line(footerText.toUpperCase());
  } else if (!showFooter) {
     // do nothing
  } else {
    encoder.line('THANK YOU FOR YOUR BUSINESS!');
    encoder.line('PLEASE VISIT AGAIN.');
  }

  encoder.newline();
  encoder.line('ERP SYSTEM FROM INZEEDO');
  encoder.line('(c) 2026 INZEEDO.LK | +94785706441');

  encoder.newline();
  try {
    if (showBarcode && sale.invoice_number) {
      encoder.barcode(sale.invoice_number);
    }
  } catch (e) { }

  encoder.cut();
  return encoder.encode(); // returns Uint8Array
};
