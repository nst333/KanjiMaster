import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/design-switch.js', import.meta.url), 'utf8');

function boot({ saved = null, blocked = false, writeBlocked = false } = {}) {
  const writes = [];
  const handlers = new Map();
  const radios = ['legacy', 'glass'].map(value => ({ value, checked: value === 'glass',
    addEventListener(type, handler) { handlers.set(value, handler); } }));
  const document = { documentElement: { dataset: {} }, readyState: 'loading',
    addEventListener(type, handler) { this.ready = handler; },
    querySelectorAll() { return radios; } };
  const context = { document };
  Object.defineProperty(context, 'localStorage', { get() {
    if (blocked) throw new Error('Storage access denied');
    return { getItem: () => saved, setItem: (key, value) => {
      if (writeBlocked) throw new Error('Storage quota exceeded');
      writes.push([key, value]);
    } };
  } });
  runInNewContext(source, context);
  return { document, radios, writes, connect() { document.ready(); },
    select(value) {
      for (const radio of radios) radio.checked = radio.value === value;
      handlers.get(value)();
    } };
}

test('first paint uses glass for missing or invalid saved preferences', () => {
  for (const saved of [null, '', 'dark', '<script>']) {
    const page = boot({ saved });
    assert.equal(page.document.documentElement.dataset.design, 'glass');
    assert.deepEqual(page.writes, []);
    page.connect();
    assert.equal(page.radios.find(input => input.checked).value, 'glass');
  }
});

test('a saved legacy choice is applied before controls are connected', () => {
  const page = boot({ saved: 'legacy' });
  assert.equal(page.document.documentElement.dataset.design, 'legacy');
  page.connect();
  assert.equal(page.radios.find(input => input.checked).value, 'legacy');
  page.select('glass');
  assert.equal(page.document.documentElement.dataset.design, 'glass');
  assert.deepEqual(page.writes, [['kanjimaster.design', 'glass']]);
  page.select('legacy');
  assert.equal(page.document.documentElement.dataset.design, 'legacy');
  assert.deepEqual(page.writes.at(-1), ['kanjimaster.design', 'legacy']);
});

test('blocked storage still starts in glass and permits switching', () => {
  const page = boot({ blocked: true });
  assert.equal(page.document.documentElement.dataset.design, 'glass');
  page.connect();
  assert.doesNotThrow(() => page.select('legacy'));
  assert.equal(page.document.documentElement.dataset.design, 'legacy');
});

test('a failed preference write does not undo the visible selection', () => {
  const page = boot({ writeBlocked: true });
  page.connect();
  assert.doesNotThrow(() => page.select('legacy'));
  assert.equal(page.document.documentElement.dataset.design, 'legacy');
  assert.deepEqual(page.writes, []);
});
