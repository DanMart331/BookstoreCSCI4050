const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

let transporter;
(async () => {
  const test = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: test.smtp.host, port: test.smtp.port,
    secure: test.smtp.secure,
    auth: { user: test.user, pass: test.pass }
  });
})();


function isAdmin(req, res, next) {
    next();
}

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

router.post('/', isAdmin, (req, res) => {
    const { code, discount_percentage, start_date, end_date, is_active } = req.body;

    if (!code || typeof discount_percentage === 'undefined' || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required promotion fields.' });
    }
    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active must be a boolean.' });
    }

    const sql = `
        INSERT INTO promotions (code, discount_percentage, start_date, end_date, is_active)
        VALUES (?, ?, ?, ?, ?)
    `;
    const params = [code, discount_percentage, start_date, end_date, is_active ? 1 : 0];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('DB Error [admin/promotions POST]:', err.message);
            if (err.message.includes('UNIQUE constraint failed: promotions.code')) {
                return res.status(409).json({ error: 'Promotion code already exists.' });
            }
            return res.status(500).json({ error: 'Failed to create promotion.' });
        }

        const newPromotionId = this.lastID;
        const newPromotionCode = code;
        const newPromotionDiscount = discount_percentage;

        const getUsersSql = `
            SELECT email, name
            FROM users
            WHERE promotion_opt_in = 1;
        `;

        db.all(getUsersSql, [], (userErr, users) => {
            if (userErr) {
                console.error('DB Error [admin/promotions POST - fetching users]:', userErr.message);
                return res.status(201).json({ id: newPromotionId, message: 'Promotion created successfully, but failed to fetch users for email.' });
            }

            if (users.length === 0) {
                console.log('No users registered for promotions.');
                return res.status(201).json({ id: newPromotionId, message: 'Promotion created successfully. No users to send promotion emails to.' });
            }

            let emailsSentCount = 0;
            let emailsFailedCount = 0;

            users.forEach(user => {
                const userName = user.name || 'there';
                transporter.sendMail({
                    from: '"Bookstore Promotions" <promotions@bookstore.com>',
                    to: user.email,
                    subject: `New Promotion Alert! Get ${newPromotionDiscount}% Off!`,
                    html: `
                        <p>Hello ${userName},</p>
                        <p>Exciting news! A new promotion has just been launched:</p>
                        <p><strong>Promotion Code:</strong> ${newPromotionCode}</p>
                        <p><strong>Discount:</strong> ${newPromotionDiscount}% off!</p>
                        <p>Don't miss out on these great savings!</p>
                        <p>Best regards,</p>
                        <p>The Bookstore Team</p>
                    `
                })
                .then(info => {
                    console.log(`Promotion email sent to ${user.email}. Preview URL:`, nodemailer.getTestMessageUrl(info));
                    emailsSentCount++;
                })
                .catch(mailErr => {
                    console.error(`Failed to send promotion email to ${user.email}:`, mailErr);
                    emailsFailedCount++;
                });
            });

            res.status(201).json({
                id: newPromotionId,
                message: 'Promotion created successfully. Promotion emails are being sent.',
                emailSummary: {
                    totalUsersForPromotion: users.length,
                }
            });
        });
    });
});

router.put('/:id', isAdmin, (req, res) => {
    const promoId = req.params.id;
    const { code, discount_percentage, start_date, end_date, is_active } = req.body;

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
