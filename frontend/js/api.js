const API = (() => {
  const CONFIG_KEY = 'printhub_config';
  let baseURL = 'http://localhost:4545';
  let authToken = '';

  function loadConfig() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        const cfg = JSON.parse(saved);
        baseURL = cfg.apiUrl || baseURL;
        authToken = cfg.token || '';
      }
    } catch (e) {}
  }
  loadConfig();

  function saveConfig(updates) {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
      Object.assign(saved, updates);
      localStorage.setItem(CONFIG_KEY, JSON.stringify(saved));
      if (updates.apiUrl) baseURL = updates.apiUrl;
      if (updates.token) authToken = updates.token;
    } catch (e) {}
  }

  function getConfig() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); }
    catch { return {}; }
  }

  async function request(endpoint, options = {}) {
    const url = baseURL.replace(/\/+$/, '') + '/' + endpoint.replace(/^\/+/, '');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

    try {
      const res = await fetch(url, { ...options, headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        const errBody = await res.text();
        let msg;
        try { msg = JSON.parse(errBody).error || errBody; } catch { msg = errBody || res.statusText; }
        throw new Error(msg || 'Request failed');
      }
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch (err) {
      if (err.name === 'TimeoutError') throw new Error('Request timed out');
      if (err.name === 'AbortError') throw new Error('Request cancelled');
      throw err;
    }
  }

  return {
    getConfig, saveConfig,

    async get(endpoint) { return request(endpoint); },
    async post(endpoint, data) { return request(endpoint, { method: 'POST', body: JSON.stringify(data) }); },
    async put(endpoint, data) { return request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); },
    async del(endpoint) { return request(endpoint, { method: 'DELETE' }); },

    getBaseURL() { return baseURL; },

    // Dashboard
    getStats() { return this.get('api/stats'); },
    getRecentActivity() { return this.get('api/activity?limit=20'); },

    // Customers
    getCustomers() { return this.get('api/customers'); },
    getCustomer(id) { return this.get('api/customers/' + id); },
    updateCustomer(id, data) { return this.put('api/customers/' + id, data); },
    deleteCustomer(id) { return this.del('api/customers/' + id); },
    searchCustomers(q) { return this.get('api/customers/search?q=' + encodeURIComponent(q)); },

    // Files
    getFiles(params = {}) {
      const q = new URLSearchParams();
      if (params.customer) q.set('customer', params.customer);
      if (params.date) q.set('date', params.date);
      if (params.ext) q.set('ext', params.ext);
      if (params.page) q.set('page', params.page);
      if (params.limit) q.set('limit', params.limit);
      return this.get('api/files?' + q.toString());
    },
    getTodayFiles() { return this.get('api/files/today'); },
    getFileInfo(id) { return this.get('api/files/' + id); },
    deleteFile(id) { return this.del('api/files/' + id); },

    // Downloads
    getDownloads() { return this.get('api/downloads'); },
    getDownloadQueue() { return this.get('api/downloads/queue'); },
    retryDownload(id) { return this.post('api/downloads/' + id + '/retry'); },
    cancelDownload(id) { return this.post('api/downloads/' + id + '/cancel'); },

    // Print Queue
    getPrintQueue() { return this.get('api/print'); },
    addToPrint(fileIds) { return this.post('api/print', { fileIds }); },
    updatePrintStatus(id, status) { return this.put('api/print/' + id, { status }); },
    removeFromPrint(id) { return this.del('api/print/' + id); },

    // Statistics
    getStatistics() { return this.get('api/statistics'); },

    // Logs
    getLogs(params = {}) {
      const q = new URLSearchParams();
      if (params.level) q.set('level', params.level);
      if (params.limit) q.set('limit', params.limit);
      if (params.offset) q.set('offset', params.offset);
      return this.get('api/logs?' + q.toString());
    },

    // Settings
    getSettings() { return this.get('api/settings'); },
    updateSettings(data) { return this.put('api/settings', data); },

    // Agent
    getAgentStatus() { return this.get('api/agent/status'); },
    restartAgent() { return this.post('api/agent/restart'); },
    getWhatsAppStatus() { return this.get('api/whatsapp/status'); },
    getWhatsAppQR() { return this.get('api/whatsapp/qr'); },
    logoutWhatsApp() { return this.post('api/whatsapp/logout'); },

    // Search
    search(query) { return this.get('api/search?q=' + encodeURIComponent(query)); }
  };
})();
