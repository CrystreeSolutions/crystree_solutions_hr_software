
const express = require("express");
const router = express.Router();

const {
  login,
  logout,
  getProfile
} = require("../controllers/adminController");

const verifyToken = require("../middleware/authMiddleware");

// Public endpoint
router.post("/login", login);

// Protected endpoints
router.post("/logout", verifyToken, logout);
router.get("/profile", verifyToken, getProfile);

module.exports = router;
