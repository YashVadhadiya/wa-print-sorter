(function () {
  function init() {
    Router.init();

    Router.register('dashboard', () => DashboardComponent.render());
    Router.register('customers', () => CustomersComponent.render());
    Router.register('files', () => FilesComponent.render());
    Router.register('downloads', () => DownloadsComponent.render());
    Router.register('print-queue', () => PrintQueueComponent.render());
    Router.register('statistics', () => StatisticsComponent.render());
    Router.register('logs', () => LogsComponent.render());
    Router.register('settings', () => SettingsComponent.render());
    Router.register('help', () => HelpComponent.render());

    Router.navigate('dashboard');

    WS.connect();
    WS.on('connected', () => {
      loadCurrentPage();
    });

    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('mobile-overlay').classList.toggle('show');
    });

    document.getElementById('refresh-btn').addEventListener('click', () => {
      loadCurrentPage();
      Notifications.info('Refreshed');
    });

    document.getElementById('theme-toggle').addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      document.documentElement.classList.toggle('light');
    });

    document.getElementById('global-search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim();
        if (q) performGlobalSearch(q);
      }
    });

    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        closeMobileSidebar();
        Router.navigate(link.dataset.route);
      }
    });

    setTimeout(() => {
      loadCurrentPage();
    }, 500);
  }

  function loadCurrentPage() {
    const route = Router.getCurrentRoute();
    const componentMap = {
      dashboard: DashboardComponent,
      customers: CustomersComponent,
      files: FilesComponent,
      downloads: DownloadsComponent,
      'print-queue': PrintQueueComponent,
      statistics: StatisticsComponent,
      logs: LogsComponent,
      settings: SettingsComponent,
      help: HelpComponent
    };
    const comp = componentMap[route];
    if (comp && comp.load) {
      setTimeout(() => comp.load(), 100);
    }
  }

  window.closeMobileSidebar = function () {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobile-overlay').classList.remove('show');
  };

  let searchTimeout;
  async function performGlobalSearch(q) {
    try {
      const results = await API.search(q);
      if (results.customers && results.customers.length > 0) {
        Notifications.info('Found ' + results.customers.length + ' customer(s)');
        Router.navigate('customers');
        setTimeout(() => {
          const input = document.getElementById('customer-search-input');
          if (input) { input.value = q; CustomersComponent.search(); }
        }, 300);
      } else if (results.files && results.files.length > 0) {
        Notifications.info('Found ' + results.files.length + ' file(s)');
        Router.navigate('files');
      } else {
        Notifications.info('No results found for "' + q + '"');
      }
    } catch (e) {
      Notifications.error('Search failed');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})();
