const StatisticsComponent = {
  render() {
    return `
      <div class="grid-dashboard mb-6">
        <div class="widget"><div class="stat-label">Total Files</div><div class="stat-value" id="stat-total-files">0</div></div>
        <div class="widget"><div class="stat-label">Total Downloads</div><div class="stat-value" id="stat-total-downloads">0</div></div>
        <div class="widget"><div class="stat-label">Total Prints</div><div class="stat-value" id="stat-total-prints">0</div></div>
        <div class="widget"><div class="stat-label">Total Customers</div><div class="stat-value" id="stat-total-customers">0</div></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="widget"><h3 class="font-semibold text-white mb-4">Files by Type</h3><div id="files-by-type-chart" class="space-y-3"></div></div>
        <div class="widget"><h3 class="font-semibold text-white mb-4">Downloads by Day</h3><div id="downloads-by-day-chart" class="space-y-3"></div></div>
      </div>
    `;
  },

  async load() {
    try {
      const stats = await API.getStatistics();
      document.getElementById('stat-total-files').textContent = stats.totalFiles || 0;
      document.getElementById('stat-total-downloads').textContent = stats.totalDownloads || 0;
      document.getElementById('stat-total-prints').textContent = stats.totalPrints || 0;
      document.getElementById('stat-total-customers').textContent = stats.totalCustomers || 0;

      const typeChart = document.getElementById('files-by-type-chart');
      if (stats.filesByType) {
        const total = Object.values(stats.filesByType).reduce((a, b) => a + b, 0) || 1;
        typeChart.innerHTML = Object.entries(stats.filesByType).map(([type, count]) => {
          const pct = Math.round((count / total) * 100);
          const colors = { pdf: 'bg-red-500', image: 'bg-blue-500', doc: 'bg-cyan-500', vector: 'bg-purple-500', archive: 'bg-yellow-500', video: 'bg-pink-500', audio: 'bg-green-500', other: 'bg-gray-500' };
          return `<div><div class="flex justify-between text-sm mb-1"><span class="capitalize text-gray-300">${type}</span><span class="text-gray-400">${count} (${pct}%)</span></div><div class="w-full bg-gray-700 rounded-full h-2"><div class="${colors[type] || 'bg-gray-500'} h-2 rounded-full" style="width:${pct}%"></div></div></div>`;
        }).join('');
      } else {
        typeChart.innerHTML = '<p class="text-gray-500 text-sm">No data yet</p>';
      }

      const dayChart = document.getElementById('downloads-by-day-chart');
      if (stats.downloadsByDay) {
        const maxVal = Math.max(...Object.values(stats.downloadsByDay), 1);
        dayChart.innerHTML = Object.entries(stats.downloadsByDay).slice(-14).map(([day, count]) => {
          const pct = Math.round((count / maxVal) * 100);
          return `<div class="flex items-center gap-3"><span class="text-xs text-gray-500 w-8">${day.slice(-2)}</span><div class="flex-1 bg-gray-700 rounded-full h-4"><div class="bg-cyan-500 h-4 rounded-full" style="width:${pct}%"></div></div><span class="text-xs text-gray-400 w-6 text-right">${count}</span></div>`;
        }).join('');
      } else {
        dayChart.innerHTML = '<p class="text-gray-500 text-sm">No data yet</p>';
      }
    } catch (e) {
      Notifications.error('Failed to load statistics');
    }
  },

  setupListeners() {
    WS.on('stats_update', () => this.load());
  }
};
