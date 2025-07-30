const express = require('express');
const db = require('../db'); 
const util = require('util');
const dbGet = util.promisify(db.get).bind(db);

const router = express.Router();

router.get('/validate', async (req, res) => {
    const { promoCode } = req.query;

    if (!promoCode) {
        return res.status(400).json({ error: 'Promo code is required.' });
    }

    try {
        const now = new Date().toISOString(); // Current time in ISO format
        const sql = `
            SELECT id, code, discount_percentage, start_date, end_date
            FROM promotions
            WHERE code = ? AND start_date <= ? AND end_date >= ?
        `;
        const promotion = await dbGet(sql, [promoCode, now, now]);

        if (promotion) {
            res.json({ success: true, promotion: promotion });
        } else {
            res.status(404).json({ success: false, error: 'Invalid or expired promo code.' });
        }
    } catch (error) {
        console.error('Error validating promo code:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to validate promo code.' });
    }
});


module.exports = router;
