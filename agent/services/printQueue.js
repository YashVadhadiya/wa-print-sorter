const Logger = require('./logger');
const Database = require('../storage/database');
const WebSocketService = require('./websocket');

class PrintQueueService {
  constructor() {
    this.printing = false;
  }

  async getAll() {
    return Database.getAll('printQueue').sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async add(fileIds, customerId = null, customerName = null) {
    const items = [];
    for (const fileId of fileIds) {
      const item = Database.add('printQueue', {
        fileId,
        customerId,
        customerName,
        status: 'pending'
      });
      items.push(item);
      Database.addActivity('print', 'Added to print queue: ' + fileId, { fileId, customerId });
    }
    WebSocketService.broadcast('print_queue_updated', { action: 'add', items });
    return items;
  }

  async updateStatus(id, status) {
    const validStatuses = ['pending', 'printing', 'printed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status: ' + status);
    }
    const updated = Database.update('printQueue', id, { status });
    if (updated) {
      Database.addActivity('print', 'Print ' + updated.name + ' -> ' + status, { id, status });
      WebSocketService.broadcast('print_update', updated);
    }
    return updated;
  }

  async remove(id) {
    const result = Database.delete('printQueue', id);
    if (result) {
      WebSocketService.broadcast('print_removed', { id });
    }
    return result;
  }

  async getStats() {
    const queue = await this.getAll();
    return {
      total: queue.length,
      pending: queue.filter(i => i.status === 'pending').length,
      printing: queue.filter(i => i.status === 'printing').length,
      printed: queue.filter(i => i.status === 'printed').length,
      cancelled: queue.filter(i => i.status === 'cancelled').length
    };
  }
}

module.exports = PrintQueueService;
