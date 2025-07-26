const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  const sql = `
    SELECT
      id,
      name,
      email,
      street,
      city,
      state,
      zip,
      promotion_opt_in,
      status,
      is_admin
    FROM users
    ORDER BY id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ users: rows });
  });
});

module.exports = router;