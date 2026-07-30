# PrintHub — WhatsApp Print Automation Platform

> Automatically receive, organize, and manage print files from WhatsApp — no manual downloading required.

PrintHub is a production-grade web platform that automates the workflow of a printing shop. Customers send files via WhatsApp, and they are automatically downloaded, organized by customer, and displayed on a beautiful real-time dashboard — all on your local machine.

---

## Architecture

```
┌──────────────────┐         ┌──────────────────────────────┐
│  GitHub Pages    │  HTTP   │  Local Agent (port 4545)     │
│  (Static UI)     │◄───────►│  Express + WebSocket         │
│                  │  WSS    │  ├─ WhatsApp Service         │
│                  │         │  ├─ Download Manager         │
│                  │         │  ├─ File Organizer           │
│                  │         │  ├─ Customer Manager         │
│                  │         │  └─ Print Queue              │
└──────────────────┘         └──────────────────────────────┘
```

## Features

- **🤖 Auto Download** — Files from WhatsApp are downloaded instantly
- **📁 Smart Organization** — Automatically sorted by customer → date
- **📊 Real-Time Dashboard** — Live updates via WebSocket, zero refresh
- **👥 Customer Management** — Profiles, history, notes for each customer
- **🖨️ Print Queue** — Track print jobs (Pending → Printing → Printed)
- **🔍 Global Search** — Find customers, files, anything instantly
- **🌙 Dark Mode** — Premium dark theme, easy on the eyes
- **📱 Responsive** — Works on desktop, tablet, and mobile
- **🔒 Local-First** — All data stays on your computer, no cloud storage
- **🧩 Plugin Ready** — Architecture supports Telegram, Email, and more

## Supported File Types

PDF, Images (JPG, PNG, GIF, WebP, BMP, TIFF), Word, Excel, PowerPoint, CorelDRAW, Photoshop, Illustrator, SVG, ZIP, RAR, 7z, Videos, Audio, and more.

## Quick Start

### Prerequisites
- Node.js 18+ (for Local Agent)
- Chrome/Chromium (for WhatsApp Web)
- A WhatsApp account

### 1. Install the Local Agent

```bash
cd agent
npm install
npm start
```

### 2. Open the Dashboard

Open `frontend/index.html` in your browser, or deploy to GitHub Pages.

### 3. Connect

Go to **Settings → Agent Connection**, enter `http://localhost:4545`.

### 4. Scan QR

Scan the WhatsApp QR code shown in the terminal or dashboard.

### 5. Done

Send a file to your WhatsApp number — it appears on the dashboard instantly.

## Dashboard

| Page | Description |
|------|-------------|
| **Dashboard** | Stats, recent files, activity feed, quick actions |
| **Customers** | Customer profiles, search, notes |
| **Today's Files** | Filterable file browser |
| **Downloads** | Download history and active queue |
| **Print Queue** | Track and manage print jobs |
| **Statistics** | Visual analytics (files by type, downloads by day) |
| **Logs** | System log viewer with level filtering |
| **Settings** | Agent connection, notifications, preferences |
| **Help** | Getting started guide and FAQ |

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | HTML5, CSS3, Tailwind CSS, Vanilla JS |
| **Backend** | Node.js, Express, WebSocket (ws) |
| **WhatsApp** | whatsapp-web.js |
| **Storage** | JSON files (SQLite-ready architecture) |
| **Hosting** | GitHub Pages (frontend) / Local (agent) |

## Folder Structure

```
PrintHub/
├── frontend/          # Static dashboard (GitHub Pages)
│   ├── index.html     # SPA entry point
│   ├── css/           # Styles
│   └── js/            # Components, API client, WebSocket, Router
├── agent/             # Local Print Agent (Node.js)
│   ├── server.js      # Entry point
│   ├── routes/        # API routes
│   ├── services/      # Business logic (WhatsApp, downloader, etc.)
│   ├── storage/       # JSON database
│   ├── config/        # Configuration
│   └── data/          # Runtime data (customers, files, logs)
├── docs/              # Documentation
└── tests/             # Test scripts and checklists
```

## API Documentation

See [docs/API.md](docs/API.md) for complete API reference.

## WebSocket Events

See [docs/WEBSOCKET.md](docs/WEBSOCKET.md) for all real-time events.

## Deployment

- **Frontend**: Deploy the `frontend/` folder to GitHub Pages
- **Agent**: Run `agent/server.js` on your local machine

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed guides.

## Roadmap

- [x] WhatsApp auto-download
- [x] Customer management
- [x] Real-time dashboard
- [x] Print queue
- [ ] Telegram integration
- [ ] Email integration
- [ ] Direct printer support
- [ ] AI file categorization
- [ ] Multi-user support

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full roadmap.

## License

MIT — Free for personal and commercial use.
