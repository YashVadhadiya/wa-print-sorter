const fs = require('fs');
const path = require('path');
const Config = require('./config');

const Logger = {
  _logDir: null,
  _todayLog: null,
  _stream: null,
  _maxSize: 10485760,

  init() {
    this._logDir = Config.get('logging.path', './data/logs');
    this._maxSize = Config.get('logging.maxSize', 10485760);
    try {
      if (!fs.existsSync(this._logDir)) fs.mkdirSync(this._logDir, { recursive: true });
    } catch (e) {}
    this._rotateLog();
    setInterval(() => this._rotateLog(), 3600000);
  },

  _rotateLog() {
    const today = new Date().toISOString().split('T')[0];
    if (this._todayLog === today && this._stream) return;
    this._todayLog = today;
    if (this._stream) {
      try { this._stream.end(); } catch (e) {}
    }
    const filePath = path.join(this._logDir, today + '.log');
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > this._maxSize) {
        const backup = filePath + '.' + Date.now();
        fs.renameSync(filePath, backup);
      }
    } catch (e) {}
    try {
      this._stream = fs.createWriteStream(filePath, { flags: 'a' });
    } catch (e) {}
  },

  _log(level, message, data) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message, data: data || null };

    const consoleMsg = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    switch (level) {
      case 'error': console.error('\x1b[31m' + consoleMsg + '\x1b[0m'); break;
      case 'warn': console.warn('\x1b[33m' + consoleMsg + '\x1b[0m'); break;
      case 'info': console.log('\x1b[36m' + consoleMsg + '\x1b[0m'); break;
      default: console.log(consoleMsg);
    }

    if (this._stream) {
      try { this._stream.write(JSON.stringify(entry) + '\n'); } catch (e) {}
    }

    const ws = require('./websocket');
    try { ws.broadcast('log', entry); } catch (e) {}

    this._rotateLog();
    return entry;
  },

  info(message, data) { return this._log('info', message, data); },
  warn(message, data) { return this._log('warn', message, data); },
  error(message, data) { return this._log('error', message, data); },
  debug(message, data) { if (Config.get('logging.level', 'info') === 'debug') this._log('debug', message, data); },

  async getLogs(options = {}) {
    const { level, limit = 100, offset = 0 } = options;
    const logs = [];
    const dir = this._logDir;
    if (!fs.existsSync(dir)) return logs;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.log')).sort().reverse().slice(0, 7);
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (!level || entry.level === level) logs.push(entry);
          } catch (e) {}
        }
      } catch (e) {}
    }
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return logs.slice(offset, offset + limit);
  }
};

Logger.init();
module.exports = Logger;
