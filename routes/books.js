const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Route 1: Get all books from the database
router.get("/", async (req, res) => {
  try {
    const [books] = await db.query("SELECT * FROM books ORDER BY created_at DESC");
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Failed to fetch books" });
  }
});

// Route 2: Add a new book to the database
router.post("/", async (req, res) => {
  const { title, author, isbn, category, total_copies } = req.body;
  
  try {
    const copies = total_copies ? parseInt(total_copies) : 1;
    
    const [result] = await db.query(
      "INSERT INTO books (title, author, isbn, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?)",
      [title, author, isbn, category, copies, copies]
    );
    
    res.json({ 
      success: true, 
      message: "Book added successfully!",
      bookId: result.insertId 
    });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ message: "Failed to add book. Make sure ISBN is unique." });
  }
});

module.exports = router;