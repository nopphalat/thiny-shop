-- Insert locations
INSERT INTO locations (id, name_th, name_en, type, code) VALUES
('WH-01', 'คลังสินค้าหลัก', 'Main Warehouse', 'warehouse', 'WH01'),
('ST-BKK', 'สาขาบางกอก', 'Bangkok Store', 'store', 'STBKK'),
('ST-CNX', 'สาขาเชียงใหม่', 'Chiang Mai Store', 'store', 'STCNX');

-- Insert products
INSERT INTO products (id, sku, name_th, name_en, price, cost, barcode, image, reorder_point) VALUES
('P001', 'TS-FW-001', 'เสื้อโอเวอร์ไซส์ Linen', 'Oversized Linen Shirt', 890, 450, '8851325017801', 'P001', 50),
('P002', 'TS-FW-002', 'กางเกงวูลคอตตอน Twill', 'Cotton Twill Pants', 890, 400, '8851325017818', 'P002', 50),
('P003', 'TS-BT-001', 'เซรั่มวิตามิน 30ml', 'Vitamin Serum', 1290, 600, '8851325018204', 'P003', 100),
('P004', 'TS-BT-002', 'บาล์มปากสุขสวัสดี์', 'Lip Balm', 290, 120, '8851325018211', 'P004', 150),
('P005', 'TS-FD-001', 'กาแฟฟอร์บิด 200g', 'Forbidden Coffee', 290, 140, '8851325017801', 'P005', 100),
('P006', 'TS-HM-002', 'แก้ว Matte', 'Matte Glass', 350, 180, '8851325017833', 'P006', 80),
('P007', 'TS-FD-002', 'น้ำผึ้งดอกเสี้ยว 500g', 'Acacia Honey', 440, 200, '8851325017840', 'P007', 60),
('P008', 'TS-EL-001', 'หูฟัง Bluetooth Mini', 'Bluetooth Mini Earbuds', 1490, 700, '8851325017857', 'P008', 40),
('P009', 'TS-EL-002', 'สายชาร์จ USB-C Braided', 'USB-C Braided Cable', 290, 120, '8851325017864', 'P009', 120),
('P010', 'TS-FW-003', 'หมวก Bucket Hat ผ้านวม', 'Quilted Bucket Hat', 390, 180, '8851325017871', 'P010', 50),
('P011', 'TS-BT-003', 'น้ำมันบำรุง Hydrating x5', 'Hydrating Oil x5', 1690, 800, '8851325017888', 'P011', 30),
('P012', 'TS-HM-001', 'แก้ว Cedar 200g', 'Cedar Glass Mug', 350, 160, '8851325017895', 'P012', 70);

-- Insert stock
INSERT INTO stock (product_id, location_id, quantity) VALUES
('P001', 'WH-01', 500),
('P001', 'ST-BKK', 120),
('P001', 'ST-CNX', 80),
('P002', 'WH-01', 450),
('P002', 'ST-BKK', 100),
('P002', 'ST-CNX', 60),
('P003', 'WH-01', 800),
('P003', 'ST-BKK', 150),
('P003', 'ST-CNX', 120),
('P004', 'WH-01', 1200),
('P004', 'ST-BKK', 200),
('P004', 'ST-CNX', 180),
('P005', 'WH-01', 300),
('P005', 'ST-BKK', 80),
('P005', 'ST-CNX', 50),
('P006', 'WH-01', 400),
('P006', 'ST-BKK', 100),
('P006', 'ST-CNX', 70),
('P007', 'WH-01', 250),
('P007', 'ST-BKK', 60),
('P007', 'ST-CNX', 40),
('P008', 'WH-01', 150),
('P008', 'ST-BKK', 40),
('P008', 'ST-CNX', 30),
('P009', 'WH-01', 600),
('P009', 'ST-BKK', 100),
('P009', 'ST-CNX', 80),
('P010', 'WH-01', 200),
('P010', 'ST-BKK', 50),
('P010', 'ST-CNX', 35),
('P011', 'WH-01', 100),
('P011', 'ST-BKK', 25),
('P011', 'ST-CNX', 20),
('P012', 'WH-01', 350),
('P012', 'ST-BKK', 90),
('P012', 'ST-CNX', 60);

-- Insert customers
INSERT INTO customers (id, name, email, phone, tier, joined_date, points) VALUES
('C001', 'สมชาย นวลเพชร', 'somchai@email.com', '08xxxxxxxx', 'gold', '2023-01-15', 5000),
('C002', 'สมหญิง ดวงดี', 'somying@email.com', '08xxxxxxxx', 'silver', '2023-02-20', 2000),
('C003', 'นวพล วัฒนา', 'nawapon@email.com', '08xxxxxxxx', 'platinum', '2022-05-10', 15000),
('C004', 'จิตรา สวรรค์', 'chitra@email.com', '08xxxxxxxx', 'bronze', '2023-06-01', 500),
('C005', 'กิตติศักดิ์ ศรีประเสริฐ', 'kitti@email.com', '08xxxxxxxx', 'gold', '2023-03-15', 7000);

-- Insert sample orders
INSERT INTO orders (id, customer_id, total_amount, status) VALUES
('ORD-001', 'C001', 2670, 'delivered'),
('ORD-002', 'C002', 3580, 'shipped'),
('ORD-003', 'C003', 5240, 'confirmed'),
('ORD-004', 'C004', 1180, 'pending'),
('ORD-005', 'C005', 4320, 'delivered');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
('ORD-001', 'P001', 2, 890),
('ORD-001', 'P005', 1, 290),
('ORD-002', 'P003', 1, 1290),
('ORD-002', 'P006', 2, 350),
('ORD-003', 'P008', 1, 1490),
('ORD-003', 'P009', 2, 290),
('ORD-003', 'P011', 1, 1690),
('ORD-004', 'P004', 4, 290),
('ORD-005', 'P002', 3, 890),
('ORD-005', 'P007', 1, 440);

-- Insert movements log
INSERT INTO movements (id, type, product_id, quantity, from_location_id, to_location_id, user_name, reference_id) VALUES
('MOV-001', 'in', 'P001', 100, NULL, 'WH-01', 'admin', 'SUP-001'),
('MOV-002', 'transfer', 'P001', 50, 'WH-01', 'ST-BKK', 'admin', 'TRN-001'),
('MOV-003', 'out', 'P005', 30, 'ST-BKK', NULL, 'cashier', 'ORD-001'),
('MOV-004', 'adjust', 'P003', 10, 'WH-01', NULL, 'admin', 'ADJ-001');
