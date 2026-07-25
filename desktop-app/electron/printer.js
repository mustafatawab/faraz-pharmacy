import { BrowserWindow, app } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { usb } from "usb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logoPath = `file://${path.join(__dirname, "image", "logo.png").replace(/\\/g, "/")}`;
const logoBase64 = (() => {
  try {
    const buf = fs.readFileSync(path.join(__dirname, "image", "logo.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
})();

function safeDeviceProp(device, prop) {
  try {
    const val = device[prop];
    return val != null ? val : null;
  } catch {
    return null;
  }
}

function safeProductName(device) {
  return safeDeviceProp(device, "productName") || "Unknown Printer";
}

function safeSerial(device) {
  return safeDeviceProp(device, "serialNumber") || null;
}

function generateSaleReceiptHTML(sale) {
  const items = sale.items || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const totalAmount = sale.total || 0;
  const paid = sale.amount_paid || 0;
  const balance = Math.max(0, totalAmount - paid);
  const changeDue = sale.change || 0;
  const discount = sale.discount || 0;

  const itemsHTML = items.map(item => {
    const unitPrice = item.unit_price || item.subtotal / item.quantity;
    return `<tr><td>${item.product_name}</td><td class="r">${item.quantity}</td><td class="r">${Math.round(unitPrice)}</td><td class="r b">${Math.round(item.subtotal)}</td></tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { size: 80mm auto; margin: 0; }
body {
  width: 76mm; margin: 0; padding: 3mm 2mm;
  font-family: 'Courier New', Courier, 'Lucida Console', monospace;
  font-size: 13px; color: #000; line-height: 1.3;
}
.c { text-align: center; }
.r { text-align: right; }
.b { font-weight: 700; }
.hdr { font-weight: 700; font-size: 15px; letter-spacing: 1px; }
.sub { font-size: 10px; color: #444; margin: 1px 0; }
.dash { border: none; border-top: 1px dashed #999; margin: 4px 0; }
.thick { border: none; border-top: 2px solid #000; margin: 5px 0; }
table { width: 100%; border-collapse: collapse; }
th { border-bottom: 1px solid #000; text-align: left; font-size: 10px; padding: 3px 0; letter-spacing: 0.5px; }
td { padding: 1.5px 0; font-size: 11px; }
.lines td { padding: 2px 0; }
.ret { text-align: center; font-size: 9px; color: #555; line-height: 1.4; }
</style>
</head>
<body>

<div class="c">
  <div class="hdr">FARAZ MEDICAL STORE</div>
  <div class="sub">Beside Noman Clinical Laboratory, Barikot</div>
  <div class="sub">Phone: 03469383792 / 03449006940</div>
</div>

<hr class="dash">

<div style="font-size:10px;">
  <div>Date: ${dateStr}</div>
  <div>Invoice #: ${sale.id || ""}</div>
  <div>Customer: ${sale.customer_name || "Walk-in Customer"}</div>
</div>

<hr class="dash">

<div style="font-size:10px; margin-bottom:2px;">Items: ${items.length}</div>

<table>
  <thead>
    <tr><th>Product</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amt</th></tr>
  </thead>
  <tbody>${itemsHTML}</tbody>
</table>

<hr class="dash">

<table class="lines">
  <tr><td style="width:60%">Total</td><td class="r">${Math.round(totalAmount)}</td></tr>
  ${discount > 0 ? `<tr><td>Discount</td><td class="r">-${Math.round(discount)}</td></tr>` : ""}
</table>

<hr class="thick">

<table class="lines">
  <tr><td style="width:60%" class="b">Payable</td><td class="r b">${Math.round(totalAmount)}</td></tr>
  <tr><td>Paid</td><td class="r">${Math.round(paid)}</td></tr>
  ${balance > 0 ? `<tr><td>Balance</td><td class="r">${Math.round(balance)}</td></tr>` : changeDue > 0 ? `<tr><td>Change</td><td class="r">${Math.round(changeDue)}</td></tr>` : ""}
</table>

<hr class="dash">

<div class="ret">
  No return without receipt<br>
  No return of freezer/refrigerator medicines<br>
  No return after 3 days
</div>

<hr class="dash">

<div class="c" style="font-size:10px; color:#555;">
  THANK YOU FOR YOUR VISIT
</div>

</body>
</html>`;
}

function generateA4InvoiceHTML(sale) {
  const items = sale.items || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
@page { margin: 12mm; size: A4; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: 11px; color: #1a1a1a; line-height: 1.5;
}
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 3px solid #0D9488; padding-bottom: 14px; }
.header-left { display: flex; align-items: center; gap: 10px; }
.header-logo { width: 44px; height: 44px; border-radius: 8px; object-fit: contain; }
.header h1 { font-size: 24px; letter-spacing: 1px; color: #0D9488; font-weight: 800; margin: 0; }
.header p { font-size: 11px; color: #666; margin-top: 2px; }
.header .addr { font-size: 10px; color: #888; margin-top: 1px; }
.header-right { text-align: right; }
.header-right .inv-label { font-size: 16px; font-weight: 800; color: #0D9488; letter-spacing: 1px; }
.header-right .inv-id { font-size: 9px; color: #fff; background: #0D9488; padding: 3px 8px; border-radius: 3px; margin-top: 3px; display: inline-block; }
.info { display: flex; justify-content: space-between; margin-bottom: 14px; background: #f9fafb; padding: 10px 14px; border-radius: 5px; }
.info div { font-size: 10.5px; }
.info .lbl { color: #9ca3af; font-weight: 600; }
table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
thead th {
  background: #0D9488; color: #fff; text-align: left; padding: 7px 8px;
  font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
}
thead th:first-child { border-radius: 4px 0 0 0; }
thead th:last-child { border-radius: 0 4px 0 0; }
td { padding: 6px 8px; font-size: 10.5px; border-bottom: 1px solid #eee; }
td:last-child, th:last-child { text-align: right; }
td:nth-child(2) { text-align: center; }
tbody tr:nth-child(even) { background: #fafafa; }
.totals { width: 300px; margin-left: auto; border-collapse: collapse; }
.totals td { padding: 4px 8px; border: none; font-size: 10.5px; }
.totals td:last-child { text-align: right; font-weight: 600; }
.totals .big td { font-weight: 800; font-size: 15px; border-top: 2px solid #0D9488; padding-top: 6px; color: #0D9488; }
.footer { text-align: center; font-size: 9.5px; color: #9ca3af; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
.status-a4 { text-align: center; margin-top: 8px; font-size: 10px; font-weight: 700; color: #0D9488; letter-spacing: 1px; }
.status-a4.partial { color: #f59e0b; }
</style></head><body>
<div class="header">
  <div class="header-left">
    ${logoBase64 ? `<img src="${logoBase64}" class="header-logo" alt="">` : ""}
    <div>
      <h1>FARAZ PHARMACY</h1>
      <p>Your Trusted Pharmacy &mdash; Quality Care for Everyone</p>
      <div class="addr">Barikot, Swat KPK &bull; Phone: 03469383792</div>
    </div>
  </div>
  <div class="header-right">
    <div class="inv-label">INVOICE</div>
    <div class="inv-id">#${sale.id ? sale.id.slice(0, 8) : "000000"}</div>
  </div>
</div>
<div class="info">
<div><span class="lbl">Invoice:</span> ${sale.id || "N/A"}<br><span class="lbl">Date:</span> ${dateStr}</div>
<div style="text-align:right">
${sale.customer_name ? `<span class="lbl">Customer:</span> ${sale.customer_name}<br>` : ""}
<span class="lbl">Items:</span> ${items.length} (${totalQty} units)
</div>
</div>
<table>
<thead><tr><th style="width:50%">Item</th><th style="width:12%;text-align:center">Qty</th><th style="width:16%;text-align:right">Price</th><th style="width:22%;text-align:right">Total</th></tr></thead>
<tbody>${items.map((i) => `<tr><td>${i.product_name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${(i.subtotal / i.quantity).toFixed(0)}</td><td style="text-align:right">${i.subtotal.toFixed(0)}</td></tr>`).join("")}</tbody>
</table>
<table class="totals">
<tr><td>Subtotal</td><td>${(sale.subtotal || 0).toFixed(0)}</td></tr>
${sale.discount > 0 ? `<tr><td>Discount</td><td>-${sale.discount.toFixed(0)}</td></tr>` : ""}
<tr class="big"><td>Total</td><td>${(sale.total || 0).toFixed(0)}</td></tr>
<tr><td>Paid</td><td>${(sale.amount_paid || 0).toFixed(0)}</td></tr>
<tr><td>Change</td><td>${Math.max(0, (sale.amount_paid || 0) - (sale.total || 0)).toFixed(0)}</td></tr>
<tr><td>Arrears</td><td>${(sale.customer_total_arrears || 0).toFixed(0)}</td></tr>
</table>
${sale.status === "partial" ? '<div class="status-a4 partial">PARTIAL PAYMENT</div>' : ""}
<div class="footer"><p>Thank you for your visit! &bull; Powered by Faraz Pharmacy</p></div>
</body></html>`;
}


function generateA5InvoiceHTML(sale) {
  const items = sale.items || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { size: A5 portrait; margin: 6mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  color: #1a1a1a; background: #fff; font-size: 10.5px; line-height: 1.4;
}
.header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 10px; border-bottom: 2.5px solid #0D9488; margin-bottom: 12px;
}
.brand { display: flex; align-items: center; gap: 8px; }
.brand-logo { width: 36px; height: 36px; border-radius: 6px; object-fit: contain; }
.brand-name { font-size: 17px; font-weight: 800; color: #0D9488; letter-spacing: -0.3px; }
.brand-sub { font-size: 8.5px; color: #666; margin-top: 1px; }
.brand-addr { font-size: 8px; color: #888; }
.badge { text-align: right; }
.badge h2 { font-size: 18px; font-weight: 800; color: #0D9488; letter-spacing: 1px; }
.badge-id {
  margin-top: 4px; background: #0D9488; color: #fff;
  padding: 4px 10px; border-radius: 3px; font-size: 9px; font-weight: 600; letter-spacing: 0.5px;
}
.info-row {
  display: flex; justify-content: space-between; gap: 10px; margin-bottom: 12px;
}
.info-block {
  flex: 1; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 5px;
}
.info-block-title {
  font-size: 7.5px; font-weight: 700; color: #9ca3af; text-transform: uppercase;
  letter-spacing: 0.8px; margin-bottom: 4px;
}
.info-block p { font-size: 10px; margin: 1px 0; color: #333; }
.info-block .label { color: #9ca3af; font-size: 8.5px; }
table.items { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
table.items thead th {
  background: #0D9488; color: #fff; padding: 5px 7px;
  font-size: 8.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
}
table.items thead th:first-child { border-radius: 4px 0 0 0; }
table.items thead th:last-child { border-radius: 0 4px 0 0; }
table.items td { padding: 5px 7px; border-bottom: 1px solid #f0f0f0; font-size: 10px; }
table.items tbody tr:last-child td { border-bottom: none; }
.bottom { display: flex; gap: 12px; margin-top: 4px; }
.notes-block {
  flex: 1; border: 1px solid #e5e7eb; border-radius: 5px; padding: 8px 10px;
  min-height: 70px;
}
.notes-block strong { font-size: 8.5px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
.notes-block p { font-size: 9px; color: #666; margin-top: 4px; line-height: 1.5; }
.totals { width: 200px; }
.totals table { width: 100%; border-collapse: collapse; }
.totals td { padding: 3.5px 6px; font-size: 10px; }
.totals td:last-child { text-align: right; font-weight: 600; }
.totals .total-row td {
  padding: 6px; font-size: 13px; font-weight: 800;
  background: #0D9488; color: #fff; border-radius: 3px;
}
.status-badge {
  margin-top: 8px; text-align: center; padding: 4px;
  border-radius: 3px; font-size: 9px; font-weight: 700; letter-spacing: 1px;
  border: 1.5px solid #0D9488; color: #0D9488;
}
.status-badge.partial { border-color: #f59e0b; color: #f59e0b; background: #fffbeb; }
.divider { border: none; border-top: 1px dashed #d1d5db; margin: 6px 0; }
.footer { margin-top: 10px; padding-top: 6px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 8px; color: #9ca3af; }
</style>
</head>
<body>

<div class="header">
  <div class="brand">
    ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="">` : ""}
    <div>
      <div class="brand-name">FARAZ PHARMACY</div>
      <div class="brand-sub">Quality Care For Everyone</div>
      <div class="brand-addr">Barikot, Swat KPK</div>
    </div>
  </div>
  <div class="badge">
    <h2>INVOICE</h2>
    <div class="badge-id">#${sale.id ? sale.id.slice(0, 8) : "000000"}</div>
  </div>
</div>

<div class="info-row">
  <div class="info-block">
    <div class="info-block-title">Customer</div>
    <p><strong>${sale.customer_name || "Walk-in Customer"}</strong></p>
    <p>${sale.customer_phone || ""}</p>
  </div>
  <div class="info-block">
    <div class="info-block-title">Invoice Details</div>
    <p><span class="label">Date:</span> ${dateStr}</p>
    <p><span class="label">Status:</span> ${sale.status || "Paid"}</p>
    <p><span class="label">Items:</span> ${items.length} (${totalQty} units)</p>
  </div>
</div>

<table class="items">
  <thead>
    <tr>
      <th style="width:55%">Product</th>
      <th style="width:15%;text-align:center">Qty</th>
      <th style="width:15%;text-align:right">Rate</th>
      <th style="width:15%;text-align:right">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${items.map(item => {
      const unitPrice = item.unit_price || (item.subtotal / item.quantity);
      return `<tr>
        <td>${item.product_name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${Math.round(unitPrice)}</td>
        <td style="text-align:right">${item.subtotal.toFixed(0)}</td>
      </tr>`;
    }).join("")}
  </tbody>
</table>

<hr class="divider">

<div class="bottom">
  <div class="notes-block">
    <strong>Notes</strong>
    <p>Please keep this invoice for returns, replacement or future reference.</p>
    <p>No return without receipt &bull; No return after 3 days &bull; No return of freezer/refrigerator medicines</p>
  </div>
  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td>${sale.subtotal ? sale.subtotal.toFixed(0) : "0"}</td></tr>
      ${sale.discount > 0 ? `<tr><td>Discount</td><td>-${sale.discount.toFixed(0)}</td></tr>` : ""}
      <tr class="total-row"><td>Total</td><td>${(sale.total || 0).toFixed(0)}</td></tr>
      <tr><td>Paid</td><td>${(sale.amount_paid || 0).toFixed(0)}</td></tr>
      <tr><td>Change</td><td>${Math.max(0, (sale.amount_paid || 0) - (sale.total || 0)).toFixed(0)}</td></tr>
      <tr><td>Arrears</td><td>${(sale.customer_total_arrears || 0).toFixed(0)}</td></tr>
    </table>
    ${sale.status === "partial"
      ? '<div class="status-badge partial">PARTIAL PAYMENT</div>'
      : '<div class="status-badge">PAID</div>'}
  </div>
</div>

<div class="footer">Thank you for choosing Faraz Pharmacy &bull; Powered by FarSight System</div>
</body>
</html>`;
}

function generateReturnReceiptHTML(returnData, sale, paperSize) {
  const items = returnData.items || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isThermal = paperSize === "thermal";
  const pageCSS = isThermal
    ? "@page { margin: 0; size: 80mm 297mm; }"
    : "@page { margin: 5mm; size: A5; }";

  const baseStyle = isThermal
    ? `body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; padding: 4mm 3mm; line-height: 1.3; } .receipt { width: 100%; }`
    : `body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #000; }`;

  const itemsHTML = items
    .map((i) => {
      const reasonStr = i.reason ? ` (${i.reason})` : "";
      const amt = i.refund_amount ?? i.subtotal ?? 0;
      return `<tr><td>${i.product_name} × ${i.quantity}${reasonStr}</td><td style="text-align:right">${amt.toFixed(0)}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
${pageCSS}
* { margin: 0; padding: 0; box-sizing: border-box; }
${isThermal ? "html, body { height: 100%; }" : ""}
${baseStyle}
h1 { text-align: center; margin-bottom: 4px; font-size: ${isThermal ? "20px" : "20px"}; letter-spacing: 1px; font-weight: 800; }
.sub { text-align: center; font-size: ${isThermal ? "10px" : "11px"}; margin-bottom: 6px; color: #333; font-weight: 600; }
.badge { text-align: center; font-size: ${isThermal ? "13px" : "14px"}; font-weight: 800; color: #c00; margin: 6px 0; letter-spacing: 1px; }
hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
hr.dashed { border-top: 1px dashed #888; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th { text-align: left; font-size: 11px; border-bottom: 1px solid #000; padding: 3px 0; font-weight: 700; }
td { font-size: ${isThermal ? "11px" : "13px"}; padding: 2px 0; font-weight: 600; }
td:last-child { text-align: right; }
.big td { font-weight: 800; font-size: ${isThermal ? "13px" : "15px"}; padding-top: 4px; border-top: 1px solid #000; }
.ftr { text-align: center; font-size: ${isThermal ? "10px" : "11px"}; margin-top: 6px; color: #555; font-weight: 600; }
</style></head><body>
<div class="receipt">
<h1>FARAZ PHARMACY</h1>
<p class="sub">${dateStr}</p>
<p class="badge">** RETURN RECEIPT **</p>
<p class="sub">Sale: ${sale?.id?.slice(0, 8) || "N/A"}</p>
<hr>
<table>
<thead><tr><th>Item</th><th style="text-align:right">Refund</th></tr></thead>
<tbody>${itemsHTML}</tbody>
</table>
<hr class="dashed">
<table>
<tr class="big"><td>Total Refund</td><td style="text-align:right">${returnData.refund_amount.toFixed(0)}</td></tr>
</table>
<p class="sub" style="margin-top:6px">Reason: ${returnData.reason}</p>
<hr>
<p class="ftr">Return processed successfully</p>
<p class="ftr">--- Powered by Faraz Pharmacy ---</p>
</div>
</body></html>`;
}

function getPrintOptions(printerConfig) {
  const paperSize = printerConfig?.paperSize || "thermal";
  const opts = {
    silent: true,
    printBackground: true,
    deviceName: printerConfig?.deviceName || undefined,
  };

  const margins = printerConfig?.margins;

  if (paperSize === "thermal") {
    opts.pageSize = { width: 80000, height: 297000 };
    opts.margins = { marginType: "none" };
  } else if (paperSize === "a4") {
    opts.pageSize = "A4";
    if (margins) {
      opts.margins = {
        marginType: "custom",
        top: margins.top,
        bottom: margins.bottom,
        left: margins.left,
        right: margins.right,
      };
    } else {
      opts.margins = { marginType: "printableArea" };
    }
  } else if (paperSize === "a5") {
    opts.pageSize = "A5";
    if (margins) {
      opts.margins = {
        marginType: "custom",
        top: margins.top,
        bottom: margins.bottom,
        left: margins.left,
        right: margins.right,
      };
    } else {
      opts.margins = { marginType: "printableArea" };
    }
  }

  return opts;
}

function escposInit() {
  return Buffer.from([0x1b, 0x40]);
}

function escposAlign(n) {
  return Buffer.from([0x1b, 0x61, n]);
}

function escposBold(n) {
  return Buffer.from([0x1b, 0x45, n]);
}

function escposCut(full) {
  return Buffer.from([0x1d, 0x56, full ? 0x00 : 0x01]);
}

function escposText(str) {
  const safe = String(str).replace(/[^\x00-\xFF]/g, "");
  return Buffer.from(safe + "\r\n", "latin1");
}

function escposTextUTF8(str) {
  const safe = String(str).replace(/[^\x00-\xFF]/g, "");
  return Buffer.from(safe + "\r\n", "utf8");
}

function escposCodePage(n) {
  return Buffer.from([0x1b, 0x74, n]);
}

function escposFont(n) {
  return Buffer.from([0x1b, 0x4d, n]);
}

function escposCharSize(h, w) {
  return Buffer.from([0x1d, 0x21, (h << 4) | w]);
}

function escposLine(char, len) {
  return Buffer.from(char.repeat(len) + "\r\n", "latin1");
}

function escposFeed(n) {
  return Buffer.from("\r\n".repeat(n), "latin1");
}

function generateESCPOSReceipt(sale) {
  const items = sale.items || [];
  const now = new Date();
  const totalAmount = sale.total || 0;
  const paidAmount = sale.amount_paid || 0;
  const changeDue = sale.change || 0;
  const discount = sale.discount || 0;
  const balance = Math.max(0, totalAmount - paidAmount);
  const L = 48;
  const parts = [];

  parts.push(escposInit());
  parts.push(escposCodePage(2));
  parts.push(escposAlign(1));
  parts.push(escposBold(1));
  parts.push(escposCharSize(1, 0));
  parts.push(escposText("Faraz Medical Store"));
  parts.push(escposCharSize(0, 0));
  parts.push(escposBold(0));
  parts.push(escposText("Beside Noman Clinical Laboratory"));
  parts.push(escposText("Barikot, Swat"));
  parts.push(escposLine("=", L));
  parts.push(escposAlign(0));

  const dateStr = now.toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  parts.push(escposText("Date:      " + dateStr));
  parts.push(escposText("Invoice:   " + (sale.id || "")));
  parts.push(escposText("Customer:  " + (sale.customer_name || "Walk-in Customer")));
  parts.push(escposLine("-", L));

  const colName = 22;
  const colQty = 4;
  const colUnit = 7;
  const colAmt = 10;
  const colPad = colName + colQty + colUnit;
  parts.push(escposText(
    "Item".padEnd(colName) + "Qty".padStart(colQty) +
    "Rate".padStart(colUnit) + "Amt".padStart(colAmt)
  ));
  parts.push(escposLine("-", L));

  items.forEach((item) => {
    const name = (item.product_name || "").padEnd(colName).slice(0, colName);
    const qty = String(item.quantity).padStart(colQty);
    const unitPrice = String(Math.round(item.subtotal / item.quantity)).padStart(colUnit);
    const amount = String(item.subtotal.toFixed(0)).padStart(colAmt);
    parts.push(escposText(name + qty + unitPrice + amount));
  });

  parts.push(escposLine("-", L));

  function addLine(label, valueStr, isBold) {
    const line = label.padEnd(colPad) + valueStr.padStart(colAmt);
    if (isBold) parts.push(escposBold(1));
    parts.push(escposText(line));
    if (isBold) parts.push(escposBold(0));
  }

  addLine("Subtotal", totalAmount.toFixed(0));
  if (discount > 0) addLine("Discount", "-" + discount.toFixed(0));
  addLine("Total", totalAmount.toFixed(0), true);
  addLine("Paid", paidAmount.toFixed(0));
  if (balance > 0) addLine("Balance", balance.toFixed(0));
  else if (changeDue > 0) addLine("Change", changeDue.toFixed(0));
  parts.push(escposLine("=", L));

  if (sale.status === "partial") {
    parts.push(escposAlign(1));
    parts.push(escposBold(1));
    parts.push(escposText("** PARTIAL PAYMENT **"));
    parts.push(escposBold(0));
    parts.push(escposAlign(0));
  }

  parts.push(escposAlign(1));
  parts.push(escposFeed(1));
  parts.push(escposText("Thank You For Your Visit!"));
  parts.push(escposFeed(3));
  parts.push(escposCut(true));

  return Buffer.concat(parts);
}

function generateESCPOSReturnReceipt(returnData, sale) {
  const items = returnData.items || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const L = 56;
  const parts = [];

  parts.push(escposInit());
  parts.push(escposFont(1));
  parts.push(escposAlign(1));
  parts.push(escposBold(1));
  parts.push(escposCharSize(1, 0));
  parts.push(escposText("FARAZ PHARMACY"));
  parts.push(escposCharSize(0, 0));
  parts.push(escposBold(0));
  parts.push(escposText(dateStr));
  parts.push(escposLine("=", L));
  parts.push(escposBold(1));
  parts.push(escposText("** RETURN RECEIPT **"));
  parts.push(escposBold(0));
  parts.push(escposText("Sale: " + (sale?.id?.slice(0, 8) || "N/A")));
  parts.push(escposLine("-", L));
  parts.push(escposAlign(0));
  const colName = 44;
  const colAmt = 12;
  parts.push(
    escposText("Item description".padEnd(colName) + "Refund".padStart(colAmt)),
  );
  parts.push(escposLine("-", L));

  items.forEach((i) => {
    const reasonStr = i.reason ? " (" + i.reason + ")" : "";
    const name = (i.product_name + " x" + i.quantity + reasonStr)
      .padEnd(colName)
      .slice(0, colName);
    const amt = String(
      (i.refund_amount ?? i.subtotal ?? 0).toFixed(0),
    ).padStart(colAmt);
    parts.push(escposText(name + amt));
  });

  parts.push(escposLine("-", L));
  parts.push(escposBold(1));
  const totalLabel = "Total Refund".padEnd(colName);
  const totalVal = returnData.refund_amount.toFixed(0).padStart(colAmt);
  parts.push(escposText(totalLabel + totalVal));
  parts.push(escposBold(0));
  parts.push(escposText("Reason: " + returnData.reason));
  parts.push(escposLine("=", L));
  parts.push(escposAlign(1));
  parts.push(escposText("Return processed successfully"));
  parts.push(escposFeed(3));
  parts.push(escposCut(true));

  return Buffer.concat(parts);
}

function findBulkOutEndpoint(iface) {
  const eps = iface.endpoints;
  if (eps) {
    for (const ep of eps) {
      if (ep.direction === "out" && ep.type === "bulk") {
        return ep.address;
      }
    }
  }
  return null;
}

function isPrinterInterface(iface) {
  try {
    const alt = iface.alternate;
    if (!alt) return false;
    const ifClass = alt.interfaceClass;
    if (ifClass === 7) return true;
    if (ifClass === 0xff) {
      const eps = alt.endpoints || [];
      return eps.some(ep => ep.direction === "out" && ep.type === "bulk");
    }
    return false;
  } catch {
    return false;
  }
}

async function findUSBPrinter(options = {}) {
  const { excludeVendorId } = options;
  const devices = await usb.getDevices();
  for (const d of devices) {
    try {
      if (excludeVendorId && d.vendorId === excludeVendorId) continue;
      const cfgs = d.configurations;
      if (!cfgs || cfgs.length === 0) continue;
      for (const cfg of cfgs) {
        for (let i = 0; i < cfg.interfaces.length; i++) {
          const iface = cfg.interfaces[i];
          if (!isPrinterInterface(iface)) continue;
          const ep = findBulkOutEndpoint(iface);
          if (ep !== null) {
            return { device: d, interfaceNum: i, endpoint: ep };
          }
        }
      }
    } catch (_) {}
  }
  return null;
}

async function doUSBPrint(dataBuffer) {
  const result = await findUSBPrinter({ excludeVendorId: ZEBRA_VENDOR_ID });
  if (!result) {
    console.error("doUSBPrint: No USB printer found (excluding Zebra)");
    throw new Error("No USB printer found. Check connection and power.");
  }
  const { device, interfaceNum, endpoint } = result;
  const printerName = safeProductName(device);
  console.log(
    `doUSBPrint: Found device "${printerName}" interface=${interfaceNum} endpoint=${endpoint} bufferSize=${dataBuffer.length}`,
  );

  await device.open();
  console.log("doUSBPrint: device opened");
  try {
    await device.detachKernelDriver(interfaceNum);
    console.log("doUSBPrint: detachKernelDriver OK");
  } catch (_) {
    console.log("doUSBPrint: detachKernelDriver skipped");
  }
  await device.claimInterface(interfaceNum);
  console.log("doUSBPrint: interface claimed");
  try {
    const writeResult = await device.transferOut(endpoint, dataBuffer);
    console.log("doUSBPrint: transferOut status:", writeResult.status);
    if (writeResult.status !== "ok") {
      throw new Error("USB write failed: " + writeResult.status);
    }
  } finally {
    try {
      await device.releaseInterface(interfaceNum);
      console.log("doUSBPrint: interface released");
    } catch (_) {
      console.log("doUSBPrint: releaseInterface skipped");
    }
    try {
      device.close();
      console.log("doUSBPrint: device closed");
    } catch (_) {
      console.log("doUSBPrint: close skipped");
    }
  }
}

const ZEBRA_VENDOR_ID = 0x0a5f;

async function findZebraPrinter() {
  const devices = await usb.getDevices();
  for (const d of devices) {
    try {
      if (d.vendorId !== ZEBRA_VENDOR_ID) continue;
      const cfgs = d.configurations;
      if (!cfgs || cfgs.length === 0) continue;
      for (const cfg of cfgs) {
        for (let i = 0; i < cfg.interfaces.length; i++) {
          const iface = cfg.interfaces[i];
          if (!isPrinterInterface(iface)) continue;
          const ep = findBulkOutEndpoint(iface);
          if (ep !== null) return { device: d, interfaceNum: i, endpoint: ep };
        }
      }
    } catch (_) {}
  }
  return null;
}

async function doUSBZPLPrint(dataBuffer) {
  const result = await findZebraPrinter();
  if (!result) {
    throw new Error("No Zebra printer found. Check connection and power.");
  }
  const { device, interfaceNum, endpoint } = result;
  await device.open();
  try {
    await device.detachKernelDriver(interfaceNum);
  } catch (_) {}
  await device.claimInterface(interfaceNum);
  try {
    const transferResult = await device.transferOut(endpoint, dataBuffer);
    if (transferResult.status !== "ok") {
      throw new Error("Zebra USB write failed: " + transferResult.status);
    }
  } finally {
    try {
      await device.releaseInterface(interfaceNum);
    } catch (_) {}
    try {
      device.close();
    } catch (_) {}
  }
}

function generateZPLBarcode(barcode, copies, labelWidth, labelHeight) {
  const pw = labelWidth || 203;
  const ll = labelHeight || 102;
  const labels = [];
  for (let i = 0; i < copies; i++) {
    labels.push(`^XA
^PW${pw}
^LL${ll}
^FO5,5
^BY2
^BEN,60,Y,N,N
^FD${barcode}
^FS
^XZ`);
  }
  return Buffer.from(labels.join(""), "latin1");
}

async function printBarcodeLabel(barcode, copies, labelWidth, labelHeight) {
  const data = generateZPLBarcode(
    barcode,
    copies || 1,
    labelWidth,
    labelHeight,
  );
  await doUSBZPLPrint(data);
}

function generateHTML(sale, paperSize) {
  if (paperSize === "a4") return generateA4InvoiceHTML(sale);
  if (paperSize === "a5") return generateA5InvoiceHTML(sale);
  return generateSaleReceiptHTML(sale);
}

function writeTempFile(content, ext) {
  const tmpDir = app.getPath("temp");
  const filePath = path.join(tmpDir, `faraz-receipt-${Date.now()}.${ext}`);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

function doPrintJob(data, printerConfig) {
  const paperSize = printerConfig?.paperSize || "thermal";

  if (paperSize === "thermal") {
    return doUSBPrint(data);
  }

  return new Promise((resolve, reject) => {
    const filePath = writeTempFile(data, "html");

    const printWin = new BrowserWindow({
      width: paperSize === "a4" ? 800 : paperSize === "thermal" ? 350 : 600,
      height: 600,
      show: false,
      paintWhenReady: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
      },
    });

    let resolved = false;

    function cleanup() {
      resolved = true;
      try {
        printWin.close();
      } catch (_) {}
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }

    function doPrint() {
      if (resolved) return;
      try {
        printWin.webContents.print(
          getPrintOptions(printerConfig),
          (success) => {
            if (resolved) return;
            if (!success) {
              cleanup();
              return reject(new Error("Print failed or cancelled"));
            }
            cleanup();
            resolve();
          },
        );
      } catch (e) {
        cleanup();
        reject(e);
      }
    }

    printWin.webContents.on("did-finish-load", doPrint);
    printWin.webContents.on("did-fail-load", (_, code, desc) => {
      if (resolved) return;
      cleanup();
      reject(new Error(`Failed to load receipt: ${desc} (${code})`));
    });

    printWin.loadURL(`file://${filePath.replace(/\\/g, "/")}`);

    setTimeout(() => {
      if (!resolved) {
        cleanup();
        reject(new Error("Print timeout"));
      }
    }, 15000);
  });
}

function printReceipt(sale, printerConfig) {
  const paperSize = printerConfig?.paperSize || "thermal";
  console.log(
    `printReceipt: paperSize=${paperSize} items=${(sale.items || []).length} total=${sale.total}`,
  );
  if (paperSize === "thermal") {
    const data = generateESCPOSReceipt(sale);
    console.log(`printReceipt: generated ESC/POS data length=${data.length}`);
    return doPrintJob(data, printerConfig);
  }
  const html = generateHTML(sale, paperSize);
  console.log(`printReceipt: generated HTML length=${html.length}`);
  return doPrintJob(html, printerConfig);
}

function printReturnReceipt(returnData, sale, printerConfig) {
  const paperSize = printerConfig?.paperSize || "thermal";
  if (paperSize === "thermal") {
    const data = generateESCPOSReturnReceipt(returnData, sale);
    return doPrintJob(data, printerConfig);
  }
  const html = generateReturnReceiptHTML(returnData, sale, paperSize);
  return doPrintJob(html, printerConfig);
}

async function listUSBPrinters() {
  const devices = await usb.getDevices();
  const printers = [];
  for (const d of devices) {
    try {
      const cfgs = d.configurations;
      if (!cfgs || cfgs.length === 0) continue;
      let found = false;
      for (const cfg of cfgs) {
        for (const iface of cfg.interfaces) {
          if (isPrinterInterface(iface)) {
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) continue;
      printers.push({
        vendorId: d.vendorId,
        productId: d.productId,
        productName: safeProductName(d),
        serialNumber: safeSerial(d),
      });
    } catch (_) {}
  }
  return printers;
}

export { printReceipt, printReturnReceipt, printBarcodeLabel, listUSBPrinters, generateHTML, generateReturnReceiptHTML };
