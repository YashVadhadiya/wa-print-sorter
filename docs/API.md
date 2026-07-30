# PrintHub API Documentation

Base URL: `http://localhost:4545`

## Authentication

All API routes under `/api` require authentication if enabled.

```
Authorization: Bearer <token>
```

## Endpoints

### Agent

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agent/status` | Get agent health and status |
| POST | `/api/agent/restart` | Restart the agent |

### WhatsApp

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/whatsapp/status` | Get WhatsApp connection status |
| GET | `/api/whatsapp/qr` | Get current QR code for scanning |
| POST | `/api/whatsapp/logout` | Logout WhatsApp session |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stats` | Get dashboard statistics |
| GET | `/api/activity?limit=20` | Get recent activity feed |

### Customers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customers` | Get all customers |
| GET | `/api/customers/search?q=` | Search customers |
| GET | `/api/customers/:id` | Get customer details |
| PUT | `/api/customers/:id` | Update customer (e.g., notes) |
| DELETE | `/api/customers/:id` | Delete customer and files |

### Files

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/files` | Get files (query: customer, ext, date, q, page, limit) |
| GET | `/api/files/today` | Get today's files |
| GET | `/api/files/:id` | Get file info |
| DELETE | `/api/files/:id` | Delete file |

### Downloads

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/downloads` | Get download history |
| GET | `/api/downloads/queue` | Get active downloads |
| POST | `/api/downloads/:id/retry` | Retry failed download |
| POST | `/api/downloads/:id/cancel` | Cancel active download |

### Print Queue

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/print` | Get print queue |
| POST | `/api/print` | Add files to queue |
| PUT | `/api/print/:id` | Update print status |
| DELETE | `/api/print/:id` | Remove from queue |

### Statistics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/statistics` | Get detailed statistics |

### Logs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/logs?level=&limit=&offset=` | Get system logs |

### Settings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings` | Get current settings |
| PUT | `/api/settings` | Update settings |

### Search

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=` | Global search (customers + files) |

## Example Responses

### GET /api/stats

```json
{
  "todayFiles": 12,
  "totalCustomers": 45,
  "pendingPrints": 3,
  "downloadsToday": 12,
  "storageUsed": 1048576000,
  "storageTotal": 1000000000000,
  "whatsappStatus": "Connected"
}
```

### GET /api/agent/status

```json
{
  "status": "running",
  "uptime": "3600s",
  "memory": "45.2 MB",
  "cpu": "0.15",
  "platform": "win32",
  "hostname": "SHOP-PC",
  "nodeVersion": "v18.16.0",
  "wsClients": 2
}
```

### POST /api/print

Request:
```json
{
  "fileIds": ["file123.pdf", "file456.jpg"],
  "customerId": "919876543210",
  "customerName": "John Doe"
}
```

Response:
```json
[
  { "id": "print1", "fileId": "file123.pdf", "status": "pending", "createdAt": "..." },
  { "id": "print2", "fileId": "file456.jpg", "status": "pending", "createdAt": "..." }
]
```
