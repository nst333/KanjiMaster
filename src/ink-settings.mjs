const storageKey = 'kanjimaster.laser';

export function readLaserEffect(getStorage = () => localStorage) {
  try { return getStorage().getItem(storageKey) !== 'off'; }
  catch { return true; }
}

export function saveLaserEffect(enabled, getStorage = () => localStorage) {
  try { getStorage().setItem(storageKey, enabled ? 'on' : 'off'); }
  catch { /* The current-page setting remains usable without storage. */ }
}

export function createInkSettings(onChange) {
  const settings = document.getElementById('ink-settings');
  const toggle = document.getElementById('laser-effect');
  let enabled = readLaserEffect();
  toggle.checked = enabled;
  toggle.addEventListener('change', () => {
    enabled = toggle.checked;
    saveLaserEffect(enabled);
    onChange();
  });
  document.addEventListener('pointerdown', event => {
    if (settings.open && !settings.contains(event.target)) settings.open = false;
  });
  settings.addEventListener('keydown', event => {
    if (event.key === 'Escape' && settings.open) {
      settings.open = false;
      settings.querySelector('summary').focus();
      event.preventDefault();
    }
  });
  return { get enabled() { return enabled; } };
}
