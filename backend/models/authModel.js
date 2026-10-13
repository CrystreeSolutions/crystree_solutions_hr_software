const db = require("../config/database");

async function findUserByEmail(email) {
  const sql = `
    SELECT id, name, email, password_hash, role
    FROM users
    WHERE email = ?
    LIMIT 1
  `;
  const [rows] = await db.execute(sql, [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const sql = `
    SELECT id, name, email, role
    FROM users
    WHERE id = ?
    LIMIT 1
  `;
  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash, role = "Admin" }) {
  const sql = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await db.execute(sql, [name, email, passwordHash, role]);
  return result.insertId;
}

module.exports = { findUserByEmail, findUserById, createUser };
