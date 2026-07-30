const crypto = require('crypto');
const path = require('path');

const Helpers = {
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim().substring(0, 200) || 'untitled';
  },

  getFileCategory(ext) {
    const categories = {
      pdf: 'document',
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image', webp: 'image', tiff: 'image', svg: 'image',
      doc: 'document', docx: 'document', xls: 'document', xlsx: 'document', ppt: 'document', pptx: 'document',
      cdr: 'vector', psd: 'vector', ai: 'vector', eps: 'vector',
      zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
      mp4: 'video', avi: 'video', mkv: 'video', mov: 'video', wmv: 'video',
      mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio'
    };
    return categories[ext.replace('.', '').toLowerCase()] || 'other';
  },

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  retry(fn, maxAttempts = 3, delay = 1000) {
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const result = await fn();
          return resolve(result);
        } catch (e) {
          if (i === maxAttempts - 1) return reject(e);
          await this.sleep(delay * (i + 1));
        }
      }
    });
  },

  async ensureDir(dirPath) {
    const fs = require('fs');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  },

  getDatePath() {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const day = String(now.getDate()).padStart(2, '0');
    return path.join(year, month, day);
  }
};

module.exports = Helpers;
