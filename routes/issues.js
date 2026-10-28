const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Route 1: Get all issued and returned books
router.get("/", async (req, res) => {
  try {
    // We use JOIN to get the actual book titles and student names instead of just their IDs
    const query = `
      SELECT issues.*, books.title as book_title, students.name as student_name, students.roll_number
      FROM issues
      JOIN books ON issues.book_id = books.id
      JOIN students ON issues.student_id = students.id
      ORDER BY issues.issue_date DESC
    `;
    const [transactions] = await db.query(query);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// Route 2: Issue a book to a student
router.post("/issue", async (req, res) => {
  const { book_id, student_id, due_date, issued_by } = req.body;
  const issue_date = new Date().toISOString().split('T')[0]; // Current date

  try {
    // 1. Check if the book is actually available
    const [books] = await db.query("SELECT available_copies FROM books WHERE id = ?", [book_id]);
    if (books.length === 0 || books[0].available_copies <= 0) {
      return res.status(400).json({ success: false, message: "Book is out of stock!" });
    }

    // 2. Create the issue record
    await db.query(
      "INSERT INTO issues (book_id, student_id, issue_date, due_date, status, issued_by) VALUES (?, ?, ?, ?, 'issued', ?)",
      [book_id, student_id, issue_date, due_date, issued_by]
    );

    // 3. Decrease the available copies by 1
    await db.query("UPDATE books SET available_copies = available_copies - 1 WHERE id = ?", [book_id]);

    res.json({ success: true, message: "Book issued successfully!" });
  } catch (error) {
    console.error("Error issuing book:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Route 3: Return a book
router.post("/return/:id", async (req, res) => {
  const issueId = req.params.id;
  const { returned_by } = req.body;
  const return_date = new Date().toISOString().split('T')[0]; // Current date

  try {
    // 1. Find the issue record to know which book was borrowed
    const [issues] = await db.query("SELECT book_id, status FROM issues WHERE id = ?", [issueId]);
    if (issues.length === 0 || issues[0].status === 'returned') {
      return res.status(400).json({ success: false, message: "Invalid record or already returned." });
    }

    const bookId = issues[0].book_id;

    // 2. Update the issue status to 'returned'
    await db.query(
    "UPDATE issues SET status = 'Returned', returned_by = ?, return_date = NOW() WHERE id = ?", 
    [returned_by, issueId]
  );

    // 3. Increase the available copies by 1
    await db.query("UPDATE books SET available_copies = available_copies + 1 WHERE id = ?", [bookId]);

    res.json({ success: true, message: "Book returned successfully!" });
  } catch (error) {
    console.error("Error returning book:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;