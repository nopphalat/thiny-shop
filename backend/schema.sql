-- Create database
CREATE DATABASE IF NOT EXISTS thiny_shop;
USE thiny_shop;

-- LOCATIONS table
CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(10) PRIMARY KEY,
  name_th VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  name_lo VARCHAR(255),
  type ENUM('warehouse', 'store') NOT NULL,
  code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS table
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

-- STOCK table (stock by location)
CREATE TABLE IF NOT EXISTS stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(10) NOT NULL,
  location_id VARCHAR(10) NOT NULL,
  quantity INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  UNIQUE KEY unique_product_location (product_id, location_id)
);

-- CUSTOMERS table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
  joined_date DATE,
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(20) PRIMARY KEY,
  customer_id VARCHAR(10),
  total_amount DECIMAL(12, 2),
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ORDER_ITEMS table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(20) NOT NULL,
  product_id VARCHAR(10) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- MOVEMENTS table (stock movements log)
CREATE TABLE IF NOT EXISTS movements (
  id VARCHAR(20) PRIMARY KEY,
  type ENUM('in', 'out', 'transfer', 'adjust') NOT NULL,
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

-- Create indexes
CREATE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_stock_location ON stock(location_id);
CREATE INDEX idx_order_customer ON orders(customer_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_movements_product ON movements(product_id);
CREATE INDEX idx_movements_date ON movements(movement_date);
