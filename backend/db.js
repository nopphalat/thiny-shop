// Database connection — supports both local SQLite and Turso (cloud SQLite)
// If TURSO_URL is set in env → use Turso · otherwise use local file
require('dotenv').config();

const useTurso = !!process.env.TURSO_URL;
let db;
let adapter = 'sqlite3';

if (useTurso) {
  // ===== Production: Turso (cloud SQLite via libsql) =====
  try {
    const { createClient } = require('@libsql/client');
    db = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
    adapter = 'libsql';
    console.log('[DB] Using Turso (cloud SQLite):', process.env.TURSO_URL);
  } catch (err) {
    console.error('[DB] @libsql/client not installed. Run: npm install @libsql/client');
    process.exit(1);
  }
} else {
  // ===== Local development: SQLite file =====
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'thiny_shop.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database:', err);
    else console.log('Connected to SQLite database at', dbPath);
  });
  db.configure('busyTimeout', 5000);
}

// Expose adapter type so wrapper can branch
db.__adapter = adapter;

module.exports = db;
