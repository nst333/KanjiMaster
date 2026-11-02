import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { chooseEffects, effectsKey, medianFrameTime, readEffectsMode, saveEffectsMode, validEffectsMode } from '../src/effects-policy.mjs';
const source = readFileSync(new URL('../src/effects.mjs', import.meta.url), 'utf8').replace(/^import .*;\r?\n/, '');

function boot(saved = 'auto') {
  const frames = new Map(), documentEvents = new Map(), windowEvents = new Map();
  let sequence = 0, observerCallback, time = 0;
  const storage = { getItem: () => saved, setItem: (_, value) => { saved = value; } };
  function node(id = '') {
    const events = new Map(), properties = new Map(), started = [];
    return { id, events, properties, started, isConnected: true, classList: { contains: () => false },
      style: { setProperty: (key, value) => properties.set(key, value), removeProperty: key => properties.delete(key) },
      addEventListener: (name, fn) => events.set(name, fn),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
      animate(keyframes) {
        let rejected;
        const animation = { keyframes, cancelled: false, finished: { then: (_, reject) => { rejected = reject; } }, cancel() { this.cancelled = true; rejected?.(); } };
        started.push(animation); return animation;
      },
    };
  }
  const root = { dataset: { effects: 'off' } }, status = { textContent: '' };
  const mascot = node(), header = node(), selected = node('selected');
  const radios = ['auto', 'on', 'off'].map(value => ({ ...node(), value, checked: value === saved }));
  const reduced = { matches: false, addEventListener: (_, fn) => { reduced.change = fn; } };
  const pointer = { matches: true, addEventListener: (_, fn) => { pointer.change = fn; } };
  const document = { hidden: false, body: {}, documentElement: root,
    querySelectorAll: () => radios,
    querySelector: selector => selector === '.site-header' ? header : mascot,
    getElementById: () => status,
    addEventListener: (name, fn) => documentEvents.set(name, fn),
  };
  runInNewContext(source, {
    document, window: { addEventListener: (name, fn) => windowEvents.set(name, fn) },
    navigator: { hardwareConcurrency: 8, deviceMemory: 8 },
    matchMedia: query => query.includes('reduced-motion') ? reduced : pointer,
    MutationObserver: class { constructor(callback) { observerCallback = callback; } observe() {} },
    requestAnimationFrame: fn => { frames.set(++sequence, fn); return sequence; },
    cancelAnimationFrame: id => frames.delete(id), getComputedStyle: () => ({ visibility: 'visible' }),
    chooseEffects, effectsKey, medianFrameTime, validEffectsMode,
    readEffectsMode: () => readEffectsMode(() => storage), saveEffectsMode: mode => saveEffectsMode(mode, () => storage),
  });
  return { root, status, selected, mascot, frames,
    frame(interval = 16) { time += interval; const batch = [...frames.values()]; frames.clear(); batch.forEach(fn => fn(time)); },
    choose(value) { for (const radio of radios) radio.checked = radio.value === value; radios.find(radio => radio.checked).events.get('change')(); },
    search() { observerCallback([{ type: 'childList', target: selected, addedNodes: [{ nodeType: 3 }] }]); },
    point() { header.events.get('pointermove')({ clientX: 90, clientY: 80 }); },
    hide(hidden) { document.hidden = hidden; documentEvents.get('visibilitychange')(); },
    reduce(value) { reduced.matches = value; reduced.change(); },
    external(value) { windowEvents.get('storage')({ key: effectsKey, newValue: value }); },
  };
}

test('switching off cancels active effects, pending work and mascot tracking immediately', () => {
  const app = boot('on'); app.search(); app.frame(); app.point(); app.frame();
  assert.equal(app.selected.started.length, 1); assert.ok(app.mascot.properties.size);
  app.point(); assert.ok(app.frames.size);
  app.choose('off');
  assert.equal(app.root.dataset.effects, 'off'); assert.equal(app.selected.started[0].cancelled, true);
  assert.equal(app.frames.size, 0); assert.equal(app.mascot.properties.size, 0);
  app.search(); app.point(); assert.equal(app.frames.size, 0);
});
test('an unchanged automatic frame decision does not interrupt the current selection animation', () => {
  const app = boot(); app.search(); app.frame();
  const animation = app.selected.started[0];
  for (let i = 0; i < 13; i++) app.frame();
  assert.equal(app.root.dataset.effects, 'full'); assert.equal(animation.cancelled, false); assert.equal(app.frames.size, 0);
});
test('sustained slow frames stop expensive motion, while forced-on still works', () => {
  const app = boot(); app.search(); app.frame(60);
  for (let i = 0; i < 13; i++) app.frame(60);
  assert.equal(app.root.dataset.effects, 'off'); assert.equal(app.selected.started[0].cancelled, true); assert.equal(app.frames.size, 0);
  app.choose('on'); assert.equal(app.root.dataset.effects, 'full'); assert.equal(app.frames.size, 0);
});
test('backgrounding cancels scheduled work and resumes a bounded probe on return', () => {
  const app = boot(); app.search(); assert.ok(app.frames.size);
  app.hide(true); assert.equal(app.frames.size, 0);
  app.search(); app.point(); assert.equal(app.frames.size, 0);
  app.hide(false); assert.equal(app.frames.size, 1);
  for (let i = 0; i < 14; i++) app.frame();
  assert.equal(app.frames.size, 0);
});
test('live OS reduction, cross-tab settings, and clearing preferences update the tier', () => {
  const app = boot('on'); app.reduce(true); assert.equal(app.root.dataset.effects, 'gentle');
  app.search(); app.frame();
  assert.ok(app.selected.started[0].keyframes.every(frame => !('transform' in frame)));
  app.external('off'); assert.equal(app.root.dataset.effects, 'off');
  app.external('on'); assert.equal(app.root.dataset.effects, 'gentle');
  app.external(null); assert.equal(app.root.dataset.effects, 'off');
  app.reduce(false); assert.equal(app.root.dataset.effects, 'full');
});
