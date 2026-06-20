const crypto = require("crypto");
const { getDatabase } = require("../database");

const id = () => crypto.randomUUID();

function list() {
  return getDatabase()
    .prepare(
      "SELECT d.*, c.name as company_name, (SELECT COUNT(*) FROM products WHERE distributor_id=d.id) as product_count FROM distributors d LEFT JOIN companies c ON d.company_id=c.id ORDER BY d.name"
    )
    .all();
}

function create(data) {
  const db = getDatabase();
  const i = id();
  db.prepare(
    "INSERT INTO distributors (id,name,phone,company_id) VALUES (?,?,?,?)"
  ).run(i, data.name, data.phone, data.companyId || null);
  return db
    .prepare(
      "SELECT d.*, c.name as company_name FROM distributors d LEFT JOIN companies c ON d.company_id=c.id WHERE d.id=?"
    )
    .get(i);
}

function update(id, data) {
  const db = getDatabase();
  db.prepare(
    "UPDATE distributors SET name=?, phone=?, company_id=? WHERE id=?"
  ).run(data.name, data.phone, data.companyId || null, id);
  return db
    .prepare(
      "SELECT d.*, c.name as company_name FROM distributors d LEFT JOIN companies c ON d.company_id=c.id WHERE d.id=?"
    )
    .get(id);
}

function remove(id) {
  getDatabase().prepare("DELETE FROM distributors WHERE id=?").run(id);
  return { success: true };
}

module.exports = { list, create, update, remove };
