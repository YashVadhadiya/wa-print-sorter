# PrintHub Deployment Guide

## GitHub Pages (Frontend)

### Option 1: Deploy from Repository

1. Push the `frontend/` folder to a GitHub repository
2. Go to Settings → Pages
3. Set Source to "Deploy from branch"
4. Select branch `main` and folder `/frontend`
5. Save — your dashboard will be live at `https://{username}.github.io/{repo}/`

### Option 2: Deploy Entire Project

1. Create a repository: `https://github.com/{username}/printhub`
2. Push the entire PrintHub project:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/{username}/printhub.git
git push -u origin main
```
3. GitHub Pages Settings:
   - Source: GitHub Actions
   - Or manually select the `frontend` folder

### Option 3: Use Any Static Hosting

The `frontend/` folder is fully static and works with:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Any web server (Nginx, Apache, etc.)

### Configuring API Endpoint

After deployment, open the dashboard and go to **Settings → Agent Connection**.
Enter your Local Agent URL (e.g., `http://192.168.1.100:4545`).

## Local Agent (Windows)

### Prerequisites
- Node.js 18+ (https://nodejs.org)
- Chrome/Chromium (required by whatsapp-web.js)

### Installation

```powershell
# Extract or clone PrintHub
cd PrintHub/agent

# Install dependencies
npm install

# Start the agent
npm start
```

### Running as a Service (Windows)

Using NSSM (Non-Sucking Service Manager):

```powershell
# Download nssm from https://nssm.cc
nssm install PrintHub "C:\Program Files\nodejs\node.exe" "C:\PrintHub\agent\server.js"
nssm start PrintHub
```

### Auto-Start with Windows

1. Create a shortcut to `node server.js`
2. Place it in `shell:startup`

### Firewall

Allow port 4545 through Windows Firewall:
```powershell
New-NetFirewallRule -DisplayName "PrintHub Agent" -Direction Inbound -Protocol TCP -LocalPort 4545 -Action Allow
```

## Local Agent (Linux/Mac)

```bash
cd PrintHub/agent
npm install
npm start

# Run as a service with systemd (Linux)
# Create /etc/systemd/system/printhub.service
```

## Security Considerations

1. **Change the default port** in `agent/config/default.json`
2. **Enable authentication** — set a strong token in Settings
3. **Use HTTPS** for production by configuring SSL certificate paths
4. **Restrict network access** — block port 4545 from external networks
5. **Regular backups** — the agent auto-backs up JSON data files
