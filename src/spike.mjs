import { isSingleKanji, extractKanji, validateStrokes } from './domain.mjs';
import { createReferenceResults } from './reference-results.mjs';
import { LatestRecognitionQueue } from './recognition-queue.mjs';
const $ = id => document.getElementById(id);
const canvas = $('drawing');
const ctx = canvas.getContext('2d');
let strokes = [], active = null, engineReady = false, worker, pendingTimer;
let candidates = [], visibleCandidateCount = 0;
const samples = [];
const inputTypes = new Set();
const recognitionQueue = new LatestRecognitionQueue(sendRecognition, showRecognition);

function invalidate(clear = true) {
  recognitionQueue.invalidate();
  if (clear) {
    candidates = []; visibleCandidateCount = 0;
    $('candidates').replaceChildren(); $('more-candidates').hidden = true; $('candidate-actions').hidden = true;
  }
  for (const button of $('candidates').children) button.disabled = true;
  $('more-candidates').disabled = true;
  $('candidates').setAttribute('aria-busy', 'false');
  $('recognition-status').textContent = engineReady ? '획을 마치면 후보가 갱신됩니다.' : '인식 준비 중…';
}
function redraw() {
  const size = canvas.getBoundingClientRect().width;
  const ratio = window.devicePixelRatio || 1;
  const pixels = Math.round(size * ratio);
  if (canvas.width !== pixels || canvas.height !== pixels) canvas.width = canvas.height = pixels;
  ctx.setTransform(pixels / 256, 0, 0, pixels / 256, 0, 0);
  ctx.clearRect(0, 0, 256, 256); ctx.strokeStyle = '#222'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const stroke of [...strokes, ...(active ? [active.points] : [])]) {
    if (!stroke.length) continue;
    ctx.beginPath(); ctx.moveTo(...stroke[0]);
    for (const point of stroke.slice(1)) ctx.lineTo(...point);
    ctx.stroke();
  }
  $('stroke-count').textContent = `${strokes.length}획`;
  $('undo').disabled = $('clear').disabled = !strokes.length && !active;
  $('recognize').disabled = !engineReady || !strokes.length || !!active || !!recognitionQueue.running;
}
function point(event) {
  const rect = canvas.getBoundingClientRect();
  return [Math.max(0, Math.min(256, (event.clientX - rect.left) / rect.width * 256)), Math.max(0, Math.min(256, (event.clientY - rect.top) / rect.height * 256))];
}
canvas.addEventListener('pointerdown', event => {
  if (active || event.button !== 0 || strokes.length >= 64) return;
  invalidate(false); inputTypes.add(event.pointerType); active = { id: event.pointerId, points: [point(event)] }; canvas.setPointerCapture(event.pointerId); redraw();
});
canvas.addEventListener('pointermove', event => {
  if (active?.id !== event.pointerId) return;
  for (const sample of event.getCoalescedEvents?.() || [event]) {
    if (active.points.length < 2000) active.points.push(point(sample));
  }
  redraw();
});
canvas.addEventListener('pointerup', event => {
  if (active?.id !== event.pointerId) return;
  active.points.push(point(event)); strokes.push(active.points); active = null; canvas.releasePointerCapture(event.pointerId); requestRecognition(); redraw();
});
function cancel(event) { if (active?.id === event.pointerId) { active = null; invalidate(false); requestRecognition(); redraw(); } }
canvas.addEventListener('pointercancel', cancel); canvas.addEventListener('lostpointercapture', cancel);
$('undo').onclick = () => { active = null; strokes.pop(); invalidate(); requestRecognition(); redraw(); };
$('clear').onclick = () => { active = null; strokes = []; inputTypes.clear(); invalidate(); redraw(); };
new ResizeObserver(() => { if (canvas.getBoundingClientRect().width) redraw(); }).observe(canvas);

function renderCandidates(from = 0) {
  if (!from) $('candidates').replaceChildren();
  const buttons = candidates.slice(from, visibleCandidateCount).map(character => {
    const button = document.createElement('button'); button.textContent = character; button.lang = 'ja'; button.setAttribute('aria-label', `${character} 선택`);
    button.setAttribute('aria-pressed', String(character === $('selected').textContent));
    button.onclick = () => selectCharacter(character); return button;
  });
  $('candidates').append(...buttons);
  $('candidate-actions').hidden = !candidates.length;
  $('more-candidates').hidden = visibleCandidateCount >= candidates.length;
  $('more-candidates').disabled = false;
  const nextCount = Math.min(10, candidates.length - visibleCandidateCount);
  $('more-candidates').textContent = nextCount ? `후보 ${nextCount}개 더 보기` : '후보 더보기';
  $('candidate-count').textContent = `${visibleCandidateCount}개 표시 · 전체 ${candidates.length}개`;
  $('recognition-status').textContent = candidates.length ? '찾는 한자를 선택하면 켜 둔 사전에서 검색합니다.' : '일치하는 글자가 없습니다. 다시 쓰거나 직접 입력하세요.';
  if (from) {
    // Reveal the newly appended batch within the candidate list, without scrolling the page.
    $('candidates').scrollTop = $('candidates').scrollHeight;
    if ($('more-candidates').hidden) buttons[0]?.focus({ preventScroll: true });
  } else { $('candidates').scrollTop = 0; }
}
function showRecognition(data) {
  $('candidates').setAttribute('aria-busy', 'false');
  if (data.error) {
    candidates = []; visibleCandidateCount = 0; $('candidates').replaceChildren(); $('more-candidates').hidden = true; $('candidate-actions').hidden = true;
    $('recognition-status').textContent = data.error; return;
  }
  candidates = data.candidates; visibleCandidateCount = Math.min(10, candidates.length);
  renderCandidates();
}
function sendRecognition(request) {
  $('recognition-status').textContent = '필기를 인식하고 있습니다…';
  $('candidates').setAttribute('aria-busy', 'true');
  $('more-candidates').disabled = true;
  worker.postMessage(request);
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    startEngine();
    invalidate();
    $('recognition-status').textContent = '인식 시간이 초과되었습니다. 잠시 후 다시 쓰거나 인식 버튼을 눌러 주세요.';
  }, 15000);
  redraw();
}
function requestRecognition() {
  if (!strokes.length || active) return;
  try { validateStrokes(strokes); } catch (error) { showRecognition({ error: error.message }); return; }
  recognitionQueue.request(strokes);
}
function startEngine() {
  worker?.terminate(); engineReady = false; recognitionQueue.reset(); clearTimeout(pendingTimer);
  // Classic workers permit importScripts; async import is wrapped in an IIFE.
  worker = new Worker(new URL('./recognition-worker.js', import.meta.url));
  worker.onmessage = ({ data }) => {
    if (data.ready) { engineReady = true; $('recognition-status').textContent = '획을 마칠 때마다 자동으로 인식합니다.'; recognitionQueue.setReady(); redraw(); return; }
    if (data.fatal) { $('recognition-status').textContent = `인식 엔진 오류: ${data.fatal}. 직접 입력을 이용하세요.`; return; }
    if (data.id !== recognitionQueue.running?.id) return;
    clearTimeout(pendingTimer); recognitionQueue.complete(data); redraw();
  };
  worker.onerror = () => { engineReady = false; recognitionQueue.reset(); clearTimeout(pendingTimer); $('recognition-status').textContent = '인식 엔진을 불러오지 못했습니다. 새로고침하거나 직접 입력하세요.'; redraw(); };
}
$('recognize').onclick = () => { invalidate(false); requestRecognition(); };
$('more-candidates').onclick = () => {
  const previous = visibleCandidateCount;
  visibleCandidateCount = Math.min(candidates.length, visibleCandidateCount + 10);
  renderCandidates(previous);
};
startEngine();

const referenceResults = createReferenceResults();
function selectCharacter(value) {
  const characters = extractKanji(value);
  if (!characters.length) throw new Error('한자나 한자가 포함된 단어를 입력해 주세요.');
  referenceResults.show(characters);
  $('selected').textContent = characters.join(' · ');
  $('manual').value = value;
  $('manual-error').textContent = '';
  $('manual').removeAttribute('aria-invalid');
  for (const button of $('candidates').children) {
    button.setAttribute('aria-pressed', String(characters.length === 1 && button.textContent === characters[0]));
  }
}
$('manual-form').onsubmit = event => {
  event.preventDefault();
  try { selectCharacter($('manual').value); }
  catch (error) { $('manual-error').textContent = error.message; $('manual').setAttribute('aria-invalid', 'true'); }
};

$('save-sample').onclick = () => {
  try {
    if (!isSingleKanji($('sample-label').value)) throw new Error('정답 한 글자를 입력해 주세요.');
    validateStrokes(strokes);
    samples.push({ character: $('sample-label').value, strokes: structuredClone(strokes), capturedAt: new Date().toISOString(), provenance: 'pointer-input', inputTypes: [...inputTypes], devicePixelRatio: window.devicePixelRatio, userAgent: navigator.userAgent });
    $('sample-status').textContent = `수집된 샘플 ${samples.length}개`;
  } catch (error) { $('sample-status').textContent = error.message; }
};
$('export-samples').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ schemaVersion:1, samples }, null, 2)], {type:'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = 'handwriting-samples.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
