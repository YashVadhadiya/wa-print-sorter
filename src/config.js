import dotenv from 'dotenv';

dotenv.config();

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(value).trim().toLowerCase());
}

function toNumber(value, defaultValue) {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
}

export const config = {
  appName: process.env.APP_NAME || 'StationeryPrintBot',
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',

  downloadsDir: process.env.DOWNLOADS_DIR || 'downloads',
  authDir: process.env.AUTH_DIR || 'auth',
  storageDir: process.env.STORAGE_DIR || 'storage',
  logsDir: process.env.LOGS_DIR || 'logs',
  processedIndexFile: process.env.PROCESSED_INDEX_FILE || 'processed.json',

  maxRetries: toNumber(process.env.MAX_RETRIES, 3),
  retryDelayMs: toNumber(process.env.RETRY_DELAY_MS, 1500),
  skipDuplicateHashes: toBool(process.env.SKIP_DUPLICATE_HASHES, true),

  enablePairingCode: toBool(process.env.ENABLE_PAIRING_CODE, false),
  pairingNumber: (process.env.PAIRING_NUMBER || '').replace(/\D/g, '')
};

export function validateConfig(cfg = config) {
  if (!cfg.downloadsDir) throw new Error('DOWNLOADS_DIR is required');
  if (!cfg.authDir) throw new Error('AUTH_DIR is required');
  if (!cfg.storageDir) throw new Error('STORAGE_DIR is required');
  if (!cfg.logsDir) throw new Error('LOGS_DIR is required');
  if (!cfg.appName) throw new Error('APP_NAME is required');
  if (cfg.maxRetries < 1) throw new Error('MAX_RETRIES must be at least 1');
  if (cfg.retryDelayMs < 0) throw new Error('RETRY_DELAY_MS cannot be negative');

  if (cfg.enablePairingCode && !cfg.pairingNumber) {
    throw new Error('PAIRING_NUMBER is required when ENABLE_PAIRING_CODE=true');
  }
}
