const SettingsComponent = {
  render() {
    const config = API.getConfig();
    return `
      <div class="max-w-3xl space-y-6">
        <div class="card">
          <div class="card-header"><h3 class="font-semibold text-white">Agent Connection</h3></div>
          <div class="card-body space-y-4">
            <div><label class="text-sm text-gray-400 block mb-1">Agent API URL</label><input type="text" id="setting-api-url" class="input-field" value="${config.apiUrl || 'http://localhost:4545'}" placeholder="http://localhost:4545"></div>
            <div><label class="text-sm text-gray-400 block mb-1">Auth Token (optional)</label><input type="password" id="setting-token" class="input-field" value="${config.token || ''}" placeholder="Leave empty if not set"></div>
            <button class="btn btn-primary" onclick="SettingsComponent.saveConnection()">Save & Reconnect</button>
            <button class="btn btn-secondary ml-2" onclick="SettingsComponent.testConnection()">Test Connection</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="font-semibold text-white">Download Settings</h3></div>
          <div class="card-body space-y-4">
            <div><label class="text-sm text-gray-400 block mb-1">Download Folder</label><input type="text" id="setting-download-path" class="input-field" placeholder="Default: ./data/downloads"></div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="text-sm text-gray-400 block mb-1">Max File Size (MB)</label><input type="number" id="setting-max-size" class="input-field" value="1024"></div>
              <div><label class="text-sm text-gray-400 block mb-1">Max Retries</label><input type="number" id="setting-max-retries" class="input-field" value="3"></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="font-semibold text-white">Notifications</h3></div>
          <div class="card-body space-y-3">
            <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" id="setting-notif-desktop" class="w-4 h-4 accent-cyan-500" checked><span class="text-gray-300">Desktop Notifications</span></label>
            <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" id="setting-notif-sound" class="w-4 h-4 accent-cyan-500" checked><span class="text-gray-300">Sound Notifications</span></label>
            <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" id="setting-notif-dashboard" class="w-4 h-4 accent-cyan-500" checked><span class="text-gray-300">Dashboard Notifications</span></label>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="font-semibold text-white">Agent Settings</h3></div>
          <div class="card-body space-y-4">
            <div><label class="text-sm text-gray-400 block mb-1">Log Level</label><select id="setting-log-level" class="input-field w-32"><option value="debug">Debug</option><option value="info" selected>Info</option><option value="warn">Warning</option><option value="error">Error</option></select></div>
            <div><label class="text-sm text-gray-400 block mb-1">Auto Startup</label><select id="setting-auto-startup" class="input-field w-32"><option value="true">Enabled</option><option value="false">Disabled</option></select></div>
            <button class="btn btn-primary" onclick="SettingsComponent.saveAgent()">Save Agent Settings</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="font-semibold text-white">About PrintHub</h3></div>
          <div class="card-body">
            <p class="text-gray-400 text-sm">PrintHub v1.0.0 — WhatsApp Print Automation Platform</p>
            <p class="text-gray-500 text-sm mt-1">Dashboard is running as a static site. Connect to the Local Print Agent to manage your print shop.</p>
          </div>
        </div>
      </div>
    `;
  },

  saveConnection() {
    const url = document.getElementById('setting-api-url').value.trim();
    const token = document.getElementById('setting-token').value.trim();
    if (!url) { Notifications.error('API URL is required'); return; }
    API.saveConfig({ apiUrl: url, token });
    WS.disconnect();
    WS.connect();
    Notifications.success('Settings saved. Reconnecting...');
  },

  async testConnection() {
    const url = document.getElementById('setting-api-url').value.trim();
    if (!url) { Notifications.error('Enter a URL first'); return; }
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Testing...';
    try {
      const res = await fetch(url + '/api/agent/status', { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        Notifications.success('Connected successfully!');
      } else {
        Notifications.error('Agent returned status ' + res.status);
      }
    } catch (e) {
      Notifications.error('Cannot reach agent: ' + e.message);
    }
    btn.disabled = false;
    btn.textContent = 'Test Connection';
  },

  async saveAgent() {
    try {
      const settings = {
        logLevel: document.getElementById('setting-log-level').value,
        autoStartup: document.getElementById('setting-auto-startup').value === 'true',
        downloadPath: document.getElementById('setting-download-path').value || undefined,
        maxFileSize: parseInt(document.getElementById('setting-max-size').value) * 1048576,
        maxRetries: parseInt(document.getElementById('setting-max-retries').value),
        notifications: {
          desktop: document.getElementById('setting-notif-desktop').checked,
          sound: document.getElementById('setting-notif-sound').checked,
          dashboard: document.getElementById('setting-notif-dashboard').checked
        }
      };
      await API.updateSettings(settings);
      Notifications.success('Agent settings saved');
    } catch (e) {
      Notifications.error('Failed to save settings: ' + e.message);
    }
  },

  setupListeners() {}
};
