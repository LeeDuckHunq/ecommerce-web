const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// kết nối DB
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ecommerce'
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

      if (result.length > 0) {
        res.json(result[0]);
      } else {
        res.json(null);
      }
    }
  );
});

// ===== PRODUCTS =====
app.get('/products', (req, res) => {
  db.query('SELECT * FROM products', (err, result) => {
    res.json(result);
  });
});

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
      res.json(result);
    }
  );
});

app.post('/checkout', (req, res) => {
  const { user_id } = req.body;

  // lấy cart
  db.query(
    `SELECT c.*, p.price 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [user_id],
    (err, cart) => {

      if (cart.length === 0) {
        return res.json({ message: "Cart empty" });
      }

      let total = 0;
      cart.forEach(i => total += i.price);

      // tạo order
      db.query(
        'INSERT INTO orders (user_id, status, total) VALUES (?, "pending", ?)',
        [user_id, total],
        (err2) => {

          // xóa cart
          db.query('DELETE FROM cart WHERE user_id=?', [user_id]);

          res.json({ message: "Order created" });
        }
      );
    }
  );
});

app.get('/orders', (req, res) => {
  db.query('SELECT * FROM orders', (err, result) => {
    res.json(result);
  });
});

app.put('/orders/:id', (req, res) => {
  const { status } = req.body;

  db.query(
    'UPDATE orders SET status=? WHERE id=?',
    [status, req.params.id]
  );

  res.json({ message: 'Updated' });
});

app.get('/orders/user/:id', (req, res) => {
  db.query(
    'SELECT * FROM orders WHERE user_id = ?',
    [req.params.id],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json([]);
      }
      res.json(result);
    }
  );
});

// ===== START SERVER =====
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});