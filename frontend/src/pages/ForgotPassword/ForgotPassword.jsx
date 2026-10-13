
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";

import "../Login/Login.css";
import "./ForgotPassword.css";
import logo from "../../assets/crystree-solutions-logo.webp";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/auth`;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const otpInputRefs = useRef([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(
      () => setCurrentTime(new Date()),
      1000
    );

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (step === "otp") {
      otpInputRefs.current[0]?.focus();
    }
  }, [step]);

  const showFeedback = (text, success = false) => {
    setMessage(text);
    setIsSuccess(success);
  };

  // OTP BOX HANDLERS
  const handleOtpChange = (index, value) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length > 1) {
      const pastedOtp = digits.slice(0, 6);

      setOtp(pastedOtp);

      const nextIndex = Math.min(pastedOtp.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const digitsArray = otp.split("");
    digitsArray[index] = digits;

    const updatedOtp = digitsArray.join("").slice(0, 6);
    setOtp(updatedOtp);

    if (digits && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (
      event.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      otpInputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    const pastedOtp = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedOtp) {
      event.preventDefault();
      setOtp(pastedOtp);

      const nextIndex = Math.min(pastedOtp.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    }
  };

  // STEP 1: SEND OTP
  const handleSendOtp = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      showFeedback("Please enter your registered work email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        showFeedback(
          data.message || "Unable to send the verification OTP."
        );
        return;
      }

      setEmail(normalizedEmail);
      setOtp("");
      setStep("otp");

      showFeedback(
        data.message || "OTP sent to your registered email.",
        true
      );
    } catch (error) {
      console.error("Send OTP error:", error);

      showFeedback(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP
  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (!/^\d{6}$/.test(otp)) {
      showFeedback("Please enter the six-digit OTP from your email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-reset-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success || !data.resetToken) {
        showFeedback(data.message || "Invalid or expired OTP.");
        return;
      }

      setResetToken(data.resetToken);
      setStep("password");

      showFeedback(
        "Email verified successfully. Set your new password.",
        true
      );
    } catch (error) {
      console.error("Verify OTP error:", error);

      showFeedback(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: SET NEW PASSWORD
  const handleSetPassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (password.length < 6) {
      showFeedback("Password must be at least 6 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      showFeedback(
        "Password must contain at least one uppercase letter."
      );
      return;
    }

    if (!/[a-z]/.test(password)) {
      showFeedback(
        "Password must contain at least one lowercase letter."
      );
      return;
    }

    if (!/[0-9]/.test(password)) {
      showFeedback("Password must contain at least one number.");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      showFeedback(
        "Password must contain at least one special character."
      );
      return;
    }

    if (!confirmPassword) {
      showFeedback("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      showFeedback("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      showFeedback(
        "Your verification has expired. Please verify your OTP again."
      );
      setOtp("");
      setStep("otp");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resetToken,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        showFeedback(
          data.message || "Unable to reset your password."
        );
        return;
      }

      showFeedback(
        "Password updated successfully. You can now sign in.",
        true
      );

      setPassword("");
      setConfirmPassword("");
      setResetToken("");
      setOtp("");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1800);
    } catch (error) {
      console.error("Reset password error:", error);

      showFeedback(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setMessage("");
    setIsSuccess(false);

    if (step === "password") {
      setPassword("");
      setConfirmPassword("");
      setResetToken("");
      setOtp("");
      setStep("otp");
      return;
    }

    if (step === "otp") {
      setOtp("");
      setStep("email");
      return;
    }

    navigate("/login");
  };

  const time = currentTime
    .toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  const date = currentTime.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="login-page">
      {/* LEFT PANEL */}
        {/* <HrIllustration /> */}
      <section className="login-welcome">
        <div className="welcome-brand">
          <span className="brand-symbol">
            <i />
            <i />
            <i />
          </span>

          <span>
            CRYSTREE <b>HRM</b>
          </span>
        </div>

        <div className="welcome-content">
          <span className="welcome-eyebrow">
            PEOPLE. PURPOSE. PROGRESS.
          </span>

          <h1>
            Great people.
            <br />
            <span>Greater possibilities.</span>
          </h1>

          <p>
            A thoughtful workspace for your people, processes,
            and progress — all in one place.
          </p>

          <div className="welcome-trust">
            <ShieldCheck size={17} />
            <span>A more connected way to work together</span>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="login-form-panel">
        <div className="login-container">
          <div className="login-logo">
            <img
              src={logo}
              alt="Crystree Solutions Private Limited"
            />
          </div>

          {/* STEP 1: EMAIL */}
          {step === "email" && (
            <>
              <div className="login-heading">
                <span>ACCOUNT RECOVERY · STEP 1 OF 3</span>
                <h2>Forgot your password?</h2>
                <p>
                  Enter your registered work email to receive a
                  verification code.
                </p>
              </div>

              <form onSubmit={handleSendOtp}>
                <label className="field-label" htmlFor="forgot-email">
                  Work email
                </label>

                <div className="login-input">
                  <Mail size={18} aria-hidden="true" />

                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                {message && (
                  <div
                    className={`login-message ${
                      isSuccess ? "forgot-success" : ""
                    }`}
                    role="status"
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >
                  <span>
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </span>
                  <ArrowRight size={19} />
                </button>
              </form>
            </>
          )}

          {/* STEP 2: SIX-BOX OTP */}
          {step === "otp" && (
            <>
              <div className="login-heading">
                <span>EMAIL VERIFICATION · STEP 2 OF 3</span>
                <h2>Verify your email</h2>
                <p>
                  Enter the six-digit verification code sent to{" "}
                  <strong>{email}</strong>.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp}>
                <label className="field-label">
                  Verification code
                </label>

                <div
                  className="otp-boxes"
                  role="group"
                  aria-label="Six-digit verification code"
                >
                  {Array.from({ length: 6 }, (_, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpInputRefs.current[index] = element;
                      }}
                      className="otp-box"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      aria-label={`OTP digit ${index + 1}`}
                      autoComplete={
                        index === 0 ? "one-time-code" : "off"
                      }
                      value={otp[index] || ""}
                      onChange={(event) =>
                        handleOtpChange(index, event.target.value)
                      }
                      onKeyDown={(event) =>
                        handleOtpKeyDown(index, event)
                      }
                      onPaste={handleOtpPaste}
                      required
                    />
                  ))}
                </div>

                {message && (
                  <div
                    className={`login-message ${
                      isSuccess ? "forgot-success" : ""
                    }`}
                    role="status"
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >
                  <span>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </span>
                  <ArrowRight size={19} />
                </button>
              </form>
            </>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === "password" && (
            <>
              <div className="login-heading">
                <span>NEW PASSWORD · STEP 3 OF 3</span>
                <h2>Set a new password</h2>
                <p>
                  Your email is verified. Choose a new password
                  for your HRM account.
                </p>
              </div>

              <form onSubmit={handleSetPassword}>
                <label className="field-label" htmlFor="new-password">
                  New password
                </label>

                <div className="login-input otp-password-input">
                  <LockKeyhole size={18} aria-hidden="true" />

                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>

                <label
                  className="field-label otp-confirm-label"
                  htmlFor="confirm-password"
                >
                  Confirm new password
                </label>

                <div className="login-input otp-password-input">
                  <LockKeyhole size={18} aria-hidden="true" />

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>

                {message && (
                  <div
                    className={`login-message ${
                      isSuccess ? "forgot-success" : ""
                    }`}
                    role="status"
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >
                  <span>
                    {loading ? "Updating password..." : "Update password"}
                  </span>
                  <ArrowRight size={19} />
                </button>
              </form>
            </>
          )}

          <div className="forgot-security">
            <ShieldCheck size={16} />
            <span>Secure account recovery</span>
          </div>

          <div className="forgot-back-link">
            <button
              type="button"
              onClick={handleBack}
              className="otp-back-button"
            >
              <ArrowLeft size={17} />
              {step === "email" ? "Back to sign in" : "Back"}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="site-footer-copyright">
          <span>© {new Date().getFullYear()}</span>
          <strong>Crystree Solutions Private Limited</strong>
          <span className="copyright-separator">—</span>
          <span>All Rights Reserved</span>
        </div>

        <div className="site-footer-details">
          <div className="site-footer-developer">
            <span className="site-footer-developed-label">
              Developed by
            </span>

            <a
              className="site-footer-logo-link"
              href="https://crystreesolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={logo} alt="Crystree Solutions" />
            </a>
          </div>

          <span className="site-footer-divider" />
          <time className="site-footer-time">{time}</time>
          <span className="site-footer-divider" />
          <time className="site-footer-date">{date}</time>
          <span className="site-footer-divider" />
          <span className="site-footer-version">v1.0</span>
        </div>
      </footer>
    </main>
  );
}
