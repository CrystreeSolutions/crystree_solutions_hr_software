
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HRM Backend API is running"
  });
});

// Admin APIs
app.use("/api/admin", adminRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

app.listen(PORT, () => {
  console.log(`HRM backend running on http://localhost:${PORT}`);
});
