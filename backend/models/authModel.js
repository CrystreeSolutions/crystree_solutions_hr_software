
const db = require("../config/database");

// Find user by email
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

// Find user by ID
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

// Create user
async function createUser({
  name,
  email,
  passwordHash,
  role = "Admin",
}) {
  const sql = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    name,
    email,
    passwordHash,
    role,
  ]);

  return result.insertId;
}

// Save hashed password-reset token
async function savePasswordResetToken(
  userId,
  tokenHash,
  expiry
) {
  const sql = `
    UPDATE users
    SET password_reset_token_hash = ?,
        password_reset_expires_at = ?
    WHERE id = ?
  `;

  await db.execute(sql, [tokenHash, expiry, userId]);
}

// Find user using reset-token hash
async function findUserByPasswordResetToken(tokenHash) {
  const sql = `
    SELECT id, name, email, role,
           password_reset_token_hash,
           password_reset_expires_at
    FROM users
    WHERE password_reset_token_hash = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [tokenHash]);
  return rows[0] || null;
}

// Update password and invalidate reset token
async function updatePasswordAndClearResetToken(
  userId,
  passwordHash
) {
  const sql = `
    UPDATE users
    SET password_hash = ?,
        password_reset_token_hash = NULL,
        password_reset_expires_at = NULL
    WHERE id = ?
  `;

  await db.execute(sql, [passwordHash, userId]);
}


async function savePasswordResetOtp(userId, otpHash, expiry) {
  await db.execute(
    `UPDATE users
     SET password_reset_otp_hash = ?,
         password_reset_otp_expires_at = ?,
         password_reset_otp_attempts = 0,
         password_reset_verified_token_hash = NULL,
         password_reset_verified_token_expires_at = NULL
     WHERE id = ?`,
    [otpHash, expiry, userId]
  );
}

async function getPasswordResetOtp(email) {
  const [rows] = await db.execute(
    `SELECT id, email, role, password_reset_otp_hash,
            password_reset_otp_expires_at,
            password_reset_otp_attempts
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function incrementPasswordResetOtpAttempts(userId) {
  await db.execute(
    `UPDATE users
     SET password_reset_otp_attempts = password_reset_otp_attempts + 1
     WHERE id = ?`,
    [userId]
  );
}

async function saveVerifiedPasswordResetToken(
  userId,
  tokenHash,
  expiry
) {
  await db.execute(
    `UPDATE users
     SET password_reset_verified_token_hash = ?,
         password_reset_verified_token_expires_at = ?,
         password_reset_otp_hash = NULL,
         password_reset_otp_expires_at = NULL,
         password_reset_otp_attempts = 0
     WHERE id = ?`,
    [tokenHash, expiry, userId]
  );
}

async function findUserByVerifiedPasswordResetToken(tokenHash) {
  const [rows] = await db.execute(
    `SELECT id, password_reset_verified_token_expires_at
     FROM users
     WHERE password_reset_verified_token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );

  return rows[0] || null;
}

async function updatePasswordAfterOtpVerification(userId, passwordHash) {
  await db.execute(
    `UPDATE users
     SET password_hash = ?,
         password_reset_verified_token_hash = NULL,
         password_reset_verified_token_expires_at = NULL,
         password_reset_otp_hash = NULL,
         password_reset_otp_expires_at = NULL,
         password_reset_otp_attempts = 0
     WHERE id = ?`,
    [passwordHash, userId]
  );
}


module.exports = {
  findUserByEmail,
  findUserById,
  createUser,

  savePasswordResetOtp,
  getPasswordResetOtp,
  incrementPasswordResetOtpAttempts,
  saveVerifiedPasswordResetToken,
  findUserByVerifiedPasswordResetToken,
  updatePasswordAfterOtpVerification,
};
