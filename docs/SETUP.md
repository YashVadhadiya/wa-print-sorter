# PrintHub Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd PrintHub/agent
npm install
```

### 2. Configure Settings

Edit `agent/config/default.json` or use the Settings page in the dashboard:

- **Port**: Default 4545. Change if conflict.
- **Download Path**: Where files are stored (default: `./data/downloads`)
- **Auth Token**: Set a token for API security

### 3. Start the Agent

```bash
cd PrintHub/agent
npm start
```

You should see:
```
PrintHub Agent started successfully on port 4545
Initializing WhatsApp client...
```

### 4. Open the Dashboard

Open `frontend/index.html` in a browser, or deploy to GitHub Pages.

Go to **Settings → Agent Connection** and enter:
```
http://localhost:4545
```

### 5. Connect WhatsApp

1. The agent will generate a QR code in the terminal
2. Open WhatsApp on your phone
3. Menu → Linked Devices → Link a Device
4. Scan the QR code
5. Dashboard will show "WhatsApp: Connected"

### 6. Done!

Any files sent to your WhatsApp number will now:
- Auto-download to the correct customer folder
- Appear in the dashboard in real-time
- Be ready for printing

## Folder Structure After Setup

```
PrintHub/
├── agent/
│   └── data/
│       ├── customers.json
│       ├── files.json
│       ├── downloads.json
│       ├── print-queue.json
│       ├── activity.json
│       ├── customers/
│       │   └── 919876543210/
│       │       └── profile.json
│       ├── downloads/
│       │   └── Customers/
│       │       └── 919876543210/
│       │           └── 2026/
│       │               └── July/
│       │                   └── 30/
│       │                       └── invoice.pdf
│       └── logs/
│           └── 2026-07-30.log
└── frontend/
    └── index.html
```

## Troubleshooting

### WhatsApp won't connect
- Ensure Chrome/Chromium is installed
- Check internet connection
- Restart the agent and try scanning again
- Delete `agent/data/session` folder and retry

### Dashboard can't connect to agent
- Verify agent is running (check terminal)
- Check port 4545 is not blocked by firewall
- Ensure correct URL in Settings (https vs http)
- Check for CORS errors in browser console

### Files not downloading
- Check WhatsApp is connected
- Verify file type is not blacklisted
- Check disk space
- Check agent logs for errors

### WebSocket disconnects
- Normal behavior; auto-reconnect is built-in
- Check network stability
- Agent broadcasts heartbeat every 30s
