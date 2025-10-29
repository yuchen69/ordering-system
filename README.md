# 點餐系統 (Ordering System)

簡易的網頁點餐系統專案，包含前台顧客點餐功能以及後台管理者管理功能。

## 技術棧

* **前端 (Frontend):** React + Vite + Tailwind CSS + Axios + React Router
* **後端 (Backend):** Node.js + Express.js + SQLite3
* **認證 (Authentication):** JWT (JSON Web Token) + bcryptjs

## 功能

### 前台 (顧客)
* 瀏覽所有餐點
* 依分類篩選餐點 (漢堡、點心、飲料)
* 查看餐點描述與客製化選項
* 將餐點（含客製化選項）加入購物車
* 在購物車中修改餐點數量或移除餐點
* 輸入顧客姓名/桌號
* 提交訂單

### 後台 (管理者)
* 管理者登入 (/admin/login)
* 查看所有訂單紀錄，包含顧客姓名、訂單內容、總金額、下單時間 (/admin/orders)
* 管理餐點 (/admin/meals)：
    * 顯示所有餐點列表（包含分類）
    * 新增餐點（包含名稱、價格、分類、描述、客製化選項）
    * 編輯現有餐點
    * 刪除餐點
* 登出

## 如何啟動專案

**請注意：** 您需要先安裝 [Node.js](https://nodejs.org/) (建議使用 LTS 版本)。

### 1. 啟動後端伺服器


### 進入後端資料夾
cd backend
如果是第一次啟動，需要先安裝依賴套件
npm install 

### 啟動後端伺服器 (預設運行在 http://localhost:3001)
node server.js


### 2. 啟動前端伺服器

### 進入前端資料夾(開啟一個新的終端機)
cd frontend
如果是第一次啟動，需要先安裝依賴套件
npm install

### 啟動前端開發伺服器 (預設運行在 http://localhost:5173)
npm run dev

### 3. 開啟瀏覽器


http://localhost:5173 開始使用前台點餐功能
http://localhost:5173/admin/login 或點擊 Navbar 上的後台連結，即可登入後台
(帳號:admin 密碼:admin123)
