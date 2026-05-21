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

// UPDATE stock quantity
router.put('/:productId/:locationId', async (req, res) => {
  const { quantity } = req.body;
  try {
    await run(
      'UPDATE stock SET quantity = ? WHERE product_id = ? AND location_id = ?',
      [quantity, req.params.productId, req.params.locationId]
    );
    res.json({ message: 'Stock updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
