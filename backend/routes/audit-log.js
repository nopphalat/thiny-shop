const express = require('express');
const router = express.Router();
const { query, run } = require('../db-wrapper');

// GET all audit logs (latest 200, filter by user/action)
router.get('/', async (req, res) => {
  const { user_id, action, limit = 200 } = req.query;
  let sql = 'SELECT * FROM audit_log WHERE 1=1';
  const params = [];
  if (user_id) { sql += ' AND user_id = ?'; params.push(user_id); }
  if (action) { sql += ' AND action = ?'; params.push(action); }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  try {
    const [rows] = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST log entry
router.post('/', async (req, res) => {
  const { user_id, username, user_role, action, target_type, target_id, details } = req.body;
  if (!action) return res.status(400).json({ error: 'action ต้องไม่ว่าง' });
  try {
    await run(
      'INSERT INTO audit_log (user_id, username, user_role, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id || null, username || '', user_role || '', action, target_type || '', target_id || '', details || '']
    );
    res.status(201).json({ message: 'Log entry created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Summary: count by action
router.get('/summary', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT action, COUNT(*) as count FROM audit_log GROUP BY action ORDER BY count DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
