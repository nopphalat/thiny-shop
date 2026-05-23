const express = require('express');
const router = express.Router();
const { query, run } = require('../db-wrapper');

// GET all products
router.get('/', async (req, res) => {
  try {
    const [products] = await query('SELECT * FROM products');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET product by ID
router.get('/:id', async (req, res) => {
  try {
    const [product] = await query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE product
router.post('/', async (req, res) => {
  const { id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point } = req.body;
  try {
    await run(
      'INSERT INTO products (id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, sku, name_th, name_en, name_lo, price, cost, barcode, image, reorder_point]
    );
    res.status(201).json({ message: 'Product created', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE product
router.put('/:id', async (req, res) => {
  const { name_th, name_en, name_lo, price, cost, barcode, sku, image, reorder_point } = req.body;
  try {
    await run(
      'UPDATE products SET name_th = ?, name_en = ?, name_lo = ?, price = ?, cost = ?, barcode = ?, sku = ?, image = ?, reorder_point = ? WHERE id = ?',
      [name_th, name_en, name_lo || '', price, cost, barcode || '', sku || '', image || '', reorder_point || 10, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE product (also clears stock to avoid FK errors)
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM stock WHERE product_id = ?', [req.params.id]);
    await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
