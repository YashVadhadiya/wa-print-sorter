const PrintQueueComponent = {
  render() {
    return `
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-white">Print Queue</h3>
        <span class="text-sm text-gray-500"><span id="print-count">0</span> items</span>
      </div>
      <div class="table-widget">
        <table><thead><tr><th>File</th><th>Customer</th><th>Added</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="print-queue-tbody"><tr><td colspan="5" class="text-center text-gray-500 py-8">Loading...</td></tr></tbody></table>
      </div>
    `;
  },

  async load() {
    try {
      const queue = await API.getPrintQueue();
      document.getElementById('print-count').textContent = (queue && queue.length) || 0;
      const tbody = document.getElementById('print-queue-tbody');
      if (!queue || queue.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-8">Print queue is empty</td></tr>';
        return;
      }
      tbody.innerHTML = queue.map(item => `<tr>
        <td class="truncate max-w-[200px]">${Formatters.truncate(item.name, 30)}</td>
        <td>${item.customerName || item.customer || '-'}</td>
        <td class="text-sm text-gray-500">${Formatters.timeAgo(item.addedAt || item.timestamp)}</td>
        <td>
          <select class="input-field text-sm py-1 px-2 w-28" onchange="PrintQueueComponent.updateStatus('${item.id}', this.value)">
            <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="printing" ${item.status === 'printing' ? 'selected' : ''}>Printing</option>
            <option value="printed" ${item.status === 'printed' ? 'selected' : ''}>Printed</option>
            <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm text-red-400" onclick="PrintQueueComponent.remove('${item.id}')">Remove</button>
        </td>
      </tr>`).join('');
    } catch (e) {
      document.getElementById('print-queue-tbody').innerHTML = '<tr><td colspan="5" class="text-center text-red-400 py-8">Failed to load queue</td></tr>';
    }
  },

  async updateStatus(id, status) {
    try {
      await API.updatePrintStatus(id, status);
      Notifications.success('Status updated to ' + status);
    } catch (e) {
      Notifications.error('Failed to update status');
    }
  },

  async remove(id) {
    try {
      await API.removeFromPrint(id);
      Notifications.info('Removed from queue');
      this.load();
    } catch (e) {
      Notifications.error('Failed to remove');
    }
  },

  setupListeners() {
    WS.on('print_update', () => this.load());
  }
};
