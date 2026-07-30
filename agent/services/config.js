const fs = require('fs');
const path = require('path');

const Config = {
  _data: {},

  load() {
    const configPath = path.join(__dirname, '..', 'config', 'default.json');
    const userConfigPath = path.join(__dirname, '..', 'config', 'user.json');
    try {
      this._data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (fs.existsSync(userConfigPath)) {
        const user = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
        this._deepMerge(this._data, user);
      }
    } catch (e) {
      console.error('Config load error:', e.message);
      this._data = {};
    }
  },

  _deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this._deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  },

  get(key, defaultValue = undefined) {
    const keys = key.split('.');
    let val = this._data;
    for (const k of keys) {
      if (val === undefined || val === null) return defaultValue;
      val = val[k];
    }
    return val !== undefined && val !== null ? val : defaultValue;
  },

  set(key, value) {
    const keys = key.split('.');
    let obj = this._data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this.saveUser();
  },

  getAll() {
    return JSON.parse(JSON.stringify(this._data));
  },

  saveUser() {
    const userConfigPath = path.join(__dirname, '..', 'config', 'user.json');
    try {
      fs.writeFileSync(userConfigPath, JSON.stringify(this._data, null, 2));
    } catch (e) {
      console.error('Failed to save user config:', e.message);
    }
  }
};

module.exports = Config;
