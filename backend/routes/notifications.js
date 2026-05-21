const express = require('express');
const router = express.Router();
const { query, run } = require('../db-wrapper');

// GET all notifications for an order
router.get('/order/:orderId', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT * FROM notifications_log WHERE order_id = ? ORDER BY sent_at DESC',
      [req.params.orderId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all notifications (latest 50)
router.get('/', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM notifications_log ORDER BY sent_at DESC LIMIT 50');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOG a notification (POST when message is sent via deep-link)
router.post('/', async (req, res) => {
  const { order_id, template, channel, message } = req.body;
  try {
    await run(
      'INSERT INTO notifications_log (order_id, template, channel, message) VALUES (?, ?, ?, ?)',
      [order_id, template || '', channel || '', message || '']
    );
    res.status(201).json({ message: 'Notification logged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
