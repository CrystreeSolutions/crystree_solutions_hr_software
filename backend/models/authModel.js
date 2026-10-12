
const db = require("../config/database");

const findUserByEmail = async (email) => {
    const sql = `
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = ?
        LIMIT 1
    `;

    const [rows] = await db.execute(sql, [email]);
    return rows[0] || null;
};

module.exports = {
    findUserByEmail
};
