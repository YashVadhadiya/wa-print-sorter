const fs = require('fs');
const path = require('path');
const Config = require('../services/config');

const STORE_DIR = path.join(__dirname, '..', 'data');

const stores = {
  customers: { file: 'customers.json', data: [] },
  files: { file: 'files.json', data: [] },
  downloads: { file: 'downloads.json', data: [] },
  printQueue: { file: 'print-queue.json', data: [] },
  activity: { file: 'activity.json', data: [] },
  settings: { file: 'settings.json', data: {} }
};

const Database = {
  init() {
    try {
      if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
      Object.entries(stores).forEach(([key, store]) => {
        const filePath = path.join(STORE_DIR, store.file);
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            store.data = JSON.parse(content);
          } catch (e) {
            store.data = key === 'settings' ? {} : [];
          }
        }
        this._save(key);
      });
    } catch (e) {
      console.error('Database init error:', e.message);
    }
  },

  _getStore(name) {
    return stores[name];
  },

  _save(name) {
    const store = this._getStore(name);
    if (!store) return;
    try {
      const filePath = path.join(STORE_DIR, store.file);
      fs.writeFileSync(filePath, JSON.stringify(store.data, null, 2));
    } catch (e) {
      console.error('Database save error:', e.message);
    }
  },

  _getTimestamp() {
    return new Date().toISOString();
  },

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  getAll(storeName) {
    const store = this._getStore(storeName);
    return store ? store.data : [];
  },

  getById(storeName, id, field = 'id') {
    const store = this._getStore(storeName);
    if (!store) return null;
    return store.data.find(item => item[field] === id) || null;
  },

  add(storeName, item) {
    const store = this._getStore(storeName);
    if (!store) return null;
    const entry = { id: this._generateId(), createdAt: this._getTimestamp(), ...item };
    store.data.push(entry);
    this._save(storeName);
    return entry;
  },

  update(storeName, id, updates, field = 'id') {
    const store = this._getStore(storeName);
    if (!store) return null;
    const idx = store.data.findIndex(item => item[field] === id);
    if (idx === -1) return null;
    store.data[idx] = { ...store.data[idx], ...updates, updatedAt: this._getTimestamp() };
    this._save(storeName);
    return store.data[idx];
  },

  delete(storeName, id, field = 'id') {
    const store = this._getStore(storeName);
    if (!store) return false;
    const idx = store.data.findIndex(item => item[field] === id);
    if (idx === -1) return false;
    store.data.splice(idx, 1);
    this._save(storeName);
    return true;
  },

  query(storeName, filterFn) {
    const store = this._getStore(storeName);
    if (!store) return [];
    return store.data.filter(filterFn);
  },

  count(storeName, criteria = {}) {
    const store = this._getStore(storeName);
    if (!store) return 0;
    if (Object.keys(criteria).length === 0) return store.data.length;
    return store.data.filter(item => {
      return Object.entries(criteria).every(([key, val]) => item[key] === val);
    }).length;
  },

  addActivity(type, detail, data = {}) {
    const entry = { type, detail, ...data, timestamp: this._getTimestamp() };
    const store = this._getStore('activity');
    if (!store) return null;
    store.data.unshift(entry);
    if (store.data.length > 1000) store.data.length = 1000;
    this._save('activity');
    return entry;
  },

  getRecentActivity(limit = 20) {
    const store = this._getStore('activity');
    return store ? store.data.slice(0, limit) : [];
  }
};

module.exports = Database;
