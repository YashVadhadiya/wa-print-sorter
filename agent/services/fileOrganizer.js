const fs = require('fs');
const path = require('path');
const Config = require('./config');
const Logger = require('./logger');

class FileOrganizer {
  constructor() {
    this.basePath = null;
  }

  init() {
    this.basePath = Config.get('downloads.basePath', './data/downloads');
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
    Logger.info('File organizer base path: ' + this.basePath);
  }

  getCustomerDir(customerId) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const day = String(now.getDate()).padStart(2, '0');
    return path.join(this.basePath, 'Customers', customerId, year, month, day);
  }

  getCustomerBaseDir(customerId) {
    return path.join(this.basePath, 'Customers', customerId);
  }

  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  }

  async getCustomerFolders() {
    const customersDir = path.join(this.basePath, 'Customers');
    if (!fs.existsSync(customersDir)) return [];
    const entries = fs.readdirSync(customersDir, { withFileTypes: true });
    const folders = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        folders.push(entry.name);
      }
    }
    return folders;
  }

  async getCustomerFiles(customerId) {
    const dir = this.getCustomerBaseDir(customerId);
    if (!fs.existsSync(dir)) return [];
    const files = [];
    const walk = (directory) => {
      const entries = fs.readdirSync(directory, { withFileTypes: true });
      for (const e of entries) {
        const fullPath = path.join(directory, e.name);
        if (e.isDirectory()) {
          walk(fullPath);
        } else {
          const stat = fs.statSync(fullPath);
          files.push({
            name: e.name,
            path: fullPath,
            relativePath: path.relative(this.basePath, fullPath),
            size: stat.size,
            modifiedAt: stat.mtime.toISOString()
          });
        }
      }
    };
    walk(dir);
    return files;
  }

  async getTodayFiles() {
    const customersDir = path.join(this.basePath, 'Customers');
    if (!fs.existsSync(customersDir)) return [];
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const day = String(now.getDate()).padStart(2, '0');
    const todayDir = path.join(customersDir, '*', year, month, day);
    const files = [];
    const customers = fs.readdirSync(customersDir, { withFileTypes: true });
    for (const c of customers) {
      if (!c.isDirectory()) continue;
      const dayPath = path.join(customersDir, c.name, year, month, day);
      if (fs.existsSync(dayPath)) {
        const entries = fs.readdirSync(dayPath, { withFileTypes: true });
        for (const e of entries) {
          if (e.isFile()) {
            const fullPath = path.join(dayPath, e.name);
            const stat = fs.statSync(fullPath);
            files.push({
              name: e.name,
              customer: c.name,
              path: fullPath,
              relativePath: path.relative(this.basePath, fullPath),
              size: stat.size,
              timestamp: stat.mtime.toISOString()
            });
          }
        }
      }
    }
    return files.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getAllFiles() {
    const customersDir = path.join(this.basePath, 'Customers');
    if (!fs.existsSync(customersDir)) return [];
    const files = [];
    const walk = (dir, customerId = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory()) {
          walk(fullPath, customerId || e.name);
        } else {
          const stat = fs.statSync(fullPath);
          files.push({
            name: e.name,
            customer: customerId,
            path: fullPath,
            relativePath: path.relative(this.basePath, fullPath),
            size: stat.size,
            ext: path.extname(e.name).toLowerCase(),
            timestamp: stat.mtime.toISOString()
          });
        }
      }
    };
    walk(customersDir);
    return files.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getStats() {
    const allFiles = await this.getAllFiles();
    const today = new Date().toISOString().split('T')[0];
    const todayFiles = allFiles.filter(f => f.timestamp.startsWith(today));
    let totalSize = allFiles.reduce((sum, f) => sum + (f.size || 0), 0);
    const customers = await this.getCustomerFolders();
    return { totalFiles: allFiles.length, todayFiles: todayFiles.length, totalSize, totalCustomers: customers.length };
  }

  deleteFile(relativePath) {
    const fullPath = path.join(this.basePath, relativePath);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
    } catch (e) {
      Logger.error('Failed to delete file: ' + e.message);
    }
    return false;
  }
}

module.exports = FileOrganizer;
