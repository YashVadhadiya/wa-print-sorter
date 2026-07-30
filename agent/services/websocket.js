const WebSocketService = {
  _wss: null,
  _clients: new Set(),

  init(wss) {
    this._wss = wss;
    wss.on('connection', (ws, req) => {
      this._clients.add(ws);
      ws.isAlive = true;

      ws.on('pong', () => { ws.isAlive = true; });
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          this._handleMessage(ws, msg);
        } catch (e) {}
      });
      ws.on('close', () => {
        this._clients.delete(ws);
      });
      ws.on('error', () => {
        this._clients.delete(ws);
      });

      ws.send(JSON.stringify({ type: 'connected', data: { timestamp: new Date().toISOString() } }));
    });

    const interval = setInterval(() => {
      wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    wss.on('close', () => clearInterval(interval));
  },

  _handleMessage(ws, msg) {
    switch (msg.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      case 'check_messages':
        const WhatsAppService = require('./whatsapp');
        if (WhatsAppService && WhatsAppService.checkForNewMessages) {
          WhatsAppService.checkForNewMessages();
        }
        break;
      default:
        break;
    }
  },

  broadcast(type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    this._clients.forEach((client) => {
      if (client.readyState === 1) {
        try { client.send(message); } catch (e) {}
      }
    });
  },

  getClientCount() {
    return this._clients.size;
  }
};

module.exports = WebSocketService;
