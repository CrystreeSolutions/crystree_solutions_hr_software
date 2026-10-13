
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authenticationRoutes = require("./routes/authRoutes");

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.use("/api/auth", authenticationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`HRM backend running on port ${PORT}`);
});
