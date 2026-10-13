const express = require("express");

const {
  loginAdmin,
  verifyAdminAuthentication,
  logoutAdmin,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
} = require("../controllers/authController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginAdmin);

router.get(
  "/verify-authentication",
  verifyToken,
  verifyAdminAuthentication
);

router.post("/logout", verifyToken, logoutAdmin);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyPasswordResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;