import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { ensureDir } from '../utils/files.js';

export class IndexStore {
  constructor(filePath, logger = null) {
    this.filePath = filePath;
    this.logger = logger;
    this.data = {
      processedMessages: {}
    };
    this.persistQueue = Promise.resolve();
    this.maxEntries = 50000;
  }

  async init() {
    await ensureDir(path.dirname(this.filePath));
    await this.load();
  }

  async load() {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON structure');
      }

      this.data = {
        processedMessages: parsed.processedMessages || {}
      };
    } catch (error) {
      if (error.code !== 'ENOENT') {
        if (this.logger) await this.logger.warn('Corrupted processed.json, resetting');
      }
      this.data = { processedMessages: {} };
      await this.save();
    }
  }

  hasMessage(signature) {
    return Boolean(this.data.processedMessages[signature]);
  }

  async cleanupOldEntries() {
    const entries = Object.keys(this.data.processedMessages);
    if (entries.length <= this.maxEntries) return;

    const sorted = entries.sort((a, b) => {
      const dateA = this.data.processedMessages[a]?.createdAt || '';
      const dateB = this.data.processedMessages[b]?.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    const toKeep = sorted.slice(0, this.maxEntries);
    const toRemove = sorted.slice(this.maxEntries);

    for (const key of toRemove) {
      delete this.data.processedMessages[key];
    }

    await this.save();
    if (this.logger) await this.logger.info(`Cleaned up ${toRemove} old message records`);
  }

  async markProcessed(record) {
    this.data.processedMessages[record.signature] = record;
    await this.save();
    await this.cleanupOldEntries();
  }

  async save() {
    const json = JSON.stringify(this.data, null, 2);
    const tempPath = `${this.filePath}.tmp`;

    this.persistQueue = this.persistQueue.then(async () => {
      await writeFile(tempPath, json, 'utf8');

      try {
        await rename(tempPath, this.filePath);
      } catch {
        await writeFile(this.filePath, json, 'utf8');
        await unlink(tempPath).catch(() => {});
      }
    });

    return this.persistQueue;
  }
}
