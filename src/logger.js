import { appendFile, mkdir, stat, rename, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

export class AppLogger {
  constructor(logsDir) {
    this.logsDir = logsDir;
    this.logFile = path.join(logsDir, 'downloads.log');
    this.maxLogSize = 5 * 1024 * 1024;
    this.maxArchives = 5;
    this.writeQueue = Promise.resolve();
    this.onLog = null;
  }

  async init() {
    await mkdir(this.logsDir, { recursive: true });
    await this.checkRotation();
  }

  setOnLog(callback) {
    this.onLog = callback;
  }

  async debug(message, meta = {}) {
    return this._write('debug', message, meta);
  }

  async info(message, meta = {}) {
    return this._write('info', message, meta);
  }

  async warn(message, meta = {}) {
    return this._write('warn', message, meta);
  }

  async error(message, meta = {}) {
    return this._write('error', message, meta);
  }

  async checkRotation() {
    try {
      const stats = await stat(this.logFile);
      if (stats.size > this.maxLogSize) {
        await this.rotateLog();
      }
    } catch { /* file doesn't exist */ }
  }

  async rotateLog() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = this.logFile.replace('.log', `_${timestamp}.log`);
    await rename(this.logFile, archivePath);

    try {
      const files = (await readdir(this.logsDir)).filter(f => f.startsWith('downloads_') && f.endsWith('.log'));
      if (files.length > this.maxArchives) {
        const sorted = files.sort();
        const oldest = sorted[0];
        await unlink(path.join(this.logsDir, oldest));
      }
    } catch { /* ignore */ }
  }

  async _write(level, message, meta) {
    const entry = {
      ts: new Date().toISOString(),
      level,
      message,
      ...meta
    };

    const consoleLine = `[${entry.ts}] ${level.toUpperCase()}: ${message}`;
    if (level === 'error') console.error(consoleLine, meta);
    else if (level === 'warn') console.warn(consoleLine, meta);
    else if (level === 'debug') console.debug(consoleLine, meta);
    else console.log(consoleLine, meta);

    if (this.onLog) {
      this.onLog(level, message, meta);
    }

    this.writeQueue = this.writeQueue
      .then(async () => {
        await this.checkRotation();
        return appendFile(this.logFile, `${JSON.stringify(entry)}\n`, 'utf8');
      })
      .catch(() => {});

    return this.writeQueue;
  }
}
