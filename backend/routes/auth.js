const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, run } = require('../db-wrapper');

function hashPassword(plain) {
  return crypto.createHash('sha256').update(plain + 'thiny-salt').digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Public sanitized user shape
function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    last_login: u.last_login
  };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username และ password ต้องไม่ว่าง' });
  }
  try {
    const [rows] = await query('SELECT * FROM users WHERE username = ? AND active = 1', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'ไม่พบ user หรือถูกระงับ' });
    }
    const user = rows[0];
    if (user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }
    // Generate token + save
    const token = generateToken();
    const now = new Date().toISOString();
    await run('UPDATE users SET token = ?, last_login = ? WHERE id = ?', [token, now, user.id]);
    // Log the login
    await run(
      'INSERT INTO audit_log (user_id, username, user_role, action, target_type, details) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.username, user.role, 'login', 'auth', `Login from ${req.ip || 'unknown'}`]
    );
    res.json({ token, user: publicUser({ ...user, last_login: now }) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.json({ message: 'No token' });
  try {
    const [rows] = await query('SELECT * FROM users WHERE token = ?', [token]);
    if (rows.length > 0) {
      const user = rows[0];
      await run('UPDATE users SET token = NULL WHERE id = ?', [user.id]);
      await run(
        'INSERT INTO audit_log (user_id, username, user_role, action, target_type, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, user.role, 'logout', 'auth', '']
      );
    }
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me — get current user from token
router.get('/me', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const [rows] = await query('SELECT * FROM users WHERE token = ? AND active = 1', [token]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid token' });
    res.json(publicUser(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reusable middleware: requires valid token
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const [rows] = await query('SELECT * FROM users WHERE token = ? AND active = 1', [token]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid token' });
    req.user = rows[0];
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

router.requireAuth = requireAuth;
module.exports = router;
