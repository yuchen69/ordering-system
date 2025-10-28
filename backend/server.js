/*
 * ================================================
 * 點餐系統 後端伺服器 (server.js)
 * 包含：伺服器設定、資料庫、API
 * ================================================
 */

// --- 1. 引入套件 ---
const express = require('express');         // Web 框架
const sqlite3 = require('sqlite3').verbose(); // SQLite 資料庫
const cors = require('cors');           // 處理跨域請求
const bcrypt = require('bcryptjs');       // 密碼加密
const jwt = require('jsonwebtoken');    // 登入 Token

// --- 2. 設定 ---
const app = express();                     // 建立 Express App
const port = 3001;                         // 後端 Port
const dbFile = 'database.db';              // 資料庫檔名
const JWT_SECRET = 'your-very-strong-secret-key-12345'; // Token 密鑰

// --- 3. 中介軟體 ---
app.use(cors());           // 允許所有前端來源請求
app.use(express.json());   // 讓後端能讀懂前端傳來的 JSON 資料

// --- 4. 連接資料庫 & 初始化 ---
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) return console.error("資料庫連線失敗:", err.message);
  console.log('成功連接到 SQLite 資料庫 (database.db)');

  // 確保 SQL 依序執行
  db.serialize(() => {
    
    // --- 5.1 建立 categories (分類) 表 ---
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    // --- 5.2 建立 meals (餐點) 表 ---
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

    // --- 5.3 建立 orders (訂單) 表 ---
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL, 
        items_json TEXT,
        total_price REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // --- 5.4 建立 admin (管理者) 表 ---
    db.run(`
      CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      )
    `);

    // --- 5.5 插入範例分類 (如果表是空的) ---
    db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
      if (row.count === 0) {
        console.log("正在插入範例分類...");
        const stmt = db.prepare("INSERT INTO categories (name) VALUES (?)");
        stmt.run("漢堡"); stmt.run("點心"); stmt.run("飲料");
        stmt.finalize();
      }
    });
    
    // --- 5.6 插入範例餐點 (如果表是空的) ---
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

    // --- 5.7 插入範例管理者 (如果表是空的) ---
    db.get("SELECT COUNT(*) as count FROM admin", (err, row) => {
      if (row.count === 0) {
        // 加密密碼 'admin123'
        bcrypt.hash('admin123', 10, (err, hash) => { 
          if (err) return console.error("密碼加密失敗:", err);
          db.run("INSERT INTO admin (username, password_hash) VALUES (?, ?)", ['admin', hash]);
          console.log("範例管理者帳號 'admin' (密碼 'admin123') 已建立。");
        });
      }
    });
  });
});

// --- 階段六：API 路由 ---

// --- 公開 API (不需登入) ---

// [GET] /api/categories - 取得所有分類
app.get('/api/categories', (req, res) => {
  db.all("SELECT * FROM categories", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// [GET] /api/meals - 取得餐點 (可依分類篩選)
app.get('/api/meals', (req, res) => {
  const { category_id } = req.query; // 讀取 ?category_id=N 參數
  let sql = "SELECT * FROM meals";
  const params = [];
  if (category_id) { // 如果有分類參數，加上 WHERE 條件
    sql += " WHERE category_id = ?";
    params.push(category_id);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // 將 options_json 字串轉回陣列
    const mealsWithParsedOptions = rows.map(meal => ({
      ...meal,
      options: meal.options_json ? JSON.parse(meal.options_json) : []
    }));
    res.json({ data: mealsWithParsedOptions });
  });
});

// [POST] /api/orders - 建立新訂單
app.post('/api/orders', (req, res) => {
  const { items, totalPrice, customerName } = req.body; // 從前端接收資料
  if (!customerName || customerName.trim() === '') { // 驗證姓名
     return res.status(400).json({ error: '顧客姓名或桌號為必填欄位' });
  }
  const itemsJson = JSON.stringify(items); // 將 items 陣列轉成字串存入
  const sql = 'INSERT INTO orders (customer_name, items_json, total_price) VALUES (?, ?, ?)';
  db.run(sql, [customerName, itemsJson, totalPrice], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: '訂單建立成功!', orderId: this.lastID }); // 回傳訂單 ID
  });
});

// --- 登入 API ---

// [POST] /api/login - 管理者登入
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '請輸入帳號和密碼' });
  
  db.get("SELECT * FROM admin WHERE username = ?", [username], (err, user) => { // 找使用者
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: '帳號或密碼錯誤' }); 
    
    bcrypt.compare(password, user.password_hash, (err, isMatch) => { // 比對密碼
      if (err) return res.status(500).json({ error: err.message });
      if (!isMatch) return res.status(401).json({ error: '帳號或密碼錯誤' }); 
      
      // 成功，產生 Token
      const payload = { userId: user.id, username: user.username };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token 1小時後過期
      res.json({ message: '登入成功', token: token });
    });
  });
});

// --- 認證守衛 (檢查 Token 的中介軟體) ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']; // 讀取 'Authorization' Header
  const token = authHeader && authHeader.split(' ')[1]; // 取出 "Bearer TOKEN" 中的 TOKEN
  if (token == null) return res.sendStatus(401); // 沒 Token -> 未授權

  jwt.verify(token, JWT_SECRET, (err, user) => { // 驗證 Token
    if (err) return res.sendStatus(403); // Token 錯誤或過期 -> 禁止訪問
    req.user = user; // 將解碼後的使用者資訊存入 req
    next(); // 驗證通過，繼續執行下一個動作
  });
}

// --- 後台管理 API (需要登入) ---

// [GET] /api/admin/orders - 取得所有訂單
app.get('/api/admin/orders', authenticateToken, (req, res) => { // 加入守衛
  const sql = "SELECT * FROM orders ORDER BY created_at DESC"; // 最新訂單在前面
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // 將 items_json 字串轉回物件
    const orders = rows.map(order => ({
      ...order,
      items: JSON.parse(order.items_json) 
    }));
    res.json({ data: orders });
  });
});

// [POST] /api/admin/meals - 新增餐點
app.post('/api/admin/meals', authenticateToken, (req, res) => { // 加入守衛
  const { name, price, description, options, category_id } = req.body;
  if (!name || !price || !category_id) return res.status(400).json({ error: '名稱、價格和分類必填' });
  const optionsJson = (options && options.length > 0) ? JSON.stringify(options) : null;
  const sql = 'INSERT INTO meals (name, price, description, options_json, category_id) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [name, price, description, optionsJson, category_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: '餐點新增成功!', mealId: this.lastID });
  });
});

// [DELETE] /api/admin/meals/:id - 刪除餐點
app.delete('/api/admin/meals/:id', authenticateToken, (req, res) => { // 加入守衛
  const { id } = req.params; // 從網址讀取 id
  const sql = 'DELETE FROM meals WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: '找不到該餐點' }); // 檢查是否真的有刪除
    res.json({ message: '餐點刪除成功!' });
  });
});

// [PUT] /api/admin/meals/:id - 更新餐點
app.put('/api/admin/meals/:id', authenticateToken, (req, res) => { // 加入守衛
  const { id } = req.params; // 從網址讀取 id
  const { name, price, description, options, category_id } = req.body; // 讀取新資料
  if (!name || !price || !category_id) return res.status(400).json({ error: '名稱、價格和分類必填' });
  const optionsJson = (options && options.length > 0) ? JSON.stringify(options) : null;
  const sql = `UPDATE meals SET name = ?, price = ?, description = ?, options_json = ?, category_id = ? WHERE id = ?`;
  db.run(sql, [name, price, description, optionsJson, category_id, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: '找不到該餐點' }); // 檢查是否真的有更新
    res.json({ message: '餐點更新成功!' });
  });
});

// --- 7. 啟動伺服器 ---
app.listen(port, () => {
  console.log(`後端伺服器正在 http://localhost:${port} 上運行...`);
});