const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Route to handle login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check if the username and password match any record in the admins table
    const [admins] = await db.query(
      "SELECT * FROM admins WHERE username = ? AND password = ?",
      [username, password]
    );
    
    if (admins.length > 0) {
      // Match found!
      res.json({ success: true, message: "Login successful" });
    } else {
      // No match found
      res.status(401).json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;