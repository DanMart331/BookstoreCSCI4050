const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_51Rel5jP9fb1HIuhDGs6PZ1HR9ui4eK0I8VKXlmeNFdAdGQRujVrxRJUVftIkDopj2Oxfw0Y9xthbm0qkA3YgHd7600FCNBcZqJ');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/books', require('./routes/books'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});