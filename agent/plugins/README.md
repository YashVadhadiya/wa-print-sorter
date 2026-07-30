# PrintHub Plugin System

The plugin system allows extending PrintHub with additional channels and features.

## Plugin Structure

```
plugins/
  my-plugin/
    index.js        # Plugin entry point
    manifest.json   # Plugin metadata
    config.json     # Plugin configuration (optional)
```

## manifest.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Description of my plugin",
  "type": "channel", 
  "author": "Your Name",
  "hooks": ["onMessage", "onDownload", "onPrint"]
}
```

## Plugin API

Plugins receive a context object with:

- `api` - Express router for adding routes
- `config` - Plugin configuration
- `logger` - Logger instance
- `database` - Database instance
- `websocket` - WebSocket broadcast service
- `events` - Event emitter for hooks

## Hook Types

- `channel` - New input channel (Telegram, Email, etc.)
- `processor` - File processing (AI, OCR, etc.)
- `output` - Output (printer integration, cloud upload, etc.)

## Example Plugin

```javascript
module.exports = function (context) {
  return {
    name: 'my-plugin',
    async init() {
      context.logger.info('My plugin initialized');
    },
    async onMessage(message) {
      // Handle incoming message
    },
    async destroy() {
      // Cleanup
    }
  };
};
```
