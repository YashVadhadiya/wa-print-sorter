const fs = require('fs');
const path = require('path');
const Config = require('./config');
const Logger = require('./logger');
const WebSocketService = require('./websocket');
const Database = require('../storage/database');

class DownloaderService {
  constructor(services) {
    this.services = services;
    this.activeDownloads = new Map();
    this.downloadHistory = [];
  }

  async download(media, sender, pushname, msg) {
    const ext = this._getExtension(media.mimetype, media.filename);
    const fileName = this._generateFileName(media.filename, ext, sender);
    const fileSize = media.data ? Buffer.from(media.data, 'base64').length : 0;

    if (this._isBlacklisted(ext)) {
      Logger.info('Blacklisted file type: ' + ext + ' from ' + sender);
      return;
    }

    if (fileSize > Config.get('downloads.maxFileSize', 1073741824)) {
      Logger.warn('File too large: ' + fileName + ' (' + fileSize + ' bytes) from ' + sender);
      return;
    }

    const downloadId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    try {
      const FileOrganizer = require('./fileOrganizer');
      const CustomerManager = require('./customerManager');

      const destDir = FileOrganizer.getCustomerDir(sender);
      const filePath = path.join(destDir, fileName);
      const relativePath = path.relative(Config.get('downloads.basePath', './data/downloads'), filePath);

      if (fs.existsSync(filePath)) {
        Logger.info('File already exists: ' + fileName + ' for ' + sender);
        Database.addActivity('duplicate', 'Duplicate file: ' + fileName, { sender, fileName });
        return;
      }

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      this.activeDownloads.set(downloadId, {
        id: downloadId, name: fileName, sender, pushname, status: 'downloading',
        progress: 0, size: fileSize, ext, timestamp: new Date().toISOString()
      });
      WebSocketService.broadcast('download_started', this.activeDownloads.get(downloadId));

      const buffer = Buffer.from(media.data, 'base64');
      fs.writeFileSync(filePath, buffer);

      this.activeDownloads.set(downloadId, {
        ...this.activeDownloads.get(downloadId), status: 'completed', progress: 100
      });
      this.activeDownloads.delete(downloadId);

      Logger.info('Downloaded: ' + fileName + ' (' + fileSize + ' bytes) from ' + pushname);

      const fileRecord = Database.add('files', {
        name: fileName, path: relativePath, fullPath: filePath,
        size: fileSize, ext, mimetype: media.mimetype,
        customer: sender, customerName: pushname,
        status: 'downloaded', date: new Date().toISOString().split('T')[0]
      });

      Database.add('downloads', {
        name: fileName, sender, customerName: pushname,
        size: fileSize, ext, status: 'completed',
        path: relativePath, downloadId
      });

      if (CustomerManager) {
        await CustomerManager.addFile(sender, fileName, fileSize, ext);
      }

      Database.addActivity('download', 'Downloaded: ' + fileName, {
        sender, fileName, fileSize, ext
      });

      WebSocketService.broadcast('download_complete', {
        id: fileRecord ? fileRecord.id : downloadId,
        name: fileName, customer: pushname, sender, size: fileSize, ext
      });

      const WhatsAppService = require('./whatsapp');
      if (WhatsAppService && WhatsAppService.client && msg) {
        try {
          await msg.reply('✓ File received: ' + fileName);
        } catch (e) {}
      }

    } catch (e) {
      Logger.error('Download failed for ' + fileName + ': ' + e.message);
      this.activeDownloads.set(downloadId, {
        ...(this.activeDownloads.get(downloadId) || {}),
        status: 'failed', error: e.message
      });
      WebSocketService.broadcast('download_failed', { id: downloadId, name: fileName, error: e.message });
      Database.addActivity('download_error', 'Download failed: ' + fileName, { sender, error: e.message });
    }
  }

  _getExtension(mimetype, filename) {
    if (filename) {
      const ext = path.extname(filename).toLowerCase();
      if (ext) return ext;
    }
    const map = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
      'image/webp': '.webp', 'image/bmp': '.bmp', 'image/tiff': '.tiff',
      'image/svg+xml': '.svg',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-powerpoint': '.ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'application/x-coreldraw': '.cdr',
      'application/x-photoshop': '.psd',
      'application/postscript': '.ai',
      'application/zip': '.zip', 'application/x-rar-compressed': '.rar',
      'application/x-7z-compressed': '.7z',
      'video/mp4': '.mp4', 'video/x-msvideo': '.avi', 'video/x-matroska': '.mkv',
      'video/quicktime': '.mov', 'video/x-ms-wmv': '.wmv',
      'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/ogg': '.ogg',
      'audio/flac': '.flac', 'audio/aac': '.aac',
      'text/plain': '.txt', 'text/csv': '.csv'
    };
    return map[mimetype] || '.bin';
  }

  _generateFileName(filename, ext, sender) {
    if (filename) {
      const name = path.basename(filename, path.extname(filename));
      const safeName = name.replace(/[<>:"/\\|?*]+/g, '_').substring(0, 100);
      return safeName + ext;
    }
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return sender + '_' + timestamp + '_' + random + ext;
  }

  _isBlacklisted(ext) {
    const blacklisted = Config.get('downloads.blacklistedExtensions', ['.exe', '.msi', '.bat', '.cmd', '.vbs', '.scr']);
    return blacklisted.includes(ext.toLowerCase());
  }

  async getQueue() {
    return Array.from(this.activeDownloads.values());
  }

  async getHistory(limit = 50) {
    return Database.getAll('downloads').slice(0, limit);
  }

  async retry(id) {
    return false;
  }

  async cancel(id) {
    const dl = this.activeDownloads.get(id);
    if (dl) {
      this.activeDownloads.delete(id);
      WebSocketService.broadcast('download_cancelled', { id });
      return true;
    }
    return false;
  }
}

module.exports = DownloaderService;
