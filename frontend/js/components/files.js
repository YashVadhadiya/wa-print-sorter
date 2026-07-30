const FilesComponent = {
  render() {
    return `
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div class="flex gap-2 flex-wrap">
          <input type="text" id="file-search-input" class="input-field w-48" placeholder="Search files...">
          <select id="file-type-filter" class="input-field w-36">
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="image">Images</option>
            <option value="doc">Documents</option>
            <option value="vector">Vector</option>
            <option value="archive">Archives</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="other">Other</option>
          </select>
          <select id="file-date-filter" class="input-field w-36">
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="FilesComponent.search()">Filter</button>
        </div>
      </div>
      <div class="table-widget">
        <table><thead><tr><th>File</th><th>Type</th><th>Customer</th><th>Size</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="files-tbody"><tr><td colspan="7" class="text-center text-gray-500 py-8">Loading files...</td></tr></tbody></table>
      </div>
    `;
  },

  async load(params) {
    try {
      const files = await API.getFiles(params || {});
      const tbody = document.getElementById('files-tbody');
      if (!files || files.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-gray-500 py-8">No files found</td></tr>';
        return;
      }
      tbody.innerHTML = files.map(f => {
        const ext = Formatters.ext(f.name);
        const cat = Formatters.fileCategory(ext);
        return `<tr>
          <td><div class="flex items-center gap-2"><span class="file-icon ${cat}">${ext.toUpperCase().slice(0,2) || '?'}</span><span class="truncate max-w-[200px]" title="${f.name}">${Formatters.truncate(f.name, 30)}</span></div></td>
          <td><span class="badge badge-blue uppercase">${ext || '?'}</span></td>
          <td>${f.customerName || f.customer || '-'}</td>
          <td>${Formatters.fileSize(f.size)}</td>
          <td class="text-sm">${Formatters.date(f.timestamp || f.date, 'short')}</td>
          <td><span class="badge ${f.status === 'downloaded' ? 'badge-green' : f.status === 'pending' ? 'badge-yellow' : 'badge-gray'}">${f.status || 'unknown'}</span></td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="FilesComponent.addToPrint('${f.id || f.name}')">Print</button>
            <button class="btn btn-ghost btn-sm text-red-400" onclick="FilesComponent.delete('${f.id || f.name}')">Delete</button>
          </td>
        </tr>`;
      }).join('');
    } catch (e) {
      document.getElementById('files-tbody').innerHTML = '<tr><td colspan="7" class="text-center text-red-400 py-8">Failed to load files</td></tr>';
    }
  },

  search() {
    const params = {};
    const q = document.getElementById('file-search-input').value.trim();
    const type = document.getElementById('file-type-filter').value;
    const date = document.getElementById('file-date-filter').value;
    if (q) params.q = q;
    if (type) params.ext = type;
    if (date) params.date = date;
    this.load(params);
  },

  async addToPrint(fileId) {
    try {
      await API.addToPrint([fileId]);
      Notifications.success('Added to print queue');
    } catch (e) {
      Notifications.error('Failed to add to queue');
    }
  },

  async delete(fileId) {
    if (!confirm('Delete this file?')) return;
    try {
      await API.deleteFile(fileId);
      Notifications.success('File deleted');
      this.load();
    } catch (e) {
      Notifications.error('Failed to delete file');
    }
  },

  setupListeners() {
    WS.on('file_update', () => this.load());
  }
};
