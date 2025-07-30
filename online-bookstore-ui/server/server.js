const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const paymentsRouter = require('./routes/payments');
const ordersRouter = require('./routes/orders'); 
const promotionsRouter = require('./routes/promotions');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '..')));

app.use('/api/books', require('./routes/books'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin/books', require('./routes/admin_books'));
app.use('/api/admin/users', require('./routes/admin_users'));
app.use('/api/admin/promotions', require('./routes/admin_promotions'));
app.use('/api/payments', paymentsRouter); 
app.use('/api/orders', ordersRouter); 
app.use('/api/promotions', promotionsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});