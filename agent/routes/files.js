const express = require('express');
const router = express.Router();
const FileOrganizer = require('../services/fileOrganizer');
const Database = require('../storage/database');

router.get('/', async (req, res) => {
  try {
    let files = await FileOrganizer.getAllFiles();

    if (req.query.customer) {
      files = files.filter(f => f.customer === req.query.customer);
    }
    if (req.query.ext) {
      files = files.filter(f => f.ext === '.' + req.query.ext.replace(/^\./, ''));
    }
    if (req.query.date === 'today') {
      const today = new Date().toISOString().split('T')[0];
      files = files.filter(f => f.timestamp.startsWith(today));
    }
    if (req.query.date === 'yesterday') {
      const d = new Date(); d.setDate(d.getDate() - 1);
      const yesterday = d.toISOString().split('T')[0];
      files = files.filter(f => f.timestamp.startsWith(yesterday));
    }
    if (req.query.date === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      files = files.filter(f => f.timestamp >= weekAgo);
    }
    if (req.query.date === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      files = files.filter(f => f.timestamp >= monthAgo);
    }
    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      files = files.filter(f => f.name.toLowerCase().includes(q) || (f.customer && f.customer.includes(q)));
    }

    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50;
    res.json(files.slice(page * limit, (page + 1) * limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/today', async (req, res) => {
  try {
    const files = await FileOrganizer.getTodayFiles();
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const files = await FileOrganizer.getAllFiles();
    const file = files.find(f => f.id === req.params.id || f.name === req.params.id || f.relativePath === req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const files = await FileOrganizer.getAllFiles();
    const file = files.find(f => f.id === req.params.id || f.name === req.params.id || f.relativePath === req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    const result = FileOrganizer.deleteFile(file.relativePath);
    if (result) {
      Database.delete('files', file.id);
      res.json({ message: 'File deleted' });
    } else {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
