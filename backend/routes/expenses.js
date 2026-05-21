const express = require('express');
const router = express.Router();
const { query, run } = require('../db-wrapper');

// GET all expenses (newest first), optional filter by month
router.get('/', async (req, res) => {
  try {
    let sql = 'SELECT * FROM expenses ORDER BY expense_date DESC';
    const params = [];
    if (req.query.month) {
      sql = "SELECT * FROM expenses WHERE expense_date LIKE ? ORDER BY expense_date DESC";
      params.push(req.query.month + '%');
    }
    const [rows] = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Summary by category
router.get('/summary', async (req, res) => {
  try {
    const params = [];
    let where = '';
    if (req.query.month) {
      where = "WHERE expense_date LIKE ?";
      params.push(req.query.month + '%');
    }
    const [rows] = await query(
      `SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses ${where} GROUP BY category ORDER BY total DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE expense
router.post('/', async (req, res) => {
  const { category, amount, description, note, expense_date, receipt_url } = req.body;
  if (!category || !amount || !expense_date) {
    return res.status(400).json({ error: 'category, amount, expense_date are required' });
  }
  try {
    await run(
      'INSERT INTO expenses (category, amount, description, note, expense_date, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',
      [category, amount, description || '', note || '', expense_date, receipt_url || '']
    );
    res.status(201).json({ message: 'Expense recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE expense
router.put('/:id', async (req, res) => {
  const { category, amount, description, note, expense_date, receipt_url } = req.body;
  try {
    await run(
      'UPDATE expenses SET category = ?, amount = ?, description = ?, note = ?, expense_date = ?, receipt_url = ? WHERE id = ?',
      [category, amount, description, note, expense_date, receipt_url, req.params.id]
    );
    res.json({ message: 'Expense updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
