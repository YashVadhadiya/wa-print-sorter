# PrintHub WebSocket Events

Endpoint: `ws://localhost:4545/ws`

## Client → Server

| Type | Data | Description |
|------|------|-------------|
| `ping` | `{}` | Keep-alive ping |
| `check_messages` | `{}` | Trigger message check |

## Server → Client

### Connection Events

| Type | Data | Description |
|------|------|-------------|
| `connected` | `{ timestamp }` | Initial connection confirmation |
| `pong` | `{}` | Response to ping |

### WhatsApp Events

| Type | Data | Description |
|------|------|-------------|
| `whatsapp_qr` | `{ qr }` | QR code string for authentication |
| `whatsapp_qr_image` | `{ image }` | QR code as base64 data URL |
| `whatsapp_qr_expired` | `{}` | QR code timed out |
| `whatsapp_ready` | `{ number, name }` | WhatsApp connected and ready |
| `whatsapp_disconnected` | `{ reason }` | WhatsApp disconnected |
| `whatsapp_state` | `{ state }` | Connection state change |
| `whatsapp_logged_out` | `{}` | User logged out |

### File Events

| Type | Data | Description |
|------|------|-------------|
| `new_file` | `{ name, customer, size, ext }` | New file detected |
| `download_started` | `{ id, name, sender, size, ext }` | Download started |
| `download_complete` | `{ id, name, customer, size, ext }` | Download finished |
| `download_failed` | `{ id, name, error }` | Download failed |
| `download_cancelled` | `{ id }` | Download cancelled |

### Customer Events

| Type | Data | Description |
|------|------|-------------|
| `customer_new` | `{ id, phone, name, ... }` | New customer created |
| `customer_update` | `{ id, phone, name, ... }` | Customer updated |
| `customer_deleted` | `{ phone }` | Customer removed |

### Print Queue Events

| Type | Data | Description |
|------|------|-------------|
| `print_queue_updated` | `{ action, items }` | Queue modified |
| `print_update` | `{ id, fileId, status }` | Print status changed |
| `print_removed` | `{ id }` | Print removed from queue |

### System Events

| Type | Data | Description |
|------|------|-------------|
| `stats_update` | `{ todayFiles, totalCustomers, ... }` | Periodic stats broadcast (5s) |
| `log` | `{ timestamp, level, message, data }` | New log entry |
| `checking_messages` | `{ timestamp }` | Manual message check triggered |

## Example Message Format

```json
{
  "type": "download_complete",
  "data": {
    "id": "abc123",
    "name": "invoice.pdf",
    "customer": "John Doe",
    "size": 245760,
    "ext": ".pdf"
  },
  "timestamp": "2026-07-30T20:30:00.000Z"
}
```
