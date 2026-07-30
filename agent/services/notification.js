const path = require('path');
const Config = require('./config');
const Logger = require('./logger');

const NotificationService = {
  _initialized: false,
  _notifier: null,

  init() {
    try {
      this._notifier = require('node-notifier');
      this._initialized = true;
    } catch (e) {
      Logger.warn('Desktop notifications not available (node-notifier not found)');
      this._initialized = false;
    }
  },

  show(title, message, type = 'info') {
    if (Config.get('notifications.desktop', true) && this._initialized && this._notifier) {
      try {
        this._notifier.notify({
          title: 'PrintHub - ' + title,
          message: message,
          sound: type === 'error',
          wait: false
        });
      } catch (e) {}
    }

    if (Config.get('notifications.sound', true)) {
      this._playSound(type);
    }
  },

  _playSound(type) {
    try {
      if (typeof process.stdout.write === 'function') {
        process.stdout.write('\x07');
      }
    } catch (e) {}
  },

  fileDownloaded(fileName, customer) {
    this.show('File Downloaded', fileName + ' from ' + customer, 'info');
  },

  downloadFailed(fileName, error) {
    this.show('Download Failed', fileName + ': ' + error, 'error');
  },

  whatsappConnected() {
    this.show('WhatsApp Connected', 'WhatsApp is now connected and monitoring messages', 'info');
  },

  whatsappDisconnected() {
    this.show('WhatsApp Disconnected', 'WhatsApp connection lost', 'error');
  },

  printJobCompleted(jobName) {
    this.show('Print Complete', jobName + ' has been printed', 'info');
  },

  error(message) {
    this.show('Error', message, 'error');
  }
};

module.exports = NotificationService;
