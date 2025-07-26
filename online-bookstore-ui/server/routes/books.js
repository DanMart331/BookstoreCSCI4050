const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/featured', (req, res) => {
  const sql = `
    SELECT
      id,
      title,
      author,
      genre,
      price,
      image,
      description
    FROM books
    WHERE featured = 1
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('DB Error [GET /featured]:', err.message);
      return res.status(500).json({ error: 'Failed to fetch featured books' });
    }
    res.json({ items: rows });
  });
});

router.get('/coming-soon', (req, res) => {
  const sql = `
    SELECT
      id,
      title,
      author,
      genre,
      price,
      image,
      description
    FROM books
    WHERE coming_soon = 1
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('DB Error [GET /coming-soon]:', err.message);
      return res.status(500).json({ error: 'Failed to fetch coming‑soon books' });
    }
    res.json({ items: rows });
  });
});

router.get('/search', (req, res) => {
  const q = req.query.q || '';
  const wildcard = `%${q}%`;
  const sql = `
    SELECT
      id,
      title,
      author,
      genre,
      price,
      image,
      description
    FROM books
    WHERE title LIKE ? OR author LIKE ?
  `;
  db.all(sql, [wildcard, wildcard], (err, rows) => {
    if (err) {
      console.error('DB Error [GET /search]:', err.message);
      return res.status(500).json({ error: 'Failed to search books' });
    }
    res.json({ items: rows });
  });
});


router.get('/:id', (req, res) => {
  const sql = `
    SELECT
      id,
      title,
      author,
      genre,
      price,
      image,
      description
    FROM books
    WHERE id = ?
  `;
  db.get(sql, [req.params.id], (err, book) => {
    if (err) {
      console.error('DB Error [GET /:id]:', err.message);
      return res.status(500).json({ error: 'Failed to fetch book details' });
    }
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  });
});

module.exports = router;