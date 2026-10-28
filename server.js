const express = require("express");
const cors = require("cors");
const db = require("./config/db");
require("dotenv").config();

const app = express();

// Middleware to handle requests and security
app.use(cors());
app.use(express.json());
// --- NEW BOOK ROUTES ---
const booksRouter = require("./routes/books");
app.use("/api/books", booksRouter);

// --- NEW STUDENT ROUTES ---
const studentsRouter = require("./routes/students");
app.use("/api/students", studentsRouter);

// --- NEW ISSUE ROUTES ---
const issuesRouter = require("./routes/issues");
app.use("/api/issues", issuesRouter);
// -----------------------
// --- NEW AUTH ROUTES ---
const authRouter = require("./routes/auth");
app.use("/api/auth", authRouter);
// -----------------------

// A simple test route to check our MySQL connection
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1"); // Sends a ping to MySQL
    res.json({
      success: true,
      message: "Server and MySQL are connected"
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  }
});

const PORT = Number(process.env.PORT || 3000);

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});