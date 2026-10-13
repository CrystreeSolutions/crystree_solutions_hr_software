const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const authModel = require("../models/authModel");
const mailTransporter = require("../config/mailTransporter");

// =====================================================
// GENERATE AUTHENTICATION TOKEN
// =====================================================

function generateAuthenticationToken(user, rememberMe) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
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
    },
  );
}

// =====================================================
// ADMIN LOGIN
// POST /api/auth/login
// =====================================================

async function loginAdmin(req, res) {
  try {
    const { email, password, rememberMe = false } = req.body || {};

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

    const user = await authModel.findUserByEmail(email.trim().toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (String(user.role).trim().toLowerCase() !== "super admin") {
      return res.status(403).json({
        success: false,
        message: "Super Admin access only.",
      });
    }

    const shouldRemember = rememberMe === true;
    const authenticationToken = generateAuthenticationToken(
      user,
      shouldRemember,
    );

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
    const authenticatedUser = await authModel.findUserById(req.user.id);

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: "Administrator account not found.",
      });
    }

    if (String(authenticatedUser.role).trim().toLowerCase() !== "super admin") {
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
    console.error("Authentication verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify authentication.",
    });
  }
}

// =====================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// =====================================================

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered work email.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email exists in MySQL.
    const user = await authModel.findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Email is not registered. Please enter a registered work email.",
      });
    }

    // Only Super Admin accounts can reset passwords.
    if (String(user.role).trim().toLowerCase() !== "super admin") {
      return res.status(403).json({
        success: false,
        message:
          "This account is not authorized to reset the HRM administrator password.",
      });
    }

    // Generate a secure, random reset token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the token hash in the database.
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await authModel.savePasswordResetToken(user.id, resetTokenHash, expiry);

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    await mailTransporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "Crystree Solutions HRM"}" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER}>`,
      to: normalizedEmail,
      subject: "Crystree HRM - Reset Your Password",
      text:
        "A password reset was requested for your HRM administrator account.\n\n" +
        `Open this link to set a new password:\n${resetLink}\n\n` +
        "This link expires in 15 minutes. If you did not request this, ignore this email.",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;color:#243447;">
          <h2 style="color:#071C2C;">Crystree HRM</h2>
          <h3>Reset Your Password</h3>
          <p>We received a request to reset your administrator password.</p>
          <p>Click below to choose a new password. This link expires in 15 minutes.</p>
          <p style="margin:28px 0;">
            <a href="${resetLink}"
               style="background:#071C2C;color:white;padding:12px 22px;text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>
          <p>If the button does not work, open this link:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request this reset, ignore this email.</p>
          <p>Regards,<br><strong>Crystree Solutions HRM</strong></p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset instructions have been sent to your registered email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process the password reset request.",
    });
  }
}

// =====================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// =====================================================

async function resetPassword(req, res) {
  try {
    const { resetToken, password } = req.body || {};

    if (
      typeof resetToken !== "string" ||
      typeof password !== "string" ||
      !resetToken ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Verified reset token and new password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user =
      await authModel.findUserByVerifiedPasswordResetToken(tokenHash);

    if (
      !user ||
      !user.password_reset_verified_token_expires_at ||
      new Date(user.password_reset_verified_token_expires_at).getTime() <=
        Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification expired. Please verify your email again.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await authModel.updatePasswordAfterOtpVerification(user.id, passwordHash);

    return res.json({
      success: true,
      message: "Password updated successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to reset your password.",
    });
  }
}

function logoutAdmin(req, res) {
  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully.",
  });
}

async function forgotPassword(req, res) {
  try {
    const email = req.body?.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered work email.",
      });
    }

    const user = await authModel.findUserByEmail(email);

    if (!user || String(user.role).trim().toLowerCase() !== "super admin") {
      return res.status(404).json({
        success: false,
        message: "Email is not registered for Super Admin access.",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await authModel.savePasswordResetOtp(user.id, otpHash, expiry);

    await mailTransporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "Crystree HRM"}" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER}>`,
      to: email,
      subject: "Crystree HRM - Password Verification OTP",
      text: `Your password reset OTP is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px">
          <h2>Crystree HRM</h2>
          <p>Your password reset verification code is:</p>
          <h1 style="letter-spacing:8px">${otp}</h1>
          <p>This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: "OTP sent to your registered email.",
    });
  } catch (error) {
    console.error("Send reset OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to send the verification OTP.",
    });
  }
}

async function verifyPasswordResetOtp(req, res) {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter your registered email and six-digit OTP.",
      });
    }

    const user = await authModel.getPasswordResetOtp(email);

    if (
      !user ||
      String(user.role).trim().toLowerCase() !== "super admin" ||
      !user.password_reset_otp_hash ||
      !user.password_reset_otp_expires_at ||
      new Date(user.password_reset_otp_expires_at).getTime() <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired. Request a new OTP.",
      });
    }

    if (user.password_reset_otp_attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    const submittedHash = crypto.createHash("sha256").update(otp).digest("hex");

    if (submittedHash !== user.password_reset_otp_hash) {
      await authModel.incrementPasswordResetOtpAttempts(user.id);

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP. Please try again.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await authModel.saveVerifiedPasswordResetToken(
      user.id,
      resetTokenHash,
      expiry,
    );

    return res.json({
      success: true,
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify the OTP.",
    });
  }
}

module.exports = {
  loginAdmin,
  verifyAdminAuthentication,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  logoutAdmin,
};
