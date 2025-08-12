// Minimal script to show week badge for selected date and today's date.
(function() {
  const dateInput = document.getElementById('dateInput');
  const btnToday = document.getElementById('btnToday');
  const weekBadge = document.getElementById('weekBadge');

  function toISODate(d) {
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  function weekString(d) {
    // ISO week number
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Thursday in current week decides the year.
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  }
  function updateWeek() {
    const d = new Date(dateInput.value || new Date());
    weekBadge.textContent = weekString(d);
  }
  btnToday.addEventListener('click', () => {
    dateInput.value = toISODate(new Date());
    updateWeek();
  });
  dateInput.addEventListener('change', updateWeek);
  // init
  dateInput.value = toISODate(new Date());
  updateWeek();
})();