const express = require('express');
const router = express.Router();
const { query, run } = require('../db-wrapper');

// GET all chat orders (newest first)
router.get('/', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM chat_orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single chat order
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM chat_orders WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SEARCH chat orders (by customer name/phone/tracking/order ID/item name)
router.get('/search/:q', async (req, res) => {
  try {
    const q = '%' + req.params.q + '%';
    const [rows] = await query(
      `SELECT * FROM chat_orders WHERE
         id LIKE ? OR
         customer_name LIKE ? OR
         customer_phone LIKE ? OR
         tracking LIKE ? OR
         source_tracking LIKE ? OR
         custom_item_name LIKE ?
       ORDER BY created_at DESC LIMIT 30`,
      [q, q, q, q, q, q]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE chat order
router.post('/', async (req, res) => {
  const o = req.body;
  try {
    await run(
      `INSERT INTO chat_orders (
         id, platform, channel,
         customer_name, customer_phone, customer_address, customer_note,
         custom_item_name, custom_item_options, custom_item_qty, custom_item_price,
         subtotal, service_fee, total,
         source_tracking, source_cost,
         tracking, courier,
         payment_method, payment_status, status,
         last_message, created_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        o.id, o.platform || 'shop', o.channel || 'whatsapp',
        o.customer_name || o.customer?.name || '',
        o.customer_phone || o.customer?.phone || '',
        o.customer_address || o.customer?.address || '',
        o.customer_note || o.customer?.note || '',
        o.custom_item_name || o.customItem?.name || '',
        o.custom_item_options || o.customItem?.options || '',
        o.custom_item_qty || o.customItem?.qty || 1,
        o.custom_item_price || o.customItem?.pricePerUnit || 0,
        o.subtotal || 0,
        o.service_fee || o.serviceFee || 0,
        o.total || 0,
        o.source_tracking || o.sourceTracking || '',
        o.source_cost || o.sourceCost || 0,
        o.tracking || '',
        o.courier || '',
        o.payment_method || o.paymentMethod || 'transfer',
        o.payment_status || o.paymentStatus || 'unpaid',
        o.status || 'new',
        o.last_message || o.lastMessage || '',
        o.created_at || o.created || new Date().toISOString()
      ]
    );
    res.status(201).json({ message: 'Chat order created', id: o.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE chat order (partial update — sends only changed fields)
router.put('/:id', async (req, res) => {
  const o = req.body;
  // Build the SET clause dynamically from provided fields
  const fields = [];
  const values = [];
  const map = {
    platform: o.platform, channel: o.channel,
    customer_name: o.customer_name || o.customer?.name,
    customer_phone: o.customer_phone || o.customer?.phone,
    customer_address: o.customer_address || o.customer?.address,
    customer_note: o.customer_note || o.customer?.note,
    custom_item_name: o.custom_item_name || o.customItem?.name,
    custom_item_options: o.custom_item_options || o.customItem?.options,
    custom_item_qty: o.custom_item_qty || o.customItem?.qty,
    custom_item_price: o.custom_item_price || o.customItem?.pricePerUnit,
    subtotal: o.subtotal,
    service_fee: o.service_fee !== undefined ? o.service_fee : o.serviceFee,
    total: o.total,
    source_tracking: o.source_tracking !== undefined ? o.source_tracking : o.sourceTracking,
    source_cost: o.source_cost !== undefined ? o.source_cost : o.sourceCost,
    tracking: o.tracking,
    courier: o.courier,
    payment_method: o.payment_method || o.paymentMethod,
    payment_status: o.payment_status || o.paymentStatus,
    status: o.status,
    last_message: o.last_message || o.lastMessage,
  };
  for (const [key, val] of Object.entries(map)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return res.json({ message: 'No changes' });
  values.push(req.params.id);
  try {
    await run(`UPDATE chat_orders SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Chat order updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE chat order
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM chat_orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Chat order deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
