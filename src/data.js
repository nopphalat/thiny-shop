// THINY SHOP — API data store + fallback mock data
// API URL: ใช้ window.__THINY_API_URL__ (ตั้งใน index.html ตอน deploy) หรือ localhost default
const API_BASE = (typeof window !== 'undefined' && window.__THINY_API_URL__) || 'http://localhost:5000/api';

// Static data that doesn't come from API
const CATEGORIES = [
  { id: "fashion", name: { th: "แฟชั่น", en: "Fashion", lo: "ແຟຊັນ" } },
  { id: "beauty", name: { th: "ความงาม", en: "Beauty", lo: "ຄວາມງາມ" } },
  { id: "home", name: { th: "ของใช้ในบ้าน", en: "Home & Living", lo: "ຂອງໃຊ້ໃນບ້ານ" } },
  { id: "food", name: { th: "อาหาร", en: "Food", lo: "ອາຫານ" } },
  { id: "electronics", name: { th: "อิเล็กทรอนิกส์", en: "Electronics", lo: "ເອເລັກໂທຣນິກ" } },
];

const CHANNELS = [
  { id: "shop", name: "THINY Shop", color: "#0F4C81", icon: "T" },
  { id: "shopee", name: "Shopee", color: "#EE4D2D", icon: "S" },
  { id: "lazada", name: "Lazada", color: "#1A1A8C", icon: "L" },
  { id: "tiktok", name: "TikTok Shop", color: "#000000", icon: "♪" },
];

const CHATS = [
  { id: "whatsapp", name: "WhatsApp", color: "#25D366", icon: "W" },
  { id: "facebook", name: "Messenger", color: "#0084FF", icon: "f" },
  { id: "line", name: "LINE", color: "#06C755", icon: "L" },
  { id: "ig", name: "Instagram DM", color: "#E1306C", icon: "♥" },
];

// SKU prefix → category mapping
const SKU_CAT = { "FW": "fashion", "BT": "beauty", "HM": "home", "FD": "food", "EL": "electronics" };

const SALES_TREND = [];
const CHANNEL_SPLIT = [];
const PREORDERS = [];

const CHAT_ORDERS = [];

// ============ Transform API rows → frontend format ============

function transformLocations(apiLocations) {
  return apiLocations.map(l => ({
    id: l.id,
    name: { th: l.name_th || '', en: l.name_en || '', lo: l.name_lo || '' },
    type: l.type,
    code: l.code,
  }));
}

function transformProducts(apiProducts, apiStock, locations) {
  // Build stock lookup: { product_id: { location_id: qty } }
  const stockMap = {};
  (apiStock || []).forEach(s => {
    if (!stockMap[s.product_id]) stockMap[s.product_id] = {};
    stockMap[s.product_id][s.location_id] = s.quantity;
  });

  return apiProducts.map(p => {
    const skuParts = (p.sku || '').split('-');
    const catKey = skuParts.length >= 2 ? skuParts[1] : '';
    const category = SKU_CAT[catKey] || 'fashion';
    const stockByLoc = stockMap[p.id] || {};
    const totalStock = Object.values(stockByLoc).reduce((a, b) => a + b, 0);

    return {
      id: p.id,
      sku: p.sku,
      barcode: p.barcode || '',
      name: { th: p.name_th || '', en: p.name_en || '', lo: p.name_lo || '' },
      category: category,
      price: Number(p.price),
      cost: Number(p.cost),
      status: totalStock < (p.reorder_point || 50) ? 'low' : 'active',
      image: p.image || p.id,
      stockByLoc: stockByLoc,
      reorder: p.reorder_point || 50,
      channels: ["shop", "shopee", "lazada", "tiktok"],
    };
  });
}

function transformMovements(apiMovements) {
  return apiMovements.map(m => ({
    id: m.id,
    type: m.type,
    product: m.product_id,
    qty: m.quantity,
    from: m.from_location_id || (m.type === 'in' ? 'supplier' : '—'),
    to: m.to_location_id || (m.type === 'out' ? 'customer' : '—'),
    user: m.user_name || 'System',
    date: m.movement_date || '',
    ref: m.reference_id || '',
  }));
}

function transformCustomers(apiCustomers) {
  return apiCustomers.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email || '',
    phone: c.phone || '',
    tier: c.tier || 'bronze',
    joined: c.joined_date || '',
    orders: 0,
    spent: 0,
    points: c.points || 0,
  }));
}

// ============ Fetch from backend API ============

// Transform backend chat_orders rows (flat) → frontend nested shape
function transformChatOrders(apiRows) {
  return (apiRows || []).map(r => ({
    id: r.id,
    platform: r.platform || 'shop',
    channel: r.channel || 'whatsapp',
    customer: {
      name: r.customer_name || '',
      phone: r.customer_phone || '',
      address: r.customer_address || '',
      note: r.customer_note || ''
    },
    customItem: r.custom_item_name ? {
      name: r.custom_item_name,
      options: r.custom_item_options || '',
      qty: r.custom_item_qty || 1,
      pricePerUnit: Number(r.custom_item_price) || 0
    } : null,
    items: [],
    subtotal: Number(r.subtotal) || 0,
    serviceFee: Number(r.service_fee) || 0,
    total: Number(r.total) || 0,
    sourceTracking: r.source_tracking || '',
    sourceCost: Number(r.source_cost) || 0,
    tracking: r.tracking || '',
    courier: r.courier || '',
    paymentMethod: r.payment_method || 'transfer',
    paymentStatus: r.payment_status || 'unpaid',
    status: r.status || 'new',
    lastMessage: r.last_message || '',
    created: r.created_at || ''
  }));
}

// Convert frontend chat order → backend payload (snake_case)
function toBackendChatOrder(o) {
  return {
    id: o.id,
    platform: o.platform,
    channel: o.channel,
    customer_name: o.customer?.name || '',
    customer_phone: o.customer?.phone || '',
    customer_address: o.customer?.address || '',
    customer_note: o.customer?.note || '',
    custom_item_name: o.customItem?.name || '',
    custom_item_options: o.customItem?.options || '',
    custom_item_qty: o.customItem?.qty || 1,
    custom_item_price: o.customItem?.pricePerUnit || 0,
    subtotal: o.subtotal || 0,
    service_fee: o.serviceFee || 0,
    total: o.total || 0,
    source_tracking: o.sourceTracking || '',
    source_cost: o.sourceCost || 0,
    tracking: o.tracking || '',
    courier: o.courier || '',
    payment_method: o.paymentMethod || 'transfer',
    payment_status: o.paymentStatus || 'unpaid',
    status: o.status || 'new',
    last_message: o.lastMessage || '',
    created_at: o.created || new Date().toISOString()
  };
}

// Expose for admin-chat usage
window.toBackendChatOrder = toBackendChatOrder;
window.API_BASE = typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:5000/api';

// ============ AUTH helpers ============
const AUTH_STORAGE_KEY = 'thiny_auth_v1';

window.getAuthToken = function() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).token;
  } catch (e) { return null; }
};

window.getAuthUser = function() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).user;
  } catch (e) { return null; }
};

window.setAuthSession = function(token, user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
};

window.clearAuthSession = function() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

window.authFetch = function(url, opts = {}) {
  const token = window.getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return fetch(url, { ...opts, headers });
};

// Log audit action (call this from anywhere)
window.logAudit = async function(action, target_type, target_id, details) {
  const user = window.getAuthUser();
  if (!user) return;
  try {
    await fetch(window.API_BASE + '/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        username: user.username,
        user_role: user.role,
        action,
        target_type: target_type || '',
        target_id: target_id || '',
        details: details || ''
      })
    });
  } catch (e) {}
};

async function loadDataFromAPI() {
  try {
    const [apiProducts, apiLocations, apiStock, apiCustomers, apiOrders, apiMovements, apiChatOrders] = await Promise.all([
      fetch(API_BASE + '/products').then(r => r.ok ? r.json() : []),
      fetch(API_BASE + '/locations').then(r => r.ok ? r.json() : []),
      fetch(API_BASE + '/stock').then(r => r.ok ? r.json() : []),
      fetch(API_BASE + '/customers').then(r => r.ok ? r.json() : []),
      fetch(API_BASE + '/orders').then(r => r.ok ? r.json() : []),
      fetch(API_BASE + '/movements').then(r => r.ok ? r.json() : []),
      fetch(API_BASE + '/chat-orders').then(r => r.ok ? r.json() : []),
    ]);

    const LOCATIONS = transformLocations(apiLocations);
    const PRODUCTS = transformProducts(apiProducts, apiStock, LOCATIONS);
    const MOVEMENTS = transformMovements(apiMovements);
    const CUSTOMERS = transformCustomers(apiCustomers);
    const liveChatOrders = transformChatOrders(apiChatOrders);
    const finalChatOrders = liveChatOrders; // always use API data (empty = no orders)
    // direct sales (POS) from orders table
    const ORDERS = (apiOrders || []).map(o => ({
      id: o.id,
      customerId: o.customer_id,
      total: Number(o.total_amount) || 0,
      status: o.status || 'completed',
      date: o.order_date || '',  // ISO/SQL datetime string
    }));

    console.log('[THINY] Loaded from API:', PRODUCTS.length, 'products,', LOCATIONS.length, 'locations,', CUSTOMERS.length, 'customers,', liveChatOrders.length, 'chat orders,', ORDERS.length, 'POS orders');

    return {
      LOCATIONS, PRODUCTS, MOVEMENTS, CUSTOMERS, ORDERS,
      CATEGORIES, CHANNELS, CHATS,
      SALES_TREND, CHANNEL_SPLIT,
      PREORDERS, CHAT_ORDERS: finalChatOrders,
    };
  } catch (err) {
    console.warn('[THINY] API unavailable, using fallback mock data:', err.message);
    return null;
  }
}

// ============ Fallback mock data (original) ============

function getMockData() {
  const LOCATIONS = [
    { id: "wh-bkk", name: { th: "คลังกลาง กรุงเทพฯ", en: "Main Warehouse BKK", lo: "ສາງໃຫຍ່ ບາງກອກ" }, type: "warehouse", code: "WH-01" },
    { id: "wh-cnx", name: { th: "คลังเชียงใหม่", en: "Chiang Mai Warehouse", lo: "ສາງ ຊຽງໃໝ່" }, type: "warehouse", code: "WH-02" },
    { id: "st-siam", name: { th: "หน้าร้าน สยาม", en: "Siam Store", lo: "ຮ້ານ ສະຍາມ" }, type: "store", code: "ST-01" },
    { id: "st-emp", name: { th: "หน้าร้าน เอ็มโพเรียม", en: "Emporium Store", lo: "ຮ້ານ ເອັມໂພລຽມ" }, type: "store", code: "ST-02" },
    { id: "st-vte", name: { th: "ร้านเวียงจันทน์", en: "Vientiane Store", lo: "ຮ້ານ ວຽງຈັນ" }, type: "store", code: "ST-03" },
  ];
  const PRODUCTS = [
    { id: "P001", sku: "TS-FW-001", barcode: "8851234567001", name: { th: "เสื้อโอเวอร์ไซส์ Linen", en: "Linen Oversized Tee", lo: "ເສື້ອລີນິນ" }, category: "fashion", price: 590, cost: 220, status: "active", image: "linen-tee", stockByLoc: { "wh-bkk": 124, "wh-cnx": 56, "st-siam": 18, "st-emp": 9, "st-vte": 22 }, reorder: 30, channels: ["shop", "shopee", "lazada", "tiktok"] },
    { id: "P002", sku: "TS-FW-002", barcode: "8851234567002", name: { th: "กางเกงทรงกระบอก Twill", en: "Twill Wide Pants", lo: "ກາງເກງ Twill" }, category: "fashion", price: 890, cost: 340, status: "active", image: "twill-pants", stockByLoc: { "wh-bkk": 87, "wh-cnx": 32, "st-siam": 12, "st-emp": 5, "st-vte": 14 }, reorder: 25, channels: ["shop", "shopee", "lazada"] },
    { id: "P003", sku: "TS-BT-001", barcode: "8851234567003", name: { th: "เซรั่มวิตามินซี 30ml", en: "Vitamin C Serum 30ml", lo: "ເຊຣັມວິຕາມິນ C" }, category: "beauty", price: 1290, cost: 480, status: "active", image: "vitc-serum", stockByLoc: { "wh-bkk": 245, "wh-cnx": 88, "st-siam": 34, "st-emp": 28, "st-vte": 41 }, reorder: 50, channels: ["shop", "shopee", "lazada", "tiktok"] },
    { id: "P004", sku: "TS-BT-002", barcode: "8851234567004", name: { th: "บาล์มบำรุงริมฝีปาก", en: "Lip Repair Balm", lo: "ບາມບຳລຸງສົບ" }, category: "beauty", price: 290, cost: 95, status: "active", image: "lip-balm", stockByLoc: { "wh-bkk": 412, "wh-cnx": 156, "st-siam": 67, "st-emp": 54, "st-vte": 78 }, reorder: 100, channels: ["shop", "shopee", "tiktok"] },
    { id: "P005", sku: "TS-HM-001", barcode: "8851234567005", name: { th: "เทียนหอม Cedar 200g", en: "Cedar Soy Candle 200g", lo: "ທຽນຫອມ Cedar" }, category: "home", price: 690, cost: 240, status: "active", image: "candle", stockByLoc: { "wh-bkk": 64, "wh-cnx": 22, "st-siam": 8, "st-emp": 11, "st-vte": 7 }, reorder: 20, channels: ["shop", "shopee", "lazada"] },
    { id: "P006", sku: "TS-HM-002", barcode: "8851234567006", name: { th: "แก้วเซรามิก Matte", en: "Matte Ceramic Mug", lo: "ຈອກເຊຣາມິກ" }, category: "home", price: 350, cost: 130, status: "low", image: "mug", stockByLoc: { "wh-bkk": 18, "wh-cnx": 4, "st-siam": 2, "st-emp": 0, "st-vte": 3 }, reorder: 30, channels: ["shop", "shopee"] },
    { id: "P007", sku: "TS-FD-001", barcode: "8851234567007", name: { th: "กาแฟดริปคั่วเข้ม 200g", en: "Dark Roast Drip Coffee 200g", lo: "ກາເຟຄົ່ວເຂັ້ມ" }, category: "food", price: 420, cost: 160, status: "active", image: "coffee", stockByLoc: { "wh-bkk": 156, "wh-cnx": 64, "st-siam": 22, "st-emp": 18, "st-vte": 26 }, reorder: 40, channels: ["shop", "shopee", "lazada", "tiktok"] },
    { id: "P008", sku: "TS-FD-002", barcode: "8851234567008", name: { th: "น้ำผึ้งเดือนห้า 500g", en: "Wild Honey 500g", lo: "ນ້ຳເຜິ້ງປ່າ" }, category: "food", price: 480, cost: 180, status: "active", image: "honey", stockByLoc: { "wh-bkk": 78, "wh-cnx": 33, "st-siam": 12, "st-emp": 9, "st-vte": 15 }, reorder: 25, channels: ["shop", "lazada"] },
    { id: "P009", sku: "TS-EL-001", barcode: "8851234567009", name: { th: "หูฟัง Bluetooth Mini", en: "Bluetooth Mini Earbuds", lo: "ຫູຟັງບລູທູດ" }, category: "electronics", price: 1490, cost: 620, status: "active", image: "earbuds", stockByLoc: { "wh-bkk": 92, "wh-cnx": 28, "st-siam": 14, "st-emp": 12, "st-vte": 18 }, reorder: 30, channels: ["shop", "shopee", "lazada", "tiktok"] },
    { id: "P010", sku: "TS-EL-002", barcode: "8851234567010", name: { th: "สายชาร์จ USB-C Braided", en: "USB-C Braided Cable", lo: "ສາຍສາກ USB-C" }, category: "electronics", price: 290, cost: 80, status: "active", image: "cable", stockByLoc: { "wh-bkk": 320, "wh-cnx": 124, "st-siam": 56, "st-emp": 48, "st-vte": 62 }, reorder: 80, channels: ["shop", "shopee", "lazada", "tiktok"] },
    { id: "P011", sku: "TS-FW-003", barcode: "8851234567011", name: { th: "หมวก Bucket Hat ผ้าแคนวาส", en: "Canvas Bucket Hat", lo: "ໝວກບັກເກັດ" }, category: "fashion", price: 390, cost: 140, status: "active", image: "hat", stockByLoc: { "wh-bkk": 56, "wh-cnx": 18, "st-siam": 9, "st-emp": 6, "st-vte": 11 }, reorder: 20, channels: ["shop", "shopee", "tiktok"] },
    { id: "P012", sku: "TS-BT-003", barcode: "8851234567012", name: { th: "มาส์กแผ่น Hydrating x5", en: "Hydrating Sheet Mask x5", lo: "ມາສ໌ກແຜ່ນ x5" }, category: "beauty", price: 350, cost: 110, status: "low", image: "mask", stockByLoc: { "wh-bkk": 22, "wh-cnx": 6, "st-siam": 3, "st-emp": 1, "st-vte": 4 }, reorder: 40, channels: ["shop", "shopee", "lazada", "tiktok"] },
  ];
  const MOVEMENTS = [];
  const CUSTOMERS = [];

  return {
    LOCATIONS, PRODUCTS, MOVEMENTS, CUSTOMERS,
    CATEGORIES, CHANNELS, CHATS,
    SALES_TREND, CHANNEL_SPLIT,
    PREORDERS, CHAT_ORDERS,
  };
}

// ============ Persistence helpers (Backend API for CHAT_ORDERS) ============

// Persist a single order's update to backend (PUT /api/chat-orders/:id)
// Falls back silently if backend is unavailable.
window.saveChatOrder = async function(order) {
  if (!order || !order.id) return;
  try {
    const payload = toBackendChatOrder(order);
    const res = await fetch(window.API_BASE + '/chat-orders/' + encodeURIComponent(order.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) console.warn('[THINY] saveChatOrder PUT failed:', res.status);
  } catch (e) {
    console.warn('[THINY] saveChatOrder error:', e.message);
  }
};

// Create new order in backend (POST /api/chat-orders)
window.createChatOrder = async function(order) {
  if (!order || !order.id) return;
  try {
    const payload = toBackendChatOrder(order);
    const res = await fetch(window.API_BASE + '/chat-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) console.warn('[THINY] createChatOrder POST failed:', res.status);
  } catch (e) {
    console.warn('[THINY] createChatOrder error:', e.message);
  }
};

// Save ALL chat orders (legacy compatibility helper — saves each as PUT)
// Called after status/payment/tracking updates from in-memory mutations.
window.saveChatOrders = function() {
  // We rely on individual saveChatOrder calls for granular updates.
  // This is kept for backward compatibility — does nothing if not called explicitly.
};

// Reset helper (deletes all and reloads)
window.resetChatOrders = async function() {
  if (!confirm('ลบออเดอร์ทั้งหมดและโหลด sample data ใหม่?')) return;
  try {
    const orders = window.THINY_DATA.CHAT_ORDERS || [];
    await Promise.all(orders.map(o =>
      fetch(window.API_BASE + '/chat-orders/' + encodeURIComponent(o.id), { method: 'DELETE' })
        .catch(() => {})
    ));
    location.reload();
  } catch (e) { alert('Error: ' + e.message); }
};

// Legacy localStorage fallback (only used if backend is unreachable)
function loadStoredChatOrders() {
  try {
    const raw = localStorage.getItem('thiny_chat_orders_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) { return null; }
}

function applyStoredChatOrders(data) {
  // localStorage fallback disabled — API is authoritative; empty = no orders
  return data;
}

// ============ Initialize ============

// Start with mock data so components render immediately
window.THINY_DATA = applyStoredChatOrders(getMockData());
window.THINY_DATA_SOURCE = 'mock';

// Then try to load from API and swap data
loadDataFromAPI().then(apiData => {
  if (apiData) {
    window.THINY_DATA = applyStoredChatOrders(apiData);
    window.THINY_DATA_SOURCE = 'api';
    console.log('[THINY] ✓ Switched to API data');
  } else {
    console.log('[THINY] Using mock data (API unavailable)');
  }
  // Notify any listeners
  window.dispatchEvent(new CustomEvent('thiny:data-loaded'));
});
