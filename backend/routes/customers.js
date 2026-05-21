const express = require('express');
const router = express.Router();
const { query, run } = require('../db-wrapper');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const [customers] = await query('SELECT * FROM customers');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET customer by ID
router.get('/:id', async (req, res) => {
  try {
    const [customer] = await query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (customer.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE customer
router.post('/', async (req, res) => {
  const { id, name, email, phone, tier, joined_date, points } = req.body;
  try {
    await run(
      'INSERT INTO customers (id, name, email, phone, tier, joined_date, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, phone, tier, joined_date, points || 0]
    );
    res.status(201).json({ message: 'Customer created', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE customer
router.put('/:id', async (req, res) => {
  const { name, email, phone, tier, points } = req.body;
  try {
    await run(
      'UPDATE customers SET name = ?, email = ?, phone = ?, tier = ?, points = ? WHERE id = ?',
      [name, email, phone, tier, points, req.params.id]
    );
    res.json({ message: 'Customer updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
