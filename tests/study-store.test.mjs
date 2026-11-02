import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudyStore, studyKey, reviewQueue } from '../src/study-store.mjs';
function fixture(raw=null) {
 let data=raw, fail=false, tick=100;
 const storage={getItem:()=>data,setItem:(key,value)=>{assert.equal(key,studyKey);if(fail)throw Error('quota');data=value;}};
 return {store:createStudyStore(()=>storage,()=>tick++),raw:()=>data,fail:()=>fail=true,set:value=>data=value};
}
test('saved terms and notes survive reload and duplicate saves preserve notes',()=>{
 const f=fixture();assert.deepEqual(f.store.read(),[]);
 f.store.save(' 食べ物 ','たべもの · 음식');f.store.save('食べ物');
 const loaded=fixture(f.raw()).store.read();assert.equal(loaded.length,1);assert.equal(loaded[0].note,'たべもの · 음식');assert.equal(loaded[0].term,'食べ物');
});
test('notes update without resetting the saved date or review history',()=>{
 const f=fixture();const initial=f.store.save('木','나무')[0];f.store.remember('木');
 const edited=f.store.save('木','き · 나무')[0];assert.equal(edited.createdAt,initial.createdAt);assert.equal(edited.reviewedAt,101);assert.equal(edited.note,'き · 나무');
});
test('Unicode variations are preserved and invalid or excessive input is rejected',()=>{
 const f=fixture();const term='葛\u{E0100}';f.store.save(term);assert.equal(f.store.read()[0].term,term);
 for(const word of ['', 'kana', 'あいう', '木'.repeat(81)])assert.throws(()=>f.store.save(word));
 assert.throws(()=>f.store.save('木','a'.repeat(501)));assert.equal(f.store.read().length,1);
});
test('corrupt or incompatible stored data is never overwritten',()=>{
 for(const raw of ['{broken','null','{"version":2,"entries":[]}',JSON.stringify({version:1,entries:[{term:'木',note:'tree'}]})]) {
  const f=fixture(raw);assert.throws(()=>f.store.read());assert.throws(()=>f.store.save('日'));assert.equal(f.raw(),raw);
 }
});
test('failed storage writes do not claim success or alter the original data',()=>{
 const f=fixture();f.store.save('木','나무');const before=f.raw();f.fail();
 assert.throws(()=>f.store.save('日'));assert.throws(()=>f.store.remove('木'));assert.equal(f.raw(),before);
 const unavailable=createStudyStore(()=>{throw Error();});assert.throws(()=>unavailable.read());
});
test('deletion can be undone with notes and review history intact',()=>{
 const f=fixture();f.store.save('木','나무');f.store.remember('木');const before=f.store.read()[0];
 const removed=f.store.remove('木');assert.deepEqual(f.store.read(),[]);f.store.restore(removed);assert.deepEqual(f.store.read()[0],before);
 f.store.restore(removed);assert.equal(f.store.read().length,1);
});
test('writes use the latest stored entries to preserve changes made in another tab',()=>{
 const f=fixture();f.store.save('木');const other=fixture(f.raw());other.store.save('日','해');f.set(other.raw());f.store.save('水');
 assert.deepEqual(f.store.read().map(e=>e.term),['水','日','木']);
});
test('review skips unannotated words and prioritizes unreviewed then oldest reviewed',()=>{
 const entries=[{term:'木',note:'나무',createdAt:1,reviewedAt:10},{term:'日',note:'해',createdAt:2,reviewedAt:0},{term:'水',note:'',createdAt:3,reviewedAt:0},{term:'火',note:'불',createdAt:4,reviewedAt:5}];
 assert.deepEqual(reviewQueue(entries).map(e=>e.term),['日','火','木']);assert.equal(entries[0].term,'木');
});
test('the notebook capacity is bounded without damaging saved entries',()=>{
 const entries=Array.from({length:500},(_,i)=>({term:`木${i}`,note:'',createdAt:i,reviewedAt:0}));
 const f=fixture(JSON.stringify({version:1,entries}));assert.throws(()=>f.store.save('日'));assert.equal(f.store.read().length,500);assert.equal(f.store.save('木0','나무')[0].note,'나무');
});
