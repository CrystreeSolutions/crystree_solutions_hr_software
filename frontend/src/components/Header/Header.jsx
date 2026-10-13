
import "./Header.css";

export default function Header() {
  return (
    <header className="hrm-header">
      <div className="header-brand">
        <div className="header-logo">C</div>
        <div>
          <h2>CRYSTREE HRM</h2>
          <p>Human Resource Management</p>
        </div>
      </div>

      <div className="header-actions">
        <button className="notification-button" aria-label="Notifications">
          ♧
        </button>

        <div className="header-profile">
          <div className="profile-avatar">SA</div>
          <div className="profile-details">
            <strong>Super Admin</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
