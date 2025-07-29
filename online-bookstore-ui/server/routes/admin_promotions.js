
const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

// Middleware to check if user is admin (Highly Recommended)
// Use the same isAdmin function as in admin_users.js and admin_books.js
function isAdmin(req, res, next) {
        next();
}

// GET all promotions
router.get('/', isAdmin, (req, res) => {
    const sql = `
        SELECT id, code, discount_percentage, start_date, end_date, is_active
        FROM promotions
        ORDER BY id;
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('DB Error [admin/promotions GET]:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ promotions: rows });
    });
});

// GET a single promotion by ID
router.get('/:id', isAdmin, (req, res) => {
    const promoId = req.params.id;
    const sql = `
        SELECT id, code, discount_percentage, start_date, end_date, is_active
        FROM promotions
        WHERE id = ?;
    `;
    db.get(sql, [promoId], (err, row) => {
        if (err) {
            console.error('DB Error [admin/promotions GET by ID]:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Promotion not found.' });
        }
        res.json(row);
    });
});


// POST create a new promotion
router.post('/', isAdmin, (req, res) => {
    const { code, discount_percentage, start_date, end_date, is_active } = req.body;

    // Basic validation
    if (!code || typeof discount_percentage === 'undefined' || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required promotion fields.' });
    }
    if (typeof is_active !== 'boolean') { // Ensure is_active is explicitly boolean from frontend
        return res.status(400).json({ error: 'is_active must be a boolean.' });
    }

    const sql = `
        INSERT INTO promotions (code, discount_percentage, start_date, end_date, is_active)
        VALUES (?, ?, ?, ?, ?)
    `;
    // SQLite stores boolean as 0 or 1
    const params = [code, discount_percentage, start_date, end_date, is_active ? 1 : 0];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('DB Error [admin/promotions POST]:', err.message);
            // Handle unique constraint error for code
            if (err.message.includes('UNIQUE constraint failed: promotions.code')) {
                return res.status(409).json({ error: 'Promotion code already exists.' });
            }
            return res.status(500).json({ error: 'Failed to create promotion.' });
        }
        res.status(201).json({ id: this.lastID, message: 'Promotion created successfully.' });
    });
});

// PUT update an existing promotion
router.put('/:id', isAdmin, (req, res) => {
    const promoId = req.params.id;
    const { code, discount_percentage, start_date, end_date, is_active } = req.body;

    // Basic validation
    if (!code || typeof discount_percentage === 'undefined' || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required promotion fields for update.' });
    }
    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active must be a boolean.' });
    }

    const sql = `
        UPDATE promotions
        SET code = ?, discount_percentage = ?, start_date = ?, end_date = ?, is_active = ?
        WHERE id = ?
    `;
    const params = [code, discount_percentage, start_date, end_date, is_active ? 1 : 0, promoId];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('DB Error [admin/promotions PUT]:', err.message);
            // Handle unique constraint error for code
            if (err.message.includes('UNIQUE constraint failed: promotions.code')) {
                return res.status(409).json({ error: 'Promotion code already exists.' });
            }
            return res.status(500).json({ error: 'Failed to update promotion.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Promotion not found or no changes made.' });
        }
        res.json({ message: 'Promotion updated successfully.' });
    });
});

// DELETE a promotion
router.delete('/:id', isAdmin, (req, res) => {
    const promoId = req.params.id;
    const sql = `DELETE FROM promotions WHERE id = ?`;
    db.run(sql, [promoId], function(err) {
        if (err) {
            console.error('DB Error [admin/promotions DELETE]:', err.message);
            return res.status(500).json({ error: 'Failed to delete promotion.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Promotion not found.' });
        }
        res.json({ message: 'Promotion deleted successfully.' });
    });
});

module.exports = router;