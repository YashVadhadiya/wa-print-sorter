const Formatters = {
  fileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  },

  date(date, style = 'medium') {
    if (!date) return '-';
    const d = new Date(date);
    if (style === 'relative') {
      const now = Date.now();
      const diff = now - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return mins + 'm ago';
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return hrs + 'h ago';
      const days = Math.floor(hrs / 24);
      if (days < 7) return days + 'd ago';
      return d.toLocaleDateString();
    }
    if (style === 'short') return d.toLocaleDateString();
    return d.toLocaleString();
  },

  timeAgo(date) {
    return this.date(date, 'relative');
  },

  ext(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  },

  fileCategory(ext) {
    const cat = {
      pdf: 'pdf',
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image', webp: 'image', tiff: 'image', svg: 'image',
      doc: 'doc', docx: 'doc', xls: 'doc', xlsx: 'doc', ppt: 'doc', pptx: 'doc',
      cdr: 'vector', psd: 'vector', ai: 'vector', eps: 'vector',
      zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
      mp4: 'video', avi: 'video', mkv: 'video', mov: 'video', wmv: 'video',
      mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio'
    };
    return cat[ext] || 'other';
  },

  phone(mobile) {
    if (!mobile) return '-';
    if (mobile.startsWith('91') && mobile.length === 12) return '+' + mobile;
    if (mobile.startsWith('+')) return mobile;
    return '+' + mobile;
  },

  truncate(str, len = 40) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  },

  percent(used, total) {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  }
};
