import path from 'node:path';
import { config, validateConfig } from './config.js';
import { AppLogger } from './logger.js';
import { IndexStore } from './storage/indexStore.js';
import { ensureDir } from './utils/files.js';
import { startWhatsAppService } from './whatsapp.js';

async function main() {
  validateConfig(config);

  await Promise.all([
    ensureDir(config.downloadsDir),
    ensureDir(config.authDir),
    ensureDir(config.storageDir),
    ensureDir(config.logsDir)
  ]);

  const logger = new AppLogger(config.logsDir);
  await logger.init();

  const storePath = path.join(config.storageDir, config.processedIndexFile);
  const store = new IndexStore(storePath);
  await store.init();

  await logger.info('Starting WhatsApp file downloader', {
    appName: config.appName,
    downloadsDir: config.downloadsDir,
    authDir: config.authDir,
    storageDir: config.storageDir,
    timezone: config.timezone
  });

  await startWhatsAppService({ config, logger, store });

  process.on('SIGINT', async () => {
    await logger.warn('Shutting down on SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await logger.warn('Shutting down on SIGTERM');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
