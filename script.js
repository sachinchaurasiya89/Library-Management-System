// --- SECURITY CHECK ---
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "login.html"; // Kick unauthorized users to login page
}

// --- LOGOUT FUNCTION ---
function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}
// ----------------------
let books = [];
let students = [];
let transactions = [];
let currentPage = "Dashboard";

const dataTable = document.getElementById("dataTable");
const tableHead = document.getElementById("tableHead");
const searchInput = document.getElementById("searchInput");
const mainActionBtn = document.getElementById("mainActionBtn");
const toast = document.getElementById("toast");

// Modals
const bookDialog = document.getElementById("bookDialog");
const bookForm = document.getElementById("bookForm");
const studentDialog = document.getElementById("studentDialog");
const studentForm = document.getElementById("studentForm");
const issueDialog = document.getElementById("issueDialog");
const issueForm = document.getElementById("issueForm");

// --- API FETCH FUNCTIONS ---
async function fetchBooks() {
  try {
    const res = await fetch("http://localhost:3000/api/books");
    books = await res.json();
    if (currentPage === "Dashboard" || currentPage === "Books") renderBooks(searchInput.value);
    updateStats();
  } catch (err) { console.error(err); }
}

async function fetchStudents() {
  try {
    const res = await fetch("http://localhost:3000/api/students");
    students = await res.json();
    if (currentPage === "Students") renderStudents(searchInput.value);
    updateStats();
  } catch (err) { console.error(err); }
}

async function fetchTransactions() {
  try {
    const res = await fetch("http://localhost:3000/api/issues");
    transactions = await res.json();
    if (currentPage === "Issue & Return") renderTransactions(searchInput.value);
  } catch (err) { console.error(err); }
}

// --- RENDER FUNCTIONS ---
function renderBooks(query = "") {
  const term = query.trim().toLowerCase();
  // 👇 UPDATE THE HEADERS 👇
  tableHead.innerHTML = `<tr><th>BOOK DETAILS</th><th>CATEGORY</th><th>BOOK ID</th><th>COPIES</th><th>STATUS</th></tr>`;
  
  const filtered = books.filter(b => `${b.title} ${b.author} ${b.category} BK${b.id}`.toLowerCase().includes(term));
  dataTable.replaceChildren();

  filtered.forEach(book => {
    const row = document.createElement("tr");
    const isAvail = book.available_copies > 0;
    // 👇 ADD THE COPIES CELL TO THE ROW 👇
    row.innerHTML = `
      <td><div class="book-name">${book.title}</div><div class="book-author">by ${book.author}</div></td>
      <td>${book.category || "Other"}</td>
      <td>BK${String(book.id).padStart(3, "0")}</td>
      <td><strong>${book.available_copies}</strong> / ${book.total_copies}</td>
      <td><span class="status ${isAvail ? "available" : "issued"}">${isAvail ? "Available" : "Issued"}</span></td>
    `;
    dataTable.append(row);
  });
  document.getElementById("emptyMessage").classList.toggle("hidden", filtered.length === 0);
}

function renderStudents(query = "") {
  const term = query.trim().toLowerCase();
  tableHead.innerHTML = `<tr><th>STUDENT NAME</th><th>ROLL NUMBER</th><th>EMAIL</th><th>MEMBER ID</th></tr>`;
  
  const filtered = students.filter(s => `${s.name} ${s.roll_number} ST${s.id}`.toLowerCase().includes(term));
  dataTable.replaceChildren();

  filtered.forEach(student => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><div class="book-name">${student.name}</div></td>
      <td>${student.roll_number}</td>
      <td>${student.email || "N/A"}</td>
      <td>ST${String(student.id).padStart(3, "0")}</td>
    `;
    dataTable.append(row);
  });
  document.getElementById("emptyMessage").classList.toggle("hidden", filtered.length === 0);
}

function renderTransactions(query = "") {
  const term = query.trim().toLowerCase();
  // UPDATE 1: Added "RETURNED BY & DATE" to the headers
  tableHead.innerHTML = `<tr><th>BOOK TITLE</th><th>STUDENT</th><th>DUE DATE</th><th>RETURNED BY & DATE</th><th>STATUS / ACTION</th></tr>`;
  
  const filtered = transactions.filter(t => `${t.book_title} ${t.student_name} ${t.roll_number}`.toLowerCase().includes(term));
  dataTable.replaceChildren();

  filtered.forEach(t => {
    const row = document.createElement("tr");
    const isIssued = t.status === 'issued';
    let issuedByText = t.issued_by ? t.issued_by : "Unknown";
    // UPDATE 2: Format the return date and admin name
    let returnDateText = t.return_date ? new Date(t.return_date).toLocaleString() : "Not returned yet";
    let returnedByText = t.returned_by ? t.returned_by : "Pending";

    // Create the Return button only if the book is currently issued
    let actionHTML = `<span class="status available">Returned</span>`;
    if (isIssued) {
      actionHTML = `<button onclick="returnBook(${t.id})" class="primary-btn" style="padding: 6px 12px; font-size: 11px;">Return Book</button>`;
    }

    // UPDATE 3: Added the new cell to the row HTML
    row.innerHTML = `
      <td><div class="book-name">${t.book_title}</div></td>
      <td><div class="book-name">${t.student_name}</div><div class="book-author">${t.roll_number}</div></td>
      <td>${new Date(t.due_date).toLocaleDateString()}</td>
      <td><strong>${returnedByText}</strong><br><small class="muted" style="color: gray;">${returnDateText}</small></td>
      <td><strong>${issuedByText}</strong></td>
      <td>${actionHTML}</td>
    `;
    dataTable.append(row);
  });
  document.getElementById("emptyMessage").classList.toggle("hidden", filtered.length === 0);
}

function renderPlaceholder(pageName) {
  if (pageName === "Reports") {
    // 1. Setup Headers for the Report
    document.getElementById("sectionTitle").textContent = "Library Reports";
    document.getElementById("tableTitle").textContent = "Overdue Books";
    tableHead.innerHTML = `<tr><th>BOOK TITLE</th><th>STUDENT</th><th>DUE DATE</th><th>DAYS OVERDUE</th></tr>`;

    // 2. Calculate overdue books
    const today = new Date();
    // Set time to midnight so we strictly compare dates
    today.setHours(0, 0, 0, 0); 
    
    const overdue = transactions.filter(t => {
        const dueDate = new Date(t.due_date);
        return t.status === 'issued' && dueDate < today;
    });

    // 3. Build the table rows
    dataTable.replaceChildren();
    if (overdue.length === 0) {
        dataTable.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 30px; color: green;">✔ No overdue books right now!</td></tr>`;
    } else {
        overdue.forEach(t => {
            const due = new Date(t.due_date);
            const diffTime = Math.abs(today - due);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><div class="book-name">${t.book_title}</div></td>
                <td>${t.student_name}</td>
                <td style="color: #ff4757; font-weight: bold;">${due.toLocaleDateString()}</td>
                <td><strong>${diffDays} days</strong></td>
            `;
            dataTable.append(row);
        });
    }
    document.getElementById("emptyMessage").classList.add("hidden");
  } else {
    // Fallback for any other empty pages
    tableHead.innerHTML = "";
    dataTable.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 30px;">${pageName} content will be added here.</td></tr>`;
    document.getElementById("emptyMessage").classList.add("hidden");
  }
}

function updateStats() {
  document.getElementById("totalBooks").textContent = books.length;
  document.getElementById("totalStudents").textContent = students.length;
  const available = books.filter(b => b.available_copies > 0).length;
  document.getElementById("issuedBooks").textContent = books.length - available;
  document.getElementById("availableBooks").textContent = available;
}

// --- POPULATE ISSUE FORM ---
function populateIssueDropdowns() {
  const bookSelect = document.getElementById("issueBookSelect");
  const studentSelect = document.getElementById("issueStudentSelect");
  
  // Clear existing options
  bookSelect.innerHTML = '<option value="" disabled selected>Select a book...</option>';
  studentSelect.innerHTML = '<option value="" disabled selected>Select a student...</option>';
  
  // Add only available books
  books.filter(b => b.available_copies > 0).forEach(book => {
    bookSelect.innerHTML += `<option value="${book.id}">${book.title} (BK${String(book.id).padStart(3, "0")})</option>`;
  });
  
  // Add all students
  students.forEach(student => {
    studentSelect.innerHTML += `<option value="${student.id}">${student.name} (${student.roll_number})</option>`;
  });
}

// --- RETURN BOOK FUNCTION (Global for inline button) ---
window.returnBook = async function(issueId) {
  // Grab the admin's name from localStorage
  const activeAdmin = localStorage.getItem("activeAdmin") || "Unknown Admin";

  try {
    const res = await fetch(`http://localhost:3000/api/issues/return/${issueId}`, { 
      method: "POST", // Matching your backend setup
      headers: { "Content-Type": "application/json" }, // Tell the server we are sending JSON data
      body: JSON.stringify({ returned_by: activeAdmin }) // Send the admin's name
    });
    
    const result = await res.json();
    if (result.success) {
      showToast(`Book returned successfully by ${activeAdmin}!`);
      fetchBooks();
      fetchTransactions();
    } else {
      showToast(result.message);
    }
  } catch (error) {
    showToast("Server error during return.");
  }
}

// --- EVENT LISTENERS ---
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

searchInput.addEventListener("input", e => {
  if (currentPage === "Students") renderStudents(e.target.value);
  else if (currentPage === "Issue & Return") renderTransactions(e.target.value);
  else if (currentPage === "Dashboard" || currentPage === "Books") renderBooks(e.target.value);
});

mainActionBtn.addEventListener("click", () => {
  if (currentPage === "Students") {
    studentForm.reset();
    studentDialog.showModal();
  } else if (currentPage === "Issue & Return") {
    issueForm.reset();
    populateIssueDropdowns();
    issueDialog.showModal();
  } else {
    bookForm.reset();
    bookDialog.showModal();
  }
});

document.getElementById("cancelBookBtn").addEventListener("click", () => bookDialog.close());
document.getElementById("cancelStudentBtn").addEventListener("click", () => studentDialog.close());
document.getElementById("cancelIssueBtn").addEventListener("click", () => issueDialog.close());

// Add Book
// Add Book
bookForm.addEventListener("submit", async e => {
  e.preventDefault();
  
  // Grab the number from the new input
  const copiesInput = parseInt(document.getElementById("bookCopies").value) || 1;
  
  const newBook = {
    title: document.getElementById("bookName").value.trim(),
    author: document.getElementById("bookAuthor").value.trim(),
    category: document.getElementById("bookCategory").value,
    isbn: "ISBN-" + Date.now(),
    total_copies: copiesInput,        // Send the actual amount
    available_copies: copiesInput    // Initially, all copies are available
  };
  
  // (Keep the rest of your try/catch block exactly the same)
  try {
    const res = await fetch("http://localhost:3000/api/books", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newBook)
    });
    if ((await res.json()).success) {
      bookDialog.close();
      showToast("Book saved!");
      fetchBooks();
    }
  } catch (err) { showToast("Server error."); }
});

// Add Student
studentForm.addEventListener("submit", async e => {
  e.preventDefault();
  const newStudent = {
    name: document.getElementById("studentName").value.trim(),
    roll_number: document.getElementById("studentRoll").value.trim().toUpperCase(),
    email: document.getElementById("studentEmail").value.trim()
  };
  try {
    const res = await fetch("http://localhost:3000/api/students", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newStudent)
    });
    if ((await res.json()).success) {
      studentDialog.close();
      showToast("Student saved!");
      fetchStudents();
    }
  } catch (err) { showToast("Server error."); }
});

// Issue Book
issueForm.addEventListener("submit", async e => {
  e.preventDefault();
  const issueData = {
    book_id: document.getElementById("issueBookSelect").value,
    student_id: document.getElementById("issueStudentSelect").value,
    due_date: document.getElementById("issueDueDate").value,
    issued_by: localStorage.getItem("activeAdmin") || "Unknown Admin"
  };
  try {
    const res = await fetch("http://localhost:3000/api/issues/issue", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(issueData)
    });
    const result = await res.json();
    if (result.success) {
      issueDialog.close();
      showToast("Book issued successfully!");
      fetchBooks();
      fetchTransactions();
    } else {
      showToast(result.message);
    }
  } catch (err) { showToast("Server error."); }
});

// Sidebar Navigation
document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    
    currentPage = button.dataset.page;
    document.getElementById("pageTitle").textContent = currentPage;
    searchInput.value = "";
    mainActionBtn.style.display = "block";

    if (currentPage === "Students") {
      document.getElementById("sectionTitle").textContent = "Student Directory";
      document.getElementById("tableTitle").textContent = "Registered Students";
      mainActionBtn.textContent = "+ Add a student";
      renderStudents();
    } else if (currentPage === "Issue & Return") {
      document.getElementById("sectionTitle").textContent = "Lending Management";
      document.getElementById("tableTitle").textContent = "Transaction History";
      mainActionBtn.textContent = "+ Issue Book";
      renderTransactions();
    } else if (currentPage === "Dashboard" || currentPage === "Books") {
      document.getElementById("sectionTitle").textContent = "Library overview";
      document.getElementById("tableTitle").textContent = "Book catalogue";
      mainActionBtn.textContent = "+ Add a book";
      renderBooks();
    } else {
      mainActionBtn.style.display = "none";
      renderPlaceholder(currentPage);
    }
  });
});

// Initial Load
fetchBooks();
fetchStudents();
fetchTransactions();
// --- SET ACTIVE ADMIN PROFILE ---
const activeAdmin = localStorage.getItem("activeAdmin");
if (activeAdmin) {
  // Change the name to the logged-in username
  document.getElementById("adminNameDisplay").textContent = activeAdmin;
  // Change the avatar circle to the first letter of the username
  document.getElementById("adminAvatar").textContent = activeAdmin.charAt(0).toUpperCase();
}