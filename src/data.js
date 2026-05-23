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

// Sales trend (static analytics — will be replaced when analytics API is built)
const SALES_TREND = [
  { d: "06", sales: 24800, orders: 38 },
  { d: "07", sales: 28100, orders: 42 },
  { d: "08", sales: 31900, orders: 48 },
  { d: "09", sales: 22400, orders: 34 },
  { d: "10", sales: 26700, orders: 40 },
  { d: "11", sales: 34200, orders: 52 },
  { d: "12", sales: 41600, orders: 63 },
  { d: "13", sales: 38900, orders: 58 },
  { d: "14", sales: 29400, orders: 45 },
  { d: "15", sales: 33800, orders: 51 },
  { d: "16", sales: 44100, orders: 67 },
  { d: "17", sales: 47900, orders: 72 },
  { d: "18", sales: 39200, orders: 59 },
  { d: "19", sales: 42700, orders: 64 },
];

const CHANNEL_SPLIT = [
  { id: "shop", pct: 28, value: 184200 },
  { id: "shopee", pct: 32, value: 210800 },
  { id: "lazada", pct: 22, value: 144800 },
  { id: "tiktok", pct: 18, value: 118400 },
];

const PREORDERS = [
  { id: "PO-2826", channel: "shopee", customer: "Napaporn S.", product: "P003", qty: 2, total: 2580, status: "pending", date: "2026-05-19 14:22", eta: "2026-05-23" },
  { id: "PO-2825", channel: "lazada", customer: "Somchai K.", product: "P001", qty: 1, total: 590, status: "packing", date: "2026-05-19 13:18", eta: "2026-05-22" },
  { id: "PO-2824", channel: "tiktok", customer: "Praewa T.", product: "P004", qty: 5, total: 1450, status: "shipped", date: "2026-05-19 11:04", eta: "2026-05-21" },
  { id: "PO-2823", channel: "shopee", customer: "Anan W.", product: "P009", qty: 1, total: 1490, status: "pending", date: "2026-05-19 10:42", eta: "2026-05-23" },
  { id: "PO-2822", channel: "lazada", customer: "Kanya R.", product: "P002", qty: 2, total: 1780, status: "packing", date: "2026-05-19 09:15", eta: "2026-05-22" },
  { id: "PO-2821", channel: "tiktok", customer: "Vichai L.", product: "P007", qty: 3, total: 1260, status: "shipped", date: "2026-05-18 22:50", eta: "2026-05-20" },
  { id: "PO-2820", channel: "shop", customer: "Ploy J.", product: "P010", qty: 4, total: 1160, status: "delivered", date: "2026-05-18 18:33", eta: "2026-05-20" },
  { id: "PO-2819", channel: "shopee", customer: "Tanawat P.", product: "P005", qty: 1, total: 690, status: "pending", date: "2026-05-18 16:11", eta: "2026-05-22" },
  { id: "PO-2818", channel: "lazada", customer: "Manee S.", product: "P012", qty: 2, total: 700, status: "cancelled", date: "2026-05-18 14:08", eta: "—" },
  { id: "PO-2817", channel: "tiktok", customer: "Daoroong N.", product: "P003", qty: 1, total: 1290, status: "delivered", date: "2026-05-18 12:45", eta: "2026-05-20" },
];

const CHAT_ORDERS = [
  // Nike shoes example - awaiting shop owner to order from Shopee
  { id: "CH-1043", platform: "shopee", channel: "line", customer: { name: "ปริยา ม.", phone: "0813334455", address: "100 ม.5 บางบัวทอง นนทบุรี 11110", note: "ขอกล่องสวยๆ ให้ของขวัญ" }, customItem: { name: "Nike Air Max 90", options: "Size 40 / สีดำ", qty: 1, pricePerUnit: 3290 }, items: [], subtotal: 3290, serviceFee: 80, total: 3370, sourceTracking: "", sourceCost: 2890, tracking: "", courier: "", paymentMethod: "transfer", paymentStatus: "paid", status: "paid", created: "2026-05-21 09:15", lastMessage: "อยากได้รองเท้าค่ะ สั่งให้ด้วยได้ไหม" },
  { id: "CH-1042", platform: "shop", channel: "whatsapp", customer: { name: "Pim Suwannee", phone: "0812345678", address: "123/4 ซ.อารีย์ 5 พญาไท กรุงเทพฯ 10400", note: "ส่งวันจันทร์ก็ได้" }, items: [{ pid: "P003", qty: 2 }, { pid: "P004", qty: 1 }], tracking: "TH99-1234-5678", courier: "Kerry", sourceTracking: "", sourceCost: 0, paymentMethod: "transfer", paymentStatus: "paid", status: "shipped", total: 2870, created: "2026-05-19 14:30", lastMessage: "ขอบคุณคะ รอรับของนะ 🙏" },
  { id: "CH-1041", platform: "shopee", channel: "facebook", customer: { name: "Akira Wong", phone: "0991234567", address: "88 ม.6 บางพลี สมุทรปราการ 10540", note: "" }, items: [{ pid: "P001", qty: 1 }], tracking: "", courier: "", sourceTracking: "SPX-9988-1122", sourceCost: 350, paymentMethod: "transfer", paymentStatus: "unpaid", status: "awaitingPayment", total: 590, created: "2026-05-19 13:12", lastMessage: "ยังจ่ายอยู่นะ เดี๋ยวโอนเลย" },
  { id: "CH-1040", platform: "lazada", channel: "line", customer: { name: "Nattaya R.", phone: "0867789900", address: "55/1 รัชดา ดินแดง กรุงเทพฯ 10400", note: "ใส่กล่องของขวัญด้วยน้า" }, items: [{ pid: "P005", qty: 1 }, { pid: "P008", qty: 2 }], tracking: "FLE-4421-9012", courier: "Flash", sourceTracking: "LZD-2200-7788", sourceCost: 1100, paymentMethod: "cod", paymentStatus: "unpaid", status: "arrived", total: 1650, created: "2026-05-19 11:55", lastMessage: "ใช้บัตรเครดิตได้ไหมคะ?" },
  { id: "CH-1039", platform: "shop", channel: "whatsapp", customer: { name: "Kham Vongphachanh", phone: "+8562012345678", address: "23 Ban Saphangmoh, Vientiane", note: "ส่งข้าม border" }, items: [{ pid: "P010", qty: 3 }], tracking: "DHL-7788-0099", courier: "DHL", sourceTracking: "", sourceCost: 0, paymentMethod: "transfer", paymentStatus: "paid", status: "shipped", total: 870, created: "2026-05-19 10:20", lastMessage: "Got the tracking, thanks!" },
  { id: "CH-1038", platform: "tiktok", channel: "ig", customer: { name: "@phitchapha_", phone: "0822334455", address: "12 อโศกมนตรี วัฒนา กรุงเทพฯ 10110", note: "" }, items: [{ pid: "P012", qty: 4 }], tracking: "", courier: "", sourceTracking: "TT-4455-8899", sourceCost: 900, paymentMethod: "transfer", paymentStatus: "unpaid", status: "new", total: 1400, created: "2026-05-19 09:48", lastMessage: "สนใจมาส์กแผ่นค่ะ มีของไหม" },
  { id: "CH-1037", platform: "shopee", channel: "facebook", customer: { name: "Somsak P.", phone: "0945556677", address: "99/8 ลาดพร้าว 71 กรุงเทพฯ 10230", note: "" }, items: [{ pid: "P007", qty: 2 }, { pid: "P002", qty: 1 }], tracking: "JT99-1199-2299", courier: "J&T", sourceTracking: "SPX-3344-5566", sourceCost: 1200, paymentMethod: "transfer", paymentStatus: "paid", status: "delivered", total: 1730, created: "2026-05-18 17:04", lastMessage: "ของถึงแล้ว ขอบคุณค่ะ ⭐⭐⭐⭐⭐" },
  { id: "CH-1036", platform: "lazada", channel: "line", customer: { name: "Mali D.", phone: "0814443322", address: "5 ม.1 ต.สันทราย เชียงใหม่ 50210", note: "เก็บปลายทาง" }, items: [{ pid: "P011", qty: 1 }, { pid: "P006", qty: 2 }], tracking: "TH88-2200-1100", courier: "Thailand Post", sourceTracking: "LZD-7788-3344", sourceCost: 700, paymentMethod: "cod", paymentStatus: "unpaid", status: "shipped", total: 1090, created: "2026-05-18 15:22", lastMessage: "ขอที่อยู่หลังจัดส่งให้หน่อยค่ะ" },
  { id: "CH-1035", platform: "shop", channel: "whatsapp", customer: { name: "Linda S.", phone: "0623344556", address: "Mahasarakham", note: "" }, items: [{ pid: "P009", qty: 1 }], tracking: "", courier: "", sourceTracking: "", sourceCost: 0, paymentMethod: "transfer", paymentStatus: "unpaid", status: "cancelled", total: 1490, created: "2026-05-18 12:30", lastMessage: "ขอยกเลิกค่ะ ราคาที่อื่นถูกกว่า" },
];

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
  const MOVEMENTS = [
    { id: "MV-9912", type: "in", product: "P001", qty: 50, from: "supplier", to: "wh-bkk", user: "Admin", date: "2026-05-19 15:42", ref: "PUR-0421" },
    { id: "MV-9911", type: "out", product: "P003", qty: 2, from: "wh-bkk", to: "customer", user: "System", date: "2026-05-19 14:22", ref: "PO-2826" },
    { id: "MV-9910", type: "transfer", product: "P007", qty: 20, from: "wh-bkk", to: "st-siam", user: "Admin", date: "2026-05-19 13:55", ref: "TR-0188" },
    { id: "MV-9909", type: "out", product: "P001", qty: 1, from: "wh-bkk", to: "customer", user: "System", date: "2026-05-19 13:18", ref: "PO-2825" },
    { id: "MV-9908", type: "in", product: "P010", qty: 200, from: "supplier", to: "wh-bkk", user: "Admin", date: "2026-05-19 11:30", ref: "PUR-0420" },
    { id: "MV-9907", type: "out", product: "P004", qty: 5, from: "wh-bkk", to: "customer", user: "System", date: "2026-05-19 11:04", ref: "PO-2824" },
    { id: "MV-9906", type: "adjust", product: "P006", qty: -2, from: "st-emp", to: "—", user: "Manager", date: "2026-05-19 10:15", ref: "ADJ-0042" },
    { id: "MV-9905", type: "out", product: "P009", qty: 1, from: "wh-bkk", to: "customer", user: "System", date: "2026-05-19 10:42", ref: "PO-2823" },
    { id: "MV-9904", type: "transfer", product: "P012", qty: 15, from: "wh-cnx", to: "st-vte", user: "Admin", date: "2026-05-19 09:50", ref: "TR-0187" },
    { id: "MV-9903", type: "in", product: "P008", qty: 30, from: "supplier", to: "wh-cnx", user: "Admin", date: "2026-05-18 17:00", ref: "PUR-0419" },
  ];
  const CUSTOMERS = [
    { id: "C001", name: "Napaporn S.", email: "napaporn@example.com", phone: "081-234-5678", tier: "gold", joined: "2024-08-12", orders: 24, spent: 18420, points: 1842 },
    { id: "C002", name: "Somchai K.", email: "somchai@example.com", phone: "089-876-5432", tier: "silver", joined: "2025-01-04", orders: 12, spent: 8650, points: 865 },
    { id: "C003", name: "Praewa T.", email: "praewa@example.com", phone: "062-555-0188", tier: "platinum", joined: "2023-11-28", orders: 47, spent: 52310, points: 5231 },
    { id: "C004", name: "Anan W.", email: "anan@example.com", phone: "094-444-2211", tier: "bronze", joined: "2026-02-14", orders: 3, spent: 1890, points: 189 },
    { id: "C005", name: "Kanya R.", email: "kanya@example.com", phone: "086-330-9911", tier: "gold", joined: "2024-05-22", orders: 18, spent: 14200, points: 1420 },
  ];

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
