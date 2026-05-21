const express = require('express');
const router = express.Router();
const { query, run } = require('../db-wrapper');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const [orders] = await query('SELECT * FROM orders ORDER BY order_date DESC');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET order by ID with items
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const [items] = await query(
      'SELECT oi.*, p.name_th, p.name_en FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [req.params.id]
    );
    res.json({ ...orders[0], items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE order with items
router.post('/', async (req, res) => {
  const { id, customer_id, total_amount, items } = req.body;
  try {
    await run(
      'INSERT INTO orders (id, customer_id, total_amount) VALUES (?, ?, ?)',
      [id, customer_id, total_amount]
    );
    if (items && items.length > 0) {
      for (const item of items) {
        await run(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [id, item.product_id, item.quantity, item.price]
        );
      }
    }
    res.status(201).json({ message: 'Order created', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE order status
router.put('/:id', async (req, res) => {
  const { status } = req.body;
  try {
    await run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);
    await run('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
