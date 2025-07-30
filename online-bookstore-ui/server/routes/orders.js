const express = require('express');
const db = require('../db'); // Path to db.js (one directory up from 'routes')
const util = require('util');
const nodemailer = require('nodemailer');
const dbRun = function(sql, params) {
    return new Promise((resolve, reject) => {
        // Use a traditional function() to ensure 'this' context is bound by sqlite3
        db.run(sql, params, function(err) {
            if (err) {
                return reject(err);
            }
            // Resolve with an object containing lastID and changes
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};
const dbGet = util.promisify(db.get).bind(db);

const router = express.Router();

let transporter;
(async () => {
    try {
        const test = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: test.smtp.host,
            port: test.smtp.port,
            secure: test.smtp.secure,
            auth: { user: test.user, pass: test.pass }
        });
        console.log('Nodemailer test account created for orders router.');
    } catch (err) {
        console.error('Failed to create Nodemailer test account in orders router:', err);
    }
})();

// Endpoint to place an order after payment is confirmed on client-side
router.post('/place', async (req, res) => {
    const { userId, cart, subtotal, tax, total, shipping, payment, date } = req.body;

    if (!userId || !cart || cart.length === 0 || !total || !shipping || !payment || !payment.stripePaymentIntentId) {
        return res.status(400).json({ error: 'Missing required order details.' });
    }

    try {
        await dbRun('BEGIN TRANSACTION;');

        const user = await dbGet('SELECT name, email FROM users WHERE id = ?', [userId]);
        if (!user) {
            throw new Error('User not found for order confirmation.');
        }

        const insertOrderSql = `
            INSERT INTO orders (
                user_id,
                total,
                subtotal,
                tax,
                shipping_name,
                shipping_street,
                shipping_city,
                shipping_state,
                shipping_zip,
                stripe_payment_intent_id,
                payment_display,
                order_date,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const orderParams = [
            userId,
            parseFloat(total),
            parseFloat(subtotal),
            parseFloat(tax),
            shipping.name,
            shipping.street,
            shipping.city,
            shipping.state,
            shipping.zip,
            payment.stripePaymentIntentId,
            payment.display,
            date,
            'completed'
        ];

        let orderId;
        try {
            const result = await dbRun(insertOrderSql, orderParams);
            orderId = result.lastID;
        } catch (err) {
            throw new Error(`Failed to insert order: ${err.message}`);
        }

        const insertOrderItemSql = `
            INSERT INTO order_items (
                order_id,
                book_id,
                quantity,
                price_at_purchase,
                title_at_purchase
            ) VALUES (?, ?, ?, ?, ?)
        `;
        for (const item of cart) {
            try {
                await dbRun(insertOrderItemSql, [
                    orderId,
                    item.id,
                    item.quantity,
                    item.price,
                    item.title
                ]);
            } catch (err) {
                throw new Error(`Failed to insert order item for book ${item.id}: ${err.message}`);
            }
        }

        await dbRun('COMMIT;');

        if (transporter) {
            let itemsHtml = '';
            cart.forEach(item => {
                itemsHtml += `
                    <li>
                        ${item.title} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}
                    </li>
                `;
            });

            const mailOptions = {
                from: '"Online Bookstore" <no-reply@onlinebookstore.com>',
                to: user.email, // Customer's email
                subject: `Order Confirmation - Order #${orderId}`,
                html: `
                    <p>Dear ${user.name},</p>
                    <p>Thank you for your order! Your order has been successfully placed and confirmed.</p>
                    
                    <h3>Order Details:</h3>
                    <ul>
                        <li><strong>Order ID:</strong> ${orderId}</li>
                        <li><strong>Confirmation Number:</strong> ${payment.stripePaymentIntentId}</li>
                        <li><strong>Order Date:</strong> ${date}</li>
                    </ul>

                    <h3>Shipping Information:</h3>
                    <p>
                        ${shipping.name}<br>
                        ${shipping.street}<br>
                        ${shipping.city}, ${shipping.state} ${shipping.zip}
                    </p>

                    <h3>Items Ordered:</h3>
                    <ul>
                        ${itemsHtml}
                    </ul>

                    <h3>Payment Summary:</h3>
                    <p><strong>Subtotal:</strong> $${subtotal}</p>
                    <p><strong>Tax:</strong> $${tax}</p>
                    <p><strong>Total Paid:</strong> $${total}</p>

                    <p>If you have any questions, please contact our support team.</p>
                    <p>Sincerely,<br>The Online Bookstore Team</p>
                `
            };

            transporter.sendMail(mailOptions)
                .then(info => {
                    console.log('Order confirmation email sent: %s', info.messageId);
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                })
                .catch(mailErr => {
                    console.error('Failed to send order confirmation email:', mailErr);
                });
        } else {
            console.warn('Nodemailer transporter not initialized. Email will not be sent.');
        }
        
        res.json({ success: true, message: 'Order placed successfully!', orderId: orderId });

    } catch (error) {
        console.error('Error placing order:', error);
        await dbRun('ROLLBACK;');
        res.status(500).json({ error: error.message || 'Failed to place order.' });
    }
});

module.exports = router;
