const express = require('express');
const stripe = require('stripe')('sk_test_51RqNndJcKtieGzIV7fCHyknNkBN52SqNag5zHDrRvaeoYlKqZYu5LOpPTgzDgoPZStfY1OjGqGJluLG7kFUqgXfO00eW4FDTQW'); // Your Stripe SECRET key
const db = require('../db.js'); // Assuming your db connection is in ./db.js
const util = require('util');
const dbGet = util.promisify(db.get).bind(db); // Promisify db.get

const router = express.Router();

// Endpoint to create a Payment Intent
router.post('/create-intent', async (req, res) => {
    const { amount, userId } = req.body; // amount should be in cents (e.g., $10.00 is 1000)

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount provided.' });
    }
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required to create a payment intent.' });
    }

    try {
        // Fetch the user's Stripe Customer ID from your database
        const user = await dbGet('SELECT stripe_customer_id FROM users WHERE id = ?', [userId]);

        if (!user || !user.stripe_customer_id) {
            return res.status(404).json({ error: 'Stripe customer ID not found for this user.' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd', // Set your currency
            customer: user.stripe_customer_id, // Associate with the user's Stripe customer
            // You can add 'payment_method_types': ['card'] if you only accept cards
            // confirm: false, // Client-side will confirm
        });

        res.json({ clientSecret: paymentIntent.client_secret });

    } catch (error) {
        console.error('Error creating Payment Intent:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
