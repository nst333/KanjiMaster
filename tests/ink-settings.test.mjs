import test from 'node:test';
import assert from 'node:assert/strict';
import { readLaserEffect, saveLaserEffect } from '../src/ink-settings.mjs';

test('laser effect defaults on and restores an explicit off preference', () => {
  for (const saved of [null, '', 'on', 'invalid']) {
    assert.equal(readLaserEffect(() => ({ getItem: () => saved })), true);
  }
  assert.equal(readLaserEffect(() => ({ getItem: () => 'off' })), false);
});

test('laser effect remains usable when access to storage is blocked', () => {
  const blocked = () => { throw new Error('Storage is unavailable'); };
  assert.equal(readLaserEffect(blocked), true);
  assert.doesNotThrow(() => saveLaserEffect(false, blocked));
  assert.equal(readLaserEffect(() => ({ getItem() { throw new Error('Read blocked'); } })), true);
});

test('both laser selections persist and read back independently of the design', () => {
  const values = new Map([['kanjimaster.design', 'legacy']]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  for (const enabled of [false, true]) {
    saveLaserEffect(enabled, () => storage);
    assert.equal(readLaserEffect(() => storage), enabled);
    assert.equal(values.get('kanjimaster.design'), 'legacy');
  }
});

test('failed laser preference writes do not escape into the drawing interaction', () => {
  const full = () => ({ setItem() { throw new Error('Storage quota exceeded'); } });
  assert.doesNotThrow(() => saveLaserEffect(true, full));
  assert.doesNotThrow(() => saveLaserEffect(false, full));
});
