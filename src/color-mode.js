/* Apply the saved preference before CSS loads, so dark pages never flash light. */
(() => {
  const key = 'kanjimaster.colorMode';
  const valid = value => ['system', 'light', 'dark'].includes(value);
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try {
    const saved = localStorage.getItem(key);
    if (valid(saved)) preference = saved;
  } catch { /* Use the device preference when storage is unavailable. */ }
  function apply() {
    document.documentElement.dataset.colorMode = preference === 'system'
      ? (media.matches ? 'dark' : 'light') : preference;
  }
  apply();
  media.addEventListener('change', apply);
  function connect() {
    const select = document.getElementById('color-mode');
    select.value = preference;
    select.addEventListener('change', () => {
      if (!valid(select.value)) return;
      preference = select.value;
      apply();
      try { localStorage.setItem(key, preference); } catch { /* Keep the current-page choice. */ }
    });
    window.addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return;
      preference = valid(event.newValue) ? event.newValue : 'system';
      select.value = preference;
      apply();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', connect, { once: true });
  else connect();
})();
