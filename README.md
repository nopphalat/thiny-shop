# 🌿 THINY SHOP

ระบบจัดการ Pre-order Reseller — รับสั่งสินค้าจาก Shopee/Lazada/TikTok ให้ลูกค้า

## ✨ Features

- 📊 **Dashboard** — KPI, Action items, Smart aggregation
- 📦 **Pre-order Management** — Status tracking, Bulk actions
- 📱 **Barcode Scanner** — รับเข้า/ตัดออก, พิมพ์ tracking เอง
- 🖨️ **Bill Printer** — A6 sticker พร้อมบาร์โค้ด CODE128
- 👥 **Multi-user + Roles** — Owner / Manager / Staff + Audit log
- 💰 **Finance** — รายรับ-รายจ่าย, P&L
- 📅 **Delivery Calendar** — ปฏิทินจัดส่งรายเดือน
- 📊 **Analytics** — Top customers, products, platform ROI
- 📨 **Notifications** — Templates → WhatsApp/LINE/Messenger/IG
- 🔍 **Global Search** — orders/customers/products

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18 (via Babel CDN) + HTML/CSS |
| **Backend** | Node.js + Express.js |
| **Database** | SQLite (local) / Turso (cloud) |
| **Auth** | Token-based + SHA256 password hash |

---

## 🚀 Quick Start (Local Development)

### Backend
```bash
cd backend
npm install
node server.js   # http://localhost:5000
```

### Frontend
```bash
# จาก root folder
python -m http.server 8000   # http://localhost:8000
```

### Demo Accounts
| Username | Password | Role |
|---|---|---|
| `owner` | `owner123` | 👑 เจ้าของ |
| `manager` | `manager123` | 💼 ผู้จัดการ |
| `staff` | `staff123` | 👷 พนักงาน |

---

## 🌐 Production Deployment

ดูคู่มือเต็มที่ [DEPLOY.md](./DEPLOY.md)

**Stack ฟรี 100%:**
- Frontend → **Cloudflare Pages**
- Backend → **Render.com**
- Database → **Turso** (9GB SQLite cloud)

---

## 📂 Project Structure

```
thiny-shop/
├── index.html                  # Entry point
├── styles.css                  # Admin styles
├── styles-shop.css             # Customer shop styles
├── src/
│   ├── data.js                 # Data loader + API
│   ├── i18n.js                 # Translations (TH/EN/LO)
│   ├── shared.jsx              # Shared components
│   ├── auth.jsx                # Login + UserMenu
│   ├── admin-shell.jsx         # Main admin layout + Dashboard
│   ├── admin-screens.jsx       # All admin pages
│   ├── admin-chat.jsx          # Pre-order management
│   └── shop.jsx                # Customer-facing shop
├── backend/
│   ├── server.js               # Express server
│   ├── db.js                   # DB connection (SQLite/Turso)
│   ├── db-wrapper.js           # Query/run helpers
│   ├── init-db.js              # Schema + seed
│   ├── routes/                 # API endpoints
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── audit-log.js
│   │   ├── chat-orders.js
│   │   ├── customers.js
│   │   ├── products.js
│   │   ├── expenses.js
│   │   ├── notifications.js
│   │   ├── locations.js
│   │   ├── stock.js
│   │   ├── orders.js
│   │   └── movements.js
│   ├── package.json
│   └── render.yaml             # Render deploy config
├── DEPLOY.md                   # Deployment guide
└── README.md                   # This file
```

---

## 🔐 Database Schema

12 tables:
- `users` · `audit_log` · `notifications_log`
- `chat_orders` (Pre-orders จาก WhatsApp/LINE/Messenger/IG)
- `expenses` (รายจ่าย)
- `customers` · `products` · `locations` · `stock`
- `orders` · `order_items` · `movements`

---

## 📜 License

MIT — ใช้งานได้ตามต้องการ
