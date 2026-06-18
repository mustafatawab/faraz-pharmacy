const { BrowserWindow, app } = require("electron");
const path = require("path");
const fs = require("fs");

const logoPath = `file://${path.join(__dirname, "image", "logo.png").replace(/\\/g, "/")}`;



function generateSaleReceiptHTML(sale) {

  const items = sale.items || [];

  const now = new Date();

  const dateStr = now.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const totalAmount = sale.total || 0;
  const paid = sale.amount_paid || 0;
  const balance = Math.max(0, totalAmount - paid);
  const customerArrears = sale.customer_total_arrears || 0;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<style>
@page { size: 80mm auto; margin: 0; }

body {
  width: 80mm;
            font-family: 'Arial', sans-serif;
            font-size: 13px;
            margin: 0;
            padding: 5mm;
            color: #000;
}

.center { text-align: center; }
.header { font-weight: bold; font-size: 18px; }
.small { font-size: 14px; }

.divider { border-top: 1px dashed #000; margin: 8px 0; }

table { width: 100%; border-collapse: collapse; }

th {
  border-bottom: 1px solid #000;
  text-align: left;
  font-size: 14px;
}

td { padding: 2px 0;
 font-size: 14px; }

.text-right { text-align: right; }

.total-box {
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
  font-weight: bold;
  font-size: 14px;
}

.urdu {
  direction: rtl;
  font-family: Arial, sans-serif;
  font-size: 13px;
}
</style>

</head>

<body>

<div class="center">
  <div class="header">FARAZ PHARMACY</div>
  <div class="small">Beside Noman Clinical Laboratory, Barikot</div>
  <div class="small">Phone: 03469383792 / 03449006940</div>
</div>

<div class="divider"></div>

<div>Invoice #: ${sale.id || Math.floor(Math.random() * 100000)}</div>
<div>Date: ${dateStr}</div>
<div>Customer: ${sale.customer_name || "Walk-in Customer"}</div>
<div>No. of items: ${items.length}</div>

<div class="divider"></div>

<table>
  <thead>
    <tr>
      <th>Product</th>
      <th>Qty</th>
      <th class="text-right">Amount</th>
    </tr>
  </thead>

  <tbody>
    ${items.map(item => `
      <tr>
        <td>${item.product_name}</td>
        <td>${item.quantity}</td>
        <td class="text-right">${item.subtotal.toFixed(0)}</td>
      </tr>
    `).join("")}
  </tbody>
</table>

<div class="divider"></div>

<table>
  <tr>
    <td>Subtotal</td>
    <td class="text-right">${sale.subtotal.toFixed(0)}</td>
  </tr>

  ${sale.discount > 0 ? `
  <tr>
    <td>Discount</td>
    <td class="text-right">-${sale.discount.toFixed(0)}</td>
  </tr>` : ""}

  <tr class="total-box">
    <td>TOTAL</td>
    <td class="text-right">${totalAmount.toFixed(0)}</td>
  </tr>

  <tr>
    <td>Paid</td>
    <td class="text-right">${paid.toFixed(0)}</td>
  </tr>

  <tr>
    <td>Balance</td>
    <td class="text-right">${balance.toFixed(0)}</td>
  </tr>

  <tr>
    <td>Arrears</td>
    <td class="text-right">${customerArrears.toFixed(0)}</td>
  </tr>
</table>

<div class="divider"></div>

<table>
  <tr>
    <td class="urdu">
      <b>ضروری نوٹ</b><br>
      - رسید کے بغیر کوئی واپسی نہیں<br>
      - دوائیوں کی واپسی ممکن نہیں<br>
      - 3 دن بعد کوئی واپسی نہیں
    </td>
  </tr>
</table>

<div class="divider"></div>

<div class="center">
  <b>
  Developed By farsightsystem.com
  </b>
</div>

<div class="divider"></div>

<div class="center small">
  THANK YOU FOR YOUR VISIT<br>
</div>

</body>
</html>`;
}


function generateA4InvoiceHTML(sale) {
  const items = sale.items || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@page { margin: 10mm; size: A4; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #000; padding: 0; }
.header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
.header h1 { font-size: 24px; letter-spacing: 2px; }
.header p { font-size: 11px; color: #555; margin-top: 4px; }
.info { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; }
.info div { width: 48%; }
.info .lbl { color: #888; }
table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
th { background: #f0f0f0; text-align: left; padding: 8px 6px; font-size: 10px; border-bottom: 2px solid #000; }
td { padding: 6px; font-size: 11px; border-bottom: 1px solid #ddd; }
td:last-child, th:last-child { text-align: right; }
td:nth-child(2) { text-align: center; }
.totals { width: 300px; margin-left: auto; }
.totals td { padding: 4px 6px; border: none; }
.totals .big td { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 6px; }
.footer { text-align: center; font-size: 10px; color: #888; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 10px; }
</style></head><body>
<div class="header">
<h1>FARAZ PHARMACY</h1>
<p>Your Trusted Pharmacy &mdash; Quality Care for Everyone</p>
</div>
<div class="info">
<div><span class="lbl">Invoice:</span> ${sale.id || "N/A"}<br><span class="lbl">Date:</span> ${dateStr}</div>
<div style="text-align:right">${sale.customer_name ? `<span class="lbl">Customer:</span> ${sale.customer_name}` : ""}</div>
</div>
<table>
<thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
<tbody>${items.map(i => `<tr><td>${i.product_name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${(i.subtotal / i.quantity).toFixed(0)}</td><td style="text-align:right">${i.subtotal.toFixed(0)}</td></tr>`).join("")}</tbody>
</table>
<table class="totals">
<tr><td>Subtotal</td><td style="text-align:right">${sale.subtotal.toFixed(0)}</td></tr>
${sale.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${sale.discount.toFixed(0)}</td></tr>` : ""}
<tr class="big"><td>Total</td><td style="text-align:right">${sale.total.toFixed(0)}</td></tr>
<tr><td>Paid</td><td style="text-align:right">${sale.amount_paid.toFixed(0)}</td></tr>
<tr><td>Change</td><td style="text-align:right">${Math.max(0, sale.amount_paid - sale.total).toFixed(0)}</td></tr>
<tr><td>Arrears</td><td style="text-align:right">${(sale.customer_total_arrears || 0).toFixed(0)}</td></tr>
</table>
${sale.status === "partial" ? '<p style="color:#888;text-align:center;font-size:11px">Partial Payment</p>' : ""}
<div class="footer"><p>Thank you for your visit! &bull; Powered by Faraz Pharmacy</p></div>
</body></html>`;
}

// function generateA5InvoiceHTML(sale) {
//   const items = sale.items || [];
//   const now = new Date();
//   const dateStr = now.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

//   return `<!DOCTYPE html>
// <html><head><meta charset="utf-8">
// <style>
// @page { margin: 5mm; size: A5; }
// * { margin: 0; padding: 0; box-sizing: border-box; }
// body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #000; padding: 0; }
// .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 8px; }
// .header h1 { font-size: 18px; letter-spacing: 1px; }
// .header p { font-size: 10px; color: #555; margin-top: 2px; }
// .info { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 10px; }
// table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
// th { background: #f0f0f0; text-align: left; padding: 5px; font-size: 9px; border-bottom: 2px solid #000; }
// td { padding: 4px 5px; font-size: 10px; border-bottom: 1px solid #ddd; }
// td:last-child, th:last-child { text-align: right; }
// .totals { width: 250px; margin-left: auto; }
// .totals td { padding: 3px 5px; border: none; }
// .totals .big td { font-weight: bold; font-size: 12px; border-top: 2px solid #000; padding-top: 5px; }
// .footer { text-align: center; font-size: 9px; color: #888; margin-top: 15px; border-top: 1px solid #ddd; padding-top: 6px; }
// </style></head><body>
// <div class="header">
// <h1>FARAZ PHARMACY</h1>
// <p>Quality Care for Everyone</p>
// </div>
// <div class="info">
// <div>Invoice: ${sale.id ? sale.id.slice(0, 8) : "N/A"}<br>${dateStr}</div>
// <div style="text-align:right">${sale.customer_name ? `Customer: ${sale.customer_name}` : ""}</div>
// </div>
// <table>
// <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr></thead>
// <tbody>${items.map(i => `<tr><td>${i.product_name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${i.subtotal.toFixed(0)}</td></tr>`).join("")}</tbody>
// </table>
// <table class="totals">
// <tr><td>Subtotal</td><td style="text-align:right">${sale.subtotal.toFixed(0)}</td></tr>
// ${sale.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${sale.discount.toFixed(0)}</td></tr>` : ""}
// <tr class="big"><td>Total</td><td style="text-align:right">${sale.total.toFixed(0)}</td></tr>
// <tr><td>Paid</td><td style="text-align:right">${sale.amount_paid.toFixed(0)}</td></tr>
// <tr><td>Change</td><td style="text-align:right">${Math.max(0, sale.amount_paid - sale.total).toFixed(0)}</td></tr>
// </table>
// ${sale.status === "partial" ? '<p style="color:#888;text-align:center;font-size:10px">Partial Payment</p>' : ""}
// <div class="footer"><p>Thank you &bull; Powered by Faraz Pharmacy</p></div>
// </body></html>`;
// }

function generateA5InvoiceHTML(sale) {
  const items = sale.items || [];

  const now = new Date();

  const dateStr = now.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<style>

@page{
  size:A5 portrait;
  margin:8mm;
}

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  font-family:'Segoe UI',Arial,sans-serif;
  color:#222;
  background:#fff;
  font-size:12px;
}

.invoice{
  width:100%;
}

/* ===================================
   HEADER
=================================== */

.header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  border-bottom:3px solid #111;
  padding-bottom:12px;
  margin-bottom:15px;
}

.company-info{
  display:flex;
  align-items:center;
  gap:12px;
}

.logo{
  width:70px;
  height:70px;
  object-fit:contain;
}

.company-info h1{
  font-size:20px;
  margin-bottom:4px;
}

.company p{
  color:#666;
  margin-top:4px;
  font-size:11px;
}

.invoice-badge{
  text-align:right;
}

.invoice-badge h2{
  font-size:22px;
  font-weight:800;
}

.invoice-no{
  margin-top:6px;
  background:#111;
  color:#fff;
  padding:6px 10px;
  border-radius:4px;
  font-size:11px;
}

/* ===================================
   INFO SECTION
=================================== */

.info-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
  margin-bottom:18px;
}

.card{
  border:1px solid #ddd;
  border-radius:8px;
  padding:10px;
}

.card-title{
  font-size:10px;
  font-weight:700;
  color:#777;
  margin-bottom:6px;
  text-transform:uppercase;
}

.card p{
  margin:2px 0;
}

/* ===================================
   TABLE
=================================== */

.items{
  width:100%;
  border-collapse:collapse;
  margin-bottom:15px;
}

.items thead th{
  background:#111;
  color:#fff;
  padding:8px;
  font-size:11px;
  font-weight:600;
}

.items td{
  padding:8px;
  border-bottom:1px solid #e6e6e6;
}

.items tbody tr:nth-child(even){
  background:#fafafa;
}

.text-center{
  text-align:center;
}

.text-right{
  text-align:right;
}

/* ===================================
   TOTAL SECTION
=================================== */

.bottom{
  display:flex;
  justify-content:space-between;
  gap:15px;
  margin-top:10px;
}

.notes{
  flex:1;
}

.notes-box{
  border:1px solid #ddd;
  border-radius:8px;
  padding:10px;
  min-height:100px;
}

.summary{
  width:220px;
}

.summary table{
  width:100%;
  border-collapse:collapse;
}

.summary td{
  padding:6px;
}

.summary td:last-child{
  text-align:right;
}

.grand-total{
  background:#111;
  color:#fff;
  font-size:18px;
  font-weight:700;
}

.grand-total td{
  padding:10px;
}

/* ===================================
   STATUS
=================================== */

.status{
  margin-top:12px;
  text-align:center;
  padding:8px;
  border-radius:6px;
  font-weight:700;
  letter-spacing:1px;
  border:1px solid #111;
}

.status.partial{
  background:#f3f3f3;
}

/* ===================================
   SIGNATURE
=================================== */

.signature{
  margin-top:30px;
  display:flex;
  justify-content:flex-end;
}

.signature-box{
  width:180px;
  text-align:center;
}

.signature-line{
  border-top:1px solid #000;
  margin-top:35px;
  padding-top:5px;
  font-size:11px;
}

/* ===================================
   FOOTER
=================================== */

.footer{
  margin-top:25px;
  border-top:1px solid #ddd;
  padding-top:8px;
  text-align:center;
  color:#777;
  font-size:10px;
}

</style>
</head>

<body>

<div class="invoice">

  <!-- HEADER -->

  <div class="header">

   
  <div class="company-info">

    <img src="/image/logo.png" class="logo">

    <div>
      <h1>FARAZ PHARMACY</h1>
      <p>Quality Care For Everyone</p>
      <p>Barikot, Swat KPK</p>
    </div>

  </div>

    <div class="invoice-badge">
      <h2>INVOICE</h2>

      <div class="invoice-no">
        #${sale.id ? sale.id.slice(0,8) : "000000"}
      </div>
    </div>

  </div>

  <!-- CUSTOMER & INVOICE INFO -->

  <div class="info-grid">

    <div class="card">
      <div class="card-title">Customer</div>

      <p><strong>${sale.customer_name || "Walk-in Customer"}</strong></p>
      <p>${sale.customer_phone || ""}</p>
    </div>

    <div class="card">
      <div class="card-title">Invoice Details</div>

      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Status:</strong> ${sale.status || "Paid"}</p>
    </div>

  </div>

  <!-- ITEMS -->

  <table class="items">

    <thead>
      <tr>
        <th>Product</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>

    <tbody>

      ${items.map(item => `
      <tr>
        <td>${item.product_name}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">Rs ${item.subtotal.toFixed(0)}</td>
      </tr>
      `).join("")}

    </tbody>

  </table>

  <!-- BOTTOM -->

  <div class="bottom">

    <div class="notes">

      <div class="notes-box">

        <strong>Notes</strong>

        <p style="margin-top:8px;color:#666;">
          Please keep this invoice for Returned,
          replacement or future reference.
        </p>

      </div>

    </div>

    <div class="summary">

      <table>

        <tr>
          <td>Subtotal</td>
          <td>Rs ${sale.subtotal.toFixed(0)}</td>
        </tr>

        ${sale.discount > 0 ? `
        <tr>
          <td>Discount</td>
          <td>- Rs ${sale.discount.toFixed(0)}</td>
        </tr>
        ` : ""}

        <tr class="grand-total">
          <td>Total</td>
          <td>Rs ${sale.total.toFixed(0)}</td>
        </tr>

        <tr>
          <td>Paid</td>
          <td>Rs ${sale.amount_paid.toFixed(0)}</td>
        </tr>

        <tr>
          <td>Change</td>
          <td>Rs ${Math.max(
            0,
            sale.amount_paid - sale.total
          ).toFixed(0)}</td>
        </tr>

        <tr>
          <td>Arrears</td>
          <td>Rs ${(sale.customer_total_arrears || 0).toFixed(0)}</td>
        </tr>

      </table>

      ${
        sale.status === "partial"
        ? `<div class="status partial">PARTIAL PAYMENT</div>`
        : `<div class="status">PAID</div>`
      }

    </div>

  </div>

  <!-- SIGNATURE -->

  <div class="signature">

    <div class="signature-box">
      <div class="signature-line">
        Authorized Signature
      </div>
    </div>

  </div>

  <!-- FOOTER -->

  <div class="footer">
    Thank you for choosing Faraz Pharmacy • Powered by FarSight System
  </div>

</div>

</body>
</html>
`;
}

function generateReturnReceiptHTML(returnData, sale, paperSize) {
  const items = returnData.items || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const isThermal = paperSize === "thermal";
  const pageCSS = isThermal
    ? "@page { margin: 0; size: 80mm 297mm; }"
    : "@page { margin: 5mm; size: A5; }";

  const baseStyle = isThermal
    ? `body { font-family: 'Courier New', 'Consolas', monospace; font-size: 14px; color: #000; display: flex; flex-direction: column; align-items: center; } .receipt { width: 72mm; }`
    : `body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #000; }`;

  const itemsHTML = items.map(i => {
    const reasonStr = i.reason ? ` (${i.reason})` : "";
    const amt = i.refund_amount ?? i.subtotal ?? 0;
    return `<tr><td>${i.product_name} × ${i.quantity}${reasonStr}</td><td style="text-align:right">${amt.toFixed(0)}</td></tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
${pageCSS}
* { margin: 0; padding: 0; box-sizing: border-box; }
${isThermal ? "html, body { height: 100%; }" : ""}
${baseStyle}
h1 { text-align: center; margin-bottom: 4px; font-size: ${isThermal ? "22px" : "20px"}; letter-spacing: 2px; font-weight: bold; }
.sub { text-align: center; font-size: 11px; margin-bottom: 8px; color: #333; }
.badge { text-align: center; font-size: ${isThermal ? "14px" : "14px"}; font-weight: bold; color: #c00; margin: 6px 0; letter-spacing: 1px; }
hr { border: none; border-top: 2px solid #000; margin: 6px 0; }
hr.dashed { border-top: 1px dashed #888; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-size: 11px; border-bottom: 2px solid #000; padding: 3px 0; font-weight: bold; }
td { font-size: 13px; padding: 3px 0; }
td:last-child { text-align: right; }
.big td { font-weight: bold; font-size: 15px; padding-top: 6px; border-top: 2px solid #000; }
.ftr { text-align: center; font-size: 11px; margin-top: 8px; color: #555; }
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

  if (paperSize === "thermal") {
    opts.margins = { marginType: "none" };
    opts.pageSize = { width: 70000, height: 397000 };
  } else if (paperSize === "a4") {
    opts.margins = { marginType: "printableArea" };
    opts.pageSize = "A4";
  } else if (paperSize === "a5") {
    opts.margins = { marginType: "printableArea" };
    opts.pageSize = "A5";
  }

  return opts;
}

function generateHTML(sale, paperSize) {
  if (paperSize === "a4") return generateA4InvoiceHTML(sale);
  if (paperSize === "a5") return generateA5InvoiceHTML(sale);
  return generateSaleReceiptHTML(sale);
}

function writeTempHTML(html) {
  const tmpDir = app.getPath("temp");
  const filePath = path.join(tmpDir, `faraz-receipt-${Date.now()}.html`);
  fs.writeFileSync(filePath, html, "utf-8");
  return filePath;
}

function doPrintJob(html, printerConfig) {
  return new Promise((resolve, reject) => {
    const paperSize = printerConfig?.paperSize || "thermal";
    const filePath = writeTempHTML(html);

    const printWin = new BrowserWindow({
      width: paperSize === "a4" ? 800 : paperSize === "a5" ? 600 : 300,
      height: 600,
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    let resolved = false;

    function cleanup() {
      resolved = true;
      try { printWin.close(); } catch (_) {}
      try { fs.unlinkSync(filePath); } catch (_) {}
    }

    function doPrint() {
      if (resolved) return;
      try {
        printWin.webContents.print(getPrintOptions(printerConfig), (success) => {
          if (resolved) return;
          if (!success) {
            cleanup();
            return reject(new Error("Print failed or cancelled"));
          }
          cleanup();
          resolve();
        });
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
  const html = generateHTML(sale, paperSize);
  return doPrintJob(html, printerConfig);
}

function printReturnReceipt(returnData, sale, printerConfig) {
  const paperSize = printerConfig?.paperSize || "thermal";
  const html = generateReturnReceiptHTML(returnData, sale, paperSize);
  return doPrintJob(html, printerConfig);
}

module.exports = { printReceipt, printReturnReceipt };
