import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseEffects, effectsKey, medianFrameTime, readEffectsMode, saveEffectsMode } from '../src/effects-policy.mjs';

const capable = { cores: 8, memory: 8, finePointer: true, frameTime: 16.7 };
test('automatic mode enables full effects for a capable device with smooth frames', () => {
  assert.equal(chooseEffects('auto', capable).tier, 'full');
  assert.equal(chooseEffects('auto', { cores: 8, finePointer: true }).tier, 'full');
});
test('OS motion and data saving settings turn automatic effects off', () => {
  assert.deepEqual(chooseEffects('auto', { ...capable, reducedMotion: true }), { tier: 'off', reason: 'reduced-motion' });
  assert.deepEqual(chooseEffects('auto', { ...capable, saveData: true }), { tier: 'off', reason: 'save-data' });
});
test('low and moderate specs are handled conservatively', () => {
  for (const spec of [{ cores: 2 }, { memory: 2 }]) assert.equal(chooseEffects('auto', { ...capable, ...spec }).tier, 'off');
  for (const spec of [{ cores: 4 }, { memory: 4 }]) assert.equal(chooseEffects('auto', { ...capable, ...spec }).tier, 'gentle');
});
test('missing or invalid performance information never assumes a powerful device', () => {
  for (const spec of [{}, { cores: 0, memory: 0 }, { cores: NaN, memory: Infinity }, { cores: '16', memory: '8' }]) {
    assert.equal(chooseEffects('auto', { finePointer: true, ...spec }).tier, 'gentle');
  }
  assert.equal(chooseEffects('auto', { ...capable, finePointer: false }).tier, 'gentle');
});
test('sustained slow frame cadence downgrades only automatic mode', () => {
  assert.equal(chooseEffects('auto', { ...capable, frameTime: 33 }).tier, 'gentle');
  assert.equal(chooseEffects('auto', { ...capable, frameTime: 60 }).tier, 'off');
  assert.equal(chooseEffects('on', { ...capable, frameTime: 60 }).tier, 'full');
});
test('manual modes override hardware and saving decisions while preserving OS accessibility', () => {
  assert.deepEqual(chooseEffects('off', capable), { tier: 'off', reason: 'manual' });
  assert.equal(chooseEffects('on', { cores: 1, memory: 1, saveData: true }).tier, 'full');
  assert.deepEqual(chooseEffects('on', { ...capable, reducedMotion: true }), { tier: 'gentle', reason: 'reduced-motion' });
});
test('frame sampling ignores an isolated startup stall and rejects invalid intervals', () => {
  assert.equal(medianFrameTime([16, 16, 16, 16, 16, 150]), 16);
  assert.equal(medianFrameTime([NaN, -1, Infinity, 0]), undefined);
  assert.equal(medianFrameTime([30, 34, 32]), 32);
});
test('mode persistence validates saved values and handles denied storage', () => {
  for (const value of ['auto', 'on', 'off']) {
    assert.equal(readEffectsMode(() => ({ getItem: key => { assert.equal(key, effectsKey); return value; } })), value);
    const writes = [];
    assert.equal(saveEffectsMode(value, () => ({ setItem: (...args) => writes.push(args) })), true);
    assert.deepEqual(writes, [[effectsKey, value]]);
  }
  for (const value of [null, '', 'dark', '<script>']) assert.equal(readEffectsMode(() => ({ getItem: () => value })), 'auto');
  const denied = () => { throw new Error('denied'); };
  assert.equal(readEffectsMode(denied), 'auto');
  assert.equal(saveEffectsMode('on', denied), false);
  assert.equal(saveEffectsMode('invalid', () => ({ setItem: () => assert.fail() })), false);
});
