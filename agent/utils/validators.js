const Validators = {
  isValidPhone(phone) {
    if (!phone) return false;
    return /^\+?\d{6,15}$/.test(phone.replace(/[-\s]/g, ''));
  },

  isValidExtension(ext) {
    if (!ext) return false;
    return /^\.?[a-zA-Z0-9]+$/.test(ext);
  },

  isValidFilename(name) {
    if (!name || name.length > 255) return false;
    return /^[^<>:"/\\|?*\x00-\x1f]+$/.test(name);
  },

  isValidStatus(status) {
    return ['pending', 'printing', 'printed', 'cancelled', 'downloading', 'completed', 'failed'].includes(status);
  },

  isValidDate(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d);
  },

  sanitize(value, maxLength = 1000) {
    if (!value) return '';
    return String(value).trim().substring(0, maxLength);
  },

  validateSettings(settings) {
    const errors = [];
    if (settings.port !== undefined && (settings.port < 1024 || settings.port > 65535)) {
      errors.push('Port must be between 1024 and 65535');
    }
    if (settings.maxFileSize !== undefined && settings.maxFileSize < 1) {
      errors.push('maxFileSize must be positive');
    }
    if (settings.maxRetries !== undefined && (settings.maxRetries < 0 || settings.maxRetries > 10)) {
      errors.push('maxRetries must be between 0 and 10');
    }
    return errors;
  }
};

module.exports = Validators;
