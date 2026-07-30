const Router = (() => {
  let currentRoute = 'dashboard';
  const routes = {};
  const navLinks = new Map();

  function init() {
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(a => {
      const route = a.dataset.route;
      if (route) {
        navLinks.set(route, a);
        a.addEventListener('click', (e) => {
          e.preventDefault();
          navigate(route);
        });
      }
    });
  }

  function register(route, renderFn) {
    routes[route] = renderFn;
  }

  function navigate(route) {
    if (route === currentRoute) return;
    const renderFn = routes[route];
    if (!renderFn) return;

    navLinks.forEach((link, r) => {
      link.classList.toggle('active', r === route);
    });

    const titleMap = {
      dashboard: 'Dashboard', customers: 'Customers', files: "Today's Files",
      downloads: 'Downloads', 'print-queue': 'Print Queue', statistics: 'Statistics',
      logs: 'Logs', settings: 'Settings', help: 'Help'
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = titleMap[route] || route;

    currentRoute = route;
    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = '<div class="page-section">' + renderFn() + '</div>';
    }
  }

  function getCurrentRoute() { return currentRoute; }

  return { init, register, navigate, getCurrentRoute };
})();
