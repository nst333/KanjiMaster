export const effectsKey = 'kanjimaster.effects';
export const validEffectsMode = value => ['auto', 'on', 'off'].includes(value);

export function readEffectsMode(getStorage = () => localStorage) {
  try { const value = getStorage().getItem(effectsKey); return validEffectsMode(value) ? value : 'auto'; }
  catch { return 'auto'; }
}
export function saveEffectsMode(value, getStorage = () => localStorage) {
  if (!validEffectsMode(value)) return false;
  try { getStorage().setItem(effectsKey, value); return true; } catch { return false; }
}

/** Coarse browser capabilities, not OS-name or user-agent assumptions. */
export function chooseEffects(mode, { reducedMotion = false, saveData = false, cores, memory, finePointer = false, frameTime } = {}) {
  if (mode === 'off') return { tier: 'off', reason: 'manual' };
  // Even a forced-on choice retains a gentle path for the OS accessibility setting.
  if (reducedMotion) return { tier: mode === 'on' ? 'gentle' : 'off', reason: 'reduced-motion' };
  if (mode === 'on') return { tier: 'full', reason: 'manual' };
  if (saveData) return { tier: 'off', reason: 'save-data' };
  const known = value => Number.isFinite(value) && value > 0;
  if ((known(cores) && cores <= 2) || (known(memory) && memory <= 2)) return { tier: 'off', reason: 'limited-device' };
  if (known(frameTime) && frameTime > 45) return { tier: 'off', reason: 'slow-frames' };
  if (known(frameTime) && frameTime > 24) return { tier: 'gentle', reason: 'slow-frames' };
  if ((known(cores) && cores <= 4) || (known(memory) && memory <= 4)) return { tier: 'gentle', reason: 'limited-device' };
  if (!finePointer) return { tier: 'gentle', reason: 'touch-device' };
  if ((known(cores) && cores >= 8) || (known(memory) && memory >= 8)) return { tier: 'full', reason: 'capable-device' };
  return { tier: 'gentle', reason: 'unknown-device' };
}

/** Ignore a single startup stall; sustained slow frame cadence determines the tier. */
export function medianFrameTime(samples) {
  const sorted = samples.filter(value => Number.isFinite(value) && value > 0).toSorted((a, b) => a - b);
  if (!sorted.length) return undefined;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
