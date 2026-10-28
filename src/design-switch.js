/* This small classic script runs before the stylesheets to avoid a theme flash. */
(() => {
  const storageKey = 'kanjimaster.design';
  const valid = value => value === 'legacy' || value === 'glass';
  let design = 'glass';
  try {
    const saved = localStorage.getItem(storageKey);
    if (valid(saved)) design = saved;
  } catch { /* Storage can be disabled; the new design remains usable. */ }
  document.documentElement.dataset.design = design;

  function connectSwitch() {
    const inputs = document.querySelectorAll('input[name="design"]');
    for (const input of inputs) {
      input.checked = input.value === design;
      input.addEventListener('change', () => {
        if (!input.checked || !valid(input.value)) return;
        design = input.value;
        document.documentElement.dataset.design = design;
        try { localStorage.setItem(storageKey, design); } catch { /* Keep the selection for this page. */ }
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', connectSwitch, { once: true });
  else connectSwitch();
})();
