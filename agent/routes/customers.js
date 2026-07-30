const express = require('express');
const router = express.Router();
const CustomerManager = require('../services/customerManager');

router.get('/', async (req, res) => {
  try {
    const customers = await CustomerManager.getAllCustomers();
    res.json(customers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const results = q ? await CustomerManager.search(q) : await CustomerManager.getAllCustomers();
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await CustomerManager.getCustomer(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await CustomerManager.updateCustomer(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await CustomerManager.deleteCustomer(req.params.id);
    if (!result) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
