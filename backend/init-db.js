const db = require('./db');
const crypto = require('crypto');

// Simple SHA256 password hashing (prototype only — production should use bcrypt)
function hashPassword(plain) {
  return crypto.createHash('sha256').update(plain + 'thiny-salt').digest('hex');
}

const schema = `
CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(10) PRIMARY KEY,
  name_th VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  name_lo VARCHAR(255),
  type TEXT NOT NULL,
  code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(10) PRIMARY KEY,
  sku VARCHAR(20) UNIQUE NOT NULL,
  name_th VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  name_lo VARCHAR(255),
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  barcode VARCHAR(50) UNIQUE,
  image VARCHAR(255),
  reorder_point INT DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id VARCHAR(10) NOT NULL,
  location_id VARCHAR(10) NOT NULL,
  quantity INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  UNIQUE (product_id, location_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  tier TEXT DEFAULT 'bronze',
  joined_date DATE,
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(20) PRIMARY KEY,
  customer_id VARCHAR(10),
  total_amount DECIMAL(12, 2),
  status TEXT DEFAULT 'pending',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id VARCHAR(20) NOT NULL,
  product_id VARCHAR(10) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS movements (
  id VARCHAR(20) PRIMARY KEY,
  type TEXT NOT NULL,
  product_id VARCHAR(10) NOT NULL,
  quantity INT NOT NULL,
  from_location_id VARCHAR(10),
  to_location_id VARCHAR(10),
  user_name VARCHAR(255),
  reference_id VARCHAR(50),
  movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (from_location_id) REFERENCES locations(id),
  FOREIGN KEY (to_location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role TEXT NOT NULL DEFAULT 'staff',
  active INTEGER DEFAULT 1,
  avatar VARCHAR(255),
  token VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username VARCHAR(50),
  user_role TEXT,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(50),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

CREATE TABLE IF NOT EXISTS chat_orders (
  id VARCHAR(20) PRIMARY KEY,
  platform TEXT,
  channel TEXT,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  customer_note TEXT,
  custom_item_name VARCHAR(255),
  custom_item_options VARCHAR(255),
  custom_item_qty INT DEFAULT 1,
  custom_item_price DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(12, 2) DEFAULT 0,
  service_fee DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(12, 2) DEFAULT 0,
  source_tracking VARCHAR(100),
  source_cost DECIMAL(10, 2) DEFAULT 0,
  tracking VARCHAR(100),
  courier VARCHAR(50),
  payment_method TEXT DEFAULT 'transfer',
  payment_status TEXT DEFAULT 'unpaid',
  status TEXT DEFAULT 'new',
  last_message TEXT,
  created_at TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  note TEXT,
  expense_date TEXT NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id VARCHAR(20),
  template TEXT,
  channel TEXT,
  message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_orders_status ON chat_orders(status);
CREATE INDEX IF NOT EXISTS idx_chat_orders_platform ON chat_orders(platform);
CREATE INDEX IF NOT EXISTS idx_chat_orders_phone ON chat_orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_chat_orders_tracking ON chat_orders(tracking);
CREATE INDEX IF NOT EXISTS idx_chat_orders_source_tracking ON chat_orders(source_tracking);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications_log(order_id);

CREATE INDEX IF NOT EXISTS idx_product_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location_id);
CREATE INDEX IF NOT EXISTS idx_order_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(movement_date);
`;

const { query: dbQuery, run: dbRun } = require('./db-wrapper');

async function initializeDatabase() {
  const statements = schema.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    try {
      await dbRun(stmt);
    } catch (err) {
      console.error('Error creating schema:', err.message, '\nSQL:', stmt.substring(0, 80));
      throw err;
    }
  }
  console.log('Database schema initialized');
  await seedDatabase();
}

async function seedDatabase() {
  const [rows] = await dbQuery("SELECT COUNT(*) as count FROM locations");
  const count = rows[0]?.count ?? rows[0]?.COUNT ?? 0;

  if (count > 0) {
    console.log('Database already seeded, skipping seed data');
    return;
  }

  console.log('Seeding database with sample data...');
  return seedDatabaseInternal();
}

async function seedDatabaseInternal() {
  return new Promise((resolve, reject) => {
    (async () => {

      const seedStatements = [
        // Locations
        "INSERT INTO locations (id, name_th, name_en, name_lo, type, code) VALUES ('WH-01', 'คลังสินค้าหลัก', 'Main Warehouse', 'ສາງໃຫຍ່', 'warehouse', 'WH01')",
        "INSERT INTO locations (id, name_th, name_en, name_lo, type, code) VALUES ('ST-BKK', 'สาขาบางกอก', 'Bangkok Store', 'ຮ້ານບາງກອກ', 'store', 'STBKK')",
        "INSERT INTO locations (id, name_th, name_en, name_lo, type, code) VALUES ('ST-CNX', 'สาขาเชียงใหม่', 'Chiang Mai Store', 'ຮ້ານເຊຍງໃໝ່', 'store', 'STCNX')",

        // Products (all 12)
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P001', 'TS-FW-001', 'เสื้อโอเวอร์ไซส์ Linen', 'Oversized Linen Shirt', 'ເສື້ອລີນິນ', 590, 220, '8851234567001', 'P001', 30)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P002', 'TS-FW-002', 'กางเกงทรงกระบอก Twill', 'Twill Wide Pants', 'ກາງເກງ Twill', 890, 340, '8851234567002', 'P002', 25)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P003', 'TS-BT-001', 'เซรั่มวิตามินซี 30ml', 'Vitamin C Serum 30ml', 'ເຊຣັມວິຕາມິນ C', 1290, 480, '8851234567003', 'P003', 50)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P004', 'TS-BT-002', 'บาล์มบำรุงริมฝีปาก', 'Lip Repair Balm', 'ບາມບຳລຸງສົບ', 290, 95, '8851234567004', 'P004', 100)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P005', 'TS-HM-001', 'เทียนหอม Cedar 200g', 'Cedar Soy Candle 200g', 'ທຽນຫອມ Cedar', 690, 240, '8851234567005', 'P005', 20)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P006', 'TS-HM-002', 'แก้วเซรามิก Matte', 'Matte Ceramic Mug', 'ຈອກເຊຣາມິກ', 350, 130, '8851234567006', 'P006', 30)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P007', 'TS-FD-001', 'กาแฟดริปคั่วเข้ม 200g', 'Dark Roast Drip Coffee 200g', 'ກາເຟຄົ່ວເຂັ້ມ', 420, 160, '8851234567007', 'P007', 40)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P008', 'TS-FD-002', 'น้ำผึ้งเดือนห้า 500g', 'Wild Honey 500g', 'ນ້ຳເຜິ້ງປ່າ', 480, 180, '8851234567008', 'P008', 25)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P009', 'TS-EL-001', 'หูฟัง Bluetooth Mini', 'Bluetooth Mini Earbuds', 'ຫູຟັງບລູທູດ', 1490, 620, '8851234567009', 'P009', 30)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P010', 'TS-EL-002', 'สายชาร์จ USB-C Braided', 'USB-C Braided Cable', 'ສາຍສາກ USB-C', 290, 80, '8851234567010', 'P010', 80)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P011', 'TS-FW-003', 'หมวก Bucket Hat ผ้าแคนวาส', 'Canvas Bucket Hat', 'ໝວກບັກເກັດ', 390, 140, '8851234567011', 'P011', 20)",
        "INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES ('P012', 'TS-BT-003', 'มาส์กแผ่น Hydrating x5', 'Hydrating Sheet Mask x5', 'ມາສ໌ກແຜ່ນ x5', 350, 110, '8851234567012', 'P012', 40)",

        // Stock (all products × all locations)
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P001', 'WH-01', 124)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P001', 'ST-BKK', 18)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P001', 'ST-CNX', 22)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P002', 'WH-01', 87)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P002', 'ST-BKK', 12)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P002', 'ST-CNX', 14)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P003', 'WH-01', 245)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P003', 'ST-BKK', 34)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P003', 'ST-CNX', 41)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P004', 'WH-01', 412)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P004', 'ST-BKK', 67)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P004', 'ST-CNX', 78)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P005', 'WH-01', 64)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P005', 'ST-BKK', 8)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P005', 'ST-CNX', 7)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P006', 'WH-01', 18)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P006', 'ST-BKK', 2)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P006', 'ST-CNX', 3)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P007', 'WH-01', 156)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P007', 'ST-BKK', 22)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P007', 'ST-CNX', 26)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P008', 'WH-01', 78)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P008', 'ST-BKK', 12)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P008', 'ST-CNX', 15)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P009', 'WH-01', 92)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P009', 'ST-BKK', 14)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P009', 'ST-CNX', 18)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P010', 'WH-01', 320)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P010', 'ST-BKK', 56)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P010', 'ST-CNX', 62)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P011', 'WH-01', 56)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P011', 'ST-BKK', 9)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P011', 'ST-CNX', 11)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P012', 'WH-01', 22)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P012', 'ST-BKK', 3)",
        "INSERT INTO stock (product_id, location_id, quantity) VALUES ('P012', 'ST-CNX', 4)",

        // Customers
        "INSERT INTO customers (id, name, email, phone, tier, joined_date, points) VALUES ('C001', 'Napaporn S.', 'napaporn@example.com', '081-234-5678', 'gold', '2024-08-12', 1842)",
        "INSERT INTO customers (id, name, email, phone, tier, joined_date, points) VALUES ('C002', 'Somchai K.', 'somchai@example.com', '089-876-5432', 'silver', '2025-01-04', 865)",
        "INSERT INTO customers (id, name, email, phone, tier, joined_date, points) VALUES ('C003', 'Praewa T.', 'praewa@example.com', '062-555-0188', 'platinum', '2023-11-28', 5231)",
        "INSERT INTO customers (id, name, email, phone, tier, joined_date, points) VALUES ('C004', 'Anan W.', 'anan@example.com', '094-444-2211', 'bronze', '2026-02-14', 189)",
        "INSERT INTO customers (id, name, email, phone, tier, joined_date, points) VALUES ('C005', 'Kanya R.', 'kanya@example.com', '086-330-9911', 'gold', '2024-05-22', 1420)",

        // Movements
        "INSERT INTO movements (id, type, product_id, quantity, from_location_id, to_location_id, user_name, reference_id) VALUES ('MV-9912', 'in', 'P001', 50, NULL, 'WH-01', 'Admin', 'PUR-0421')",
        "INSERT INTO movements (id, type, product_id, quantity, from_location_id, to_location_id, user_name, reference_id) VALUES ('MV-9910', 'transfer', 'P007', 20, 'WH-01', 'ST-BKK', 'Admin', 'TR-0188')",
        "INSERT INTO movements (id, type, product_id, quantity, from_location_id, to_location_id, user_name, reference_id) VALUES ('MV-9908', 'in', 'P010', 200, NULL, 'WH-01', 'Admin', 'PUR-0420')",
        "INSERT INTO movements (id, type, product_id, quantity, from_location_id, to_location_id, user_name, reference_id) VALUES ('MV-9904', 'transfer', 'P012', 15, 'ST-BKK', 'ST-CNX', 'Admin', 'TR-0187')",

        // Orders
        "INSERT INTO orders (id, customer_id, total_amount, status) VALUES ('ORD-001', 'C001', 2670, 'delivered')",
        "INSERT INTO orders (id, customer_id, total_amount, status) VALUES ('ORD-002', 'C002', 3580, 'shipped')",
        "INSERT INTO orders (id, customer_id, total_amount, status) VALUES ('ORD-003', 'C003', 5240, 'confirmed')",
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ('ORD-001', 'P001', 2, 590)",
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ('ORD-001', 'P005', 1, 690)",
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ('ORD-002', 'P003', 1, 1290)",
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ('ORD-003', 'P008', 1, 480)",

        // ===== Users (Owner / Manager / Staff) — passwords: owner123 / manager123 / staff123 =====
        `INSERT INTO users (username, password_hash, name, email, role, avatar) VALUES ('owner', '${hashPassword('owner123')}', 'สิริกร เจ้าของร้าน', 'owner@thinyshop.co', 'owner', 'SK')`,
        `INSERT INTO users (username, password_hash, name, email, role, avatar) VALUES ('manager', '${hashPassword('manager123')}', 'มณีรัตน์ ผู้จัดการ', 'manager@thinyshop.co', 'manager', 'MR')`,
        `INSERT INTO users (username, password_hash, name, email, role, avatar) VALUES ('staff', '${hashPassword('staff123')}', 'นัทธมน พนักงาน', 'staff@thinyshop.co', 'staff', 'NM')`,
        `INSERT INTO users (username, password_hash, name, email, role, avatar) VALUES ('staff2', '${hashPassword('staff123')}', 'อัครเดช พนักงาน', 'staff2@thinyshop.co', 'staff', 'AD')`,

        // ===== Chat Orders (Pre-order) =====
        "INSERT INTO chat_orders (id, platform, channel, customer_name, customer_phone, customer_address, customer_note, custom_item_name, custom_item_options, custom_item_qty, custom_item_price, subtotal, service_fee, total, source_tracking, source_cost, tracking, courier, payment_method, payment_status, status, last_message, created_at) VALUES ('CH-1043', 'shopee', 'line', 'ปริยา ม.', '0813334455', '100 ม.5 บางบัวทอง นนทบุรี 11110', 'ขอกล่องสวยๆ ให้ของขวัญ', 'Nike Air Max 90', 'Size 40 / สีดำ', 1, 3290, 3290, 80, 3370, '', 2890, '', '', 'transfer', 'paid', 'paid', 'อยากได้รองเท้าค่ะ สั่งให้ด้วยได้ไหม', '2026-05-21 09:15')",
        "INSERT INTO chat_orders (id, platform, channel, customer_name, customer_phone, customer_address, custom_item_name, custom_item_qty, custom_item_price, subtotal, service_fee, total, source_tracking, source_cost, tracking, courier, payment_method, payment_status, status, last_message, created_at) VALUES ('CH-1042', 'shop', 'whatsapp', 'Pim Suwannee', '0812345678', '123/4 ซ.อารีย์ 5 พญาไท กรุงเทพฯ 10400', 'เซรั่มวิตามินซี 30ml', 3, 956, 2870, 0, 2870, 'SPX-2023-1144', 1440, 'TH99-1234-5678', 'Kerry', 'transfer', 'paid', 'arrived', 'ขอบคุณคะ รอรับของนะ 🙏', '2026-05-19 14:30')",
        "INSERT INTO chat_orders (id, platform, channel, customer_name, customer_phone, customer_address, custom_item_name, custom_item_qty, custom_item_price, subtotal, service_fee, total, source_tracking, source_cost, payment_method, payment_status, status, last_message, created_at) VALUES ('CH-1041', 'shopee', 'facebook', 'Akira Wong', '0991234567', '88 ม.6 บางพลี สมุทรปราการ 10540', 'เสื้อโอเวอร์ไซส์ Linen', 1, 590, 590, 0, 590, 'SPX-9988-1122', 350, 'transfer', 'unpaid', 'awaitingPayment', 'ยังจ่ายอยู่นะ เดี๋ยวโอนเลย', '2026-05-19 13:12')",
        "INSERT INTO chat_orders (id, platform, channel, customer_name, customer_phone, customer_address, customer_note, custom_item_name, custom_item_qty, custom_item_price, subtotal, service_fee, total, source_tracking, source_cost, tracking, courier, payment_method, payment_status, status, last_message, created_at) VALUES ('CH-1040', 'lazada', 'line', 'Nattaya R.', '0867789900', '55/1 รัชดา ดินแดง กรุงเทพฯ 10400', 'ใส่กล่องของขวัญด้วยน้า', 'เทียนหอม Cedar 200g', 3, 550, 1650, 0, 1650, 'LZD-2200-7788', 1100, 'FLE-4421-9012', 'Flash', 'cod', 'unpaid', 'arrived', 'ใช้บัตรเครดิตได้ไหมคะ?', '2026-05-19 11:55')",
        "INSERT INTO chat_orders (id, platform, channel, customer_name, customer_phone, customer_address, custom_item_name, custom_item_qty, custom_item_price, subtotal, service_fee, total, payment_method, payment_status, status, last_message, created_at) VALUES ('CH-1039', 'shop', 'whatsapp', 'Kham Vongphachanh', '+8562012345678', '23 Ban Saphangmoh, Vientiane', 'สายชาร์จ USB-C Braided', 3, 290, 870, 0, 870, 'transfer', 'paid', 'paid', 'Got the tracking, thanks!', '2026-05-19 10:20')",
        "INSERT INTO chat_orders (id, platform, channel, customer_name, customer_phone, customer_address, custom_item_name, custom_item_qty, custom_item_price, subtotal, service_fee, total, source_tracking, source_cost, payment_method, payment_status, status, last_message, created_at) VALUES ('CH-1038', 'tiktok', 'ig', '@phitchapha_', '0822334455', '12 อโศกมนตรี วัฒนา กรุงเทพฯ 10110', 'มาส์กแผ่น Hydrating x5', 4, 350, 1400, 0, 1400, 'TT-4455-8899', 900, 'transfer', 'unpaid', 'new', 'สนใจมาส์กแผ่นค่ะ มีของไหม', '2026-05-19 09:48')",
      ];

      // Execute all seed statements sequentially (works with both sqlite3 and libsql)
      for (const statement of seedStatements) {
        try {
          await dbRun(statement);
        } catch (err) {
          console.error('Error seeding data:', err.message);
        }
      }
      console.log('Sample data seeded successfully (' + seedStatements.length + ' rows)');
      resolve();
    })().catch(reject);
  });
}

module.exports = { initializeDatabase };
