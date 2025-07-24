const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const stripe = require('stripe')('sk_test_51Rel5jP9fb1HIuhDGs6PZ1HR9ui4eK0I8VKXlmeNFdAdGQRujVrxRJUVftIkDopj2Oxfw0Y9xthbm0qkA3YgHd7600FCNBcZqJ');

const db = require('./db'); // Make sure db.js is in the same folder
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/js', express.static(path.join(__dirname, 'js')));


// Test DB Route
app.get('/api/test-db', (req, res) => {
  db.all('SELECT title FROM books LIMIT 5', [], (err, rows) => {
    if (err) return res.status(500).send('DB error: ' + err.message);
    res.json(rows);
  });
});

// ROUTE: Get all books
app.get('/api/books', (req, res) => {
  db.all('SELECT * FROM books', [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to load books' });
    } else {
      res.json({ items: rows });
    }
  });
});

// Get featured books
app.get('/api/books/featured', (req, res) => {
  db.all('SELECT * FROM books WHERE featured = 1', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to load featured books' });
    }
    res.json({ items: rows });
  });
});

// Get coming soon books
app.get('/api/books/coming-soon', (req, res) => {
  db.all('SELECT * FROM books WHERE coming_soon = 1', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to load coming soon books' });
    }
    res.json({ items: rows });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password, remember } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = 'mock-token';
    const cookieOptions = {
      httpOnly: true,
      maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : undefined
    };
    res.cookie('token', token, cookieOptions);
    res.json({ id: user.id, name: user.name, email: user.email });
  });
});

// Register
app.post('/api/register', (req, res) => {
  const {
    name, email, password,
    street, city, state, zip,
    card_number, card_exp, card_cvv,
    promotion_opt_in
  } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, existingUser) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    db.run(`INSERT INTO users
    (name, email, password, street, city, state, zip, card_number, card_exp, card_cvv, promotion_opt_in)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, password, street, city, state, zip, card_number, card_exp, card_cvv, promotion_opt_in],
    (err) => {
      if (err) {
        console.error("Error inserting user:", err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log("User registered successfully");
      res.status(201).json({ message: "User registered successfully" });
    }
        );
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
