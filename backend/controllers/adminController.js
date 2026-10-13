
const jwt = require("jsonwebtoken");
const { validateAdmin } = require("../models/adminModel");


const login = (req, res) => {
  try {
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Request body:", req.body);

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        receivedBody: req.body ?? null
      });
    }

    const admin = validateAdmin(email.trim(), password);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        designation: admin.designation
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully."
  });
};

const getProfile = (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin
  });
};

module.exports = {
  login,
  logout,
  getProfile
};


// Sathya Oct 13