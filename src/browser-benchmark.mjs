import { geometricSamples } from '../fixtures/geometric-samples.mjs';
const worker = new Worker(new URL('./recognition-worker.js', import.meta.url));
let resolve, reject;
worker.onmessage=({data})=>{
  if(data.ready){ document.getElementById('run').disabled=false; document.getElementById('status').textContent='준비 완료'; return; }
  if(data.fatal){ document.getElementById('status').textContent=data.fatal; return; }
  if(data.error) reject(new Error(data.error)); else resolve(data);
};
const recognize = strokes => new Promise((yes,no)=>{resolve=yes;reject=no;worker.postMessage({id:1,strokes});});
document.getElementById('run').onclick=async()=>{
  document.getElementById('run').disabled=true;
  try {
    await recognize(geometricSamples[0].strokes);
    const results=[];
    for (const sample of geometricSamples) {
      const started=performance.now(); const result=await recognize(sample.strokes);
      results.push({character:sample.character,variant:sample.variant,candidates:result.candidates,topFive:result.candidates.slice(0,5).includes(sample.character),engineMs:result.elapsedMs,roundTripMs:performance.now()-started});
      document.getElementById('status').textContent=`${results.length}/60`;
    }
    const times=results.map(r=>r.roundTripMs).sort((a,b)=>a-b);
    document.getElementById('results').textContent=JSON.stringify({methodology:'Agent-authored geometric fixtures; NOT human handwriting accuracy evidence.',recordedAt:new Date().toISOString(),userAgent:navigator.userAgent,devicePixelRatio:devicePixelRatio,hardwareConcurrency:navigator.hardwareConcurrency,sampleCount:60,topFiveRate:results.filter(r=>r.topFive).length/60,p95RoundTripMs:times[56],results},null,2);
    document.getElementById('status').textContent='완료 · 실제 사용자 필기 검증은 별도 필요';
  }catch(error){document.getElementById('status').textContent=error.message;}
  finally{document.getElementById('run').disabled=false;}
};
