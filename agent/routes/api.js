const express = require('express');
const router = express.Router();
const path = require('path');
const os = require('os');
const Database = require('../storage/database');
const FileOrganizer = require('../services/fileOrganizer');
const CustomerManager = require('../services/customerManager');
const PrintQueueService = require('../services/printQueue');
const Logger = require('../services/logger');
const WebSocketService = require('../services/websocket');
const Config = require('../services/config');

router.get('/stats', async (req, res) => {
  try {
    const organizerStats = await FileOrganizer.getStats();
    const customerStats = await CustomerManager.getStats();
    const printStats = await PrintQueueService.getStats();
    res.json({
      todayFiles: organizerStats.todayFiles,
      totalCustomers: customerStats.totalCustomers,
      pendingPrints: printStats.pending,
      downloadsToday: 0,
      storageUsed: organizerStats.totalSize,
      storageTotal: 1000000000000,
      whatsappStatus: 'Unknown'
    });
  } catch (e) {
    res.json({ todayFiles: 0, totalCustomers: 0, pendingPrints: 0, downloadsToday: 0, storageUsed: 0, storageTotal: 0, whatsappStatus: 'Error' });
  }
});

router.get('/activity', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json(Database.getRecentActivity(limit));
});

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ customers: [], files: [] });
  try {
    const customers = await CustomerManager.search(q);
    const allFiles = await FileOrganizer.getAllFiles();
    const files = allFiles.filter(f =>
      f.name.toLowerCase().includes(q.toLowerCase()) ||
      (f.customer && f.customer.includes(q))
    ).slice(0, 20);
    res.json({ customers, files });
  } catch (e) {
    res.json({ customers: [], files: [] });
  }
});

router.get('/agent/status', async (req, res) => {
  res.json({
    status: 'running',
    uptime: Math.floor((Date.now() - global.agentStartTime) / 1000) + 's',
    memory: (process.memoryUsage().rss / 1024 / 1024).toFixed(1) + ' MB',
    cpu: os.loadavg()[0].toFixed(2),
    platform: os.platform(),
    hostname: os.hostname(),
    nodeVersion: process.version,
    wsClients: WebSocketService.getClientCount()
  });
});

router.post('/agent/restart', async (req, res) => {
  res.json({ message: 'Restart initiated' });
  setTimeout(() => { process.exit(0); }, 1000);
});

router.get('/whatsapp/status', async (req, res) => {
  const WhatsAppService = require('../services/whatsapp');
  let status = 'N/A', qr = null;
  if (global.agent && global.agent.services && global.agent.services.whatsapp) {
    status = await global.agent.services.whatsapp.getStatus();
    if (status === 'Awaiting QR Scan') {
      qr = await global.agent.services.whatsapp.getQR();
    }
  }
  res.json({ status, qr });
});

router.get('/whatsapp/qr', async (req, res) => {
  const WhatsAppService = require('../services/whatsapp');
  if (global.agent && global.agent.services && global.agent.services.whatsapp) {
    const qr = await global.agent.services.whatsapp.getQR();
    if (qr) return res.json({ qr });
  }
  res.json({ qr: null });
});

router.post('/whatsapp/logout', async (req, res) => {
  try {
    if (global.agent && global.agent.services && global.agent.services.whatsapp) {
      await global.agent.services.whatsapp.logout();
      res.json({ message: 'Logged out' });
    } else {
      res.status(400).json({ error: 'WhatsApp service not available' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/print', async (req, res) => {
  try {
    const queue = await PrintQueueService.getAll();
    res.json(queue);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/print', async (req, res) => {
  try {
    const { fileIds, customerId, customerName } = req.body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'fileIds array required' });
    }
    const items = await PrintQueueService.add(fileIds, customerId, customerName);
    res.status(201).json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/print/:id', async (req, res) => {
  try {
    const updated = await PrintQueueService.updateStatus(req.params.id, req.body.status);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/print/:id', async (req, res) => {
  try {
    const result = await PrintQueueService.remove(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Removed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/downloads', async (req, res) => {
  try {
    const Downloader = require('../services/downloader');
    const history = await Downloader.getHistory();
    res.json(history);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/downloads/queue', async (req, res) => {
  try {
    const Downloader = require('../services/downloader');
    const queue = await Downloader.getQueue();
    res.json(queue);
  } catch (e) {
    res.json([]);
  }
});

router.post('/downloads/:id/retry', async (req, res) => {
  try {
    const Downloader = require('../services/downloader');
    const result = await Downloader.retry(req.params.id);
    res.json({ success: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/downloads/:id/cancel', async (req, res) => {
  try {
    const Downloader = require('../services/downloader');
    const result = await Downloader.cancel(req.params.id);
    res.json({ success: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const logs = await Logger.getLogs({
      level: req.query.level,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const allFiles = await FileOrganizer.getAllFiles();
    const customers = await CustomerManager.getAllCustomers();
    const printStats = await PrintQueueService.getStats();

    const filesByType = {};
    allFiles.forEach(f => {
      const ext = (f.ext || path.extname(f.name).toLowerCase()).replace('.', '') || 'other';
      const cat = { pdf: 'pdf', jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image', webp: 'image', tiff: 'image', svg: 'image', doc: 'doc', docx: 'doc', xls: 'doc', xlsx: 'doc', ppt: 'doc', pptx: 'doc', cdr: 'vector', psd: 'vector', ai: 'vector', eps: 'vector', zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive', mp4: 'video', avi: 'video', mkv: 'video', mov: 'video', wmv: 'video', mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio' }[ext] || 'other';
      filesByType[cat] = (filesByType[cat] || 0) + 1;
    });

    const downloadsByDay = {};
    allFiles.forEach(f => {
      const day = f.timestamp ? f.timestamp.split('T')[0] : 'unknown';
      downloadsByDay[day] = (downloadsByDay[day] || 0) + 1;
    });

    res.json({
      totalFiles: allFiles.length,
      totalDownloads: allFiles.length,
      totalPrints: printStats.printed,
      totalCustomers: customers.length,
      filesByType,
      downloadsByDay
    });
  } catch (e) {
    res.json({ totalFiles: 0, totalDownloads: 0, totalPrints: 0, totalCustomers: 0 });
  }
});

module.exports = router;
global.agentStartTime = Date.now();
