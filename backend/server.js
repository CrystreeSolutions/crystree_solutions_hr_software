require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/database");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "HR Management API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

async function startServer() {
    try {
        await db.query("SELECT 1");

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

startServer();