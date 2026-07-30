const express = require('express');
const router = express.Router();
const Config = require('../services/config');
const Logger = require('../services/logger');

router.get('/', (req, res) => {
  const settings = Config.getAll();
  res.json({
    server: { port: settings.server.port, host: settings.server.host },
    whatsapp: { enabled: settings.whatsapp.enabled, autoReconnect: settings.whatsapp.autoReconnect },
    downloads: {
      basePath: settings.downloads.basePath,
      maxRetries: settings.downloads.maxRetries,
      maxFileSize: settings.downloads.maxFileSize,
      allowedExtensions: settings.downloads.allowedExtensions
    },
    logging: { level: settings.logging.level },
    notifications: settings.notifications,
    auth: { enabled: settings.auth.enabled }
  });
});

router.put('/', (req, res) => {
  try {
    const body = req.body;
    if (body.logLevel) Config.set('logging.level', body.logLevel);
    if (body.downloadPath) Config.set('downloads.basePath', body.downloadPath);
    if (body.maxFileSize) Config.set('downloads.maxFileSize', body.maxFileSize);
    if (body.maxRetries) Config.set('downloads.maxRetries', body.maxRetries);
    if (body.notifications) {
      if (body.notifications.desktop !== undefined) Config.set('notifications.desktop', body.notifications.desktop);
      if (body.notifications.sound !== undefined) Config.set('notifications.sound', body.notifications.sound);
      if (body.notifications.dashboard !== undefined) Config.set('notifications.dashboard', body.notifications.dashboard);
    }
    if (body.autoStartup !== undefined) Config.set('autoStartup', body.autoStartup);

    Logger.info('Settings updated');
    res.json({ message: 'Settings saved', settings: Config.getAll() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
