const HelpComponent = {
  render() {
    return `
      <div class="max-w-4xl space-y-6">
        <div class="card">
          <div class="card-header"><h3 class="font-semibold text-white">Getting Started</h3></div>
          <div class="card-body space-y-4">
            <div class="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div class="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
              <div><h4 class="text-white font-medium">Install the Local Agent</h4><p class="text-gray-400 text-sm mt-1">Download and run the PrintHub Local Agent on your shop computer. It handles all WhatsApp communication and file management.</p></div>
            </div>
            <div class="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div class="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
              <div><h4 class="text-white font-medium">Connect WhatsApp</h4><p class="text-gray-400 text-sm mt-1">Scan the QR code with WhatsApp to link your number. The agent will automatically download incoming files.</p></div>
            </div>
            <div class="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div class="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
              <div><h4 class="text-white font-medium">Configure Settings</h4><p class="text-gray-400 text-sm mt-1">Set your download folder, file type preferences, notification settings, and more from the Settings page.</p></div>
            </div>
            <div class="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div class="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
              <div><h4 class="text-white font-medium">Start Receiving Files</h4><p class="text-gray-400 text-sm mt-1">When customers send files on WhatsApp, they are automatically downloaded, organized by customer, and appear in your dashboard in real time.</p></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="font-semibold text-white">FAQ</h3></div>
          <div class="card-body space-y-4">
            <details class="group">
              <summary class="text-white font-medium cursor-pointer list-none flex items-center justify-between">How do I connect to the agent?<span class="text-gray-500 group-open:rotate-180 transition-transform"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></span></summary>
              <p class="text-gray-400 text-sm mt-2">Go to Settings and enter the Local Agent URL (default: http://localhost:4545). If you've set an auth token, enter it as well.</p>
            </details>
            <details class="group">
              <summary class="text-white font-medium cursor-pointer list-none flex items-center justify-between">Is my data stored in the cloud?<span class="text-gray-500 group-open:rotate-180 transition-transform"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></span></summary>
              <p class="text-gray-400 text-sm mt-2">No. All files and data stay on your local computer. The dashboard is just a UI that connects to your local agent. Nothing is uploaded to the cloud.</p>
            </details>
            <details class="group">
              <summary class="text-white font-medium cursor-pointer list-none flex items-center justify-between">What file types are supported?<span class="text-gray-500 group-open:rotate-180 transition-transform"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></span></summary>
              <p class="text-gray-400 text-sm mt-2">PDF, images, Word, Excel, PowerPoint, CorelDRAW, Photoshop, Illustrator, SVG, ZIP, RAR, videos, audio, and more. You can configure allowed types in Settings.</p>
            </details>
            <details class="group">
              <summary class="text-white font-medium cursor-pointer list-none flex items-center justify-between">How are files organized?<span class="text-gray-500 group-open:rotate-180 transition-transform"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></span></summary>
              <p class="text-gray-400 text-sm mt-2">Files are organized by customer (phone number) → Year → Month → Date. Each customer has a profile.json with their details.</p>
            </details>
            <details class="group">
              <summary class="text-white font-medium cursor-pointer list-none flex items-center justify-between">Can I use this with Telegram or email?<span class="text-gray-500 group-open:rotate-180 transition-transform"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></span></summary>
              <p class="text-gray-400 text-sm mt-2">Not yet. The plugin system is designed to support multiple channels in the future. Stay tuned for updates.</p>
            </details>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="font-semibold text-white">Keyboard Shortcuts</h3></div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="flex justify-between"><span class="text-gray-300">Dashboard</span><kbd class="px-2 py-0.5 bg-gray-800 rounded text-gray-400">Alt + 1</kbd></div>
              <div class="flex justify-between"><span class="text-gray-300">Customers</span><kbd class="px-2 py-0.5 bg-gray-800 rounded text-gray-400">Alt + 2</kbd></div>
              <div class="flex justify-between"><span class="text-gray-300">Today's Files</span><kbd class="px-2 py-0.5 bg-gray-800 rounded text-gray-400">Alt + 3</kbd></div>
              <div class="flex justify-between"><span class="text-gray-300">Print Queue</span><kbd class="px-2 py-0.5 bg-gray-800 rounded text-gray-400">Alt + 5</kbd></div>
              <div class="flex justify-between"><span class="text-gray-300">Settings</span><kbd class="px-2 py-0.5 bg-gray-800 rounded text-gray-400">Alt + 8</kbd></div>
              <div class="flex justify-between"><span class="text-gray-300">Refresh</span><kbd class="px-2 py-0.5 bg-gray-800 rounded text-gray-400">Ctrl + R</kbd></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="font-semibold text-white">Support</h3></div>
          <div class="card-body">
            <p class="text-gray-400 text-sm">If you need help, check the documentation or contact support.</p>
            <div class="mt-4 flex gap-3">
              <a href="#" class="btn btn-secondary">View Documentation</a>
              <a href="#" class="btn btn-secondary">Report Issue</a>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  load() {},
  setupListeners() {}
};
