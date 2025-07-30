const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});