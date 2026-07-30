const WS = (() => {
  let ws = null;
  let reconnectTimer = null;
  let isConnected = false;
  const listeners = {};
  let reconnectAttempts = 0;
  const MAX_RECONNECT_DELAY = 30000;

  function connect() {
    const url = API.getBaseURL().replace(/^http/, 'ws') + '/ws';
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    try {
      ws = new WebSocket(url);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      isConnected = true;
      reconnectAttempts = 0;
      updateConnectionUI(true);
      emit('connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        emit(msg.type, msg.data);
        emit('*', msg);
      } catch (e) {}
    };

    ws.onclose = () => {
      isConnected = false;
      updateConnectionUI(false);
      emit('disconnected');
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
    reconnectAttempts++;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function updateConnectionUI(connected) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (dot && text) {
      dot.className = 'w-2 h-2 rounded-full ' + (connected ? 'status-dot connected' : 'status-dot disconnected') + ' inline-block';
      text.textContent = connected ? 'Connected' : 'Disconnected';
    }
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
  }

  return {
    connect,

    on(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },

    off(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(f => f !== fn);
    },

    send(type, data = {}) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, data }));
      }
    },

    disconnect() {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      if (ws) { ws.close(); ws = null; }
      isConnected = false;
      updateConnectionUI(false);
    },

    isConnected() { return isConnected; }
  };
})();
