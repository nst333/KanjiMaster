import test from 'node:test';
import assert from 'node:assert/strict';
import { LatestRecognitionQueue } from '../src/recognition-queue.mjs';

const stroke = [[[10,10],[100,100]]];
test('rapid input keeps only the latest waiting request and discards stale results',()=>{
  const sent=[],shown=[];
  const queue=new LatestRecognitionQueue(job=>sent.push(job),result=>shown.push(result));
  queue.setReady(); queue.request(stroke);
  const first=sent[0];
  queue.invalidate(); queue.request([...stroke,...stroke]);
  queue.invalidate(); queue.request([...stroke,...stroke,...stroke]);
  assert.equal(sent.length,1);
  queue.complete({id:first.id,candidates:['old']});
  assert.equal(shown.length,0); assert.equal(sent.length,2); assert.equal(sent[1].strokes.length,3);
  queue.complete({id:sent[1].id,candidates:['三']});
  assert.deepEqual(shown.map(result=>result.candidates),[['三']]);
});
test('clear invalidates running and pending jobs without resurrecting candidates',()=>{
  const sent=[],shown=[];
  const queue=new LatestRecognitionQueue(job=>sent.push(job),result=>shown.push(result));
  queue.setReady(); queue.request(stroke); queue.request([...stroke,...stroke]); queue.invalidate();
  queue.complete({id:sent[0].id,candidates:['old']});
  assert.equal(sent.length,1); assert.equal(shown.length,0); assert.equal(queue.running,null);
});
test('strokes queued during startup are snapshotted and sent once ready',()=>{
  const sent=[]; const queue=new LatestRecognitionQueue(job=>sent.push(job),()=>{});
  const input=structuredClone(stroke); queue.request(input); input[0][0][0]=255;
  assert.equal(sent.length,0); queue.setReady();
  assert.equal(sent.length,1); assert.equal(sent[0].strokes[0][0][0],10);
});
test('worker reset rejects late messages from the old worker',()=>{
  const sent=[],shown=[]; const queue=new LatestRecognitionQueue(job=>sent.push(job),result=>shown.push(result));
  queue.setReady(); queue.request(stroke); const old=sent[0]; queue.reset();
  queue.request(stroke); queue.setReady();
  queue.complete({id:old.id,candidates:['old']});
  assert.equal(queue.running.id,sent[1].id); assert.equal(shown.length,0);
  queue.complete({id:sent[1].id,candidates:['new']});
  assert.equal(shown.length,1);
});
