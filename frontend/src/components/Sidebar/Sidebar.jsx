import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const menuItems = [
  { label: "Dashboard", icon: "▦", path: "/dashboard" },
  { label: "Employees", icon: "♙", path: "/employees" },
  { label: "Departments", icon: "▤", path: "/departments" },
  { label: "Attendance", icon: "◷", path: "/attendance" },
  { label: "Leave Management", icon: "▣", path: "/leave" },
  { label: "Payroll", icon: "₹", path: "/payroll" },
  { label: "Recruitment", icon: "♧", path: "/recruitment" },
  { label: "Reports", icon: "▥", path: "/reports" },
  { label: "Settings", icon: "⚙", path: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="hrm-sidebar">
      <p className="sidebar-heading">MAIN MENU</p>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <span className="status-indicator"></span>
        <div>
          <strong>System Status</strong>
          <p>All systems operational</p>
        </div>
      </div>
    </aside>
  );
}