
const express = require("express");

const {
  loginAdmin,
  verifyAdminAuthentication,
} = require("../controllers/authController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// ADMIN LOGIN
// PUBLIC API
// =====================================================

router.post("/login", loginAdmin);

// =====================================================
// VERIFY ADMIN AUTHENTICATION
// PROTECTED API
// =====================================================

router.get(
  "/verify-authentication",
  verifyToken,
  verifyAdminAuthentication
);

module.exports = router;
