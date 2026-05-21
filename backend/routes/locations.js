const express = require('express');
const router = express.Router();
const { query, run } = require('../db-wrapper');

router.get('/', async (req, res) => {
  try {
    const [locations] = await query('SELECT * FROM locations');
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [location] = await query('SELECT * FROM locations WHERE id = ?', [req.params.id]);
    if (location.length === 0) return res.status(404).json({ error: 'Location not found' });
    res.json(location[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { id, name_th, name_en, name_lo, type, code } = req.body;
  try {
    await run(
      'INSERT INTO locations (id, name_th, name_en, name_lo, type, code) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name_th, name_en, name_lo, type, code]
    );
    res.status(201).json({ message: 'Location created', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
