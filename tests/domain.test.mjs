import test from 'node:test';
import assert from 'node:assert/strict';
import { isSingleKanji, extractKanji, resolveReferences, recognizeWithEngine, validateStrokes } from '../src/domain.mjs';
import { loadEngine } from '../scripts/load-engine.mjs';
import { geometricSamples } from '../fixtures/geometric-samples.mjs';

test('extracts word kanji in order, ignoring kana and repeated characters',()=>{
  assert.deepEqual(extractKanji('接線'), ['接', '線']);
  assert.deepEqual(extractKanji('食べ物'), ['食', '物']);
  assert.deepEqual(extractKanji('日曜日'), ['日', '曜']);
  assert.deepEqual(extractKanji('  カナ 接\n線 123 接!'), ['接', '線']);
  assert.deepEqual(extractKanji('語'), ['語']);
});

test('extraction preserves supplementary kanji and attached variation selectors',()=>{
  const characters = ['𠮷', '邊\u{E0100}', '邊\uFE00', '邊', '學'];
  assert.deepEqual(extractKanji(characters.join('かな') + characters.join('')), characters);
  for (const character of extractKanji(characters.join(''))) {
    assert.equal(isSingleKanji(character), true);
    assert.equal(resolveReferences(character)[0].character, character);
  }
});

test('input without kanji yields no results',()=>{
  for (const value of ['', ' ', 'かなカナ', 'abc123', '<script>😀', '\u{E0100}', null]) assert.deepEqual(extractKanji(value), []);
});

test('preserves traditional, supplementary and variation-selector code points',()=>{
  for (const character of ['日','学','學','𠮷','邊\u{E0100}']) {
    assert.equal(isSingleKanji(character),true);
    const refs=resolveReferences(character);
    assert.equal(refs[0].character,character); assert.equal(refs[1].character,character);
    assert.equal(new URL(refs[0].url).searchParams.get('s'),character);
    assert.equal(new URLSearchParams(new URL(refs[1].url).hash.split('?')[1]).get('query'),character);
    assert.equal(refs[0].kind,'search');
  }
});
test('rejects multi-character, blank, Latin and markup input',()=>{
  for (const value of ['', ' ', ' 学', '日本','a','<script>','😀','\u{E0100}']) assert.throws(()=>resolveReferences(value));
});
test('rejects malformed and excessive stroke input before invoking the engine',()=>{
  for (const strokes of [[],[[]],[[[0,0]]],[[[NaN,1],[1,1]]],[[[0,0],[300,1]]],Array.from({length:65},()=>[[0,0],[1,1]]),[[[10,10],[10,10]]]]) assert.throws(()=>validateStrokes(strokes));
});
test('real engine ranks independently authored 日 input without mutating it',async()=>{
  const engine=await loadEngine(); const strokes=structuredClone(geometricSamples.find(s=>s.character==='日').strokes); const before=structuredClone(strokes);
  const candidates=recognizeWithEngine(engine,strokes);
  assert.ok(candidates.slice(0,5).includes('日')); assert.ok(candidates.length>1); assert.deepEqual(strokes,before); assert.equal(engine.recordedPattern_spike,undefined);
});
test('empty candidate set remains empty rather than receiving fabricated results',()=>{
  const engine={momentNormalize:()=>[],extractFeatures:()=>[],coarseClassification:()=>[],fineClassification:()=>''};
  assert.deepEqual(recognizeWithEngine(engine,[[[0,0],[100,100]]]),[]);
});

test('expanded candidates preserve upstream top ten and expose additional real matches',async()=>{
  const engine=await loadEngine();
  for (const character of ['日','語']) {
    const strokes=geometricSamples.find(sample=>sample.character===character).strokes;
    engine.recordedPattern_comparison=structuredClone(strokes);
    const features=engine.extractFeatures(engine.momentNormalize('comparison'),20);
    const upstream=engine.fineClassification(features,engine.coarseClassification(features)).trim().split(/\s+/);
    delete engine.recordedPattern_comparison;
    const expanded=recognizeWithEngine(engine,strokes);
    assert.deepEqual(expanded.slice(0,10),upstream);
    assert.ok(expanded.length>10 && expanded.length<=100);
    assert.equal(new Set(expanded).size,expanded.length);
    assert.ok(expanded.every(isSingleKanji));
  }
});
