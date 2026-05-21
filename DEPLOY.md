# 🚀 THINY SHOP — Deployment Guide

ระบบนี้ deploy ได้ฟรี 100% โดยใช้:
- **Frontend** → Cloudflare Pages (หรือ Vercel)
- **Backend** → Render.com
- **Database** → Turso (SQLite cloud)

---

## 📦 Step 1: เตรียม Repository

```bash
cd "D:\Web App\Thiny Shop"
git init
git add .
git commit -m "Initial commit"
# Push ไปที่ GitHub (สร้าง repo ใหม่ก่อน)
git remote add origin https://github.com/YOUR_USERNAME/thiny-shop.git
git branch -M main
git push -u origin main
```

ก่อน push **แก้ `.gitignore`** ไม่ให้ commit DB เก่า + node_modules:
```
backend/node_modules/
backend/thiny_shop.db
.env
.env.local
*.log
```

---

## 🗄️ Step 2: Database — Turso (ฟรี 9GB SQLite)

### 1. สมัครและสร้าง DB
```bash
# ติดตั้ง Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth signup       # หรือ turso auth login

# สร้าง database
turso db create thiny-shop --location sin   # sin = Singapore (ใกล้ไทย)

# ดู URL connection
turso db show thiny-shop --url
# จะได้: libsql://thiny-shop-yourname.turso.io

# สร้าง auth token
turso db tokens create thiny-shop
# จะได้: eyJhbGciOiJFZERTQSI... (เก็บไว้)
```

### 2. Migration จาก SQLite local → Turso
```bash
# Dump schema + data ปัจจุบัน
cd backend
sqlite3 thiny_shop.db .dump > dump.sql

# Push เข้า Turso
turso db shell thiny-shop < dump.sql
```

### 3. แก้ Backend ให้ใช้ Turso (เปลี่ยน connection)

ติดตั้ง package:
```bash
cd backend
npm install @libsql/client
```

แก้ `backend/db.js` รองรับทั้ง local SQLite และ Turso:
```js
// db.js
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_URL || 'file:./thiny_shop.db',
  authToken: process.env.TURSO_AUTH_TOKEN
});

module.exports = db;
```

แก้ `db-wrapper.js` ให้ใช้ libsql client (API คล้ายกัน):
```js
const db = require('./db');

async function query(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return [result.rows];
}

async function run(sql, params = []) {
  return db.execute({ sql, args: params });
}

module.exports = { query, run };
```

---

## 🖥️ Step 3: Backend — Render.com

### 1. สร้างไฟล์ `backend/render.yaml`
```yaml
services:
  - type: web
    name: thiny-shop-api
    runtime: node
    plan: free
    region: singapore
    buildCommand: npm install
    startCommand: node server.js
    healthCheckPath: /api/health
    envVars:
      - key: NODE_VERSION
        value: 20
      - key: TURSO_URL
        sync: false   # ตั้งเองใน dashboard
      - key: TURSO_AUTH_TOKEN
        sync: false
      - key: CORS_ORIGIN
        sync: false   # ใส่ URL ของ frontend
```

### 2. แก้ CORS ใน `server.js`
```js
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
};
app.use(cors(corsOptions));
```

### 3. Deploy บน Render
1. ไปที่ https://render.com → New Web Service
2. Connect GitHub repo
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. **Add Environment Variables:**
   - `TURSO_URL` = `libsql://thiny-shop-yourname.turso.io`
   - `TURSO_AUTH_TOKEN` = (token จาก turso)
   - `CORS_ORIGIN` = `https://thiny-shop.pages.dev` (frontend URL)
   - `NODE_VERSION` = `20`
7. Plan: **Free** → Deploy

จะได้ URL: `https://thiny-shop-api.onrender.com`

---

## 🌐 Step 4: Frontend — Cloudflare Pages

### 1. แก้ `src/data.js` ให้ใช้ API URL จาก env

แทนที่ hardcoded `'http://localhost:5000/api'`:
```js
const API_BASE = window.__THINY_API_URL__ || 'http://localhost:5000/api';
```

เพิ่มใน `index.html` ก่อน `<script src="src/data.js">`:
```html
<script>
  // Production API URL — แก้ตรงนี้ตอน deploy
  window.__THINY_API_URL__ = 'https://thiny-shop-api.onrender.com/api';
</script>
```

### 2. Deploy บน Cloudflare Pages
1. ไปที่ https://dash.cloudflare.com → Workers & Pages → Create
2. Connect GitHub repo
3. Build settings:
   - Framework preset: **None**
   - Build command: (ว่างไว้)
   - Build output directory: `/`
4. Deploy

จะได้ URL: `https://thiny-shop.pages.dev`

### 3. Custom Domain (optional, ฟรี)
- ใน Cloudflare Pages → Custom domains → Add
- ใส่ domain ที่ซื้อ (เช่นจาก Namecheap, Cloudflare Registrar)

---

## 🔒 Step 5: ป้องกัน Cold Start (Render Free Sleep)

ใช้ **UptimeRobot** ฟรี — ping API ทุก 5 นาที:

1. สมัคร https://uptimerobot.com (ฟรี 50 monitors)
2. Add Monitor:
   - Type: HTTP(s)
   - URL: `https://thiny-shop-api.onrender.com/api/health`
   - Interval: 5 minutes
3. Save → server จะไม่ sleep

---

## 📊 ค่าใช้จ่ายโดยรวม (Free Tier)

| บริการ | Free Limit | พอใช้ได้แค่ไหน |
|---|---|---|
| **Cloudflare Pages** | Unlimited bandwidth + 500 builds/เดือน | ใช้งานทั่วไปไม่จำกัด |
| **Render Free** | 750 hrs/เดือน · 512MB RAM | พอสำหรับ small business |
| **Turso Free** | 9GB · 1B rows reads/เดือน | ออเดอร์ระดับ 1 ล้าน/เดือน |
| **UptimeRobot** | 50 monitors · 5min interval | เกินพอ |

**รวม: ฟรี 100% สำหรับร้านขนาดเล็ก-กลาง** 🎉

---

## ⚙️ Step 6: Backup ข้อมูลอัตโนมัติ

Turso มี backup ในตัว แต่แนะนำ export เอง:
```bash
# Daily backup script
turso db shell thiny-shop ".dump" > backup-$(date +%Y%m%d).sql
```

ตั้งเป็น cron / GitHub Actions:
```yaml
# .github/workflows/backup.yml
on:
  schedule:
    - cron: '0 2 * * *'  # ทุกวันตี 2
```

---

## 🚀 Quick Deploy Checklist

- [ ] Push code ไป GitHub
- [ ] สร้าง Turso DB + migrate data
- [ ] Deploy backend บน Render
- [ ] อัปเดต API URL ใน frontend
- [ ] Deploy frontend บน Cloudflare Pages
- [ ] ตั้ง UptimeRobot ping
- [ ] ทดสอบ login + create order
- [ ] Backup script

---

## 🆙 ถ้าโตขึ้น (Paid Tier)

| ระดับ | ราคา/เดือน | ที่ได้ |
|---|---|---|
| Render Starter | $7 | ไม่ sleep · 512MB |
| Turso Hobby | $0 → $29 | 24GB · ไม่มี limit reads |
| Cloudflare Pro | $5 | extra analytics |

---

## 🔧 ทางเลือกอื่นถ้าไม่ชอบ Stack นี้

### Option B: All-in-one (จัดการง่ายกว่า)
- **Supabase** = DB + Auth + Storage + Realtime ทั้งหมด
- ต้องเปลี่ยน schema เป็น PostgreSQL
- ใช้ Supabase JS client แทน Express
- เหมาะถ้าอยากลด backend ไป serverless

### Option C: Fly.io (ไม่ sleep ฟรี)
- Deploy backend + SQLite ที่เดียวกัน
- ใช้ Fly Volumes สำหรับ persistent storage
- เหมาะถ้ายืนยันใช้ SQLite ไม่ย้าย DB

---

ติดต่อ: thinyshop.co
