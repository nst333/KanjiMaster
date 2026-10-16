import { readFile, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { loadEngine } from './load-engine.mjs';
import { recognizeWithEngine } from '../src/domain.mjs';
import { geometricSamples } from '../fixtures/geometric-samples.mjs';
const external = process.argv[2];
const samples = external ? JSON.parse(await readFile(external, 'utf8')).samples : geometricSamples;
if (!samples?.length) throw new Error('No samples.');
const engine = await loadEngine();
recognizeWithEngine(engine, samples[0].strokes);
const results = samples.map(sample => {
  const started = performance.now();
  try {
    const candidates = recognizeWithEngine(engine,sample.strokes);
    return { character:sample.character, provenance:sample.provenance, variant:sample.variant, candidates, topFive:candidates.slice(0,5).includes(sample.character), elapsedMs:performance.now()-started };
  } catch (error) { return { character:sample.character, error:error.message, topFive:false, elapsedMs:performance.now()-started }; }
});
const timings=results.map(r=>r.elapsedMs).sort((a,b)=>a-b);
const characters=[...new Set(engine.refPatterns.map(p=>p[0]))];
const report = {
  recordedAt:new Date().toISOString(), runtime:process.version, platform:`${os.platform()} ${os.release()} ${os.arch()}`, cpu:os.cpus()[0]?.model,
  methodology:external?'Imported samples; inspect provenance and independence before treating as human accuracy evidence.':'60 geometric fixtures from 20 agent-authored polylines with three deterministic variants. NOT a 60-sample human handwriting benchmark. No recognition training patterns used as inputs.',
  humanAccuracyGate:'UNVERIFIED: requires independently collected handwriting samples and device/browser validation.',
  patternCount:engine.refPatterns.length, uniqueCharacterCount:characters.length, hanCharacterCount:characters.filter(c=>/^\p{Unified_Ideograph}$/u.test(c)).length,
  coverage:Object.fromEntries(['日','人','学','語','鬱','學','𠮷'].map(c=>[c,characters.includes(c)])),
  sampleCount:results.length, distinctCharacters:new Set(samples.map(s=>s.character)).size,
  topFiveRate:results.filter(r=>r.topFive).length/results.length, p95Ms:timings[Math.ceil(timings.length*.95)-1], results,
};
await mkdir('evidence',{recursive:true});
const output=external?'evidence/imported-benchmark.json':'evidence/geometric-benchmark.json';
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,results:undefined},null,2));
