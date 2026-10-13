
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";
import "./Login.css";
import logo from "../../assets/crystree-solutions-logo.webp";

function HrIllustration() {
  return (
    <div className="hr-illustration" aria-hidden="true">
      <div className="illustration-orbit illustration-orbit-one" />
      <div className="illustration-orbit illustration-orbit-two" />

      <div className="dashboard-illustration">
        <div className="dashboard-header">
          <span />
          <span />
          <span />
          <p>PEOPLE OVERVIEW</p>
        </div>

        <div className="dashboard-content">
          {["A", "R", "M"].map((person, index) => (
            <div className="employee-card" key={person}>
              <div
                className={`employee-avatar ${
                  ["avatar-gold", "avatar-green", "avatar-blue"][index]
                }`}
              >
                {person}
              </div>
              <div className="employee-lines">
                <i />
                <i />
              </div>
              <small>Team member</small>
            </div>
          ))}

          <div className="growth-chart">
            <p>Workforce growth</p>
            <div className="chart-bars">
              {Array.from({ length: 7 }, (_, index) => (
                <i key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="attendance-card">
        <ShieldCheck size={20} />
        <div>
          <b>98.4%</b>
          <small>Attendance</small>
        </div>
      </div>

      <div className="people-card">
        <Users size={20} />
        <div>
          <b>People first</b>
          <small>Every day, together</small>
        </div>
      </div>

      <div className="calendar-card">
        <span>OCTOBER</span>
        <b>13</b>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();

  useEffect(() => {
    const timerId = window.setInterval(
      () => setCurrentTime(new Date()),
      1000
    );

    return () => window.clearInterval(timerId);
  }, []);

const handleSubmit = async (event) => {
  event.preventDefault();
  setMessage("");
  setIsSubmitting(true);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          rememberMe,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      setMessage(data.message || "Unable to sign in.");
      return;
    }

    if (!data.token || !data.user) {
      setMessage("The server returned an invalid login response.");
      return;
    }

    localStorage.removeItem("hrmToken");
    localStorage.removeItem("hrmUser");
    sessionStorage.removeItem("hrmToken");
    sessionStorage.removeItem("hrmUser");

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("hrmToken", data.token);
    storage.setItem("hrmUser", JSON.stringify(data.user));

    navigate("/dashboard", { replace: true });
  } catch (error) {
    console.error("Login error:", error);
    setMessage("Unable to connect to the HRM server. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  const time = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).toLowerCase();

  const date = currentTime.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="login-page">
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

        <HrIllustration />

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
            A thoughtful workspace for your people, processes, and progress
            — all in one place.
          </p>
          <div className="welcome-trust">
            <ShieldCheck size={17} />
            <span>A more connected way to work together</span>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-container">
          <div className="login-logo">
            <img src={logo} alt="Crystree Solutions Private Limited" />
          </div>

          <div className="login-heading">
            <span>WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Enter your work credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="email">
              Work email
            </label>

            <div className="login-input">
              <Mail size={18} aria-hidden="true" />
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="password-heading">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                className="forgot-password"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

            <div className="login-input">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            <div className="login-options">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <span className="secure-label">
                <ShieldCheck size={14} />
                Secure sign in
              </span>
            </div>

            {message && (
              <div className="login-message" role="alert">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={isSubmitting}
            >
              <span>
                {isSubmitting ? "Signing in..." : "Sign in securely"}
              </span>
              <ArrowRight size={19} />
            </button>
          </form>

          <footer className="login-footer">
            <p>
              <b>Need access?</b> Contact your HR administrator.
            </p>
            <div className="footer-links">
              <span>Privacy</span>
              <i />
              <span>Terms</span>
              <i />
              <span>Help &amp; support</span>
            </div>
          </footer>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer-copyright">
          <span>© {new Date().getFullYear()}</span>
          <strong>Crystree Solutions Private Limited</strong>
          <span className="copyright-separator">—</span>
          <span>All Rights Reserved</span>
        </div>

        <div className="site-footer-details">
          <div className="site-footer-developer">
            <span className="site-footer-developed-label">Developed by</span>
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
