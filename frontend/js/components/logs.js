const LogsComponent = {
  render() {
    return `
      <div class="flex items-center gap-3 mb-6 flex-wrap">
        <select id="log-level-filter" class="input-field w-32">
          <option value="">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>
        <button class="btn btn-primary btn-sm" onclick="LogsComponent.load()">Refresh</button>
        <button class="btn btn-secondary btn-sm" onclick="LogsComponent.clear()">Clear View</button>
        <span class="text-sm text-gray-500 ml-auto">Showing <span id="log-count">0</span> entries</span>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div class="h-[600px] overflow-y-auto font-mono text-sm p-4" id="logs-container">
          <div class="text-gray-500 text-center py-8">Loading logs...</div>
        </div>
      </div>
    `;
  },

  async load() {
    try {
      const level = document.getElementById('log-level-filter').value;
      const params = { limit: 200 };
      if (level) params.level = level;
      const logs = await API.getLogs(params);
      document.getElementById('log-count').textContent = (logs && logs.length) || 0;
      const container = document.getElementById('logs-container');
      if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-center py-8">No logs found</div>';
        return;
      }
      container.innerHTML = logs.map(log => {
        const time = Formatters.date(log.timestamp, 'short');
        const levelClass = log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : log.level === 'debug' ? 'text-gray-500' : 'text-gray-300';
        const badgeClass = log.level === 'error' ? 'badge-red' : log.level === 'warn' ? 'badge-yellow' : log.level === 'debug' ? 'badge-gray' : 'badge-blue';
        return `<div class="flex items-start gap-3 py-1 border-b border-gray-800/50 last:border-0">
          <span class="text-gray-500 text-xs whitespace-nowrap w-20 flex-shrink-0">${time}</span>
          <span class="badge ${badgeClass} text-xs uppercase flex-shrink-0 w-16 text-center">${log.level || 'info'}</span>
          <span class="${levelClass}">${log.message || log.detail || ''}</span>
        </div>`;
      }).join('');
      container.scrollTop = container.scrollHeight;
    } catch (e) {
      document.getElementById('logs-container').innerHTML = '<div class="text-red-400 text-center py-8">Failed to load logs</div>';
    }
  },

  clear() {
    document.getElementById('logs-container').innerHTML = '<div class="text-gray-500 text-center py-8">View cleared</div>';
    document.getElementById('log-count').textContent = '0';
  },

  setupListeners() {
    WS.on('log', () => this.load());
  }
};
