const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// ===== KẾT NỐI DB =====
const mysql = require('mysql2');
const connectionString = 'mysql://root:JSgGADhVzFuoKANTvBwTyrqUpXQSExmm@maglev.proxy.rlwy.net:39709/railway';

const db = mysql.createConnection(connectionString);

db.connect(err => {
  if (err) {
    console.error("❌ DB connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL Railway");
  }
});

// ===== LOGIN =====
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE username=? AND password=?',
    [username, password],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json(null);
      }
      res.json(result.length > 0 ? result[0] : null);
    }
  );
});

// ===== PRODUCTS =====
app.get('/products', (req, res) => {
  db.query('SELECT * FROM products', (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

// ===== CART =====
app.post('/cart', (req, res) => {
  const { user_id, product_id } = req.body;

  db.query(
    'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)',
    [user_id, product_id],
    (err) => {
      if (err) {
        console.log(err);
        return res.json({ message: 'Error' });
      }
      res.json({ message: 'Added' });
    }
  );
});

app.get('/cart/:user_id', (req, res) => {
  db.query(
    `SELECT c.*, p.name, p.price 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [req.params.user_id],
    (err, result) => {
      if (err) return res.json([]);
      res.json(result);
    }
  );
});

// ===== ORDERS =====
app.post('/checkout', (req, res) => {
  const { user_id } = req.body;

  db.query(
    `SELECT c.*, p.price 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [user_id],
    (err, cart) => {
      if (err) return res.json({ message: "Error" });
      if (cart.length === 0) return res.json({ message: "Cart empty" });

      let total = 0;
      cart.forEach(i => total += i.price);

      db.query(
        'INSERT INTO orders (user_id, status, total) VALUES (?, "pending", ?)',
        [user_id, total],
        (err2) => {
          if (err2) return res.json({ message: "Error creating order" });

          db.query('DELETE FROM cart WHERE user_id=?', [user_id]);
          res.json({ message: "Order created" });
        }
      );
    }
  );
});

app.get('/orders', (req, res) => {
  db.query('SELECT * FROM orders', (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

app.put('/orders/:id', (req, res) => {
  const { status } = req.body;

  db.query('UPDATE orders SET status=? WHERE id=?', [status, req.params.id], (err) => {
    if (err) return res.json({ message: 'Error updating order' });
    res.json({ message: 'Updated' });
  });
});

app.get('/orders/user/:id', (req, res) => {
  db.query('SELECT * FROM orders WHERE user_id = ?', [req.params.id], (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});