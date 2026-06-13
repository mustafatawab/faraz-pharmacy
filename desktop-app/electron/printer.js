const { BrowserWindow } = require("electron");
const path = require("path");

function generateReceiptHTML(sale) {
  const items = sale.items || [];
  const itemsHTML = items.map((item) => `
    <tr>
      <td style="padding:2px 0">${item.product_name} × ${item.quantity}</td>
      <td style="padding:2px 0;text-align:right">${item.subtotal.toFixed(0)}</td>
    </tr>
  `).join("");

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 0; size: 80mm auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 72mm;
          padding: 4mm;
          color: #000;
        }
        h1 { font-size: 16px; text-align: center; margin-bottom: 2px; }
        .sub { text-align: center; font-size: 10px; margin-bottom: 6px; }
        hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 10px; border-bottom: 1px solid #000; padding: 2px 0; }
        td { font-size: 11px; }
        .total-row td { font-weight: bold; font-size: 13px; padding-top: 4px; border-top: 1px solid #000; }
        .footer { text-align: center; font-size: 10px; margin-top: 6px; }
        .paid { text-align: center; font-size: 12px; font-weight: bold; margin: 4px 0; }
      </style>
    </head>
    <body>
      <h1>Faraz Pharmacy</h1>
      <p class="sub">${dateStr}</p>
      <hr>
      <table>
        <thead><tr><th>Item</th><th style="text-align:right">Amt</th></tr></thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <hr>
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">${sale.subtotal.toFixed(0)}</td></tr>
        ${sale.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${sale.discount.toFixed(0)}</td></tr>` : ""}
        <tr class="total-row"><td>Total</td><td style="text-align:right">${sale.total.toFixed(0)}</td></tr>
        <tr><td>Paid</td><td style="text-align:right">${sale.amount_paid.toFixed(0)}</td></tr>
        <tr><td>Change</td><td style="text-align:right">${(sale.amount_paid - sale.total).toFixed(0)}</td></tr>
      </table>
      ${sale.status === "partial" ? '<p class="paid" style="color:#888">Partial Payment</p>' : ""}
      <hr>
      <p class="footer">Thank you for your visit!</p>
      <p class="footer" style="font-size:8px">--- Powered by Faraz Pharmacy ---</p>
    </body>
    </html>
  `;
}

function printReceipt(sale) {
  return new Promise((resolve, reject) => {
    const printWin = new BrowserWindow({
      width: 300,
      height: 600,
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    const html = generateReceiptHTML(sale);
    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    printWin.webContents.on("did-finish-load", () => {
      printWin.webContents.print(
        { silent: true, printBackground: true, deviceName: undefined },
        (success) => {
          printWin.close();
          success ? resolve() : reject(new Error("Print failed"));
        }
      );
    });

    printWin.webContents.on("did-fail-load", () => {
      printWin.close();
      reject(new Error("Failed to load receipt"));
    });

    setTimeout(() => {
      printWin.close();
      reject(new Error("Print timeout"));
    }, 10000);
  });
}

function generateReturnReceiptHTML(returnData, sale) {
  const items = returnData.items || [];
  const itemsHTML = items.map((item) => `
    <tr>
      <td style="padding:2px 0">${item.product_name} × ${item.quantity}</td>
      <td style="padding:2px 0;text-align:right">${item.refund_amount.toFixed(0)}</td>
    </tr>
  `).join("");

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 0; size: 80mm auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 72mm;
          padding: 4mm;
          color: #000;
        }
        h1 { font-size: 16px; text-align: center; margin-bottom: 2px; }
        .sub { text-align: center; font-size: 10px; margin-bottom: 6px; }
        .return-badge { text-align: center; font-size: 14px; font-weight: bold; color: #c00; margin: 4px 0; }
        hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 10px; border-bottom: 1px solid #000; padding: 2px 0; }
        td { font-size: 11px; }
        .total-row td { font-weight: bold; font-size: 13px; padding-top: 4px; border-top: 1px solid #000; }
        .footer { text-align: center; font-size: 10px; margin-top: 6px; }
      </style>
    </head>
    <body>
      <h1>Faraz Pharmacy</h1>
      <p class="sub">${dateStr}</p>
      <p class="return-badge">** RETURN RECEIPT **</p>
      <p class="sub">Sale: ${sale?.id?.slice(0, 8) || "N/A"}</p>
      <hr>
      <table>
        <thead><tr><th>Item</th><th style="text-align:right">Refund</th></tr></thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <hr>
      <table>
        <tr class="total-row"><td>Total Refund</td><td style="text-align:right">${returnData.refund_amount.toFixed(0)}</td></tr>
      </table>
      <p class="sub" style="margin-top:4px">Reason: ${returnData.reason}</p>
      <hr>
      <p class="footer">Return processed successfully</p>
      <p class="footer" style="font-size:8px">--- Powered by Faraz Pharmacy ---</p>
    </body>
    </html>
  `;
}

function printReturnReceipt(returnData, sale) {
  return new Promise((resolve, reject) => {
    const printWin = new BrowserWindow({
      width: 300,
      height: 600,
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    const html = generateReturnReceiptHTML(returnData, sale);
    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    printWin.webContents.on("did-finish-load", () => {
      printWin.webContents.print(
        { silent: true, printBackground: true, deviceName: undefined },
        (success) => {
          printWin.close();
          success ? resolve() : reject(new Error("Print failed"));
        }
      );
    });

    printWin.webContents.on("did-fail-load", () => {
      printWin.close();
      reject(new Error("Failed to load receipt"));
    });

    setTimeout(() => {
      printWin.close();
      reject(new Error("Print timeout"));
    }, 10000);
  });
}

module.exports = { printReceipt, printReturnReceipt };
