const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  const sql = `
    SELECT id, title, author, genre, price, image, featured, coming_soon
    FROM books
    ORDER BY id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ books: rows });
  });
});

router.post('/', (req, res) => {
  const { title, author, genre, price, image, featured, coming_soon } = req.body;
  const sql = `
    INSERT INTO books
      (title, author, genre, price, image, featured, coming_soon)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [title, author, genre, price, image, featured ? 1 : 0, coming_soon ? 1 : 0];
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT * FROM books WHERE id = ?`, [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: e.message });
      res.json({ book: row });
    });
  });
});

router.put('/:id', (req, res) => {
  const { title, author, genre, price, image, featured, coming_soon } = req.body;
  const sql = `
    UPDATE books
    SET title = ?, author = ?, genre = ?, price = ?, image = ?, featured = ?, coming_soon = ?
    WHERE id = ?
  `;
  const params = [title, author, genre, price, image, featured ? 1 : 0, coming_soon ? 1 : 0, req.params.id];
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

router.delete('/:id', (req, res) => {
  db.run(`DELETE FROM books WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;