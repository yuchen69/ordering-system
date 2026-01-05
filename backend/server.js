const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;
const dbFile = 'database.db';
const JWT_SECRET = 'your-very-strong-secret-key-12345'; 

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) return console.error("資料庫連線失敗:", err.message);
  console.log('成功連接到 SQLite 資料庫 (database.db)');

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        options_json TEXT,
        category_id INTEGER,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL, 
        items_json TEXT,
        total_price REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      )
    `);

    db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
      if (row.count === 0) {
        console.log("正在插入範例分類...");
        const stmt = db.prepare("INSERT INTO categories (name) VALUES (?)");
        stmt.run("漢堡"); stmt.run("點心"); stmt.run("飲料");
        stmt.finalize();
      }
    });

    db.get("SELECT COUNT(*) as count FROM meals", (err, row) => {
      if (row.count === 0) {
        console.log("資料庫為空，正在插入附有分類的餐點資料...");
        const stmt = db.prepare("INSERT INTO meals (name, price, description, options_json, category_id) VALUES (?, ?, ?, ?, ?)");
        const burgerOptions = JSON.stringify(['不要酸黃瓜', '不要番茄醬']);
        stmt.run("墨西哥辣牛堡", 230, "此餐點包含美式脆薯", burgerOptions, 1);
        stmt.run("雙起司香牛堡", 230, "此餐點包含美式脆薯", burgerOptions, 1);
        stmt.run("塔塔魚堡", 210, "此餐點包含美式脆薯", burgerOptions, 1);
        const friesOptions = JSON.stringify(['番茄醬', '塔塔醬']);
        stmt.run("美式脆薯", 45, null, friesOptions, 2);
        stmt.run("美式雞球", 65, null, friesOptions, 2);
        stmt.run("可樂", 40, null, null, 3); 
        stmt.run("雪碧", 40, null, null, 3);
        stmt.run("可爾必思", 40, null, null, 3);
        stmt.finalize();
      }
    });

    db.get("SELECT COUNT(*) as count FROM admin", (err, row) => {
      if (row.count === 0) {
        bcrypt.hash('admin123', 10, (err, hash) => { 
          if (err) return console.error("密碼加密失敗:", err);
          db.run("INSERT INTO admin (username, password_hash) VALUES (?, ?)", ['admin', hash]);
          console.log("範例管理者帳號 'admin' (密碼 'admin123') 已建立。");
        });
      }
    });
  });
});

app.get('/api/categories', (req, res) => {
  db.all("SELECT * FROM categories", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

app.get('/api/meals', (req, res) => {
  const { category_id } = req.query; 
  let sql = "SELECT * FROM meals";
  const params = [];
  if (category_id) { 
    sql += " WHERE category_id = ?";
    params.push(category_id);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const mealsWithParsedOptions = rows.map(meal => ({
      ...meal,
      options: meal.options_json ? JSON.parse(meal.options_json) : []
    }));
    res.json({ data: mealsWithParsedOptions });
  });
});

app.post('/api/orders', (req, res) => {
  const { items, totalPrice, customerName } = req.body; 
  if (!customerName || customerName.trim() === '') { 
     return res.status(400).json({ error: '顧客姓名或桌號為必填欄位' });
  }
  const itemsJson = JSON.stringify(items); 
  
  const sql = "INSERT INTO orders (customer_name, items_json, total_price, created_at) VALUES (?, ?, ?, datetime('now', 'localtime'))";
  
  db.run(sql, [customerName, itemsJson, totalPrice], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: '訂單建立成功!', orderId: this.lastID }); 
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '請輸入帳號和密碼' });
  
  db.get("SELECT * FROM admin WHERE username = ?", [username], (err, user) => { 
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: '帳號或密碼錯誤' }); 
    
    bcrypt.compare(password, user.password_hash, (err, isMatch) => { 
      if (err) return res.status(500).json({ error: err.message });
      if (!isMatch) return res.status(401).json({ error: '帳號或密碼錯誤' }); 
      
      const payload = { userId: user.id, username: user.username };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); 
      res.json({ message: '登入成功', token: token });
    });
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']; 
  const token = authHeader && authHeader.split(' ')[1]; 
  if (token == null) return res.sendStatus(401); 

  jwt.verify(token, JWT_SECRET, (err, user) => { 
    if (err) return res.sendStatus(403); 
    req.user = user; 
    next(); 
  });
}

app.get('/api/admin/orders', authenticateToken, (req, res) => {
  const sql = "SELECT * FROM orders ORDER BY created_at DESC";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const orders = rows.map(order => ({
      ...order,
      items: JSON.parse(order.items_json) 
    }));
    res.json({ data: orders });
  });
});

app.post('/api/admin/meals', authenticateToken, (req, res) => {
  const { name, price, description, options, category_id } = req.body;
  if (!name || !price || !category_id) return res.status(400).json({ error: '名稱、價格和分類必填' });
  const optionsJson = (options && options.length > 0) ? JSON.stringify(options) : null;
  const sql = 'INSERT INTO meals (name, price, description, options_json, category_id) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [name, price, description, optionsJson, category_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: '餐點新增成功!', mealId: this.lastID });
  });
});

app.delete('/api/admin/meals/:id', authenticateToken, (req, res) => {
  const { id } = req.params; 
  const sql = 'DELETE FROM meals WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: '找不到該餐點' });
    res.json({ message: '餐點刪除成功!' });
  });
});

app.put('/api/admin/meals/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, price, description, options, category_id } = req.body; 
  if (!name || !price || !category_id) return res.status(400).json({ error: '名稱、價格和分類必填' });
  const optionsJson = (options && options.length > 0) ? JSON.stringify(options) : null;
  const sql = `UPDATE meals SET name = ?, price = ?, description = ?, options_json = ?, category_id = ? WHERE id = ?`;
  db.run(sql, [name, price, description, optionsJson, category_id, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: '找不到該餐點' }); 
    res.json({ message: '餐點更新成功!' });
  });
});

app.listen(port, () => {
  console.log(`後端伺服器正在 http://localhost:${port} 上運行...`);
});