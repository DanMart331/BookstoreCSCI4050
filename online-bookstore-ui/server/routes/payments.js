const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51Rel5jP9fb1HIuhDGs6PZ1HR9ui4eK0I8VKXlmeNFdAdGQRujVrxRJUVftIkDopj2Oxfw0Y9xthbm0qkA3YgHd7600FCNBcZqJ');

router.post('/create-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'usd'
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error Creating Payment Intent:', error);
    res.status(500).json({ error: 'Failed To Create Payment Intent' });
  }
});

module.exports = router;