const fs = require('fs');
const path = require('path');
const Config = require('./config');
const Logger = require('./logger');
const Database = require('../storage/database');
const WebSocketService = require('./websocket');

class CustomerManager {
  constructor() {
    this.customers = [];
  }

  init() {
    this.customers = Database.getAll('customers');
    Logger.info('Customer manager initialized with ' + this.customers.length + ' customers');
  }

  async getOrCreateCustomer(phone) {
    let customer = Database.getById('customers', phone, 'phone');
    if (!customer) {
      customer = Database.add('customers', {
        phone,
        name: 'Unknown',
        totalFiles: 0,
        totalPrints: 0,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        notes: ''
      });
      this.customers = Database.getAll('customers');
      WebSocketService.broadcast('customer_new', customer);
      Database.addActivity('customer', 'New customer: ' + phone);
    }
    return customer;
  }

  async updateCustomer(phone, updates) {
    const customer = await this.getOrCreateCustomer(phone);
    const updated = Database.update('customers', phone, updates, 'phone');
    if (updated) {
      WebSocketService.broadcast('customer_update', updated);
    }
    return updated || customer;
  }

  async addFile(phone, fileName, fileSize, ext) {
    const customer = await this.getOrCreateCustomer(phone);
    const files = customer.files || [];
    files.push({ name: fileName, size: fileSize, ext, date: new Date().toISOString() });
    Database.update('customers', phone, {
      totalFiles: (customer.totalFiles || 0) + 1,
      lastSeen: new Date().toISOString(),
      files: files.slice(-500)
    }, 'phone');
  }

  async addPrint(phone) {
    const customer = await this.getOrCreateCustomer(phone);
    Database.update('customers', phone, {
      totalPrints: (customer.totalPrints || 0) + 1
    }, 'phone');
  }

  async getAllCustomers() {
    const customers = Database.getAll('customers');
    return customers.map(c => ({
      ...c,
      firstSeen: c.firstSeen || c.createdAt,
      lastSeen: c.lastSeen || c.updatedAt || c.createdAt
    })).sort((a, b) => new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0));
  }

  async getCustomer(phone) {
    return Database.getById('customers', phone, 'phone');
  }

  async deleteCustomer(phone) {
    const result = Database.delete('customers', phone, 'phone');
    if (result) {
      const baseDir = path.join(Config.get('downloads.basePath', './data/downloads'), 'Customers', phone);
      try {
        if (fs.existsSync(baseDir)) {
          fs.rmSync(baseDir, { recursive: true, force: true });
        }
      } catch (e) {
        Logger.warn('Failed to delete customer directory: ' + e.message);
      }
      WebSocketService.broadcast('customer_deleted', { phone });
      this.customers = Database.getAll('customers');
    }
    return result;
  }

  async search(query) {
    const customers = await this.getAllCustomers();
    const q = query.toLowerCase();
    return customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  }

  async getStats() {
    const customers = await this.getAllCustomers();
    const totalFiles = customers.reduce((sum, c) => sum + (c.totalFiles || 0), 0);
    const totalPrints = customers.reduce((sum, c) => sum + (c.totalPrints || 0), 0);
    return {
      totalCustomers: customers.length,
      totalFiles,
      totalPrints,
      recentCustomers: customers.slice(0, 5)
    };
  }
}

module.exports = new CustomerManager();
