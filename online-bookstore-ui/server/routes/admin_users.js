// server/routes/admin_users.js

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// OPTION B: isAdmin function removed completely.
// WARNING: This makes your admin routes COMPLETELY UNPROTECTED.
// DO NOT use this in a production environment.

// GET all users (for the admin table)
router.get('/', (req, res) => { // isAdmin middleware REMOVED
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
    ORDER BY id;
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
            console.error('DB Error [admin/users GET]:', err.message);
            return res.status(500).json({ error: err.message });
        }
    res.json({ users: rows });
  });
});

// PUT route to update user admin status
router.put('/:id/admin', (req, res) => { // isAdmin middleware REMOVED
    const userId = req.params.id;
    const { is_admin } = req.body;

    if (typeof is_admin !== 'boolean') {
        return res.status(400).json({ error: 'Invalid value for is_admin. Must be true or false.' });
    }

    const sql = `UPDATE users SET is_admin = ? WHERE id = ?`;
    const params = [is_admin ? 1 : 0, userId];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('DB Error [admin/users PUT admin status]:', err.message);
            return res.status(500).json({ error: 'Failed to update admin status.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found or no change made.' });
        }
        res.json({ message: 'User admin status updated successfully.' });
    });
});

// DELETE route to delete a user
router.delete('/:id', (req, res) => { // isAdmin middleware REMOVED
    const userId = req.params.id;

    const sql = `DELETE FROM users WHERE id = ?`;
    db.run(sql, [userId], function(err) {
        if (err) {
            console.error('DB Error [admin/users DELETE]:', err.message);
            return res.status(500).json({ error: 'Failed to delete user.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ message: 'User deleted successfully.' });
    });
});

module.exports = router;