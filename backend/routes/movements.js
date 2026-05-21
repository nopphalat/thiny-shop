const express = require('express');
const router = express.Router();
const { query, run } = require('../db-wrapper');

// GET all movements
router.get('/', async (req, res) => {
  try {
    const [movements] = await query(
      'SELECT m.*, p.name_th, p.name_en, f.name_th as from_location, t.name_th as to_location FROM movements m JOIN products p ON m.product_id = p.id LEFT JOIN locations f ON m.from_location_id = f.id LEFT JOIN locations t ON m.to_location_id = t.id ORDER BY m.movement_date DESC'
    );
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET movement by ID
router.get('/:id', async (req, res) => {
  try {
    const [movement] = await query('SELECT * FROM movements WHERE id = ?', [req.params.id]);
    if (movement.length === 0) return res.status(404).json({ error: 'Movement not found' });
    res.json(movement[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET movements for a specific product
router.get('/product/:productId', async (req, res) => {
  try {
    const [movements] = await query(
      'SELECT * FROM movements WHERE product_id = ? ORDER BY movement_date DESC',
      [req.params.productId]
    );
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE movement
router.post('/', async (req, res) => {
  const { id, type, product_id, quantity, from_location_id, to_location_id, user_name, reference_id } = req.body;
  try {
    await run(
      'INSERT INTO movements (id, type, product_id, quantity, from_location_id, to_location_id, user_name, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, type, product_id, quantity, from_location_id || null, to_location_id || null, user_name, reference_id]
    );
    res.status(201).json({ message: 'Movement created', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
