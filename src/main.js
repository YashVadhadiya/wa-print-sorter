import path from 'node:path';
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import { autoUpdater } from 'electron-updater';
import QRCode from 'qrcode';
import { ensureDir } from './utils/files.js';
import { AppLogger } from './logger.js';
import { IndexStore } from './storage/indexStore.js';
import { startWhatsAppService, printableExtensions } from './whatsapp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.APP_ROOT = path.join(__dirname, '..');
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

process.on('uncaughtException', async (error) => {
  if (logger) await logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  app.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  if (logger) await logger.error('Unhandled rejection', { reason: String(reason) });
});

let mainWindow = null;
let logger = null;
let store = null;
let whatsappService = null;
let config = null;
let isConnecting = false;
let isDisconnecting = false;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function getDefaultPaths() {
  const userDataPath = app.getPath('userData');
  return {
    downloadsDir: path.join(app.getPath('downloads'), 'WhatsApp Print Sorter'),
    authDir: path.join(userDataPath, 'auth'),
    storageDir: path.join(userDataPath, 'storage'),
    logsDir: path.join(userDataPath, 'logs'),
    appName: 'WhatsApp Print Sorter',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    processedIndexFile: 'processed.json',
    maxRetries: 3,
    retryDelayMs: 1500,
    enablePairingCode: false,
    pairingNumber: ''
  };
}

function loadConfig() {
  const defaults = getDefaultPaths();
  config = defaults;
  return config;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    minWidth: 700,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  await mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
}

async function initLogger() {
  await ensureDir(config.logsDir);
  logger = new AppLogger(config.logsDir);
  await logger.init();
  logger.onLog = (level, message, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('log', { level, message, data });
    }
  };
}

async function initStore() {
  const storePath = path.join(config.storageDir, config.processedIndexFile);
  await ensureDir(config.storageDir);
  store = new IndexStore(storePath, logger);
  await store.init();
}

import { rm, readdir, unlink, stat } from 'node:fs/promises';

async function clearAuth(authDir) {
  try {
    const files = await readdir(authDir);
    for (const file of files) {
      await rm(path.join(authDir, file), { recursive: true, force: true });
    }
  } catch (err) { }
}

async function cleanupTempFiles(downloadsDir) {
  try {
    const entries = await readdir(downloadsDir);
    for (const entry of entries) {
      const folderPath = path.join(downloadsDir, entry);
      try {
        const statInfo = await stat(folderPath);
        if (statInfo.isDirectory()) {
          const files = await readdir(folderPath);
          for (const file of files) {
            if (file.endsWith('.part')) {
              await unlink(path.join(folderPath, file)).catch(() => {});
            }
          }
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

let wasConnectedBefore = false;

async function startService(forceNewSession = false) {
  if (isConnecting || isDisconnecting) {
    await logger.info('Already connecting/disconnecting, skipping...');
    return;
  }

  if (forceNewSession || wasConnectedBefore) {
    await clearAuth(config.authDir);
    await logger.info('Clearing auth for fresh session...');
    wasConnectedBefore = false;
  }

  isConnecting = true;
  await logger.info('Starting WhatsApp service...');
  sendStatus('connecting');

  try {
    whatsappService = await startWhatsAppService({
      config,
      logger,
      store,
      onQR: (qr) => {
        sendQR(qr);
      },
      onConnectionChange: (status, user) => {
        sendStatus(status, user);
        if (status === 'connected') {
          isConnecting = false;
          wasConnectedBefore = true;
        } else if (status === 'disconnected' || status === 'logged_out') {
          isConnecting = false;
        }
      }
    });
  } catch (error) {
    await logger.error('Failed to start WhatsApp service', { error: error.message });
    sendStatus('error', error.message);
    isConnecting = false;
  }
}

async function stopService() {
  if (!whatsappService || isDisconnecting) return;

  isDisconnecting = true;
  try {
    if (whatsappService.disconnect) {
      await whatsappService.disconnect();
    }

    await clearAuth(config.authDir);
    wasConnectedBefore = false;

    whatsappService = null;
    isConnecting = false;
    sendStatus('disconnected');
    await logger.info('WhatsApp service stopped, auth cleared');
  } finally {
    isDisconnecting = false;
  }
}

function sendQR(qr) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    QRCode.toDataURL(qr, { width: 200, margin: 1 })
      .then((dataUrl) => {
        mainWindow.webContents.send('qr', dataUrl);
      })
      .catch((err) => {
        console.error('QR generation error:', err);
      });
  }
}

function sendStatus(status, detail = null) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('status', { status, detail });
  }
}

async function fetchRemoteVersion() {
  try {
    const url = 'https://raw.githubusercontent.com/YashVadhadiya/wa-print-sorter/main/version.json';
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (Array.isArray(data.waVersion) && data.waVersion.length === 3) {
      return data.waVersion;
    }
  } catch (err) {
    console.error('Failed to fetch remote version:', err);
  }
  return null;
}

function setupAutoUpdater() {
  autoUpdater.on('update-available', async (info) => {
    await logger.info('Update available', { version: info.version });

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
    }

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available.`,
      detail: 'Would you like to download and install it now?',
      buttons: ['Update Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', { status: 'downloading' });
      }
      autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    const pct = Math.round(progress.percent);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'downloading', progress: pct });
    }
  });

  autoUpdater.on('update-downloaded', async (info) => {
    await logger.info('Update downloaded', { version: info.version });

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'downloaded', version: info.version });
    }

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Update ${info.version} has been downloaded.`,
      detail: 'The app will restart to install the update.',
      buttons: ['Restart Now'],
      defaultId: 0
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', async (error) => {
    if (logger) await logger.warn('Auto-update error', { error: error.message });
  });

  autoUpdater.on('update-not-available', () => {
    if (logger) logger.info('App is up to date');
  });
}

ipcMain.handle('get-config', async () => {
  return config;
});

ipcMain.handle('check-update', async () => {
  try {
    autoUpdater.checkForUpdates();
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('set-downloads-folder', async (event, folderPath) => {
  if (!folderPath || typeof folderPath !== 'string') return false;

  const normalizedPath = path.normalize(folderPath);
  if (normalizedPath.includes('..')) return false;

  config.downloadsDir = normalizedPath;
  await ensureDir(normalizedPath);
  return true;
});

ipcMain.handle('select-folder', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript('document.body.style.cursor="wait"');
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript('document.body.style.cursor="default"');
  }

  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('start-service', async (event, forceNewSession = false) => {
  await startService(forceNewSession);
  return true;
});

ipcMain.handle('stop-service', async () => {
  await stopService();
  return true;
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  if (folderPath) {
    shell.openPath(folderPath);
  }
  return true;
});

ipcMain.handle('get-log-path', async () => {
  return config.logsDir;
});

ipcMain.handle('get-supported-extensions', async () => {
  return [...printableExtensions].sort();
});

app.whenReady().then(async () => {
  loadConfig();

  await ensureDir(config.downloadsDir);
  await ensureDir(config.authDir);
  await ensureDir(config.storageDir);
  await ensureDir(config.logsDir);

  await cleanupTempFiles(config.downloadsDir);

  await initLogger();
  await initStore();

  const remoteVersion = await fetchRemoteVersion();
  if (remoteVersion) {
    config.waVersion = remoteVersion;
    await logger.info('Remote WhatsApp version loaded', { version: remoteVersion.join('.') });
  }

  await logger.info('Application started', {
    downloadsDir: config.downloadsDir,
    authDir: config.authDir,
    storageDir: config.storageDir,
    logsDir: config.logsDir
  });

  await createWindow();

  setupAutoUpdater();
  autoUpdater.checkForUpdates().catch(() => {});
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    if (whatsappService?.disconnect) {
      await whatsappService.disconnect();
      whatsappService = null;
    }
    if (logger) {
      logger.onLog = null;
      await logger.warn('Application closed');
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
