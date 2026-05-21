const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, run } = require('../db-wrapper');

function hashPassword(plain) {
  return crypto.createHash('sha256').update(plain + 'thiny-salt').digest('hex');
}

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    avatar: u.avatar,
    last_login: u.last_login,
    created_at: u.created_at
  };
}

// GET all users (Owner only)
router.get('/', async (req, res) => {
  try {
    const [rows] = await query('SELECT id, username, name, email, role, active, avatar, last_login, created_at FROM users ORDER BY created_at DESC');
    res.json(rows.map(publicUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE user (Owner only)
router.post('/', async (req, res) => {
  const { username, password, name, email, role, avatar } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'username, password, name ต้องไม่ว่าง' });
  }
  if (!['owner', 'manager', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'role ต้องเป็น owner / manager / staff' });
  }
  try {
    const [existing] = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'username นี้มีอยู่แล้ว' });
    }
    await run(
      'INSERT INTO users (username, password_hash, name, email, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashPassword(password), name, email || '', role, avatar || name.charAt(0).toUpperCase()]
    );
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE user
router.put('/:id', async (req, res) => {
  const { name, email, role, active, avatar, password } = req.body;
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (email !== undefined) { fields.push('email = ?'); values.push(email); }
  if (role !== undefined) { fields.push('role = ?'); values.push(role); }
  if (active !== undefined) { fields.push('active = ?'); values.push(active ? 1 : 0); }
  if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar); }
  if (password) { fields.push('password_hash = ?'); values.push(hashPassword(password)); }
  if (fields.length === 0) return res.json({ message: 'No changes' });
  values.push(req.params.id);
  try {
    await run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
