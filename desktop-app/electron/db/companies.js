const crypto = require("crypto");
const { getDatabase } = require("../database");

const id = () => crypto.randomUUID();

function list() {
  return getDatabase()
    .prepare(
      "SELECT c.*, (SELECT COUNT(*) FROM products WHERE company=c.name) as product_count FROM companies c ORDER BY c.name"
    )
    .all();
}

function create(data) {
  const db = getDatabase();
  const i = id();
  db.prepare(
    "INSERT INTO companies (id,name,phone,address,second_number) VALUES (?,?,?,?,?)"
  ).run(i, data.name, data.phone, data.address || "", data.second_number || "");
  return db.prepare("SELECT * FROM companies WHERE id=?").get(i);
}

function update(id, data) {
  const db = getDatabase();
  db.prepare(
    "UPDATE companies SET name=?, phone=?, address=?, second_number=? WHERE id=?"
  ).run(data.name, data.phone, data.address || "", data.second_number || "", id);
  return db.prepare("SELECT * FROM companies WHERE id=?").get(id);
}

function remove(id) {
  getDatabase().prepare("DELETE FROM companies WHERE id=?").run(id);
  return { success: true };
}

module.exports = { list, create, update, remove };
