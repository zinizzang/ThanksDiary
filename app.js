
/* === Minimal patch: keep features same, only ensure view class toggles correctly === */
(function () {
  // If your app already had a router/navigator, we just ensure the body carries a
  // view flag class so CSS can hide/show the week badge without touching logic.
  const viewButtons = {
    daily:  document.querySelector('[data-nav="daily"]'),
    weekly: document.querySelector('[data-nav="weekly"]'),
    search: document.querySelector('[data-nav="search"]'),
    settings: document.querySelector('[data-nav="settings"]'),
  };
  const body = document.body;

  function setView(v){
    // Remove any previous view-* class
    (body.className || '').split(/\s+/).forEach(c => {
      if (c.startsWith('view-')) body.classList.remove(c);
    });
    body.classList.add(`view-${v}`);
  }

  // Wire only if the buttons exist (non-breaking)
  if (viewButtons.daily)  viewButtons.daily.addEventListener('click',  () => setView('daily'));
  if (viewButtons.weekly) viewButtons.weekly.addEventListener('click', () => setView('weekly'));
  if (viewButtons.search) viewButtons.search.addEventListener('click', () => setView('search'));
  if (viewButtons.settings) viewButtons.settings.addEventListener('click', () => setView('settings'));

  // Initialize once on load if there is an active tab already carrying [aria-current]
  const current = document.querySelector('[data-nav][aria-current="page"]');
  if (current) {
    setView(current.getAttribute('data-nav'));
  } else {
    // default to daily (keeps old behavior)
    setView('daily');
  }
})();
