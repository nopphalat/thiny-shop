// Unified DB wrapper — works with both sqlite3 (local) and @libsql/client (Turso)
const db = require('./db');

const isLibsql = db.__adapter === 'libsql';

async function query(sql, params = []) {
  if (isLibsql) {
    // Turso libsql
    const result = await db.execute({ sql, args: params });
    return [result.rows || []];
  }
  // Local sqlite3
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve([rows || []]);
    });
  });
}

async function run(sql, params = []) {
  if (isLibsql) {
    const result = await db.execute({ sql, args: params });
    return {
      lastID: Number(result.lastInsertRowid || 0),
      changes: result.rowsAffected || 0
    };
  }
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

module.exports = { query, run };
