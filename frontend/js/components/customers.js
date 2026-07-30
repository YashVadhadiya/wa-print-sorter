const CustomersComponent = {
  render() {
    return `
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div class="flex gap-2">
          <input type="text" id="customer-search-input" class="input-field w-64" placeholder="Search customers...">
          <button class="btn btn-primary btn-sm" onclick="CustomersComponent.search()">Search</button>
        </div>
        <span class="text-sm text-gray-500"><span id="customer-count">0</span> total customers</span>
      </div>
      <div class="table-widget">
        <table><thead><tr><th>Customer</th><th>Phone</th><th>Files</th><th>Prints</th><th>Last Seen</th><th>First Seen</th><th>Actions</th></tr></thead>
        <tbody id="customers-tbody"><tr><td colspan="7" class="text-center text-gray-500 py-8">Loading customers...</td></tr></tbody></table>
      </div>
      <div id="customer-detail-modal" class="modal-overlay hidden" onclick="if(event.target===this)this.classList.add('hidden')">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div id="customer-detail-content"></div>
        </div>
      </div>
    `;
  },

  async load(query) {
    try {
      const customers = query ? await API.searchCustomers(query) : await API.getCustomers();
      document.getElementById('customer-count').textContent = (customers && customers.length) || 0;
      const tbody = document.getElementById('customers-tbody');
      if (!customers || customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-gray-500 py-8">No customers found</td></tr>';
        return;
      }
      tbody.innerHTML = customers.map(c => `
        <tr class="cursor-pointer" onclick="CustomersComponent.showDetail('${c.id || c.phone}')">
          <td>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-sm font-bold text-white">${(c.name || c.phone || '?')[0].toUpperCase()}</div>
              <span class="font-medium text-white">${c.name || 'Unknown'}</span>
            </div>
          </td>
          <td class="font-mono text-sm">${Formatters.phone(c.phone || c.mobile)}</td>
          <td>${c.totalFiles || 0}</td>
          <td>${c.totalPrints || 0}</td>
          <td class="text-sm">${Formatters.timeAgo(c.lastSeen)}</td>
          <td class="text-sm text-gray-500">${Formatters.date(c.firstSeen, 'short')}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();CustomersComponent.showDetail('${c.id || c.phone}')">View</button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      document.getElementById('customers-tbody').innerHTML = '<tr><td colspan="7" class="text-center text-red-400 py-8">Failed to load customers</td></tr>';
    }
  },

  async showDetail(phone) {
    try {
      const c = await API.getCustomer(phone);
      const modal = document.getElementById('customer-detail-content');
      modal.innerHTML = `
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-full bg-cyan-600 flex items-center justify-center text-2xl font-bold text-white">${(c.name || '?')[0].toUpperCase()}</div>
          <div><h3 class="text-xl font-bold text-white">${c.name || 'Unknown'}</h3><p class="text-gray-400">${Formatters.phone(c.phone)}</p></div>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-800 rounded-lg p-4"><div class="text-2xl font-bold text-white">${c.totalFiles || 0}</div><div class="text-sm text-gray-400">Total Files</div></div>
          <div class="bg-gray-800 rounded-lg p-4"><div class="text-2xl font-bold text-white">${c.totalPrints || 0}</div><div class="text-sm text-gray-400">Total Prints</div></div>
          <div class="bg-gray-800 rounded-lg p-4"><div class="text-sm text-gray-400">First Seen</div><div class="text-white font-medium">${Formatters.date(c.firstSeen)}</div></div>
          <div class="bg-gray-800 rounded-lg p-4"><div class="text-sm text-gray-400">Last Seen</div><div class="text-white font-medium">${Formatters.date(c.lastSeen)}</div></div>
        </div>
        <div class="mb-4"><label class="text-sm text-gray-400 block mb-1">Notes</label><textarea class="input-field" rows="3" id="customer-notes">${c.notes || ''}</textarea></div>
        <div class="flex gap-2 justify-end">
          <button class="btn btn-secondary" onclick="document.getElementById('customer-detail-modal').classList.add('hidden')">Close</button>
          <button class="btn btn-primary" onclick="CustomersComponent.saveNotes('${c.id || c.phone}')">Save Notes</button>
        </div>
      `;
      document.getElementById('customer-detail-modal').classList.remove('hidden');
    } catch (e) {
      Notifications.error('Failed to load customer details');
    }
  },

  async saveNotes(phone) {
    const notes = document.getElementById('customer-notes').value;
    try {
      await API.updateCustomer(phone, { notes });
      Notifications.success('Notes saved');
    } catch (e) {
      Notifications.error('Failed to save notes');
    }
  },

  search() {
    const q = document.getElementById('customer-search-input').value.trim();
    this.load(q || undefined);
  },

  setupListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.getElementById('customer-search-input') === document.activeElement) {
        this.search();
      }
    });
    WS.on('customer_update', () => this.load());
  }
};
