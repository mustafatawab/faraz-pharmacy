const express = require("express");
const cors = require("cors");
const { getDatabase } = require("./database");
const crypto = require("crypto");
const id = () => crypto.randomUUID();

let serverInstance;

function startServer(port) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const db = () => getDatabase();

  // Products
  app.get("/api/products", (req, res) => {
    const all = req.query.includeArchived === "true";
    if (all) return res.json(db().prepare("SELECT * FROM products ORDER BY name").all());
    res.json(db().prepare("SELECT * FROM products WHERE active = 1 ORDER BY name").all());
  });
  app.get("/api/products/search", (req, res) => {
    const s = `%${req.query.q}%`;
    res.json(db().prepare("SELECT * FROM products WHERE active = 1 AND (barcode LIKE ? OR name LIKE ?) ORDER BY name LIMIT 50").all(s, s));
  });
  app.get("/api/products/barcode/:b", (req, res) => res.json(db().prepare("SELECT * FROM products WHERE barcode = ?").get(req.params.b)));
  app.post("/api/products", (req, res) => {
    const p = req.body; const i = id();
    const mp = p.markupPercent ?? 20;
    const sp = p.salePrice > 0 ? p.salePrice : Math.round(p.purchasePrice * (1 + mp / 100));
    db().prepare("INSERT INTO products (id,barcode,name,company,category,location,distributor_id,sale_price,purchase_price,markup_percent,stock_qty,expiry) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(i, p.barcode, p.name, p.company||"", p.category||"", p.location||"", p.distributorId||null, sp, p.purchasePrice, mp, p.stockQty ?? 0, p.expiry||null);
    res.json(db().prepare("SELECT * FROM products WHERE id = ?").get(i));
  });
  app.put("/api/products/:id", (req, res) => {
    const p = req.body;
    const old = db().prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    const mp = p.markupPercent ?? old?.markup_percent ?? 20;
    const sp = p.salePrice > 0 ? p.salePrice : Math.round(p.purchasePrice * (1 + mp / 100));
    db().prepare("UPDATE products SET barcode=?,name=?,company=?,category=?,location=?,distributor_id=?,sale_price=?,purchase_price=?,markup_percent=?,stock_qty=?,expiry=? WHERE id=?").run(p.barcode, p.name, p.company||"", p.category||"", p.location||"", p.distributorId||null, sp, p.purchasePrice, mp, p.stockQty ?? 0, p.expiry||null, req.params.id);
    res.json(db().prepare("SELECT * FROM products WHERE id = ?").get(req.params.id));
  });
  app.delete("/api/products/:id", (req, res) => { db().prepare("UPDATE products SET active = 0 WHERE id = ?").run(req.params.id); res.json({ success: true }); });
  app.post("/api/products/:id/restore", (req, res) => { db().prepare("UPDATE products SET active = 1 WHERE id = ?").run(req.params.id); res.json({ success: true }); });

  // Sales
  app.post("/api/sales", (req, res) => {
    const s = req.body; const sid = id(); const d = db();
    d.transaction(() => {
      d.prepare("INSERT INTO sales (id,customer_id,subtotal,discount,total,amount_paid,change,status) VALUES (?,?,?,?,?,?,?,?)").run(sid, s.customerId||null, s.subtotal, s.discount, s.total, s.amountPaid, Math.max(0,s.amountPaid-s.total), s.amountPaid>=s.total?"paid":"partial");
      const ii = d.prepare("INSERT INTO sale_items (id,sale_id,product_id,product_name,barcode,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?,?,?)");
      const us = d.prepare("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?");
      for (const item of s.items) {
        ii.run(id(), sid, item.productId, item.productName, item.barcode, item.quantity, item.unitPrice, item.subtotal);
        us.run(item.quantity, item.productId);
      }
      if (s.amountPaid < s.total && s.customerId) {
        d.prepare("INSERT INTO arrears (id,sale_id,customer_id,total_bill,amount_paid,balance_due,status) VALUES (?,?,?,?,?,?,?)").run(id(), sid, s.customerId, s.total, s.amountPaid, s.total-s.amountPaid, "pending");
      }
    })();
    res.json(d.prepare("SELECT * FROM sales WHERE id=?").get(sid));
  });
  app.get("/api/sales/recent", (req, res) => {
    const l = parseInt(req.query.limit) || 10;
    res.json(db().prepare("SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id=c.id ORDER BY s.created_at DESC LIMIT ?").all(l));
  });
  app.get("/api/sales/date/:date", (req, res) => {
    res.json(db().prepare("SELECT s.*, c.name as customer_name, (SELECT COUNT(*) FROM returns WHERE sale_id=s.id) as return_count FROM sales s LEFT JOIN customers c ON s.customer_id=c.id WHERE date(s.created_at)=? ORDER BY s.created_at DESC").all(req.params.date));
  });
  app.get("/api/sales", (req, res) => {
    let q = "SELECT s.*, c.name as customer_name, (SELECT COUNT(*) FROM sale_items WHERE sale_id=s.id) as item_count, (SELECT COUNT(*) FROM returns WHERE sale_id=s.id) as return_count FROM sales s LEFT JOIN customers c ON s.customer_id=c.id WHERE 1=1";
    const p = [];
    if (req.query.dateFrom) { q += " AND date(s.created_at) >= ?"; p.push(req.query.dateFrom); }
    if (req.query.dateTo) { q += " AND date(s.created_at) <= ?"; p.push(req.query.dateTo); }
    if (req.query.search) { const s = `%${req.query.search}%`; q += " AND (s.id LIKE ? OR c.name LIKE ?)"; p.push(s, s); }
    res.json(db().prepare(q + " ORDER BY s.created_at DESC LIMIT 500").all(...p));
  });
  app.get("/api/sales/:id", (req, res) => {
    const s = db().prepare("SELECT s.*, c.name as customer_name, (SELECT COUNT(*) FROM returns WHERE sale_id=s.id) as return_count FROM sales s LEFT JOIN customers c ON s.customer_id=c.id WHERE s.id=?").get(req.params.id);
    if (s) s.items = db().prepare("SELECT * FROM sale_items WHERE sale_id=?").all(req.params.id);
    res.json(s);
  });

  // Customers
  app.get("/api/customers", (_, res) => res.json(db().prepare("SELECT c.*, (SELECT COUNT(*) FROM sales WHERE customer_id=c.id) as total_purchases, (SELECT COALESCE(SUM(balance_due),0) FROM arrears WHERE customer_id=c.id AND status='pending') as outstanding_arrear, (SELECT MAX(created_at) FROM sales WHERE customer_id=c.id) as last_purchase FROM customers c ORDER BY c.name").all()));
  app.get("/api/customers/search", (req, res) => { const s = `%${req.query.q}%`; res.json(db().prepare("SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name LIMIT 20").all(s, s)); });
  app.get("/api/customers/:id", (req, res) => {
    const c = db().prepare("SELECT c.*, (SELECT COUNT(*) FROM sales WHERE customer_id=c.id) as total_purchases, (SELECT COALESCE(SUM(balance_due),0) FROM arrears WHERE customer_id=c.id AND status='pending') as outstanding_arrear FROM customers c WHERE c.id=?").get(req.params.id);
    if (c) { c.purchases = db().prepare("SELECT s.*,(SELECT COUNT(*) FROM sale_items WHERE sale_id=s.id) as item_count FROM sales s WHERE s.customer_id=? ORDER BY s.created_at DESC").all(req.params.id); c.arrears = db().prepare("SELECT * FROM arrears WHERE customer_id=? ORDER BY created_at DESC").all(req.params.id); }
    res.json(c);
  });
  app.post("/api/customers", (req, res) => { const c = req.body; const i=id(); db().prepare("INSERT INTO customers (id,name,phone,address) VALUES (?,?,?,?)").run(i,c.name,c.phone,c.address||""); res.json(db().prepare("SELECT * FROM customers WHERE id=?").get(i)); });
  app.put("/api/customers/:id", (req, res) => { const c = req.body; db().prepare("UPDATE customers SET name=?, phone=?, address=? WHERE id=?").run(c.name, c.phone, c.address||"", req.params.id); res.json(db().prepare("SELECT * FROM customers WHERE id=?").get(req.params.id)); });
  app.delete("/api/customers/:id", (req, res) => { db().prepare("DELETE FROM customers WHERE id=?").run(req.params.id); res.json({ success: true }); });

  // Arrears
  app.get("/api/arrears", (req, res) => {
    const status = req.query.status;
    let q = "SELECT a.*, c.name as customer_name FROM arrears a LEFT JOIN customers c ON a.customer_id=c.id";
    const p = [];
    if (status && status !== "all") { q += " WHERE a.status=?"; p.push(status); }
    res.json(db().prepare(q+" ORDER BY a.created_at DESC").all(...p));
  });
  app.post("/api/arrears", (req, res) => {
    const a = req.body; const i = id();
    db().prepare("INSERT INTO arrears (id,sale_id,customer_id,total_bill,amount_paid,balance_due,status) VALUES (?,?,?,?,?,?,?)").run(i, a.saleId||"", a.customerId, a.totalBill, a.amountPaid||0, a.totalBill-a.amountPaid, (a.totalBill-a.amountPaid)<=0?"settled":"pending");
    res.json(db().prepare("SELECT a.*, c.name as customer_name FROM arrears a LEFT JOIN customers c ON a.customer_id=c.id WHERE a.id=?").get(i));
  });
  app.post("/api/arrears/:id/pay", (req, res) => {
    const d = db(); const a = d.prepare("SELECT * FROM arrears WHERE id=?").get(req.params.id);
    if (!a) return res.status(404).json({ error: "Not found" });
    const np = a.amount_paid + req.body.amount; const nb = a.total_bill - np;
    d.prepare("UPDATE arrears SET amount_paid=?, balance_due=?, status=? WHERE id=?").run(np, Math.max(0, nb), nb<=0?"settled":"pending", req.params.id);
    res.json(d.prepare("SELECT a.*, c.name as customer_name FROM arrears a LEFT JOIN customers c ON a.customer_id=c.id WHERE a.id=?").get(req.params.id));
  });
  app.post("/api/arrears/:id/settle", (req, res) => {
    const a = db().prepare("SELECT * FROM arrears WHERE id=?").get(req.params.id);
    if (!a) return res.status(404).json({ error: "Not found" });
    db().prepare("UPDATE arrears SET amount_paid=total_bill, balance_due=0, status='settled' WHERE id=?").run(req.params.id);
    res.json(db().prepare("SELECT a.*, c.name as customer_name FROM arrears a LEFT JOIN customers c ON a.customer_id=c.id WHERE a.id=?").get(req.params.id));
  });
  app.delete("/api/arrears/:id", (req, res) => { db().prepare("DELETE FROM arrears WHERE id=?").run(req.params.id); res.json({ success: true }); });

  // Stock
  app.get("/api/stock", (_, res) => res.json(db().prepare("SELECT sp.*, p.name as product_name, d.name as distributor_name, c.name as company_name FROM stock_purchases sp LEFT JOIN products p ON sp.product_id=p.id LEFT JOIN distributors d ON sp.distributor_id=d.id LEFT JOIN companies c ON sp.company_id=c.id ORDER BY sp.created_at DESC").all()));
  app.post("/api/stock", (req, res) => {
    const d = db(); const p = req.body; const i=id();
    const product = d.prepare("SELECT purchase_price FROM products WHERE id=?").get(p.productId);
    const price = p.purchasePrice ?? product?.purchase_price ?? 0;
    const tv = p.quantity * price;
    d.transaction(() => {
      d.prepare("INSERT INTO stock_purchases (id,product_id,distributor_id,company_id,invoice_number,quantity,purchase_price,expiry,total_value) VALUES (?,?,?,?,?,?,?,?,?)").run(i, p.productId, p.distributorId||null, p.companyId||null, p.invoiceNumber||"", p.quantity, price, p.expiry||null, tv);
      d.prepare("UPDATE products SET stock_qty=stock_qty+?, purchase_price=?, expiry=COALESCE(?,expiry) WHERE id=?").run(p.quantity, price, p.expiry||null, p.productId);
    })();
    res.json(d.prepare("SELECT sp.*, p.name as product_name, d.name as distributor_name, c.name as company_name FROM stock_purchases sp LEFT JOIN products p ON sp.product_id=p.id LEFT JOIN distributors d ON sp.distributor_id=d.id LEFT JOIN companies c ON sp.company_id=c.id WHERE sp.id=?").get(i));
  });
  app.put("/api/stock/:id", (req, res) => {
    const d = db(); const p = req.body;
    const old = d.prepare("SELECT * FROM stock_purchases WHERE id=?").get(req.params.id);
    if (!old) return res.status(404).json({ error: "Not found" });
    const qtyDiff = p.quantity - old.quantity;
    const price = p.purchasePrice ?? old.purchase_price;
    const tv = p.quantity * price;
    d.transaction(() => {
      d.prepare("UPDATE stock_purchases SET quantity=?, purchase_price=?, expiry=?, total_value=?, company_id=?, invoice_number=?, distributor_id=? WHERE id=?").run(p.quantity, price, p.expiry||null, tv, p.companyId||null, p.invoiceNumber||"", p.distributorId||null, req.params.id);
      d.prepare("UPDATE products SET stock_qty=stock_qty+?, purchase_price=?, expiry=COALESCE(?,expiry) WHERE id=?").run(qtyDiff, price, p.expiry||null, old.product_id);
    })();
    res.json(d.prepare("SELECT sp.*, p.name as product_name, d.name as distributor_name, c.name as company_name FROM stock_purchases sp LEFT JOIN products p ON sp.product_id=p.id LEFT JOIN distributors d ON sp.distributor_id=d.id LEFT JOIN companies c ON sp.company_id=c.id WHERE sp.id=?").get(req.params.id));
  });

  // Distributors
  app.get("/api/distributors", (_, res) => res.json(db().prepare("SELECT d.*, c.name as company_name, (SELECT COUNT(*) FROM products WHERE distributor_id=d.id) as product_count FROM distributors d LEFT JOIN companies c ON d.company_id=c.id ORDER BY d.name").all()));
  app.post("/api/distributors", (req, res) => { const d = req.body; const i=id(); db().prepare("INSERT INTO distributors (id,name,contact,phone,address,company_id) VALUES (?,?,?,?,?,?)").run(i,d.name,d.contact,d.phone,d.address||"",d.companyId||null); res.json(db().prepare("SELECT d.*, c.name as company_name FROM distributors d LEFT JOIN companies c ON d.company_id=c.id WHERE d.id=?").get(i)); });
  app.put("/api/distributors/:id", (req, res) => { const d = req.body; db().prepare("UPDATE distributors SET name=?, contact=?, phone=?, address=?, company_id=? WHERE id=?").run(d.name, d.contact, d.phone, d.address, d.companyId||null, req.params.id); res.json(db().prepare("SELECT d.*, c.name as company_name FROM distributors d LEFT JOIN companies c ON d.company_id=c.id WHERE d.id=?").get(req.params.id)); });
  app.delete("/api/distributors/:id", (req, res) => { db().prepare("DELETE FROM distributors WHERE id=?").run(req.params.id); res.json({ success: true }); });

  // Companies
  app.get("/api/companies", (_, res) => res.json(db().prepare("SELECT c.*, (SELECT COUNT(*) FROM products WHERE company=c.name) as product_count FROM companies c ORDER BY c.name").all()));
  app.post("/api/companies", (req, res) => { const c = req.body; const i=id(); db().prepare("INSERT INTO companies (id,name,contact,phone,address,second_number) VALUES (?,?,?,?,?,?)").run(i,c.name,c.contact,c.phone,c.address||"",c.second_number||""); res.json(db().prepare("SELECT * FROM companies WHERE id=?").get(i)); });
  app.put("/api/companies/:id", (req, res) => { const c = req.body; db().prepare("UPDATE companies SET name=?, contact=?, phone=?, address=?, second_number=? WHERE id=?").run(c.name, c.contact, c.phone, c.address, c.second_number||"", req.params.id); res.json(db().prepare("SELECT * FROM companies WHERE id=?").get(req.params.id)); });
  app.delete("/api/companies/:id", (req, res) => { db().prepare("DELETE FROM companies WHERE id=?").run(req.params.id); res.json({ success: true }); });

  // Returns
  app.get("/api/returns", (_, res) => res.json(db().prepare("SELECT * FROM returns ORDER BY created_at DESC").all()));
  app.post("/api/returns", (req, res) => {
    const d = db(); const r = req.body;
    const existing = d.prepare("SELECT COUNT(*) as c FROM returns WHERE sale_id=?").get(r.saleId);
    if (existing.c > 0) return res.status(400).json({ error: "This sale has already been returned" });
    const ri = id();
    d.transaction(() => {
      d.prepare("INSERT INTO returns (id,sale_id,refund_amount,reason) VALUES (?,?,?,?)").run(ri, r.saleId, r.refundAmount, r.reason);
      const ii = d.prepare("INSERT INTO return_items (id,return_id,product_id,product_name,quantity,refund_amount) VALUES (?,?,?,?,?,?)");
      const rs = d.prepare("UPDATE products SET stock_qty=stock_qty+? WHERE id=?");
      for (const item of r.items) {
        ii.run(id(), ri, item.productId, item.productName, item.quantity, item.refundAmount);
        rs.run(item.quantity, item.productId);
      }
    })();
    res.json(d.prepare("SELECT * FROM returns WHERE id=?").get(ri));
  });

  // Expenses
  app.get("/api/expenses", (_, res) => res.json(db().prepare("SELECT * FROM expenses ORDER BY date DESC").all()));
  app.post("/api/expenses", (req, res) => { const e = req.body; const i=id(); db().prepare("INSERT INTO expenses (id,title,category,amount,notes,date) VALUES (?,?,?,?,?,?)").run(i, e.title, e.category, e.amount, e.notes||"", e.date); res.json(db().prepare("SELECT * FROM expenses WHERE id=?").get(i)); });
  app.put("/api/expenses/:id", (req, res) => { const e = req.body; db().prepare("UPDATE expenses SET title=?, category=?, amount=?, notes=?, date=? WHERE id=?").run(e.title, e.category, e.amount, e.notes||"", e.date, req.params.id); res.json(db().prepare("SELECT * FROM expenses WHERE id=?").get(req.params.id)); });
  app.delete("/api/expenses/:id", (req, res) => { db().prepare("DELETE FROM expenses WHERE id=?").run(req.params.id); res.json({ success: true }); });

  // Dashboard
  app.get("/api/dashboard/stats", (_, res) => {
    const d = db(); const t = new Date().toISOString().split("T")[0];
    res.json({
      todayRevenue: d.prepare("SELECT COALESCE(SUM(total),0) as v FROM sales WHERE date(created_at)=?").get(t).v,
      totalArrears: d.prepare("SELECT COALESCE(SUM(balance_due),0) as v FROM arrears WHERE status='pending'").get().v,
      lowStockCount: d.prepare("SELECT COUNT(*) as c FROM products WHERE stock_qty<=5").get().c,
      expiringSoonCount: d.prepare("SELECT COUNT(*) as c FROM products WHERE expiry IS NOT NULL AND date(expiry) BETWEEN date('now') AND date('now','+30 days')").get().c,
      weekRevenue: d.prepare("SELECT date(created_at) as day, COALESCE(SUM(total),0) as revenue FROM sales WHERE created_at>=datetime('now','-7 days') GROUP BY date(created_at) ORDER BY day").all(),
      topProducts: d.prepare("SELECT si.product_name as name, SUM(si.quantity) as value FROM sale_items si GROUP BY si.product_name ORDER BY value DESC LIMIT 5").all(),
    });
  });

  serverInstance = app.listen(port, "0.0.0.0", () => {
    console.log(`[server] API server running on port ${port}`);
  });
  return app;
}

function stopServer() {
  if (serverInstance) serverInstance.close();
}

module.exports = { startServer, stopServer };
