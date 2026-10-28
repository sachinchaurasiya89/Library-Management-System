const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Route 1: Get all students
router.get("/", async (req, res) => {
  try {
    const [students] = await db.query("SELECT * FROM students ORDER BY created_at DESC");
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

// Route 2: Add a new student
router.post("/", async (req, res) => {
  const { name, roll_number, email } = req.body;
  
  try {
    const [result] = await db.query(
      "INSERT INTO students (name, roll_number, email) VALUES (?, ?, ?)",
      [name, roll_number, email]
    );
    
    res.json({ 
      success: true, 
      message: "Student added successfully!",
      studentId: result.insertId 
    });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ message: "Failed to add student. Roll number must be unique." });
  }
});

module.exports = router;
