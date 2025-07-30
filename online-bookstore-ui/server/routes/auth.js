const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');
const util = require('util');
const dbGet = util.promisify(db.get).bind(db);
const dbRun = util.promisify(db.run).bind(db);
const router = express.Router();
const stripe = require('stripe')('sk_test_51RqNndJcKtieGzIV7fCHyknNkBN52SqNag5zHDrRvaeoYlKqZYu5LOpPTgzDgoPZStfY1OjGqGJluLG7kFUqgXfO00eW4FDTQW');

let transporter;
(async () => {
  const test = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: test.smtp.host, port: test.smtp.port,
    secure: test.smtp.secure,
    auth: { user: test.user, pass: test.pass }
  });
})();

router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password,
      street, city, state, zip,
      promotion_opt_in,
      paymentMethodId
    } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);
    const confirmToken = crypto.randomBytes(20).toString('hex');

    let stripeCustomerId = null;
    let defaultStripePaymentMethodId = null;

    if (paymentMethodId) {
      try {
        const customer = await stripe.customers.create({
          payment_method: paymentMethodId,
          email: email,
          name: name,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        stripeCustomerId = customer.id;
        defaultStripePaymentMethodId = paymentMethodId;
        console.log('Stripe Customer created:', stripeCustomerId);
        console.log('Default Payment Method set:', defaultStripePaymentMethodId);
      } catch (stripeError) {
        console.error('Stripe Customer/Payment Method creation error during registration:', stripeError);
        // Return an error to the client if Stripe fails to process the payment method
        return res.status(500).json({ error: 'Registration failed: Could not process payment method. Please try again.' });
      }
    }

    const sql = `
      INSERT INTO users (
        name, email, password,
        street, city, state, zip,
        stripe_customer_id, default_stripe_payment_method_id,
        promotion_opt_in, confirmation_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      name, email, passwordHash,
      street, city, state, zip,
      stripeCustomerId,
      defaultStripePaymentMethodId,
      promotion_opt_in, confirmToken
    ];

    db.run(sql, params, function(err) {
      if (err) {
        console.error('DB Error [register]:', err.message);
        return res.status(500).json({ error: 'Registration failed' });
      }
      const url = `http://localhost:3001/api/auth/confirm?token=${confirmToken}`;
      transporter.sendMail({
        from: '"Bookstore" <no-reply@bookstore.com>',
        to: email,
        subject: 'Confirm your email',
        html: `<p>Welcome ${name},</p>
               <p>Click <a href="${url}">here</a> to confirm your account.</p>`
      })
      .then(info => {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        res.json({ message: 'Registration successful—check your email.' });
      })
      .catch(mailErr => {
        console.error('Mail Error:', mailErr);
        res.status(500).json({ error: 'Could not send confirmation email' });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/confirm', (req, res) => {
  const token = req.query.token;
  const sql = `
    UPDATE users
      SET status = 'active', confirmation_token = NULL
    WHERE confirmation_token = ?
  `;
  db.run(sql, [token], function(err) {
    if (err) return res.status(500).send('Activation error');
    if (this.changes === 0) return res.status(400).send('Invalid token');
    res.send('Account confirmed! You may now log in.');
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT id, name, email, password, status, is_admin FROM users WHERE email = ?`;
  db.get(sql, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Account not activated' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    delete user.password;
    res.json(user);
  });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const token = crypto.randomBytes(20).toString('hex');
  const expires = Date.now() + 3600_000;

  const sql = `
    UPDATE users
      SET reset_token = ?, reset_expires = ?
    WHERE email = ?
  `;
  db.run(sql, [token, expires, email], function(err) {
    if (err) {
      console.error('DB Error [forgot-password]:', err.message);
      return res.status(500).json({ error: 'Request failed' });
    }
    const resetUrl = `http://localhost:3001/reset_password.html?token=${token}`;
    transporter.sendMail({
      from: '"Bookstore" <no-reply@bookstore.com>',
      to: email,
      subject: 'Password Reset',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Expires in 1 hour.</p>`
    })
    .then(info => {
      console.log('Reset email preview:', nodemailer.getTestMessageUrl(info));
      res.json({ message: 'If that email is registered, you’ll get a reset link.' });
    })
    .catch(merr => {
      console.error('Mail Error [forgot-password]:', merr);
      res.status(500).json({ error: 'Could not send reset email' });
    });
  });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const now = Date.now();
  const findSql = `
    SELECT id FROM users
    WHERE reset_token = ? AND reset_expires > ?
  `;
  db.get(findSql, [token, now], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Reset failed' });
    if (!row) return res.status(400).json({ error: 'Invalid or expired token' });

    const hash = await bcrypt.hash(password, 10);
    const upd = `
      UPDATE users
        SET password = ?, reset_token = NULL, reset_expires = NULL
      WHERE id = ?
    `;
    db.run(upd, [hash, row.id], function(uerr) {
      if (uerr) {
        console.error('DB Error [reset-password]:', uerr.message);
        return res.status(500).json({ error: 'Reset failed' });
      }
      res.json({ message: 'Password has been reset. You may now log in.' });
    });
  });
});

router.get('/profile', async (req, res) => {
  try {
    const id = req.query.id;
    console.log('Profile GET request received. ID from query:', id);

    const sql = `
      SELECT id, name, email,
              street, city, state, zip,
              stripe_customer_id, default_stripe_payment_method_id,
              promotion_opt_in, status, is_admin
          FROM users
         WHERE id = ?
    `;
    db.get(sql, [id], async (err, user) => {
      if (err) {
        console.error('DB Error [profile GET]:', err.message);
        return res.status(500).json({ error: 'Could not fetch profile' });
      }
      console.log('User data retrieved from DB (callback):', user);

      if (!user) {
        console.log('User not found for ID:', id);
        return res.status(404).json({ error: 'User not found' });
      }

      let defaultPaymentMethod = null;
      let allPaymentMethods = [];

      if (user.stripe_customer_id) { // Check if customer ID exists
        console.log('Attempting to retrieve Stripe payment methods for customer:', user.stripe_customer_id);
        try {
          // Fetch all card payment methods for the customer
          const paymentMethods = await stripe.paymentMethods.list({
            customer: user.stripe_customer_id,
            type: 'card',
          });
          allPaymentMethods = paymentMethods.data.map(pm => ({
            id: pm.id,
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
          }));
          console.log('Stripe payment methods retrieved successfully:', allPaymentMethods);

          // Find and set the default payment method from the list
          if (user.default_stripe_payment_method_id) {
            defaultPaymentMethod = allPaymentMethods.find(
              pm => pm.id === user.default_stripe_payment_method_id
            );
          }
        } catch (stripeErr) {
          console.error("Error retrieving payment methods from Stripe:", stripeErr);
          // If Stripe fails, ensure these are null/empty, but don't block profile fetch
          defaultPaymentMethod = null;
          allPaymentMethods = [];
        }
      } else {
        console.log('Stripe customer ID not found for user. Skipping Stripe API call for payment methods.');
      }

      const userToSend = {
        id: user.id,
        name: user.name,
        email: user.email,
        street: user.street,
        city: user.city,
        state: user.state,
        zip: user.zip,
        promotion_opt_in: user.promotion_opt_in,
        status: user.status,
        is_admin: user.is_admin,
        defaultPaymentMethod: defaultPaymentMethod,
        allPaymentMethods: allPaymentMethods 
      };

      res.json({ user: userToSend });
    });

  } catch (err) {
    console.error('Error fetching user profile (outer catch):', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const {
      id,
      name,
      password,
      street, city, state, zip,
      stripe_customer_id, default_stripe_payment_method_id,
      promotion_opt_in
    } = req.body;

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (password) {
      const passHash = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(passHash);
    }
    if (street !== undefined) {
      updates.push('street = ?', 'city = ?', 'state = ?', 'zip = ?');
      params.push(street, city, state, zip);
    }

    updates.push('promotion_opt_in = ?');
    params.push(promotion_opt_in ? 1 : 0);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    const sql = `
      UPDATE users
          SET ${updates.join(', ')}
        WHERE id = ?
    `;
    params.push(id);

    db.run(sql, params, function(err) {
      if (err) {
        console.error('DB Error [profile PUT]:', err.message);
        return res.status(500).json({ error: 'Update failed' });
      }

      db.get('SELECT email, name FROM users WHERE id = ?', [id], (e, row) => {
        if (e || !row) {
          console.error('Could not retrieve user for email:', e);
        } else {
          transporter.sendMail({
            from: '"Bookstore" <no-reply@bookstore.com>',
            to: row.email,
            subject: 'Profile Updated Successfully',
            html: `
              <p>Hi ${row.name},</p>
              <p>Your profile has been updated successfully on ${new Date().toLocaleString()}.</p>
              <p>If you did not make these changes, please contact support immediately.</p>
            `
          })
          .then(info => {
            console.log('Profile update email preview URL:', nodemailer.getTestMessageUrl(info));
          })
          .catch(mailErr => {
            console.error('Mail Error [profile confirmation]:', mailErr);
          });
        }
      });

      res.json({ message: 'Profile updated' });
    });
  } catch (err) {
    console.error('Server Error [profile PUT]:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/save-payment-method', async (req, res) => {
  try {
    const { userId, paymentMethodId, setDefault } = req.body;

    const user = await dbGet('SELECT email, stripe_customer_id FROM users WHERE id = ?', [userId]);

    let customerId;

    if (!user || !user.stripe_customer_id) {
      const customer = await stripe.customers.create({
        payment_method: paymentMethodId,
        email: user?.email || 'noemail@example.com',
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      customerId = customer.id;

      await dbRun(
        'UPDATE users SET stripe_customer_id = ?, default_stripe_payment_method_id = ? WHERE id = ?',
        [customerId, paymentMethodId, userId]
      );
    } else {
      customerId = user.stripe_customer_id;

      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

      if (setDefault) {
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });

        await dbRun(
          'UPDATE users SET default_stripe_payment_method_id = ? WHERE id = ?',
          [paymentMethodId, userId]
        );
      }
    }

    res.json({ success: true, message: 'Payment method saved.' });

  } catch (error) {
    console.error('Error saving payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
