const DashboardComponent = {
  render() {
    return `
      <div class="grid-dashboard mb-6">
        <div class="widget">
          <div class="flex items-center justify-between">
            <span class="stat-label">Today's Files</span>
            <span class="text-cyan-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg></span>
          </div>
          <div class="stat-value" id="stat-today-files">0</div>
          <div class="stat-label">files received today</div>
        </div>
        <div class="widget">
          <div class="flex items-center justify-between">
            <span class="stat-label">Customers</span>
            <span class="text-blue-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg></span>
          </div>
          <div class="stat-value" id="stat-customers">0</div>
          <div class="stat-label">total customers</div>
        </div>
        <div class="widget">
          <div class="flex items-center justify-between">
            <span class="stat-label">Pending Prints</span>
            <span class="text-yellow-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg></span>
          </div>
          <div class="stat-value" id="stat-pending-prints">0</div>
          <div class="stat-label">waiting to print</div>
        </div>
        <div class="widget">
          <div class="flex items-center justify-between">
            <span class="stat-label">Downloads Today</span>
            <span class="text-green-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg></span>
          </div>
          <div class="stat-value" id="stat-downloads-today">0</div>
          <div class="stat-label">files downloaded</div>
        </div>
        <div class="widget">
          <div class="flex items-center justify-between">
            <span class="stat-label">Storage Used</span>
            <span class="text-purple-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></span>
          </div>
          <div class="stat-value" id="stat-storage">0 B</div>
          <div class="stat-label" id="stat-storage-detail">used</div>
        </div>
        <div class="widget">
          <div class="flex items-center justify-between">
            <span class="stat-label">WhatsApp</span>
            <span class="text-green-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg></span>
          </div>
          <div class="stat-value" id="stat-whatsapp-status">N/A</div>
          <div class="stat-label" id="stat-whatsapp-detail">status unknown</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="table-widget">
          <div class="card-header"><h3 class="font-semibold text-white">Recent Files</h3><a href="#" class="text-sm text-cyan-400 hover:underline" data-route="files">View All</a></div>
          <div class="overflow-x-auto"><table><thead><tr><th>File</th><th>Customer</th><th>Size</th><th>Time</th></tr></thead><tbody id="recent-files-tbody"><tr><td colspan="4" class="text-center text-gray-500 py-8">No files yet</td></tr></tbody></table></div>
        </div>
        <div class="table-widget">
          <div class="card-header"><h3 class="font-semibold text-white">Recent Activity</h3></div>
          <div class="overflow-x-auto"><table><thead><tr><th>Event</th><th>Detail</th><th>Time</th></tr></thead><tbody id="activity-tbody"><tr><td colspan="3" class="text-center text-gray-500 py-8">No activity yet</td></tr></tbody></table></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="widget lg:col-span-2">
          <h3 class="font-semibold text-white mb-4">Quick Actions</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button class="btn btn-secondary flex-col gap-1 py-4" onclick="Router.navigate('customers')"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg><span class="text-xs">Customers</span></button>
            <button class="btn btn-secondary flex-col gap-1 py-4" onclick="Router.navigate('print-queue')"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg><span class="text-xs">Print Queue</span></button>
            <button class="btn btn-secondary flex-col gap-1 py-4" onclick="Router.navigate('settings')"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg><span class="text-xs">Settings</span></button>
            <button class="btn btn-secondary flex-col gap-1 py-4" onclick="WS.send('check_messages')"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg><span class="text-xs">Sync Now</span></button>
          </div>
        </div>
        <div class="widget">
          <h3 class="font-semibold text-white mb-4">Agent Health</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center"><span class="text-gray-400 text-sm">Status</span><span class="text-green-400 text-sm font-medium" id="health-status">Checking...</span></div>
            <div class="flex justify-between items-center"><span class="text-gray-400 text-sm">Uptime</span><span class="text-gray-300 text-sm" id="health-uptime">-</span></div>
            <div class="flex justify-between items-center"><span class="text-gray-400 text-sm">Memory</span><span class="text-gray-300 text-sm" id="health-memory">-</span></div>
            <div class="flex justify-between items-center"><span class="text-gray-400 text-sm">CPU</span><span class="text-gray-300 text-sm" id="health-cpu">-</span></div>
            <div class="flex justify-between items-center"><span class="text-gray-400 text-sm">WhatsApp</span><span class="text-gray-300 text-sm" id="health-whatsapp">-</span></div>
          </div>
        </div>
      </div>
    `;
  },

  async load() {
    try {
      const stats = await API.getStats();
      document.getElementById('stat-today-files').textContent = stats.todayFiles || 0;
      document.getElementById('stat-customers').textContent = stats.totalCustomers || 0;
      document.getElementById('stat-pending-prints').textContent = stats.pendingPrints || 0;
      document.getElementById('stat-downloads-today').textContent = stats.downloadsToday || 0;
      document.getElementById('stat-storage').textContent = Formatters.fileSize(stats.storageUsed || 0);
      document.getElementById('stat-storage-detail').textContent = 'of ' + Formatters.fileSize(stats.storageTotal || 0) + ' used';
      document.getElementById('stat-whatsapp-status').textContent = stats.whatsappStatus || 'N/A';
    } catch (e) {
      document.getElementById('stat-today-files').textContent = '--';
    }

    try {
      const files = await API.getTodayFiles();
      const tbody = document.getElementById('recent-files-tbody');
      if (files.length > 0) {
        tbody.innerHTML = files.slice(0, 10).map(f => `
          <tr>
            <td class="flex items-center gap-2">
              <span class="file-icon ${Formatters.fileCategory(Formatters.ext(f.name))}">${Formatters.ext(f.name).toUpperCase().slice(0, 2) || '?'}</span>
              <span class="truncate max-w-[180px]">${Formatters.truncate(f.name, 25)}</span>
            </td>
            <td>${f.customerName || f.customer || '-'}</td>
            <td>${Formatters.fileSize(f.size)}</td>
            <td class="text-sm text-gray-500">${Formatters.timeAgo(f.timestamp || f.date)}</td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500 py-8">No files yet today</td></tr>';
      }
    } catch (e) {}

    try {
      const activity = await API.getRecentActivity();
      const tbody = document.getElementById('activity-tbody');
      if (activity.length > 0) {
        tbody.innerHTML = activity.slice(0, 15).map(a => `
          <tr><td class="capitalize">${a.type || a.event}</td><td class="truncate max-w-[200px]">${a.detail || a.message || '-'}</td><td class="text-sm text-gray-500">${Formatters.timeAgo(a.timestamp)}</td></tr>
        `).join('');
      }
    } catch (e) {}

    try {
      const status = await API.getAgentStatus();
      document.getElementById('health-status').textContent = status.status || 'Unknown';
      document.getElementById('health-status').className = 'text-sm font-medium ' + (status.status === 'running' ? 'text-green-400' : 'text-red-400');
      document.getElementById('health-uptime').textContent = status.uptime || '-';
      document.getElementById('health-memory').textContent = status.memory || '-';
      document.getElementById('health-cpu').textContent = status.cpu || '-';
      document.getElementById('health-whatsapp').textContent = status.whatsapp || '-';
    } catch (e) {}
  },

  setupListeners() {
    WS.on('new_file', (data) => {
      DashboardComponent.load();
    });
    WS.on('download_complete', () => DashboardComponent.load());
    WS.on('stats_update', (data) => {
      if (data) {
        Object.keys(data).forEach(key => {
          const el = document.getElementById('stat-' + key);
          if (el) el.textContent = data[key];
        });
      }
    });
  }
};
