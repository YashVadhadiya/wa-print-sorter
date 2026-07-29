const downloadsFolderInput = document.getElementById('downloadsFolder');
const browseBtn = document.getElementById('browseBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const qrImage = document.getElementById('qrImage');
const qrPlaceholder = document.getElementById('qrPlaceholder');
const logsContainer = document.getElementById('logsContainer');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const connectionDetail = document.getElementById('connectionDetail');
const extensionsList = document.getElementById('extensionsList');
const updateBanner = document.getElementById('updateBanner');
const updateText = document.getElementById('updateText');
const updateProgress = document.getElementById('updateProgress');

async function init() {
  try {
    const config = await window.api.getConfig();
    downloadsFolderInput.value = config.downloadsDir;

    const exts = await window.api.getSupportedExtensions();
    extensionsList.textContent = exts.join(', ');

    const logPath = await window.api.getLogPath();
    addLog('info', `Logs directory: ${logPath}`);
    addLog('info', 'Waiting for connection...');
    
    await window.api.startService();
  } catch (error) {
    addLog('error', `Failed to start: ${error.message}`);
    setStatus('disconnected');
  }
}

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  addLog('info', 'Connecting with new session...');
  try {
    await window.api.startService(true);
  } catch (error) {
    addLog('error', `Failed to connect: ${error.message}`);
    startBtn.disabled = false;
  }
});

browseBtn.addEventListener('click', async () => {
  const folder = await window.api.selectFolder();
  if (folder) {
    await window.api.setDownloadsFolder(folder);
    downloadsFolderInput.value = folder;
    addLog('info', `Downloads folder set to: ${folder}`);
  }
});

openFolderBtn.addEventListener('click', () => {
  window.api.openFolder(downloadsFolderInput.value);
});

stopBtn.addEventListener('click', async () => {
  stopBtn.disabled = true;
  try {
    await window.api.stopService();
    setStatus('disconnected');
  } catch (error) {
    addLog('error', `Failed to stop: ${error.message}`);
  }
});

clearLogsBtn.addEventListener('click', () => {
  logsContainer.innerHTML = '';
});

function setStatus(status, text) {
  statusDot.className = 'status-dot ' + status;

  const statusTexts = {
    connected: 'Connected',
    connecting: 'Connecting...',
    reconnecting: 'Reconnecting...',
    disconnected: 'Disconnected',
    logged_out: 'Logged Out',
    waiting: 'Waiting for scan...',
    error: 'Error'
  };

  statusText.textContent = text || statusTexts[status] || status;

  if (status === 'connected') {
    startBtn.style.display = 'none';
    stopBtn.disabled = false;
  } else if (status === 'disconnected' || status === 'logged_out') {
    startBtn.style.display = 'block';
    startBtn.disabled = false;
    stopBtn.disabled = true;
  } else {
    startBtn.style.display = 'none';
  }
}

function addLog(level, message, data = {}) {
  const entry = document.createElement('div');
  entry.className = `log-entry ${level}`;

  const time = new Date().toLocaleTimeString();
  let fullMessage = message;

  if (data && Object.keys(data).length > 0) {
    const meta = Object.entries(data)
      .filter(([k]) => k !== 'ts' && k !== 'level')
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    if (meta) fullMessage += ` (${meta})`;
  }

  entry.innerHTML = `<span class="time">${time}</span>${fullMessage}`;
  logsContainer.appendChild(entry);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

function renderQR(dataUrl) {
  qrPlaceholder.classList.add('hidden');
  qrImage.classList.remove('hidden');
  qrImage.src = dataUrl;
}

window.api.onLog((data) => {
  addLog(data.level, data.message, data.data);
});

window.api.onQR((qr) => {
  renderQR(qr);
});

window.api.onStatus((data) => {
  const { status, detail } = data;
  setStatus(status);

  if (status === 'connected') {
    qrImage.classList.add('hidden');
    qrPlaceholder.classList.remove('hidden');
    qrPlaceholder.querySelector('p').textContent = 'Connected!';
  } else if (status === 'logged_out') {
    qrPlaceholder.querySelector('p').textContent = 'Session expired. New QR code generating...';
    qrImage.classList.add('hidden');
    qrPlaceholder.classList.remove('hidden');
  } else if (status === 'waiting') {
    qrPlaceholder.querySelector('p').textContent = 'Waiting for QR scan...';
  } else if (status === 'reconnecting') {
    qrPlaceholder.querySelector('p').textContent = 'Reconnecting...';
  } else if (status === 'connecting') {
    qrPlaceholder.querySelector('p').textContent = 'Scan QR code with WhatsApp to connect';
  }

  if (detail) {
    connectionDetail.textContent = detail;
  } else {
    connectionDetail.textContent = '';
  }
});

window.api.onUpdateStatus((data) => {
  if (data.status === 'available') {
    updateBanner.classList.remove('hidden');
    updateBanner.className = 'update-banner update-available';
    updateText.textContent = `Update v${data.version} available — downloading...`;
  } else if (data.status === 'downloading') {
    updateBanner.classList.remove('hidden');
    updateBanner.className = 'update-banner update-downloading';
    updateText.textContent = `Downloading update${data.progress != null ? ` (${data.progress}%)` : ''}...`;
    if (data.progress != null) {
      updateProgress.textContent = `${data.progress}%`;
    }
  } else if (data.status === 'downloaded') {
    updateBanner.classList.remove('hidden');
    updateBanner.className = 'update-banner update-downloaded';
    updateText.textContent = `Update v${data.version} downloaded — restarting...`;
    updateProgress.textContent = '';
  }
});

init();
