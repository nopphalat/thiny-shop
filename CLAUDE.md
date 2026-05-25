# THINY SHOP — Context for Claude

> Read this file FIRST before any task. Saves tokens by skipping rediscovery.

## What this is
ระบบจัดการ Pre-order + ร้านค้าออนไลน์ สำหรับร้านเล็ก (Laos/Thailand). React (no build tooling — Babel standalone in browser) + Node.js/Express + Turso (libSQL).

## URLs
- **Frontend (live):** https://nopphalat.github.io/thiny-shop/
- **Backend (live):** https://thiny-shop-api.vercel.app/api
- **Repo:** https://github.com/nopphalat/thiny-shop (public)
- **DB:** Turso `libsql://thiny-shop-nopphalat.aws-ap-south-1.turso.io`

## Stack
- **Frontend hosting:** GitHub Pages (Microsoft IPs — only one not blocked by user's ISP)
- **Backend hosting:** Vercel (serverless functions, free Hobby plan)
- **Database:** Turso (cloud SQLite, free tier, AWS Asia)
- **Auto-deploy:** push to `main` → Vercel + GitHub Pages rebuild automatically
- **No bundler:** index.html loads Babel from jsDelivr, transpiles JSX in-browser

## Project structure
```
/index.html              ← Entry point. Sets window.__THINY_API_URL__
/src/
  data.js                ← Loads from API, falls back to mock. Exposes window.THINY_DATA + window.API_BASE
  i18n.js                ← TH/EN/LO translations
  shared.jsx             ← Icons, ProductImg, ChannelPill, StatusBadge, format helpers
  auth.jsx               ← LoginScreen + AuthProvider (token in localStorage)
  admin-shell.jsx        ← AdminApp wrapper, NAV, AddProductModal, EditProductModal,
                            ReceiveStockModal, SellProductModal, MultiSellModal,
                            ScreenProducts, ScreenProductDetail, Dashboard, DirectSalesSummary,
                            logMovement(), generateBarcode(), compressImage(), printReceipt()
  admin-screens.jsx      ← ScreenScan, ScreenCustomers, ScreenReports, ScreenFinance,
                            ScreenCalendar, ScreenUsers, ScreenAuditLog
  admin-chat.jsx         ← ScreenChatOrders (pre-orders from LINE/FB/IG/etc.)
  shop.jsx               ← Customer-facing storefront (mobile UI)
ios-frame.jsx            ← iOS-style device frame component
/backend/
  server.js              ← Express app. Exports app. Listens only if !process.env.VERCEL.
                            Flexible CORS allows *.github.io / *.onrender.com / *.pages.dev / *.vercel.app / localhost
  db.js                  ← Turso client if TURSO_URL set, else local sqlite
  db-wrapper.js          ← Adapter for query()/run() with both adapters
  init-db.js             ← Schema migration + seed (DO NOT run on serverless requests)
  routes/                ← Express routers: products, locations, stock, orders, customers,
                            movements, chat-orders, expenses, notifications, auth, users, audit-log
  Dockerfile             ← For Render (kept as fallback)
  vercel.json            ← Routes /(.*)→server.js via @vercel/node
  fly.toml               ← Old Fly.io config (trial expired, not in use)
/render.yaml             ← Render Blueprint (backend + static, kept as fallback)
/.github/workflows/fly-deploy.yml  ← Old, unused now
```

## Key data flow
1. `index.html` sets `window.__THINY_API_URL__ = 'https://thiny-shop-api.vercel.app/api'`
2. `data.js` reads that, sets `window.API_BASE`, fetches all data from API into `window.THINY_DATA`
3. While loading: `window.THINY_DATA = getMockData()` (placeholder)
4. After fetch: swaps to real data, dispatches `thiny:data-loaded` event
5. If API unreachable → keeps mock data, shows "Using mock data" in console

## Auth flow
- Login → POST `/api/auth/login` → returns token + user
- Token stored in localStorage
- All authenticated requests should send `Authorization: Bearer <token>`
- 3 default roles: owner / manager / staff (role-based menu visibility)

## DB tables (Turso)
products, locations, stock (UNIQUE on product_id+location_id), customers, orders,
order_items, movements, chat_orders, expenses, notifications_log, users, sessions, audit_log

## Things that look like bugs but aren't
- **Hardcoded localhost fallback** in 9 places (`window.API_BASE || 'http://localhost:5000/api'`) —
  `window.API_BASE` IS set synchronously by data.js before any component renders, so fallback never triggers
- **Console.log in production** — kept for diagnostics on user's restricted network
- **Mock data on first load** — intentional, swapped after API responds

## Gotchas
- **JSX files are loaded via `type="text/babel"`** and transpiled in browser. Don't add real bundler — keeps deploy simple.
- **Cache busting via `?v=NN`** in script src in index.html. **Bump it whenever you edit a .jsx file.**
- **User's ISP blocks** `*.vercel.app`, `*.onrender.com`, `*.pages.dev`. User must use VPN to access from home network.
  Customers from other networks have no issue.
- **Repo is PUBLIC** — never commit secrets. backend/.env is gitignored.
- **DB init** must NOT run on serverless requests (Vercel 10s timeout). Only runs when starting standalone server.
- **CORS_ORIGIN env var** is set but server.js also has hardcoded suffix allowlist (`.github.io`, etc.) — both work together.

## Common task patterns

### "Add a feature" → typical files to touch:
- UI: `src/admin-shell.jsx` (modals) or `src/admin-screens.jsx` (page screens)
- API: `backend/routes/<entity>.js`
- Bump version in `index.html` for any .jsx edit
- Commit + push → auto-deploys to both frontend (GH Pages) and backend (Vercel)

### "Fix a bug" → check:
1. Run `node -e "const b=require('@babel/standalone');b.transform(require('fs').readFileSync('src/FILE.jsx','utf-8'),{presets:['react']})"` to syntax-check
2. Open browser DevTools Console — Babel parse errors show there

### "Database operation" → use:
```js
const { createClient } = require('@libsql/client');
const db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN });
await db.execute('SELECT * FROM products');
```
Or write a one-off script in `backend/*.js` (gitignored: clear-products.js, reset-locations.js).

## Skip these patterns — they don't apply here
- Don't suggest TypeScript / Vite / Next.js migration (user wants simple, no-build setup)
- Don't suggest Tailwind (using custom CSS in styles.css)
- Don't suggest Cloudflare Pages (user's ISP blocks .pages.dev)
- Don't suggest Render free tier as primary (50s cold-start unacceptable; backed up to Vercel)
- Don't suggest paid hosting unless user explicitly asks (BCEL One Mastercard rejected by Stripe-based providers)

## User context
- **Location:** Laos
- **Card:** BCEL One Mastercard debit virtual (rejected by Fly, Railway, Hostinger via Stripe)
- **Home ISP:** blocks most SaaS domains. Uses VPN (Hotspot Shield from MS Store).
- **Languages:** Reads/writes Thai (primary), Lao, English
- **Skill:** Beginner — explain in simple terms, avoid jargon, give exact button-by-button instructions

## Prefer short responses
The user prefers concise answers. If they ask "ตอบสั้น" or "สั้นๆ", reply in 2–3 lines.
For "what should I do" questions, give numbered steps not paragraphs.
