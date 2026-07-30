const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { WebSocketServer } = require('ws');

const Logger = require('./services/logger');
const Config = require('./services/config');
const Database = require('./storage/database');
const WebSocketService = require('./services/websocket');
const WhatsAppService = require('./services/whatsapp');
const DownloaderService = require('./services/downloader');
const FileOrganizer = require('./services/fileOrganizer');
const CustomerManager = require('./services/customerManager');
const PrintQueueService = require('./services/printQueue');
const NotificationService = require('./services/notification');

const apiRoutes = require('./routes/api');
const customerRoutes = require('./routes/customers');
const fileRoutes = require('./routes/files');
const settingsRoutes = require('./routes/settings');
const { authMiddleware } = require('./utils/auth');

class PrintHubAgent {
  constructor() {
    this.app = express();
    this.server = null;
    this.wss = null;
    this.services = {};
    this.startTime = Date.now();
  }

  async init() {
    Logger.info('Initializing PrintHub Agent...');

    Config.load();
    Database.init();
    NotificationService.init();

    this.app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
    this.app.use(cors({ origin: true, credentials: true }));
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    if (Config.get('auth.enabled')) {
      this.app.use('/api', authMiddleware);
    }

    this.app.use('/api', apiRoutes);
    this.app.use('/api/customers', customerRoutes);
    this.app.use('/api/files', fileRoutes);
    this.app.use('/api/settings', settingsRoutes);

    this.app.use((err, req, res, next) => {
      Logger.error('Unhandled error: ' + err.message);
      res.status(500).json({ error: 'Internal server error' });
    });

    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    await this.startServer();
    this.setupWebSocket();
    await this.initServices();
    this.setupGracefulShutdown();

    Logger.info('PrintHub Agent started successfully on port ' + Config.get('server.port'));
  }

  async startServer() {
    const ssl = Config.get('server.ssl');
    const port = Config.get('server.port');
    const host = Config.get('server.host');

    if (ssl && Config.get('server.sslCert') && Config.get('server.sslKey')) {
      const opts = {
        cert: fs.readFileSync(Config.get('server.sslCert')),
        key: fs.readFileSync(Config.get('server.sslKey'))
      };
      this.server = https.createServer(opts, this.app);
    } else {
      this.server = http.createServer(this.app);
    }

    return new Promise((resolve) => {
      this.server.listen(port, host, () => resolve());
    });
  }

  setupWebSocket() {
    this.wss = new WebSocketServer({ server: this.server });
    WebSocketService.init(this.wss);
    Logger.info('WebSocket server ready');
  }

  async initServices() {
    this.services.fileOrganizer = new FileOrganizer();
    this.services.customerManager = new CustomerManager();
    this.services.downloader = new DownloaderService(this.services);
    this.services.printQueue = new PrintQueueService();
    this.services.whatsapp = new WhatsAppService(this.services);

    this.services.fileOrganizer.init();
    this.services.customerManager.init();

    global.agent = this;

    if (Config.get('whatsapp.enabled')) {
      await this.services.whatsapp.init();
    }

    setInterval(() => this.broadcastStats(), 5000);
  }

  async broadcastStats() {
    try {
      const stats = {
        todayFiles: await Database.count('files', { date: new Date().toISOString().split('T')[0] }),
        totalCustomers: await Database.count('customers'),
        pendingPrints: await Database.count('printQueue', { status: 'pending' }),
        downloadsToday: await Database.count('downloads', { date: new Date().toISOString().split('T')[0] }),
        storageUsed: this.getStorageUsed(),
        storageTotal: this.getStorageTotal(),
        whatsappStatus: this.services.whatsapp ? await this.services.whatsapp.getStatus() : 'N/A'
      };
      WebSocketService.broadcast('stats_update', stats);
    } catch (e) {}
  }

  getStorageUsed() {
    const base = Config.get('downloads.basePath');
    try {
      let total = 0;
      const walk = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) walk(p);
          else total += fs.statSync(p).size;
        }
      };
      if (fs.existsSync(base)) walk(base);
      return total;
    } catch { return 0; }
  }

  getStorageTotal() {
    try {
      const base = Config.get('downloads.basePath');
      if (fs.existsSync(base)) {
        const drive = path.parse(base).root;
        const info = require('fs').statSync(drive);
        return 500000000000;
      }
    } catch {}
    return 1000000000000;
  }

  setupGracefulShutdown() {
    const shutdown = async () => {
      Logger.info('Shutting down...');
      if (this.services.whatsapp) await this.services.whatsapp.destroy();
      if (this.wss) this.wss.close();
      if (this.server) this.server.close();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (err) => {
      Logger.error('Uncaught exception: ' + err.message);
    });
  }
}

const agent = new PrintHubAgent();
agent.init().catch(err => {
  Logger.error('Failed to start agent: ' + err.message);
  process.exit(1);
});

module.exports = agent;
