# PrintHub Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                      GitHub Pages                        │
│                    ┌──────────────┐                      │
│                    │   Frontend   │                      │
│                    │  Dashboard   │                      │
│                    │  (Static)    │                      │
│                    └──────┬───────┘                      │
│                           │                              │
│                    HTTPS / WSS                           │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────┐
│              Shop Computer (Local)                       │
│                    ┌──────┴───────┐                      │
│                    │  Express +   │                      │
│                    │  WebSocket   │                      │
│                    │  Server      │                      │
│                    │  :4545       │                      │
│                    └──────┬───────┘                      │
│                           │                              │
│          ┌────────────────┼────────────────────┐         │
│          │                │                    │         │
│   ┌──────┴──────┐  ┌─────┴──────┐   ┌─────────┴──────┐ │
│   │  WhatsApp   │  │  Download  │   │  File System   │ │
│   │  Service    │  │  Manager   │   │  Organizer     │ │
│   └─────────────┘  └────────────┘   └────────────────┘ │
│          │                │                    │         │
│   ┌──────┴──────┐  ┌─────┴──────┐   ┌─────────┴──────┐ │
│   │  Customer   │  │  Print     │   │  JSON Storage  │ │
│   │  Manager    │  │  Queue     │   │  (Database)    │ │
│   └─────────────┘  └────────────┘   └────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Architecture Principles

1. **Separation of Concerns** - Frontend (static) is completely decoupled from backend (local agent)
2. **SOLID Principles** - Each service has a single responsibility
3. **Event-Driven** - WebSocket broadcasts enable real-time updates without polling
4. **Plugin Architecture** - New channels can be added without modifying core code
5. **Local-First** - All data stays on the local machine

## Component Relationships

### Frontend
- **SPA Router** - Client-side routing for single-page application
- **API Client** - HTTP client for communicating with Local Agent
- **WebSocket Client** - Real-time bidirectional communication
- **UI Components** - Modular dashboard widgets and pages

### Backend (Local Agent)
- **Express Server** - RESTful API on port 4545
- **WebSocket Server** - Real-time event broadcasting
- **WhatsApp Service** - whatsapp-web.js client wrapper
- **Download Manager** - Handles file downloads from WhatsApp
- **File Organizer** - Manages folder structure on disk
- **Customer Manager** - Customer profiles and history
- **Print Queue** - Print job management
- **JSON Database** - Lightweight file-based storage

## Data Flow

1. Customer sends file via WhatsApp
2. WhatsApp Service receives message event
3. Media is downloaded and decoded by Download Manager
4. File Organizer creates customer folder: `Customers/{phone}/{year}/{month}/{day}/{file}`
5. Customer Manager creates/updates customer profile
6. File record stored in JSON database
7. Real-time event broadcast to dashboard via WebSocket
8. Dashboard updates UI components instantly
