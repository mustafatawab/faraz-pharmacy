const { ipcMain, dialog } = require("electron");
const { getDatabase, verifyPassword, generateToken, getDbPath, restoreDatabase } = require("./database");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const id = () => crypto.randomUUID();
const { getBackupsDir, saveConfig, loadConfig } = require("./config");

function cleanupExpiredTokens() {
  getDatabase().prepare("DELETE FROM auth_tokens WHERE refresh_expires_at < datetime('now')").run();
}

function registerHandlers() {
  cleanupExpiredTokens();
  setInterval(cleanupExpiredTokens, 3600000);

  // Auth
  ipcMain.handle("auth:login", (_, { username, password }) => {
    const db = getDatabase();
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return { error: "Invalid credentials" };
    }

    const accessToken = generateToken();
    const refreshToken = generateToken();
    const csrfToken = generateToken();
    const now = new Date();
    const accessExpires = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const refreshExpires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare("DELETE FROM auth_tokens WHERE user_id = ?").run(user.id);
    db.prepare("INSERT INTO auth_tokens (id, user_id, access_token, refresh_token, csrf_token, access_expires_at, refresh_expires_at) VALUES (?,?,?,?,?,?,?)")
      .run(id(), user.id, accessToken, refreshToken, csrfToken, accessExpires, refreshExpires);

    return {
      user: { id: user.id, username: user.username, role: user.role },
      accessToken, refreshToken, csrfToken,
      accessExpires, refreshExpires,
    };
  });

  ipcMain.handle("auth:logout", (_, { accessToken }) => {
    getDatabase().prepare("DELETE FROM auth_tokens WHERE access_token = ?").run(accessToken);
    return { success: true };
  });

  ipcMain.handle("auth:refresh", (_, { refreshToken: token }) => {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM auth_tokens WHERE refresh_token = ? AND refresh_expires_at > datetime('now')").get(token);
    if (!row) return { error: "Invalid or expired refresh token" };

    const newAccessToken = generateToken();
    const newCsrfToken = generateToken();
    const accessExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.prepare("UPDATE auth_tokens SET access_token = ?, csrf_token = ?, access_expires_at = ? WHERE id = ?")
      .run(newAccessToken, newCsrfToken, accessExpires, row.id);

    const user = db.prepare("SELECT id, username, role FROM users WHERE id = ?").get(row.user_id);
    return { user, accessToken: newAccessToken, csrfToken: newCsrfToken, accessExpires };
  });

  ipcMain.handle("auth:me", (_, { accessToken }) => {
    const row = getDatabase().prepare(`
      SELECT t.*, u.id as uid, u.username, u.role
      FROM auth_tokens t JOIN users u ON t.user_id = u.id
      WHERE t.access_token = ? AND t.access_expires_at > datetime('now')
    `).get(accessToken);
    if (!row) return { error: "Invalid or expired access token" };
    return { user: { id: row.uid, username: row.username, role: row.role } };
  });

  // Products
  ipcMain.handle("products:list", () => getDatabase().prepare("SELECT * FROM products WHERE active = 1 ORDER BY name").all());
  ipcMain.handle("products:list-all", () => getDatabase().prepare("SELECT * FROM products ORDER BY name").all());
  ipcMain.handle("products:search", (_, q) => {
    const s = `%${q}%`;
    return getDatabase().prepare("SELECT * FROM products WHERE active = 1 AND (barcode LIKE ? OR name LIKE ?) ORDER BY name LIMIT 50").all(s, s);
  });
  ipcMain.handle("products:archive", (_, id) => {
    getDatabase().prepare("UPDATE products SET active = 0 WHERE id = ?").run(id);
    return { success: true };
  });
  ipcMain.handle("products:restore", (_, id) => {
    getDatabase().prepare("UPDATE products SET active = 1 WHERE id = ?").run(id);
    return { success: true };
  });
  ipcMain.handle("products:get-by-barcode", (_, b) => getDatabase().prepare("SELECT * FROM products WHERE barcode = ?").get(b));
  ipcMain.handle("products:create", (_, p) => {
    const i = id();
    const mp = p.markupPercent ?? 20;
    const sp = p.salePrice > 0 ? p.salePrice : Math.round(p.purchasePrice * (1 + mp / 100));
    getDatabase().prepare("INSERT INTO products (id,barcode,name,company,category,location,distributor_id,sale_price,purchase_price,markup_percent,stock_qty,expiry) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(i, p.barcode, p.name, p.company||"", p.category||"", p.location||"", p.distributorId||null, sp, p.purchasePrice, mp, p.stockQty ?? 0, p.expiry||null);
    return getDatabase().prepare("SELECT * FROM products WHERE id = ?").get(i);
  });
  ipcMain.handle("products:update", (_, id, p) => {
    const old = getDatabase().prepare("SELECT * FROM products WHERE id = ?").get(id);
    const mp = p.markupPercent ?? old?.markup_percent ?? 20;
    const sp = p.salePrice > 0 ? p.salePrice : Math.round(p.purchasePrice * (1 + mp / 100));
    getDatabase().prepare("UPDATE products SET barcode=?,name=?,company=?,category=?,location=?,distributor_id=?,sale_price=?,purchase_price=?,markup_percent=?,stock_qty=?,expiry=? WHERE id=?").run(p.barcode, p.name, p.company||"", p.category||"", p.location||"", p.distributorId||null, sp, p.purchasePrice, mp, p.stockQty ?? 0, p.expiry||null, id);
    return getDatabase().prepare("SELECT * FROM products WHERE id = ?").get(id);
  });
  ipcMain.handle("products:delete", (_, id) => { getDatabase().prepare("DELETE FROM products WHERE id=?").run(id); return { success: true }; });

  // Sales
  ipcMain.handle("sales:create", (_, s) => {
    const db = getDatabase();
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `${yy}${mm}-`;
    const last = db.prepare("SELECT id FROM sales WHERE id LIKE ? ORDER BY id DESC LIMIT 1").get(prefix + '%');
    let nextNum = 1;
    if (last) {
      nextNum = parseInt(last.id.slice(-6), 10) + 1;
    }
    const sid = `${prefix}${nextNum.toString().padStart(6, '0')}`;
    const tr = db.transaction(() => {
      db.prepare("INSERT INTO sales (id,customer_id,subtotal,discount,total,amount_paid,change,status) VALUES (?,?,?,?,?,?,?,?)").run(sid, s.customerId||null, s.subtotal, s.discount, s.total, s.amountPaid, Math.max(0,s.amountPaid-s.total), s.amountPaid>=s.total?"paid":"partial");
      const ii = db.prepare("INSERT INTO sale_items (id,sale_id,product_id,product_name,barcode,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?,?,?)");
      const us = db.prepare("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?");
      for (const item of s.items) {
        ii.run(id(), sid, item.productId, item.productName, item.barcode, item.quantity, item.unitPrice, item.subtotal);
        us.run(item.quantity, item.productId);
      }
      if (s.amountPaid < s.total && s.customerId) {
        db.prepare("INSERT INTO arrears (id,sale_id,customer_id,total_bill,amount_paid,balance_due,status) VALUES (?,?,?,?,?,?,?)").run(id(), sid, s.customerId, s.total, s.amountPaid, s.total-s.amountPaid, "pending");
      }
    });
    tr();
    return db.prepare("SELECT * FROM sales WHERE id=?").get(sid);
  });
  ipcMain.handle("sales:list-recent", (_, l=10) => getDatabase().prepare("SELECT s.*, c.name as customer_name, (SELECT COUNT(*) FROM returns WHERE sale_id=s.id) as return_count FROM sales s LEFT JOIN customers c ON s.customer_id=c.id ORDER BY s.created_at DESC LIMIT ?").all(l));
  ipcMain.handle("sales:get-by-id", (_, id) => {
    const s = getDatabase().prepare("SELECT s.*, c.name as customer_name, (SELECT COUNT(*) FROM returns WHERE sale_id=s.id) as return_count FROM sales s LEFT JOIN customers c ON s.customer_id=c.id WHERE s.id=?").get(id);
    if (s) s.items = getDatabase().prepare("SELECT * FROM sale_items WHERE sale_id=?").all(id);
    return s;
  });
  ipcMain.handle("sales:list-by-date", (_, dateStr) => {
    return getDatabase().prepare("SELECT s.*, c.name as customer_name, (SELECT COUNT(*) FROM returns WHERE sale_id=s.id) as return_count FROM sales s LEFT JOIN customers c ON s.customer_id=c.id WHERE date(s.created_at)=? ORDER BY s.created_at DESC").all(dateStr);
  });
  ipcMain.handle("sales:list-all", (_, opts = {}) => {
    const { search, dateFrom, dateTo } = opts;
    let q = "SELECT s.*, c.name as customer_name, (SELECT COUNT(*) FROM sale_items WHERE sale_id=s.id) as item_count, (SELECT COUNT(*) FROM returns WHERE sale_id=s.id) as return_count FROM sales s LEFT JOIN customers c ON s.customer_id=c.id WHERE 1=1";
    const p = [];
    if (dateFrom) { q += " AND date(s.created_at) >= ?"; p.push(dateFrom); }
    if (dateTo) { q += " AND date(s.created_at) <= ?"; p.push(dateTo); }
    if (search) { const s = `%${search}%`; q += " AND (s.id LIKE ? OR c.name LIKE ?)"; p.push(s, s); }
    return getDatabase().prepare(q + " ORDER BY s.created_at DESC LIMIT 500").all(...p);
  });

  // Customers
  ipcMain.handle("customers:list", () => getDatabase().prepare("SELECT c.*, (SELECT COUNT(*) FROM sales WHERE customer_id=c.id) as total_purchases, (SELECT COALESCE(SUM(balance_due),0) FROM arrears WHERE customer_id=c.id AND status='pending') as outstanding_arrear, (SELECT MAX(created_at) FROM sales WHERE customer_id=c.id) as last_purchase FROM customers c ORDER BY c.name").all());
  ipcMain.handle("customers:search", (_, q) => { const s=`%${q}%`; return getDatabase().prepare("SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name LIMIT 20").all(s,s); });
  ipcMain.handle("customers:create", (_, c) => { const i=id(); getDatabase().prepare("INSERT INTO customers (id,name,phone,address) VALUES (?,?,?,?)").run(i,c.name,c.phone,c.address||""); return getDatabase().prepare("SELECT * FROM customers WHERE id=?").get(i); });
  ipcMain.handle("customers:update", (_, id, c) => { getDatabase().prepare("UPDATE customers SET name=?, phone=?, address=? WHERE id=?").run(c.name, c.phone, c.address||"", id); return getDatabase().prepare("SELECT * FROM customers WHERE id=?").get(id); });
  ipcMain.handle("customers:delete", (_, id) => { getDatabase().prepare("DELETE FROM customers WHERE id=?").run(id); return { success: true }; });
  ipcMain.handle("customers:get-by-id", (_, id) => {
    const c = getDatabase().prepare("SELECT c.*, (SELECT COUNT(*) FROM sales WHERE customer_id=c.id) as total_purchases, (SELECT COALESCE(SUM(balance_due),0) FROM arrears WHERE customer_id=c.id AND status='pending') as outstanding_arrear FROM customers c WHERE c.id=?").get(id);
    if (c) { c.purchases = getDatabase().prepare("SELECT s.*,(SELECT COUNT(*) FROM sale_items WHERE sale_id=s.id) as item_count FROM sales s WHERE s.customer_id=? ORDER BY s.created_at DESC").all(id); c.arrears = getDatabase().prepare("SELECT * FROM arrears WHERE customer_id=? ORDER BY created_at DESC").all(id); }
    return c;
  });

  // Arrears
  ipcMain.handle("arrears:list", (_, status) => {
    let q = "SELECT a.*, c.name as customer_name FROM arrears a LEFT JOIN customers c ON a.customer_id=c.id";
    const p = [];
    if (status && status !== "all") { q += " WHERE a.status=?"; p.push(status); }
    return getDatabase().prepare(q+" ORDER BY a.created_at DESC").all(...p);
  });
  ipcMain.handle("arrears:create", (_, a) => {
    const i = id();
    getDatabase().prepare("INSERT INTO arrears (id,sale_id,customer_id,total_bill,amount_paid,balance_due,status) VALUES (?,?,?,?,?,?,?)").run(i, a.saleId||"", a.customerId, a.totalBill, a.amountPaid||0, a.totalBill-a.amountPaid, (a.totalBill-a.amountPaid)<=0?"settled":"pending");
    return getDatabase().prepare("SELECT a.*, c.name as customer_name FROM arrears a LEFT JOIN customers c ON a.customer_id=c.id WHERE a.id=?").get(i);
  });
  ipcMain.handle("arrears:record-payment", (_, aid, amt) => {
    const db = getDatabase();
    const a = db.prepare("SELECT * FROM arrears WHERE id=?").get(aid);
    if (!a) return { error: "Not found" };
    const np = a.amount_paid + amt;
    const nb = a.total_bill - np;
    db.prepare("UPDATE arrears SET amount_paid=?, balance_due=?, status=? WHERE id=?").run(np, Math.max(0, nb), nb<=0?"settled":"pending", aid);
    return db.prepare("SELECT a.*, c.name as customer_name FROM arrears a LEFT JOIN customers c ON a.customer_id=c.id WHERE a.id=?").get(aid);
  });
  ipcMain.handle("arrears:delete", (_, id) => { getDatabase().prepare("DELETE FROM arrears WHERE id=?").run(id); return { success: true }; });
  ipcMain.handle("arrears:settle", (_, id) => {
    const a = getDatabase().prepare("SELECT * FROM arrears WHERE id=?").get(id);
    if (!a) return { error: "Not found" };
    getDatabase().prepare("UPDATE arrears SET amount_paid=total_bill, balance_due=0, status='settled' WHERE id=?").run(id);
    return getDatabase().prepare("SELECT a.*, c.name as customer_name FROM arrears a LEFT JOIN customers c ON a.customer_id=c.id WHERE a.id=?").get(id);
  });

  // Stock
  ipcMain.handle("stock:list", () => getDatabase().prepare("SELECT sp.*, p.name as product_name, d.name as distributor_name, c.name as company_name FROM stock_purchases sp LEFT JOIN products p ON sp.product_id=p.id LEFT JOIN distributors d ON sp.distributor_id=d.id LEFT JOIN companies c ON sp.company_id=c.id ORDER BY sp.created_at DESC").all());
  ipcMain.handle("stock:create", (_, p) => {
    const db = getDatabase(); const i=id();
    const product = db.prepare("SELECT purchase_price FROM products WHERE id=?").get(p.productId);
    const price = p.purchasePrice ?? product?.purchase_price ?? 0;
    const tv = p.quantity * price;
    db.transaction(()=>{
      db.prepare("INSERT INTO stock_purchases (id,product_id,distributor_id,company_id,invoice_number,quantity,purchase_price,expiry,total_value) VALUES (?,?,?,?,?,?,?,?,?)").run(i, p.productId, p.distributorId||null, p.companyId||null, p.invoiceNumber||"", p.quantity, price, p.expiry||null, tv);
      db.prepare("UPDATE products SET stock_qty=stock_qty+?, purchase_price=?, expiry=COALESCE(?,expiry) WHERE id=?").run(p.quantity, price, p.expiry||null, p.productId);
    })();
    return db.prepare("SELECT sp.*, p.name as product_name, d.name as distributor_name, c.name as company_name FROM stock_purchases sp LEFT JOIN products p ON sp.product_id=p.id LEFT JOIN distributors d ON sp.distributor_id=d.id LEFT JOIN companies c ON sp.company_id=c.id WHERE sp.id=?").get(i);
  });
  ipcMain.handle("stock:update", (_, id, p) => {
    const db = getDatabase();
    const old = db.prepare("SELECT * FROM stock_purchases WHERE id=?").get(id);
    if (!old) return { error: "Not found" };
    const qtyDiff = p.quantity - old.quantity;
    const price = p.purchasePrice ?? old.purchase_price;
    const tv = p.quantity * price;
    db.transaction(()=>{
      db.prepare("UPDATE stock_purchases SET quantity=?, purchase_price=?, expiry=?, total_value=?, company_id=?, invoice_number=?, distributor_id=? WHERE id=?").run(p.quantity, price, p.expiry||null, tv, p.companyId||null, p.invoiceNumber||"", p.distributorId||null, id);
      db.prepare("UPDATE products SET stock_qty=stock_qty+?, purchase_price=?, expiry=COALESCE(?,expiry) WHERE id=?").run(qtyDiff, price, p.expiry||null, old.product_id);
    })();
    return db.prepare("SELECT sp.*, p.name as product_name, d.name as distributor_name, c.name as company_name FROM stock_purchases sp LEFT JOIN products p ON sp.product_id=p.id LEFT JOIN distributors d ON sp.distributor_id=d.id LEFT JOIN companies c ON sp.company_id=c.id WHERE sp.id=?").get(id);
  });

  // Distributors
  ipcMain.handle("distributors:list", () => getDatabase().prepare("SELECT d.*, c.name as company_name, (SELECT COUNT(*) FROM products WHERE distributor_id=d.id) as product_count FROM distributors d LEFT JOIN companies c ON d.company_id=c.id ORDER BY d.name").all());
  ipcMain.handle("distributors:create", (_, d) => { const i=id(); getDatabase().prepare("INSERT INTO distributors (id,name,contact,phone,address,company_id) VALUES (?,?,?,?,?,?)").run(i,d.name,d.contact,d.phone,d.address||"",d.companyId||null); return getDatabase().prepare("SELECT d.*, c.name as company_name FROM distributors d LEFT JOIN companies c ON d.company_id=c.id WHERE d.id=?").get(i); });
  ipcMain.handle("distributors:update", (_, id, d) => { getDatabase().prepare("UPDATE distributors SET name=?, contact=?, phone=?, address=?, company_id=? WHERE id=?").run(d.name, d.contact, d.phone, d.address, d.companyId||null, id); return getDatabase().prepare("SELECT d.*, c.name as company_name FROM distributors d LEFT JOIN companies c ON d.company_id=c.id WHERE d.id=?").get(id); });
  ipcMain.handle("distributors:delete", (_, id) => { getDatabase().prepare("DELETE FROM distributors WHERE id=?").run(id); return { success: true }; });

  // Companies
  ipcMain.handle("companies:list", () => getDatabase().prepare("SELECT c.*, (SELECT COUNT(*) FROM products WHERE company=c.name) as product_count FROM companies c ORDER BY c.name").all());
  ipcMain.handle("companies:create", (_, c) => { const i=id(); getDatabase().prepare("INSERT INTO companies (id,name,contact,phone,address,second_number) VALUES (?,?,?,?,?,?)").run(i,c.name,c.contact,c.phone,c.address||"",c.second_number||""); return getDatabase().prepare("SELECT * FROM companies WHERE id=?").get(i); });
  ipcMain.handle("companies:update", (_, id, c) => { getDatabase().prepare("UPDATE companies SET name=?, contact=?, phone=?, address=?, second_number=? WHERE id=?").run(c.name, c.contact, c.phone, c.address, c.second_number||"", id); return getDatabase().prepare("SELECT * FROM companies WHERE id=?").get(id); });
  ipcMain.handle("companies:delete", (_, id) => { getDatabase().prepare("DELETE FROM companies WHERE id=?").run(id); return { success: true }; });

  // Returns
  ipcMain.handle("returns:list", () => getDatabase().prepare("SELECT * FROM returns ORDER BY created_at DESC").all());
  ipcMain.handle("returns:create", (_, r) => {
    const db=getDatabase();
    const existing = db.prepare("SELECT COUNT(*) as c FROM returns WHERE sale_id=?").get(r.saleId);
    if (existing.c > 0) throw new Error("This sale has already been returned");
    const ri=id();
    db.transaction(()=>{
      db.prepare("INSERT INTO returns (id,sale_id,refund_amount,reason) VALUES (?,?,?,?)").run(ri, r.saleId, r.refundAmount, r.reason);
      const ii=db.prepare("INSERT INTO return_items (id,return_id,product_id,product_name,quantity,refund_amount) VALUES (?,?,?,?,?,?)");
      const rs=db.prepare("UPDATE products SET stock_qty=stock_qty+? WHERE id=?");
      for (const item of r.items) {
        ii.run(id(), ri, item.productId, item.productName, item.quantity, item.refundAmount);
        rs.run(item.quantity, item.productId);
      }
    })();
    return db.prepare("SELECT * FROM returns WHERE id=?").get(ri);
  });

  // Expenses
  ipcMain.handle("expenses:list", () => getDatabase().prepare("SELECT * FROM expenses ORDER BY date DESC").all());
  ipcMain.handle("expenses:create", (_, e) => { const i=id(); getDatabase().prepare("INSERT INTO expenses (id,title,category,amount,notes,date) VALUES (?,?,?,?,?,?)").run(i,e.title,e.category,e.amount,e.notes||"",e.date); return getDatabase().prepare("SELECT * FROM expenses WHERE id=?").get(i); });
  ipcMain.handle("expenses:update", (_, id, e) => { getDatabase().prepare("UPDATE expenses SET title=?, category=?, amount=?, notes=?, date=? WHERE id=?").run(e.title, e.category, e.amount, e.notes||"", e.date, id); return getDatabase().prepare("SELECT * FROM expenses WHERE id=?").get(id); });
  ipcMain.handle("expenses:delete", (_, id) => { getDatabase().prepare("DELETE FROM expenses WHERE id=?").run(id); return { success: true }; });

  // Dashboard
  ipcMain.handle("dashboard:stats", () => {
    const db=getDatabase(); const t=new Date().toISOString().split("T")[0];
    return {
      todayRevenue: db.prepare("SELECT COALESCE(SUM(total),0) as t FROM sales WHERE date(created_at)=?").get(t).t,
      totalArrears: db.prepare("SELECT COALESCE(SUM(balance_due),0) as t FROM arrears WHERE status='pending'").get().t,
      lowStockCount: db.prepare("SELECT COUNT(*) as c FROM products WHERE stock_qty<=5").get().c,
      expiringSoonCount: db.prepare("SELECT COUNT(*) as c FROM products WHERE expiry IS NOT NULL AND date(expiry) BETWEEN date('now') AND date('now','+30 days')").get().c,
      weekRevenue: db.prepare("SELECT date(created_at) as day, COALESCE(SUM(total),0) as revenue FROM sales WHERE created_at>=datetime('now','-7 days') GROUP BY date(created_at) ORDER BY day").all(),
      topProducts: db.prepare("SELECT si.product_name as name, SUM(si.quantity) as value FROM sale_items si GROUP BY si.product_name ORDER BY value DESC LIMIT 5").all(),
    };
  });

  // Verify admin password (for sensitive actions)
  ipcMain.handle("auth:verify-password", (_, { password }) => {
    const user = getDatabase().prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
    if (!user) return { valid: false };
    return { valid: verifyPassword(password, user.password_hash) };
  });

  // Recovery key
  const { generateRecoveryPhrase, hashRecoveryPhrase, verifyRecoveryPhrase } = require("./database");

  ipcMain.handle("auth:generate-recovery-key", () => {
    const db = getDatabase();
    const existing = db.prepare("SELECT COUNT(*) as c FROM recovery_keys WHERE used_at IS NULL").get();
    if (existing.c > 0) {
      db.prepare("UPDATE recovery_keys SET used_at = datetime('now') WHERE used_at IS NULL").run();
    }
    const phrase = generateRecoveryPhrase();
    const keyHash = hashRecoveryPhrase(phrase);
    db.prepare("INSERT INTO recovery_keys (id, key_hash) VALUES (?, ?)").run(id(), keyHash);
    return { phrase };
  });

  ipcMain.handle("auth:recover-password", (_, { phrase, newPassword }) => {
    const db = getDatabase();
    const key = verifyRecoveryPhrase(phrase);
    if (!key) return { error: "Invalid recovery key" };
    const user = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
    if (!user) return { error: "No admin user found" };
    const { hashPassword } = require("./database");
    db.transaction(() => {
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(newPassword), user.id);
      db.prepare("UPDATE recovery_keys SET used_at = datetime('now') WHERE id = ?").run(key.id);
      db.prepare("DELETE FROM auth_tokens WHERE user_id = ?").run(user.id);
    })();
    return { success: true };
  });

  // Settings - Backup
  const backupsDir = getBackupsDir();
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

  ipcMain.handle("settings:backup-create", () => {
    try {
      const dir = getBackupsDir();
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const dbPath = getDbPath();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const backupName = `faraz-pharmacy-backup-${timestamp}.db`;
      const backupPath = path.join(dir, backupName);
      fs.copyFileSync(dbPath, backupPath);
      const stat = fs.statSync(backupPath);
      return { success: true, name: backupName, path: backupPath, size: stat.size, createdAt: new Date(stat.birthtime || stat.mtime).toISOString() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("settings:backup-list", () => {
    try {
      const dir = getBackupsDir();
      if (!fs.existsSync(dir)) return [];
      const files = fs.readdirSync(dir)
        .filter(f => f.endsWith(".db"))
        .map(f => {
          const fp = path.join(dir, f);
          const stat = fs.statSync(fp);
          return { name: f, path: fp, size: stat.size, createdAt: new Date(stat.birthtime || stat.mtime).toISOString() };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return files;
    } catch (err) {
      return [];
    }
  });

  ipcMain.handle("settings:backup-delete", (_, { name }) => {
    try {
      const fp = path.join(getBackupsDir(), name);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("settings:backup-restore", (_, { name }) => {
    try {
      const backupPath = path.join(getBackupsDir(), name);
      restoreDatabase(backupPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("settings:backup-directory-pick", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (result.canceled || result.filePaths.length === 0) return { canceled: true };
    const selectedPath = result.filePaths[0];
    const cfg = loadConfig();
    cfg.backupDirectory = selectedPath;
    saveConfig(cfg);
    return { canceled: false, path: selectedPath };
  });

  ipcMain.handle("settings:get-backup-directory", () => {
    return { path: getBackupsDir() };
  });

  // Settings - Google Drive Config

  ipcMain.handle("settings:gdrive-get-config", () => {
    const cfg = loadConfig();
    return cfg.googleDrive || { clientId: "", clientSecret: "", redirectUri: "", refreshToken: "", autoUpload: false, connected: false };
  });

  ipcMain.handle("settings:gdrive-save-config", (_, gdriveCfg) => {
    const cfg = loadConfig();
    cfg.googleDrive = gdriveCfg;
    saveConfig(cfg);
    return { success: true };
  });
}

module.exports = { registerHandlers };
