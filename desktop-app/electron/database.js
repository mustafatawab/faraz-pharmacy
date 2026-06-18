const path = require("path");
const os = require("os");
const fs = require("fs");
const crypto = require("crypto");

let db = null;

function getDataDir() {
  return process.env.FARAZ_DATA_DIR || path.join(os.homedir(), ".faraz-pharmacy");
}

function ensureDataDir() {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getDbPath() {
  ensureDataDir();
  return path.join(getDataDir(), "faraz-pharmacy.db");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const computed = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === computed;
}

function generateToken() {
  return crypto.randomUUID() + crypto.randomUUID();
}

function initializeDatabase() {
  const Database = require("better-sqlite3");
  db = new Database(getDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, barcode TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      company TEXT NOT NULL, distributor_id TEXT, sale_price REAL NOT NULL DEFAULT 0,
      purchase_price REAL NOT NULL DEFAULT 0, stock_qty INTEGER NOT NULL DEFAULT 0,
      expiry TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS distributors (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, contact TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, contact TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY, customer_id TEXT, subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0, change REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'paid',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY, sale_id TEXT NOT NULL, product_id TEXT NOT NULL,
      product_name TEXT NOT NULL, barcode TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1, unit_price REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS arrears (
      id TEXT PRIMARY KEY, sale_id TEXT NOT NULL, customer_id TEXT NOT NULL,
      total_bill REAL NOT NULL DEFAULT 0, amount_paid REAL NOT NULL DEFAULT 0,
      balance_due REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS stock_purchases (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL, distributor_id TEXT,
      quantity INTEGER NOT NULL DEFAULT 0, purchase_price REAL NOT NULL DEFAULT 0,
      expiry TEXT, total_value REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY, sale_id TEXT NOT NULL, refund_amount REAL NOT NULL DEFAULT 0,
      reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS return_items (
      id TEXT PRIMARY KEY, return_id TEXT NOT NULL, product_id TEXT NOT NULL,
      product_name TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 0,
      refund_amount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      access_token TEXT UNIQUE NOT NULL, refresh_token TEXT UNIQUE NOT NULL,
      csrf_token TEXT NOT NULL,
      access_expires_at TEXT NOT NULL, refresh_expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  try { db.exec("ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN location TEXT NOT NULL DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN active INTEGER NOT NULL DEFAULT 1"); } catch {}
  try { db.exec("ALTER TABLE customers ADD COLUMN address TEXT NOT NULL DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE companies ADD COLUMN second_number TEXT NOT NULL DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE distributors ADD COLUMN company_id TEXT REFERENCES companies(id)"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN markup_percent REAL NOT NULL DEFAULT 20"); } catch {}
  try { db.exec("ALTER TABLE stock_purchases ADD COLUMN company_id TEXT REFERENCES companies(id)"); } catch {}
  try { db.exec("ALTER TABLE stock_purchases ADD COLUMN invoice_number TEXT NOT NULL DEFAULT ''"); } catch {}

  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get();
  if (userCount.c === 0) seed();

  const productCount = db.prepare("SELECT COUNT(*) as c FROM products").get();
  if (productCount.c === 0) seedProducts();

  return db;
}

function seed() {
  const now = new Date().toISOString();
  db.prepare("INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?,?,?,?,?)")
    .run("u1", "admin", hashPassword("admin123"), "admin", now);
}

function seedProducts() {
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    const ip = db.prepare("INSERT INTO products (id, barcode, name, company, category, location, sale_price, purchase_price, stock_qty, expiry, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    ip.run("p1","8901234567890","Amoxicillin 500mg","GSK","Tablets","Shelf A1",120,80,45,"2026-12-31",now);
    ip.run("p2","8901234567891","Paracetamol 500mg","Pfizer","Tablets","Shelf A2",50,30,120,"2027-06-30",now);
    ip.run("p3","8901234567892","Omeprazole 20mg","Abbott","Capsules","Shelf B1",85,55,3,"2026-09-15",now);
    ip.run("p4","8901234567893","Atorvastatin 10mg","Pfizer","Tablets","Shelf A2",150,100,28,"2027-03-20",now);
    ip.run("p5","8901234567894","Metformin 500mg","Sanofi","Tablets","Shelf A3",60,35,67,"2026-11-30",now);
    ip.run("p6","8901234567895","Losartan 50mg","MSD","Tablets","Shelf A1",95,65,15,"2026-07-31",now);
    ip.run("p7","8901234567896","Aspirin 75mg","Bayer","Tablets","Shelf B2",30,18,200,"2028-01-15",now);

    const id = db.prepare("INSERT INTO distributors (id, name, contact, phone, address, created_at) VALUES (?,?,?,?,?,?)");
    id.run("d1","HealthPlus Distributors","Mr. Ali Raza","0300-1111111","Karachi",now);
    id.run("d2","MediCare Supply Co.","Mr. Usman Khan","0300-2222222","Lahore",now);
    id.run("d3","PharmaLink Trading","Mrs. Fatima Ahmed","0300-3333333","Islamabad",now);

    const ic = db.prepare("INSERT INTO customers (id, name, phone, created_at) VALUES (?,?,?,?)");
    ic.run("c1","Ahmed Khan","0300-1234567",now);
    ic.run("c2","Fatima Ali","0301-2345678",now);
    ic.run("c3","Usman Raza","0302-3456789",now);
    ic.run("c4","Sara Mahmood","0303-4567890",now);
  });
  tx();
}

function getDatabase() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

module.exports = { initializeDatabase, getDatabase, verifyPassword, generateToken, hashPassword, getDataDir, getDbPath };
