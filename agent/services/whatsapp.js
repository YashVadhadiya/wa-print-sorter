const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const Config = require('./config');
const Logger = require('./logger');
const WebSocketService = require('./websocket');
const Database = require('../storage/database');

class WhatsAppService {
  constructor(services) {
    this.services = services;
    this.client = null;
    this.ready = false;
    this.qrCode = null;
    this.qrTimeout = null;
    this.reconnecting = false;
  }

  async init() {
    try {
      const sessionPath = Config.get('whatsapp.sessionPath', './data/session');
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      this.client = new Client({
        authStrategy: new LocalAuth({ dataPath: sessionPath }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process'
          ],
          executablePath: Config.get('whatsapp.chromePath', undefined)
        },
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        }
      });

      this.client.on('qr', async (qr) => {
        this.qrCode = qr;
        this.ready = false;
        Logger.info('WhatsApp QR code generated. Scan with WhatsApp.');
        WebSocketService.broadcast('whatsapp_qr', { qr });

        try {
          const qrImage = await qrcode.toDataURL(qr);
          WebSocketService.broadcast('whatsapp_qr_image', { image: qrImage });
        } catch (e) {}

        if (this.qrTimeout) clearTimeout(this.qrTimeout);
        this.qrTimeout = setTimeout(() => {
          this.qrCode = null;
          WebSocketService.broadcast('whatsapp_qr_expired', {});
        }, Config.get('whatsapp.qrTimeout', 60000));
      });

      this.client.on('ready', () => {
        this.ready = true;
        this.qrCode = null;
        this.reconnecting = false;
        Logger.info('WhatsApp client is ready!');
        WebSocketService.broadcast('whatsapp_ready', {
          number: this.client.info ? this.client.info.wid.user : 'unknown',
          name: this.client.info ? this.client.info.pushname : 'unknown'
        });
        Database.addActivity('whatsapp', 'WhatsApp connected successfully');
      });

      this.client.on('disconnected', (reason) => {
        this.ready = false;
        Logger.warn('WhatsApp disconnected: ' + reason);
        WebSocketService.broadcast('whatsapp_disconnected', { reason });
        Database.addActivity('whatsapp', 'WhatsApp disconnected: ' + reason);

        if (Config.get('whatsapp.autoReconnect', true)) {
          this.reconnecting = true;
          Logger.info('Reconnecting in ' + (Config.get('whatsapp.reconnectInterval', 30000) / 1000) + 's...');
          setTimeout(() => this.init(), Config.get('whatsapp.reconnectInterval', 30000));
        }
      });

      this.client.on('message', async (msg) => {
        await this.handleIncomingMessage(msg);
      });

      this.client.on('message_ack', (msg, ack) => {
        if (ack === 3) {
          Logger.debug('Message read: ' + msg.id._serialized);
        }
      });

      this.client.on('change_state', (state) => {
        Logger.info('WhatsApp state changed: ' + state);
        WebSocketService.broadcast('whatsapp_state', { state });
      });

      Logger.info('Initializing WhatsApp client...');
      await this.client.initialize();
    } catch (e) {
      Logger.error('WhatsApp init error: ' + e.message);
      if (Config.get('whatsapp.autoReconnect', true)) {
        setTimeout(() => this.init(), Config.get('whatsapp.reconnectInterval', 30000));
      }
    }
  }

  async handleIncomingMessage(msg) {
    try {
      if (msg.from === 'status@broadcast') return;
      if (msg.fromMe) return;

      const contact = await msg.getContact();
      const sender = contact.number || msg.from.replace('@c.us', '').replace('@s.whatsapp.net', '');
      const pushname = contact.pushname || contact.name || 'Unknown';
      const hasMedia = msg.hasMedia;

      Logger.info('Message from ' + sender + ': ' + (msg.body ? msg.body.substring(0, 100) : '(media)'));

      Database.addActivity('message', 'Message from ' + pushname, {
        sender, hasMedia, fromMe: false
      });

      if (hasMedia) {
        await this.handleMediaMessage(msg, sender, pushname);
      }

      const CustomerManager = require('./customerManager');
      if (CustomerManager) {
        await CustomerManager.updateCustomer(sender, {
          name: pushname,
          lastSeen: new Date().toISOString(),
          lastMessage: msg.body ? msg.body.substring(0, 500) : '(media)'
        });
      }

    } catch (e) {
      Logger.error('Error handling message: ' + e.message);
    }
  }

  async handleMediaMessage(msg, sender, pushname) {
    try {
      const media = await msg.downloadMedia();
      if (!media) {
        Logger.warn('No media data for message from ' + sender);
        return;
      }

      const Downloader = require('./downloader');
      if (Downloader) {
        await Downloader.download(media, sender, pushname, msg);
      }
    } catch (e) {
      Logger.error('Error downloading media: ' + e.message);
    }
  }

  async getStatus() {
    if (this.ready) return 'Connected';
    if (this.reconnecting) return 'Reconnecting';
    if (this.qrCode) return 'Awaiting QR Scan';
    return 'Disconnected';
  }

  async getQR() {
    return this.qrCode;
  }

  async logout() {
    try {
      await this.client.logout();
      this.ready = false;
      this.qrCode = null;
      Logger.info('WhatsApp logged out');
      WebSocketService.broadcast('whatsapp_logged_out', {});
      Database.addActivity('whatsapp', 'WhatsApp logged out');
    } catch (e) {
      Logger.error('Logout error: ' + e.message);
    }
  }

  async destroy() {
    try {
      if (this.client) {
        await this.client.destroy();
      }
    } catch (e) {}
  }

  checkForNewMessages() {
    Logger.info('Checking for new messages...');
    WebSocketService.broadcast('checking_messages', { timestamp: new Date().toISOString() });
  }
}

module.exports = WhatsAppService;
