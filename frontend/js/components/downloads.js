const DownloadsComponent = {
  render() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="table-widget">
          <div class="card-header"><h3 class="font-semibold text-white">Download History</h3></div>
          <div class="overflow-x-auto"><table><thead><tr><th>File</th><th>Customer</th><th>Size</th><th>Status</th><th>Time</th></tr></thead>
          <tbody id="downloads-tbody"><tr><td colspan="5" class="text-center text-gray-500 py-8">Loading...</td></tr></tbody></table></div>
        </div>
        <div class="table-widget">
          <div class="card-header"><h3 class="font-semibold text-white">Active Downloads</h3></div>
          <div class="overflow-x-auto"><table><thead><tr><th>File</th><th>Progress</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="download-queue-tbody"><tr><td colspan="4" class="text-center text-gray-500 py-8">No active downloads</td></tr></tbody></table></div>
        </div>
      </div>
    `;
  },

  async load() {
    try {
      const downloads = await API.getDownloads();
      const tbody = document.getElementById('downloads-tbody');
      if (!downloads || downloads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-8">No downloads yet</td></tr>';
      } else {
        tbody.innerHTML = downloads.slice(0, 50).map(d => `<tr>
          <td class="truncate max-w-[180px]">${Formatters.truncate(d.name, 25)}</td>
          <td>${d.customerName || d.customer || '-'}</td>
          <td>${Formatters.fileSize(d.size)}</td>
          <td><span class="badge ${d.status === 'completed' ? 'badge-green' : d.status === 'failed' ? 'badge-red' : d.status === 'downloading' ? 'badge-yellow' : 'badge-gray'}">${d.status || 'unknown'}</span></td>
          <td class="text-sm text-gray-500">${Formatters.timeAgo(d.timestamp)}</td>
        </tr>`).join('');
      }
    } catch (e) {
      document.getElementById('downloads-tbody').innerHTML = '<tr><td colspan="5" class="text-center text-red-400 py-8">Failed to load downloads</td></tr>';
    }

    try {
      const queue = await API.getDownloadQueue();
      const tbody = document.getElementById('download-queue-tbody');
      if (!queue || queue.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500 py-8">No active downloads</td></tr>';
      } else {
        tbody.innerHTML = queue.map(d => `<tr>
          <td class="truncate max-w-[180px]">${Formatters.truncate(d.name, 25)}</td>
          <td><div class="w-full bg-gray-700 rounded-full h-2"><div class="bg-cyan-500 h-2 rounded-full" style="width:${d.progress || 0}%"></div></div><span class="text-xs text-gray-400">${d.progress || 0}%</span></td>
          <td><span class="badge badge-yellow">${d.status || 'queued'}</span></td>
          <td><button class="btn btn-ghost btn-sm text-red-400" onclick="DownloadsComponent.cancel('${d.id}')">Cancel</button></td>
        </tr>`).join('');
      }
    } catch (e) {}
  },

  async cancel(id) {
    try { await API.cancelDownload(id); Notifications.info('Download cancelled'); this.load(); }
    catch (e) { Notifications.error('Failed to cancel'); }
  },

  setupListeners() {
    WS.on('download_update', () => this.load());
    WS.on('download_complete', (data) => {
      this.load();
      Notifications.success('Downloaded: ' + (data?.name || 'file'));
    });
  }
};
