const express = require('express');
const router = express.Router();
const { query, run } = require('../db-wrapper');

// GET all stock
router.get('/', async (req, res) => {
  try {
    const [stock] = await query(
      'SELECT s.*, p.name_th, p.name_en, l.name_th as location_name_th FROM stock s JOIN products p ON s.product_id = p.id JOIN locations l ON s.location_id = l.id'
    );
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET stock for a specific product
router.get('/product/:productId', async (req, res) => {
  try {
    const [stock] = await query(
      'SELECT s.*, l.name_th, l.name_en FROM stock s JOIN locations l ON s.location_id = l.id WHERE s.product_id = ?',
      [req.params.productId]
    );
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET stock for a specific product at a location
router.get('/:productId/:locationId', async (req, res) => {
  try {
    const [stock] = await query(
      'SELECT * FROM stock WHERE product_id = ? AND location_id = ?',
      [req.params.productId, req.params.locationId]
    );
    if (stock.length === 0) return res.status(404).json({ error: 'Stock not found' });
    res.json(stock[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE or UPDATE stock (upsert)
router.post('/', async (req, res) => {
  const { product_id, location_id, quantity } = req.body;
  if (!product_id || !location_id) return res.status(400).json({ error: 'product_id and location_id required' });
  try {
    await run(
      'INSERT INTO stock (product_id, location_id, quantity) VALUES (?, ?, ?) ON CONFLICT(product_id, location_id) DO UPDATE SET quantity = excluded.quantity',
      [product_id, location_id, quantity || 0]
    );
    res.status(201).json({ message: 'Stock saved', product_id, location_id, quantity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE stock quantity
router.put('/:productId/:locationId', async (req, res) => {
  const { quantity } = req.body;
  try {
    // upsert so it works even if row doesn't exist yet
    await run(
      'INSERT INTO stock (product_id, location_id, quantity) VALUES (?, ?, ?) ON CONFLICT(product_id, location_id) DO UPDATE SET quantity = excluded.quantity',
      [req.params.productId, req.params.locationId, quantity]
    );
    res.json({ message: 'Stock updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
