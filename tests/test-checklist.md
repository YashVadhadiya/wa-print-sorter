# PrintHub Testing Checklist

## Frontend (Dashboard)

### Navigation
- [ ] All sidebar links navigate correctly
- [ ] Active page is highlighted in sidebar
- [ ] Mobile sidebar opens/closes correctly
- [ ] Page title updates on navigation
- [ ] Client-side routing works without page reload

### Dashboard
- [ ] Stats widgets load and display data
- [ ] Recent files table shows latest files
- [ ] Activity feed shows recent events
- [ ] Quick action buttons navigate correctly
- [ ] Agent health card shows live status

### Customers
- [ ] Customer list loads correctly
- [ ] Search filters customers
- [ ] Customer detail modal opens
- [ ] Notes can be saved
- [ ] Customer count is accurate

### Files
- [ ] File list loads with all data
- [ ] File type filter works
- [ ] Date filter works
- [ ] Search within files works
- [ ] Add to print queue works
- [ ] Delete file works (with confirmation)

### Downloads
- [ ] Download history loads
- [ ] Active downloads show progress
- [ ] Cancel download works

### Print Queue
- [ ] Queue loads correctly
- [ ] Status dropdown updates work
- [ ] Remove from queue works
- [ ] Count updates correctly

### Statistics
- [ ] Stats load correctly
- [ ] Files by type chart displays
- [ ] Downloads by day chart displays

### Logs
- [ ] Log entries display correctly
- [ ] Level filter works
- [ ] Clear view works

### Settings
- [ ] API URL can be changed
- [ ] Auth token can be set
- [ ] Test connection button works
- [ ] Settings save correctly

### Help
- [ ] FAQ accordion works
- [ ] All sections are visible

### Global Features
- [ ] Theme toggle works (dark/light)
- [ ] Global search returns results
- [ ] Refresh button reloads data
- [ ] Toast notifications display
- [ ] WebSocket status indicator updates

### Responsive
- [ ] Desktop (1920x1080) — full layout
- [ ] Tablet (768px) — sidebar auto-hides
- [ ] Mobile (375px) — stacked layout
- [ ] Touch interactions work

## Backend (Local Agent)

### API Endpoints
- [ ] GET /api/agent/status returns health
- [ ] GET /api/stats returns dashboard stats
- [ ] GET /api/activity returns events
- [ ] GET /api/customers returns list
- [ ] GET /api/customers/:id returns details
- [ ] PUT /api/customers/:id updates customer
- [ ] DELETE /api/customers/:id deletes customer
- [ ] GET /api/files returns file list
- [ ] GET /api/files/today returns today's files
- [ ] GET /api/print returns queue
- [ ] POST /api/print adds to queue
- [ ] PUT /api/print/:id updates status
- [ ] DELETE /api/print/:id removes from queue
- [ ] GET /api/logs returns log entries
- [ ] GET /api/search returns results
- [ ] GET /api/settings returns config
- [ ] PUT /api/settings saves config
- [ ] POST /api/whatsapp/logout logs out

### WebSocket
- [ ] Client connects successfully
- [ ] Server broadcasts connected event
- [ ] Stats updates broadcast every 5s
- [ ] File events broadcast correctly
- [ ] Disconnect/reconnect works

### WhatsApp
- [ ] Client initializes
- [ ] QR code generates
- [ ] QR code broadcasts via WebSocket
- [ ] Ready event fires after scan
- [ ] Messages trigger download
- [ ] Media downloads correctly
- [ ] Auto-reconnect on disconnect
- [ ] Graceful logout
- [ ] Session persistence

### File Management
- [ ] Files saved to correct customer folder
- [ ] Date-based subdirectories created
- [ ] Duplicate filenames handled
- [ ] Large files handled (>100MB)
- [ ] Special characters in filenames handled
- [ ] Blacklisted extensions rejected

### Error Handling
- [ ] Invalid API tokens rejected
- [ ] Missing endpoints return 404
- [ ] Server errors return 500
- [ ] WhatsApp connection failures handled
- [ ] Disk full scenarios handled
- [ ] Network interruptions handled

## Performance
- [ ] Dashboard loads < 3s
- [ ] File list loads < 2s (1000 files)
- [ ] WebSocket reconnects < 5s
- [ ] Memory usage < 200MB idle
- [ ] CPU usage < 10% idle
