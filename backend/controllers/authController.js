
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authModel = require("../models/authModel");

// =====================================================
// GENERATE AUTHENTICATION TOKEN
// =====================================================

function generateAuthenticationToken(user, rememberMe) {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters."
    );
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: rememberMe ? "7d" : "1h",
      issuer: "crystree-hrm",
    }
  );
}

// =====================================================
// ADMIN LOGIN
// POST /api/auth/login
// =====================================================

async function loginAdmin(req, res) {
  try {
    const { email, password, rememberMe = false } =
      req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await authModel.findUserByEmail(
      email.trim().toLowerCase()
    );

    if (
      !user ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (
      String(user.role).trim().toLowerCase() !==
      "super admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Super Admin access only.",
      });
    }

    const shouldRemember = rememberMe === true;
    const authenticationToken =
      generateAuthenticationToken(user, shouldRemember);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: authenticationToken,
      expiresIn: shouldRemember ? "7d" : "1h",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to complete login.",
    });
  }
}

// =====================================================
// VERIFY ADMIN AUTHENTICATION
// GET /api/auth/verify-authentication
// =====================================================

async function verifyAdminAuthentication(req, res) {
  try {
    const authenticatedUser =
      await authModel.findUserById(req.user.id);

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: "Administrator account not found.",
      });
    }

    if (
      String(authenticatedUser.role).trim().toLowerCase() !==
      "super admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Super Admin access only.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Authentication verified successfully.",
      user: {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        role: authenticatedUser.role,
      },
    });
  } catch (error) {
    console.error(
      "Authentication verification error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify authentication.",
    });
  }
}

module.exports = {
  loginAdmin,
  verifyAdminAuthentication,
};
