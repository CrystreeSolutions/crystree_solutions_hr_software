const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const authModel = require("../models/authModel");
const mailTransporter = require("../config/mailTransporter");

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6371000;

  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lon2 - lon1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
    const {
      email,
      password,
      rememberMe = false,
      latitude,
      longitude,
    } = req.body || {};

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

    // Validate credentials first.
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

    // Read the office geofence configuration from backend/.env.
    const officeLatitude = Number(process.env.GEOFENCE_LATITUDE);
    const officeLongitude = Number(process.env.GEOFENCE_LONGITUDE);
    const allowedRadius = Number(process.env.GEOFENCE_RADIUS_METERS);

    if (
      process.env.GEOFENCE_LATITUDE === undefined ||
      process.env.GEOFENCE_LONGITUDE === undefined ||
      process.env.GEOFENCE_RADIUS_METERS === undefined ||
      !Number.isFinite(officeLatitude) ||
      officeLatitude < -90 ||
      officeLatitude > 90 ||
      !Number.isFinite(officeLongitude) ||
      officeLongitude < -180 ||
      officeLongitude > 180 ||
      !Number.isFinite(allowedRadius) ||
      allowedRadius <= 0
    ) {
      console.error("Geofence configuration is invalid.");

      return res.status(500).json({
        success: false,
        message: "Office location is not configured correctly.",
      });
    }

    // Never issue a JWT if coordinates are missing or invalid.
    if (
      latitude === undefined ||
      longitude === undefined ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enable location access to sign in.",
      });
    }

    const distance = calculateDistanceMeters(
      officeLatitude,
      officeLongitude,
      latitude,
      longitude,
    );

    if (distance > allowedRadius) {
      return res.status(403).json({
        success: false,
        message: `Login allowed only within ${allowedRadius} metres of the office.`,
      });
    }

    // Generate the JWT only after the geofence check passes.
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

// async function forgotPassword(req, res) {
//   try {
//     const { email } = req.body || {};

//     if (typeof email !== "string" || !email.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Please enter your registered work email.",
//       });
//     }

//     const normalizedEmail = email.trim().toLowerCase();

//     // Check whether the email exists in MySQL.
//     const user = await authModel.findUserByEmail(normalizedEmail);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Email is not registered. Please enter a registered work email.",
//       });
//     }

//     // Only Super Admin accounts can reset passwords.
//     if (String(user.role).trim().toLowerCase() !== "super admin") {
//       return res.status(403).json({
//         success: false,
//         message:
//           "This account is not authorized to reset the HRM administrator password.",
//       });
//     }

//     // Generate a secure, random reset token.
//     const resetToken = crypto.randomBytes(32).toString("hex");

//     // Store only the token hash in the database.
//     const resetTokenHash = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");

//     const expiry = new Date(Date.now() + 15 * 60 * 1000);

//     await authModel.savePasswordResetToken(user.id, resetTokenHash, expiry);

//     const frontendUrl = (
//       process.env.FRONTEND_URL || "http://localhost:5173"
//     ).replace(/\/+$/, "");

//     const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

//     await mailTransporter.sendMail({
//       from: `"${process.env.MAIL_FROM_NAME || "Crystree Solutions HRM"}" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER}>`,
//       to: normalizedEmail,
//       subject: "Crystree HRM - Reset Your Password",
//       text:
//         "A password reset was requested for your HRM administrator account.\n\n" +
//         `Open this link to set a new password:\n${resetLink}\n\n` +
//         "This link expires in 15 minutes. If you did not request this, ignore this email.",
//       html: `
//         <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;color:#243447;">
//           <h2 style="color:#071C2C;">Crystree HRM</h2>
//           <h3>Reset Your Password</h3>
//           <p>We received a request to reset your administrator password.</p>
//           <p>Click below to choose a new password. This link expires in 15 minutes.</p>
//           <p style="margin:28px 0;">
//             <a href="${resetLink}"
//                style="background:#071C2C;color:white;padding:12px 22px;text-decoration:none;border-radius:6px;">
//               Reset Password
//             </a>
//           </p>
//           <p>If the button does not work, open this link:</p>
//           <p><a href="${resetLink}">${resetLink}</a></p>
//           <p>If you did not request this reset, ignore this email.</p>
//           <p>Regards,<br><strong>Crystree Solutions HRM</strong></p>
//         </div>
//       `,
//     });

//     return res.status(200).json({
//       success: true,
//       message:
//         "Password reset instructions have been sent to your registered email.",
//     });
//   } catch (error) {
//     console.error("Forgot password error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to process the password reset request.",
//     });
//   }
// }

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
  from: `"${process.env.MAIL_FROM_NAME || "Crystree Solutions HRM"}" <${
    process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER
  }>`,
  to: email,
  subject: "Crystree HRM | Password Verification OTP",

  text: `
CRYSTREE HRM
Password Reset Verification

Hello,

We received a request to reset your Crystree HRM account password.

Your verification code is: ${otp}

This code expires in 10 minutes.

Please do not share this code with anyone. If you did not request this reset, you can safely ignore this email.

Regards,
Crystree Solutions HRM Team
Crystree Solutions Private Limited

This is an automated email. Please do not reply.
  `.trim(),

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Crystree HRM - Password Verification</title>
</head>

<body style="margin:0;padding:0;background:#f3f1eb;font-family:Arial,Helvetica,sans-serif;color:#243447;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:#f3f1eb;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:28px 20px;background:#fbf9f3;border-bottom:1px solid #f0eadc;">

              <div style="font-size:25px;font-weight:800;letter-spacing:2px;color:#102b40;">
                CRYSTREE <span style="color:#c79b35;">HRM</span>
              </div>

              <p style="margin:10px 0 0;color:#8d702b;font-size:10px;letter-spacing:2px;">
                PEOPLE · PURPOSE · PROGRESS
              </p>

            </td>
          </tr>

          <!-- Email content -->
          <tr>
            <td style="padding:30px 28px 28px;">

              <h1 style="margin:0;color:#173750;font-size:25px;line-height:1.35;">
                Email Verification
              </h1>

              <div style="width:38px;height:2px;margin:10px 0 18px;background:#c79b35;"></div>

              <p style="margin:0 0 10px;color:#37475a;font-size:14px;line-height:1.7;">
                Hello,
              </p>

              <p style="margin:0 0 22px;color:#37475a;font-size:14px;line-height:1.7;">
                We received a request to reset your Crystree HRM password.
                Please use the following verification code to continue.
              </p>

              <!-- OTP card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#f6f0fa;border-radius:12px;">
                <tr>
                  <td align="center" style="padding:24px 12px;">

                    <p style="margin:0 0 12px;color:#5e5270;font-size:11px;font-weight:bold;letter-spacing:1.5px;">
                      YOUR VERIFICATION CODE
                    </p>

                    <p style="margin:0;color:#173750;font-size:32px;line-height:1.5;font-weight:bold;letter-spacing:8px;">
                      ${otp}
                    </p>

                    <p style="margin:8px 0 0;color:#6d617b;font-size:12px;line-height:1.6;">
                      This OTP is valid for <strong>10 minutes</strong>.
                    </p>

                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="margin-top:18px;">
                <tr>
                  <td width="42" valign="top" align="center">
                    <div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:#c79b35;color:#ffffff;font-size:16px;font-weight:bold;">
                      !
                    </div>
                  </td>

                  <td valign="middle" style="padding-left:8px;color:#667386;font-size:12px;line-height:1.7;">
                    Please do not share this OTP with anyone. Crystree support will never ask you to disclose your verification code.
                  </td>
                </tr>
              </table>

              <p style="margin:22px 0 18px;color:#37475a;font-size:13px;line-height:1.8;">
                If you did not request a password reset, you can safely ignore this email.
                Your password will not change unless the reset process is completed.
              </p>

              <p style="margin:0;color:#37475a;font-size:13px;line-height:1.8;">
                Regards,<br>
                <strong style="color:#173750;">Crystree Solutions HRM Team</strong><br>
                <span style="color:#8290a0;font-size:11px;">People. Purpose. Progress.</span>
              </p>

            </td>
          </tr>

          <!-- Premium footer inspired by Triloka -->
          <tr>
            <td align="center" style="padding:22px 18px 20px;background:#f6f0fa;border-top:1px solid #eae0f0;">

              <p style="margin:0 0 12px;color:#b18425;font-size:9px;font-weight:bold;letter-spacing:2px;">
                POWERED BY
              </p>

              <!-- Replace with the verified public URL of your Crystree logo -->
              <a href="https://crystreesolutions.com/"
                style="display:inline-block;text-decoration:none;">
                <img
                  src="https://crystreesolutions.com/assets/crystree-solutions-logo.webp"
                  alt="Crystree Solutions Private Limited"
                  width="150"
                  style="display:block;width:150px;max-width:100%;height:auto;margin:0 auto;border:0;"
                >
              </a>

              <p style="margin:12px 0 0;color:#8792a0;font-size:10px;line-height:1.7;">
                This is an automated email. Please do not reply directly to this message.
              </p>

              <p style="margin:10px 0 0;color:#8c79a0;font-size:10px;line-height:1.6;">
                © ${new Date().getFullYear()} Crystree Solutions Private Limited
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`,
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
