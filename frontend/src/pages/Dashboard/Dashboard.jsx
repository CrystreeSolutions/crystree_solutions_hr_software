
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import Footer from "../../components/Footer/Footer";
import "./Dashboard.css";

const summaryData = [
  {
    title: "Total Employees",
    count: 128,
    note: "Across all departments",
  },
  {
    title: "Present Today",
    count: 112,
    note: "Attendance overview",
  },
  {
    title: "Pending Leaves",
    count: 8,
    note: "Awaiting approval",
  },
  {
    title: "Open Positions",
    count: 6,
    note: "Recruitment overview",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("hrmToken");
    localStorage.removeItem("hrmUser");

    sessionStorage.removeItem("hrmToken");
    sessionStorage.removeItem("hrmUser");

    navigate("/", { replace: true });
  };

  return (
    <div className="hrm-app">
      <Header />

      <div className="hrm-body">
        <Sidebar />

        <main className="hrm-main">
          <div className="page-heading">
            <div>
              <h1>Dashboard</h1>
              <p>
                Welcome back! Here is your HR overview.
              </p>
            </div>

            <div className="dashboard-actions">
              <span className="demo-badge">
                Demo Data
              </span>

              <button
                type="button"
                className="dashboard-logout-button"
                onClick={handleLogout}
              >
                <span aria-hidden="true">↪</span>
                Logout
              </button>
            </div>
          </div>

          <div className="dashboard-cards">
            {summaryData.map((item) => (
              <div
                className="summary-card"
                key={item.title}
              >
                <p>{item.title}</p>
                <h2>{item.count}</h2>
                <span>{item.note}</span>
              </div>
            ))}
          </div>

          <section className="dashboard-panel">
            <h3>Recent Activities</h3>

            <p>
              New employee registered — Priya Kumar
            </p>

            <p>
              Leave request submitted — Arun Raj
            </p>

            <p>
              Attendance updated — Human Resources
            </p>
          </section>

          <Footer />
        </main>
      </div>
    </div>
  );
}
